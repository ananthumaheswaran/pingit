import mongoose from "mongoose";
import Post from "../models/post.js";
import Comment from "../models/comment.js";
import { AppError } from "../utils/AppError.js";
import cloudinary from "../config/cloudinary.js";
import { sendResponse } from "../utils/responseHelper.js";
import { formatPost, formatPostsArray } from "../utils/formatPost.js";

// @desc Create a new post with optional image
// @route POST /api/posts
// @access Private
export const createPost = async (req, res, next) => {
  const { content, images = [] } = req.body;
  let postSaved = false;

  try {
    const userId = req.user._id;

    if (images.length > 5) {
      throw new AppError("A post can have a maximum of 5 images", 400);
    }

    const post = new Post({
      content: content || "",
      images,
      author: userId,
    });

    await post.save();

    postSaved = true;

    await post.populate("author", "username profilePic");

    const formattedPost = formatPost(post, userId);

    sendResponse(res, 201, "Post created", { post: formattedPost });
  } catch (err) {
    // Remove newly uploaded images if post creation fails
    if (!postSaved && images.length > 0) {
      await Promise.allSettled(
        images.map((image) => cloudinary.uploader.destroy(image.publicId)),
      );
    }
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
    const userId = req.user._id;
    const post = req.resource;
    // const postId = req.resource._id;

    await post.populate([
      { path: "author", select: "username profilePic" },
      {
        path: "comments",
        populate: {
          path: "author",
          select: "username profilePic",
        },
      },
    ]);

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
    const currentUserId = req.user._id;
    const authorId = req.resource._id;

    const posts = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .populate("author", "username profilePic")
      .lean();

    const formattedPosts = formatPostsArray(posts, currentUserId);

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
  const session = await mongoose.startSession();

  try {
    const post = req.resource;

    // Save cloudinary publicIds before deleting the post
    const imagePublicIds = post.images?.map((image) => image.publicId) || [];

    // Start a MongoDB transaction
    session.startTransaction();

    // Delete all comments associated with the post as part of the transaction
    await Comment.deleteMany({ post: post._id }).session(session);

    // Delete post as part of the same transaction
    await Post.deleteOne({ _id: post._id }).session(session);

    // Make both MongoDB deletions permanent
    await session.commitTransaction();

    // Clean up the external Cloudinary files

    if (imagePublicIds.length > 0) {
      const results = await Promise.allSettled(
        imagePublicIds.map((publicId) => cloudinary.uploader.destroy(publicId)),
      );

      // Log any Cloudinary cleanup failures for later retry
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Failed to delete Cloudinary image: ${imagePublicIds[index]}`,
            result.reason,
          );
        }
      });
    }

    sendResponse(res, 200, "Post and associated comments deleted");
  } catch (err) {
    // Undo MongoDB changes if the transaction has not already been committed
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Error in deletePost:", err);
    next(err);
  } finally {
    // End the session
    await session.endSession();
  }
};

// @desc Toggle like/unlike a post
// @route PUT /api/posts/like/:postId
// @access Private
export const toggleLikePost = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const post = req.resource;

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId.toString(),
    );

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
  const { content, images = [], removedImageIds = [] } = req.body;
  let postSaved = false;

  try {
    // const { postId } = req.params;
    const userId = req.user._id;
    const post = req.resource;

    // Update content if provided
    if (content !== undefined) post.content = content;

    // Find existing images selected for removal
    const imagesToRemove = post.images.filter((image) =>
      removedImageIds.includes(image._id.toString()),
    );

    // Calculate final image count BEFORE modifying anything

    const finalImageCount =
      post.images.length - imagesToRemove.length + images.length;

    if (finalImageCount > 5) {
      throw new AppError("A post can have a maximum of 5 images", 400);
    }

    // Remove the selected images from the post
    post.images = post.images.filter(
      (image) => !removedImageIds.includes(image._id.toString()),
    );

    // Add newly uploaded images while keeping remaining existing images
    if (images.length > 0) {
      post.images.push(...images);
    }

    await post.save();

    postSaved = true;

    // Delete selected images from Cloudinary
    if (imagesToRemove.length > 0) {
      await Promise.allSettled(
        imagesToRemove.map((image) =>
          cloudinary.uploader.destroy(image.publicId),
        ),
      );
    }

    await post.populate("author", "username profilePic");

    const formattedPost = formatPost(post, userId);

    sendResponse(res, 200, "Post updated successfully", {
      post: formattedPost,
    });
  } catch (err) {
    if (!postSaved && images.length > 0) {
      await Promise.allSettled(
        images.map((image) => cloudinary.uploader.destroy(image.publicId)),
      );
    }
    console.error("Error in updatePost:", err);
    next(err);
  }
};
