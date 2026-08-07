import User from "../models/user.js";
import Post from "../models/post.js";
import { generateToken } from "../utils/generateToken.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/responseHelper.js";
import cloudinary from "../config/cloudinary.js";
import { formatAuthUser, formatPublicUser } from "../utils/formatUser.js";
import { deleteUserData } from "../services/deleteUserData.js";

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    // Check if a user with the same email or username already exists
    const existingEmail = await User.exists({ email });

    if (existingEmail) {
      return next(new AppError("Email already in use", 400));
    }

    const existingUsername = await User.exists({
      username,
    });

    if (existingUsername) {
      return next(new AppError("Username already taken", 400));
    }

    // Create and save the new user
    const newUser = new User({
      name,
      username,
      email,
      password,
    });
    await newUser.save();

    // Send success response
    sendResponse(res, 201, "User registered successfully", {});
  } catch (err) {
    console.error("[userController][registerUser] Error:", err);
    next(err);
  }
};

/**
 * @desc    Authenticate user and return JWT token
 * @route   POST /api/users/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    }).select("+password");

    // Validate user existence and password correctness
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError("Invalid credentials", 401));
    }

    // Reactivate account on successful login
    if (!user.isActive) {
      user.isActive = true;
      user.deactivatedAt = null;

      await user.save();
    }

    // Generate JWT token for authenticated user
    const token = generateToken(user._id);

    // Send token and user info in response
    sendResponse(res, 200, "Login successful", {
      token,
      user: formatAuthUser(user),
    });
  } catch (err) {
    console.error("[userController][loginUser] Error:", err);
    next(err);
  }
};

/**
 * @desc    Logout user (handled client-side)
 * @route   POST /api/users/logout
 * @access  Public
 */
export const logoutUser = (req, res) => {
  // Since JWT is stored client-side, server doesn't need to clear anything
  sendResponse(res, 200, "Logged out successfully", {});
};

/**
 * @desc    Search users by partial username match
 * @route   GET /api/users/search?search=
 * @access  Private
 */
export const searchUsers = async (req, res, next) => {
  try {
    const { search } = req.query;

    // Case-insensitive partial match on username or name
    const users = await User.find({
      $or: [
        {
          username: { $regex: search, $options: "i" },
        },
        { name: { $regex: search, $options: "i" } },
      ],
    })
      .select("username name profilePic")
      .lean(); // Select only necessary fields

    sendResponse(res, 200, "Users fetched successfully", {
      users: users.map(formatAuthUser),
      count: users.length,
    });
  } catch (err) {
    console.error("[userController][searchUsers] Error:", err);
    next(err);
  }
};

/**
 * @desc    Get user profile by user ID including their posts with comments
 * @route   GET /api/users/:userId
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Fetch user data with selected public fields
    const user = await User.findById(userId)
      .select("username name profilePic bio followers following")
      .lean();

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Fetch user's posts (newest first)
    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate("author", "username profilePic")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username profilePic",
        },
      })
      .lean();

    const profileId = user._id.toString();

    const isOwnProfile = req.user._id.toString() === profileId;

    const isFollowing = req.user.following.some(
      (id) => id.toString() === profileId,
    );

    // Send user profile and posts data
    sendResponse(res, 200, "User profile fetched", {
      user: formatPublicUser(user, posts.length, isFollowing, isOwnProfile),
      posts,
    });
  } catch (err) {
    console.error("[userController][getUserProfile] Error:", err);
    next(err);
  }
};

/**
 * @desc    Get list of followers or following users for a specified user
 * @route   GET /api/users/:userId/:type
 * @access  Private
 */
export const getFollowList = async (req, res, next) => {
  try {
    const { userId, type } = req.params;

    // Retrieve the user and only the requested follow list field
    const user = await User.findById(userId).select(type).lean();
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Handle empty list scenario
    if (!user[type] || user[type].length === 0) {
      return sendResponse(res, 200, `No ${type} found`, { [type]: [] });
    }

    // Find user details for each follower/following
    const followList = await User.find({ _id: { $in: user[type] } })
      .select("name username profilePic")
      .lean();

    // Return list and count
    sendResponse(
      res,
      200,
      `${type.charAt(0).toUpperCase() + type.slice(1)} list fetched`,
      { [type]: followList.map(formatAuthUser), count: followList.length },
    );
  } catch (err) {
    console.error(`[userController][getFollowList] Error:`, err);
    next(err);
  }
};

/**
 * @desc    Get the authenticated user's basic account settings
 * @route   GET /api/users/me/settings
 * @access  Private
 */
export const getUserSettings = async (req, res, next) => {
  try {
    const user = req.user;

    // Send user settings data
    sendResponse(res, 200, "User settings fetched", {
      user: formatUserSettings(user),
    });
  } catch (err) {
    console.error("[userController][getUserSettings] Error:", err);
    next(err);
  }
};

