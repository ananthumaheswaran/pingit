export const formatAuthUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  // Expose only the profile picture URL.
  // The publicId is kept internal and is not sent to the client.
  profilePic: user.profilePic?.url || null,
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
  profilePic: user.profilePic?.url || null,
  followerCount: user.followers?.length || 0,
  followingCount: user.following?.length || 0,
  postCount,
  isFollowing,
  isOwnProfile,
});

export const formatUserSettings = (user) => ({
  username: user.username,
  name: user.name,
  profilePic: user.profilePic?.url || null,
  createdAt: user.createdAt,
});
