export const formatPost = (post, currentUserId = null) => {
  const postObj = typeof post.toObject === "function" ? post.toObject() : post;

  const likeCount = Array.isArray(postObj.likes) ? postObj.likes.length : 0;
  const commentCount = Array.isArray(postObj.comments)
    ? postObj.comments.length
    : 0;

  const likedByUser =
    currentUserId && Array.isArray(postObj.likes)
      ? postObj.likes.some((likedUser) => {
          const id = typeof likedUser === "string" ? likedUser : likedUser?._id;
          return id?.toString() === currentUserId;
        })
      : false;

  return {
    _id: postObj._id,
    content: postObj.content,
    image: postObj.image,
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