/**
 * @desc    Update the authenticated user's profile (username, name, bio, profilePic)
 * @route   PATCH /api/users/me/settings/profile/update
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const { username, name, bio } = req.body;
    const userId = req.user._id;

    if (
      !req.file &&
      username === undefined &&
      name === undefined &&
      bio === undefined
    ) {
      return next(
        new AppError("At least one field must be provided for update", 400),
      );
    }

    // Fetch user excluding sensitive fields
    const user = await User.findById(userId);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // If username change requested, check for conflicts
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });

      if (existingUser) {
        return next(new AppError("Username is already taken", 400));
      }
      user.username = username;
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    // Handle profile picture update if file uploaded
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (user.profilePicId) {
        await cloudinary.uploader.destroy(user.profilePicId);
      }

      // Save new image info
      user.profilePic = req.file.path;
      user.profilePicId = req.file.filename;
    }

    // Save updated user document
    await user.save();

    // Prepare response data
    const responseData = {
      username: user.username,
      name: user.name,
      bio: user.bio,
      profilePic: user.profilePic || null,
    };

    // Send success response
    sendResponse(res, 200, "Profile updated successfully", responseData);
  } catch (err) {
    console.error("[userController][updateUserProfile] Error:", err);
    next(err);
  }
};

/**
 * @desc    Change authenticated user's password (requires current password)
 * @route   PATCH /api/users/me/settings/security/change-password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Fetch user including password field
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Verify current password matches
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError("Current password is incorrect", 401));
    }

    // Prevent using the same password again
    if (currentPassword === newPassword) {
      return next(
        new AppError(
          "New password must be different from current password",
          400,
        ),
      );
    }

    // Update password (hashed automatically via pre-save hook)
    user.password = newPassword;
    await user.save();

    // Send success response
    sendResponse(res, 200, "Password changed successfully");
  } catch (err) {
    console.error("[userController] [changePassword] Error:", err);
    next(err);
  }
};

/**
 * @desc    Change authenticated user's email (requires current password)
 * @route   PATCH /api/users/me/settings/security/change-email
 * @access  Private
 */
export const changeEmail = async (req, res, next) => {
  try {
    const { currentPassword, newEmail } = req.body;
    const userId = req.user._id;

    // Fetch user with password and email fields
    const user = await User.findById(userId).select("+password +email");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError("Current password is incorrect", 401));
    }

    if (newEmail === user.email) {
      return next(
        new AppError("New email must be different from current email", 400),
      );
    }

    // Check for email conflict
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return next(new AppError("Email already in use", 400));
    }

    // Update email and save
    user.email = newEmail;
    await user.save();

    // Respond with updated email
    sendResponse(res, 200, "Email changed successfully", {
      email: user.email,
    });
  } catch (err) {
    console.error("[userController] [changeEmail] Error:", err);
    next(err);
  }
};

/**
 * @desc    Permanently delete authenticated user's account (requires current password)
 * @route   DELETE /api/users/me/settings/account/delete
 * @access  Private
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const { currentPassword } = req.body;
    const userId = req.user._id;

    // Fetch user including password for verification
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Verify current password before deleting
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return next(new AppError("Current password is incorrect", 401));
    }

    // Permanently delete the user and all related data
    await deleteUserData(userId);

    // Send success response
    sendResponse(res, 200, "User account deleted successfully");
  } catch (err) {
    console.error("[userController] [deleteAccount] Error:", err);
    next(err);
  }
};

/**
 * @desc    Temporarily deactivate authenticated user's account (requires current password)
 * @route   PATCH /api/users/me/settings/account/deactivate
 * @access  Private
 */
export const deactivateAccount = async (req, res, next) => {
  try {
    const { currentPassword } = req.body;
    const userId = req.user._id;

    // Fetch user including password for verification
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Verify current password before deactivation
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError("Current password is incorrect", 401));
    }

    // Update account status to inactive and record deactivation timestamp
    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();

    // Send success response
    sendResponse(res, 200, "User account deactivated successfully");
  } catch (err) {
    console.error("[userController] [deactivateAccount] Error:", err);
    next(err);
  }
};

/**
 * @desc    Toggle follow or unfollow a user
 * @route   PATCH /api/users/:userId/follow
 * @access  Private
 */
export const toggleFollowUser = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.params;

    // Prevent self-follow
    if (currentUserId.toString() === userId) {
      return next(new AppError("You cannot follow yourself", 400));
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId),
    ]);
    if (!currentUser || !targetUser) {
      return next(new AppError("User not found", 404));
    }

    const isFollowing = currentUser.following.some((id) =>
      id.equals(targetUser._id),
    );

    if (isFollowing) {
      currentUser.following.pull(targetUser._id);
      targetUser.followers.pull(currentUser._id);
    } else {
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    sendResponse(
      res,
      200,
      isFollowing
        ? "User unfollowed successfully"
        : "User followed successfully",
      { isFollowing: !isFollowing, followerCount: targetUser.followers.length },
    );
  } catch (err) {
    next(err);
  }
};
