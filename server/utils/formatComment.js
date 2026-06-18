export const formatComment = (comment, currentUserId = null) => {
  // Convert Mongoose document to plain JavaScript object
  // If it is already a plain object (e.g. from .lean()),
  // use it directly.
  const commentObj =
    typeof comment.toObject === "function" ? comment.toObject() : comment;

  // Determine whether the comment has been edited.
  // If createdAt and updatedAt are different,
  // the comment was modified after creation.
  const isEdited =
    commentObj.updatedAt.getTime() !== commentObj.createdAt.getTime();

  // Normalize author ID.
  // After populate(), author is usually an object:
  //   { _id, username, profilePic }
  // Without populate(), author may be just an ObjectId.
  const authorId = commentObj.author?._id || commentObj.author;

  // Determine ownership.
  // The logged-in user can edit/delete only
  // their own comments.
  const isOwner =
    currentUserId &&
    authorId &&
    authorId.toString() === currentUserId.toString();

  // Return a new object containing:
  // 1. All original comment fields
  // 2. Computed frontend-friendly fields
  return {
    ...commentObj,

    // True if comment has been updated
    isEdited,

    // Permission flags
    canEdit: Boolean(isOwner),
    canDelete: Boolean(isOwner),
  };
};
