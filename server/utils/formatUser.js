export const formatAuthUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  profilePic: user.profilePic,
});

export const formatPublicUser = (
  user,
  postCount = 0,
  isFollowing = false,
  isOwnProfile = false,
) => ({
  _id: user._id,
  username: user.username,
  name: user.name,
  bio: user.bio,
  profilePic: user.profilePic,
  followerCount: user.followers?.length || 0,
  followingCount: user.following?.length || 0,
  postCount,
  isFollowing,
  isOwnProfile,
});

const formatUserSettings = (user) => ({
  username: user.username,
  name: user.name,
  profilePic: user.profilePic,
  createdAt: user.createdAt,
});
