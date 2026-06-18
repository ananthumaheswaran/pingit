import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String], // Store image URL or file path
      default: [],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Refers to the User model
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Users who liked this post
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment", // To populate comments seperately
      },
    ],
  },
  { timestamps: true } // Adds createdAt and updatedAt fields automatically
);

const Post = mongoose.model("Post", postSchema);
export default Post;
