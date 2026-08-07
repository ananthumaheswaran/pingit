import Comment from "../models/comment.js";
import Post from "../models/post.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/responseHelper.js";
import { formatComment } from "../utils/formatComment.js";

// @desc Create a new comment on a post or reply
// @route POST /api/comments/post/:postId
// @access Private

export const createComment = async (req, res, next) => {
  try {
    const { text, parentComment } = req.body;
    const currentUserId = req.user._id;

    const post = req.resource;
    const postId = post._id;

    // Validate parent comment if reply
    if (parentComment) {
      const parentCommentDoc =
        await Comment.findById(parentComment).select("post");

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
    const formattedComment = formatComment(comment, currentUserId);

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
    const currentUserId = req.user._id;
    const post = req.resource;
    const postId = post._id;

    // Fetch all comments
    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .populate("author", "username profilePic")
      .lean();

    // Format comments
    const commentMap = new Map();

    for (const comment of comments) {
      const formattedComment = {
        ...formatComment(comment, currentUserId),
        replies: [],
      };

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
    sendResponse(res, 200, "Comments fetched successfully", {
      comments: topLevelComments,
      count: comments.length,
    });
  } catch (err) {
    console.error("[commentController] [getCommentsByPost] Error:", err);
    next(err);
  }
};

// @desc   Edit a comment
// @route  PATCH /api/comments/:commentId
// @access Private

export const editComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const currentUserId = req.user._id;
    const comment = req.resource;

    // Update text
    comment.text = text.trim();

    // Save
    await comment.save();

    // Populate author
    await comment.populate("author", "username profilePic");

    // Format response
    const formattedComment = formatComment(comment, currentUserId);

    // Send response
    sendResponse(res, 200, "Comment updated successfully", {
      comment: formattedComment,
    });
  } catch (err) {
    console.error("[commentController][editComment] Error:", err);
    next(err);
  }
};

// @desc Delete a comment and its replies
// @route DELETE /api/comments/:commentId
// @access Private

export const deleteComment = async (req, res, next) => {
  try {
    const comment = req.resource;

    // Find all descendants
    const commentsToDelete = [comment._id];
    const queue = [comment._id];

    while (queue.length > 0) {
      const currentCommentId = queue.shift();

      const replies = await Comment.find({
        parentComment: currentCommentId,
      }).select("_id");

      for (const reply of replies) {
        commentsToDelete.push(reply._id);
        queue.push(reply._id);
      }
    }

    // Remove top-level comment from post.comments
    if (!comment.parentComment) {
      await Post.findByIdAndUpdate(comment.post, {
        $pull: { comments: comment._id },
      });
    }

    // Delete all comments
    await Comment.deleteMany({
      _id: { $in: commentsToDelete },
    });

    sendResponse(res, 200, "Comment deleted successfully");
  } catch (err) {
    console.error("[commentController][deleteComment] Error:", err);
    next(err);
  }
};

// @descv  Toggle like on a comment
// @route  PATCH /api/comments/:commentId/like
// @access Private

export const toggleLikeComment = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const comment = req.resource;

    // Check existing like
    const alreadyLiked = comment.likes.some(
      (userId) => userId.toString() === currentUserId.toString(),
    );

    let message;

    if (alreadyLiked) {
      // Unlike
      comment.likes = comment.likes.filter(
        (userId) => userId.toString() !== currentUserId.toString(),
      );

      message = "Comment unliked successfully";
    } else {
      //Like

      comment.likes.push(currentUserId);
      message = "Comment liked successfully";
    }

    // Save
    await comment.save();
    sendResponse(res, 200, message, {
      likeCount: comment.likes.length,
      isLiked: !alreadyLiked,
    });
  } catch (err) {
    console.error("[commentController][toggleLikeComment] Error:", err);
    next(err);
  }
};
