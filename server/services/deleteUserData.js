import mongoose from "mongoose";
import User from "../models/user.js";
import Post from "../models/post.js";
import Comment from "../models/comment.js";
import Message from "../models/message.js";
import cloudinary from "../config/cloudinary.js";
import { AppError } from "../utils/AppError.js";

export const deleteUserData = async (userId) => {
  const session = await mongoose.startSession();

  try {
    // Collect Cloudinary publicIds before deleting MongoDB documents

    const user = await User.findById(userId).select("profilePicId");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const userPosts = await Post.find(
      { author: userId },
      "images.publicId",
    ).lean();

    const messages = await Message.find(
      {
        $or: [{ sender: userId }, { recipient: userId }],
      },
      "image.publicId",
    ).lean();

    const imagePublicIds = [];

    if (user.profilePicId) {
      imagePublicIds.push(user.profilePicId);
    }

    userPosts.forEach((post) => {
      post.images?.forEach((image) => {
        if (image.publicId) {
          imagePublicIds.push(image.publicId);
        }
      });
    });

    messages.forEach((message) => {
      if (message.image?.publicId) {
        imagePublicIds.push(message.image.publicId);
      }
    });

    const postIds = userPosts.map((post) => post._id);

    // MongoDB Transaction

    session.startTransaction();

    await Promise.all([
      // Delete comments created by the user
      Comment.deleteMany({
        author: userId,
      }).session(session),

      // Delete all messages sent or received by the user
      Message.deleteMany({
        $or: [{ sender: userId }, { recipient: userId }],
      }).session(session),

      // Remove user from followers/following list
      User.updateMany(
        {},
        { $pull: { followers: userId, following: userId } },
        { session },
      ),

      // Remove user likes from posts
      Post.updateMany({}, { $pull: { likes: userId } }, { session }),

      // Remove likes from comments
      Comment.updateMany({}, { $pull: { likes: userId } }, { session }),
    ]);

    // Delete comments on the user's posts
    if (postIds.length > 0) {
      await Comment.deleteMany({
        post: { $in: postIds },
      }).session(session);
    }

    // Delete user's posts
    await Post.deleteMany({ author: userId }).session(session);

    // Delete user
    await User.deleteOne({
      _id: userId,
    }).session(session);

    await session.commitTransaction();

    //Cloudinary Cleanup
    if (imagePublicIds.length > 0) {
      const results = await Promise.allSettled(
        imagePublicIds.map((publicId) => cloudinary.uploader.destroy(publicId)),
      );

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Failed to delete Cloudinary image: ${imagePublicIds[index]}`,
            result.reason,
          );
        }
      });
    }
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw err;
  } finally {
    await session.endSession();
  }
};
