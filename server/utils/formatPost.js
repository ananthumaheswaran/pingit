export const formatPost = (post, currentUserId = null) => {
  // Convert Mongoose document to a plain JavaScript object.
  // If the post is already a plain object (e.g. from .lean()), use it directly.
  const postObj = typeof post.toObject === "function" ? post.toObject() : post;

  // Count the number of likes on the post.
  // Fall back to 0 if likes is not an array.
  const likeCount = Array.isArray(postObj.likes) ? postObj.likes.length : 0;

  // Count the number of comments on the post.
  // Fall back to 0 if comments is not an array.
  const commentCount = Array.isArray(postObj.comments)
    ? postObj.comments.length
    : 0;

  // Determine whether the currently logged-in user has liked the post.
  // The likes array may contain either populated user objects or ObjectIds
  const likedByUser =
    currentUserId && Array.isArray(postObj.likes)
      ? postObj.likes.some((likedUser) => {
          // Normalize the liked user's ID whether the value is
          // a populated user object or a direct ObjectId.
          const likedUserId = likedUser?._id ?? likedUser;

          return likedUserId?.toString() === currentUserId?.toString();
        })
      : false;

  // Format post images for the client.
  // Only expose the image _id and URL.
  // The Cloudinary publicId is kept internally for image management.
  const images = Array.isArray(postObj.images)
    ? postObj.images.map((image) => ({ _id: image._id, url: image.url }))
    : [];

  // Return only the required post fields and computed fields are exposed.
  return {
    _id: postObj._id,
    content: postObj.content,
    images,
    author: postObj.author,
    createdAt: postObj.createdAt,
    updatedAt: postObj.updatedAt,
    likeCount,
    commentCount,
    likedByUser,
  };
};

// Format each post in an array using the same current-user context.
export const formatPostsArray = (posts, currentUserId = null) =>
  posts.map((post) => formatPost(post, currentUserId));
