export const formatPost = (post, currentUserId = null) => {
  const postObj = typeof post.toObject === "function" ? post.toObject() : post;

  const likeCount = Array.isArray(postObj.likes) ? postObj.likes.length : 0;
  const commentCount = Array.isArray(postObj.comments)
    ? postObj.comments.length
    : 0;

  const likedByUser =
    currentUserId && Array.isArray(postObj.likes)
      ? postObj.likes.some((likedUser) => {
          const likedUserId = likedUser?._id ?? likedUser;

          return likedUserId?.toString() === currentUserId?.toString();
        })
      : false;

  const images = Array.isArray(postObj.images)
    ? postObj.images.map((image) => ({ _id: image._id, url: image.url }))
    : [];

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

export const formatPostsArray = (posts, currentUserId = null) =>
  posts.map((post) => formatPost(post, currentUserId));
