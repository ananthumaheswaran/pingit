import Comment from "../models/comment.js";
import Post from "../models/post.js";
import { AppError } from "../utils/AppError.js";
import { isValidObjectId } from "../utils/objectIdValidator.js";
import { sendResponse } from "../utils/responseHelper.js";
import { formatComment } from "../utils/formatComment.js";
import mongoose from "mongoose";

// @desc Create a new comment on a post or reply
// @route POST /api/comments/post/:postId
// @access Private

export const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { text, parentComment } = req.body;
    const currentUserId = req.user._id;

    // Validate post ID
    if (!isValidObjectId(postId)) {
      return next(new AppError("Invalid post ID", 400));
    }

    // Validate parent comment ID if provided
    if (parentComment && !isValidObjectId(parentComment)) {
      return next(new AppError("Invalid parent comment ID", 400));
    }

    // Check if the target post exists
    const post = await Post.findById(postId).select("author comments");

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Validate parent comment if reply

    if (parentComment) {
      const parentCommentDoc = await Comment.findById(parentComment);

      if (!parentCommentDoc) {
        return next(new AppError("Parent comment not found", 404));
      }

      // Prevent cross-post replies
      if (parentCommentDoc.post.toString() !== postId.toString()) {
        return next(
          new AppError("Parent comment does not belong to this post", 400),
        );
      }
    }

    // Create comment/reply
    const comment = new Comment({
      post: postId,
      author: currentUserId,
      text: text.trim(),
      parentComment: parentComment || null,
    });
    // Save comment
    await comment.save();

    // Store only top-level comments in post.comments
    if (!parentComment) {
      post.comments.push(comment._id);
      await post.save();
    }

    // Populate author info
    await comment.populate("author", "username profilePic");

    // Format frontend-ready response
    const formattedComment = formatComment(comment, currentUserId, post.author);

    // Send response
    sendResponse(
      res,
      201,
      parentComment
        ? "Reply created successfully"
        : "Comment created successfully",
      { comment: formattedComment },
    );
  } catch (err) {
    console.error("[commentController][createComment] Error:", err);
    next(err);
  }
};

// @desc    Get all comments and replies for a post
// @route   GET /api/comments/post/:postId
// @access  Private

export const getCommentsByPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.user._id;

    // Validate post ID
    if (!isValidObjectId(postId)) {
      return next(new AppError("Invalid post ID", 400));
    }

    // Fetch post
    const post = await Post.findById(postId).select("author");

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Fetch all comments
    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .populate("author", "username profilePic")
      .lean();

    // Format comments
    for (const comment of comments) {
      const formattedComment = formatComment(
        comment,
        currentUserId,
        post.author,
      );

      commentMap.set(comment._id.toString(), formattedComment);
    }

    // Build nested comment tree
    const topLevelComments = [];

    for (const comment of commentMap.values()) {
      if (comment.parentComment) {
        const parent = commentMap.get(comment.parentComment.toString());
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        topLevelComments.push(comment);
      }
    }

    // Send response
    sendResponse(req, 200, "Comments fetched successfully", {
      comments: topLevelComments,
      count: comments.length,
    });
  } catch (err) {
    console.error("[commentController] [getCommentsByPost] Error:", err);

    next(err);
  }
};
