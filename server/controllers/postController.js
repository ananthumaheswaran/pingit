import Post from "../models/post.js";
import Comment from "../models/comment.js";
import { formatPost, formatPostsArray } from "../utils/formatPost.js";
import { sendResponse } from "../utils/responseHelper.js";
import { AppError } from "../utils/AppError.js";
import mongoose from "mongoose";

// @desc Create a new post with optional image
// @route POST /api/posts
// @access Private
export const createPost = async (req, res, next) => {
  try {
    const { content, images } = req.body;
    const userId = req.user._id;

    const newPost = new Post({
      content: content || "",
      images: images || [],
      author: userId,
    });

    await newPost.save();

    const formattedPost = formatPost(newPost, userId);

    sendResponse(res, 201, "Post created", { post: formattedPost });
  } catch (err) {
    console.error("Error in createPost:", err);
    next(err);
  }
};

// @desc Get all posts
// @route GET /api/posts
// @access Private
export const getAllPosts = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch all posts, sorted by creation date (newest first)
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "username profilePic")
      .lean();

    const formattedPosts = formatPostsArray(posts, userId);

    sendResponse(res, 200, "Posts fetched", { posts: formattedPosts });
  } catch (err) {
    console.error("Error in getAllPosts:", err);
    next(err);
  }
};

// @desc Get single post by ID
// @route GET /api/posts/:postId
// @access Private
export const getPostById = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return next(new AppError("Invalid post ID", 400));
    }

    const post = await Post.findById(postId)
      .populate("author", "username profilePic")
      .populate({
        path: "comments",
        populate: { path: "author", select: "username profilePic" },
      });

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    const formattedPost = formatPost(post, userId);

    const isOwner = post.author._id.toString() === userId.toString();

    sendResponse(res, 200, "Post fetched", { post: formattedPost, isOwner });
  } catch (err) {
    console.error("Error in getPostById:", err);
    next(err);
  }
};

// @desc Get all posts by a specific user
// @route GET /api/posts/user/:userId
// @access Private
export const getPostsByUser = async (req, res, next) => {
  try {
    const { userId: paramUserId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(paramUserId)) {
      return next(new AppError("Invalid user ID", 400));
    }

    const posts = await Post.find({ author: paramUserId })
      .sort({ createdAt: -1 })
      .populate("author", "username profilePic");

    if (posts.length === 0) {
      return next(new AppError("No posts found for this user", 404));
    }

    const formattedPosts = formatPostsArray(posts, userId);

    sendResponse(res, 200, "User's posts fetched successfully", {
      posts: formattedPosts,
    });
  } catch (err) {
    console.error("Error in getPostsByUser:", err);
    next(err);
  }
};

// @desc Delete a post (only by author)
// @route DELETE /api/posts/:postId
// @access Private
export const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    // Validate postId format
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return next(new AppError("Invalid post ID", 400));
    }

    const post = await Post.findById(postId);

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    if (post.author.toString() !== userId.toString()) {
      return next(new AppError("Unauthorized to delete this post", 403));
    }

    await Comment.deleteMany({ post: post._id });
    await post.remove();
    sendResponse(res, 200, "Post and associated comments deleted", {});
  } catch (err) {
    console.error("Error in deletePost:", err);
    next(err);
  }
};

// @desc Toggle like/unlike a post
// @route PUT /api/posts/like/:postId
// @access Private
export const toggleLikePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    // Validate post ID format
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return next(new AppError("Invalid post ID", 400));
    }
    const post = await Post.findById(postId);

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Determine if the current user has already liked this post
    const alreadyLiked = post.likes.includes(userId);

    // Toggle like status
    if (alreadyLiked) {
      // User has already liked → remove their like (unlike)
      post.likes.pull(userId);
    } else {
      // User has not liked yet → add their like
      post.likes.push(userId);
    }

    await post.save();

    sendResponse(res, 200, alreadyLiked ? "Post unliked" : "Post liked", {
      likeCount: post.likes.length,
    });
  } catch (err) {
    console.error("Error in toggleLikePost:", err);
    next(err);
  }
};

// @desc Update a post (only by author)
// @route PUT /api/posts/:postId
// @access Private
export const updatePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content, images } = req.body;
    const userId = req.user._id;

    // Validate post ID format
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return next(new AppError("Invalid post ID", 400));
    }

    const post = await Post.findById(postId);

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Check ownership
    if (post.author.toString() !== userId.toString()) {
      return next(new AppError("Unauthorized to update this post", 403));
    }

    // Update content and image if provided
    if (content !== undefined) post.content = content;
    if (images !== undefined) post.images = images; // replace all existing images

    await post.save();

    const formattedPost = formatPost(post, userId);

    sendResponse(res, 200, "Post updated successfully", {
      post: formattedPost,
    });
  } catch (err) {
    console.error("Error in updatePost:", err);
    next(err);
  }
};
