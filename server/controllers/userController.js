import User from "../models/user.js";
import Post from "../models/post.js";
import { generateToken } from "../utils/generateToken.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/responseHelper.js";
import cloudinary from "../config/cloudinary.js";

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Normalize username and email for consistency
    const normalizedUsername = username.toLowerCase();
    const normalizedEmail = email.toLowerCase();

    // Check if a user with the same email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });
    if (existingUser) {
      return next(new AppError("User already exists", 400));
    }

    // Create and save the new user
    const newUser = new User({
      username: normalizedUsername,
      email: normalizedEmail,
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

    // Normalize input for case-insensitive matching
    const normalizedIdentifier = emailOrUsername.toLowerCase();

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier },
      ],
    });

    // Validate user existence and password correctness
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError("Invalid credentials", 401));
    }

    // Generate JWT token for authenticated user
    const token = generateToken(user._id);

    // Prepare user data to return (exclude sensitive info)
    const formattedUser = {
      _id: user._id,
      username: user.username,
      profilePic: user.profilePic,
    };

    // Send token and user info in response
    sendResponse(res, 200, "Login successful", {
      token,
      user: formattedUser,
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
 * @route   GET /api/users/search?username=
 * @access  Private
 */
export const searchUsers = async (req, res, next) => {
  try {
    const { username } = req.query;

    // Validate presence of search query
    if (!username) {
      return next(new AppError("Please provide a username to search", 400));
    }

    // Perform case-insensitive partial match search on username
    const users = await User.find({
      username: { $regex: username, $options: "i" }, //case-insensitive match
    }).select("username name profilePic"); // Select only necessary fields

    sendResponse(res, 200, "Users fetched successfully", {
      users,
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
    const user = await User.findById(userId).select(
      "username name profilePic bio followers following"
    );

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Fetch user's posts, most recent first, with author and comment details populated
    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate("author", "username profilePic")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username profilePic",
        },
      });

    // Format user data to include counts
    const formattedUser = {
      _id: user._id,
      username: user.username,
      name: user.name,
      bio: user.bio,
      profilePic: user.profilePic,
      followerCount: user.followers.length,
      followingCount: user.following.length,
      postCount: posts.length,
    };

    // Send user profile and posts data
    sendResponse(res, 200, "User profile fetched", {
      user: formattedUser,
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

    // Validate that type is either 'followers' or 'following'
    if (!["followers", "following"].includes(type)) {
      return next(
        new AppError(
          `Invalid follow list type. Use 'followers' or 'following'`,
          400
        )
      );
    }

    // Retrieve the user and only the requested follow list field
    const user = await User.findById(userId).select(type);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Handle empty list scenario
    if (!user[type] || user[type].length === 0) {
      return sendResponse(res, 200, `No ${type} found`, { [type]: [] });
    }

    // Find user details for each follower/following
    const followList = await User.find({ _id: { $in: user[type] } }).select(
      "username profilePic"
    );

    // Return list and count
    sendResponse(
      res,
      200,
      `${type.charAt(0).toUpperCase() + type.slice(1)} list fetched`,
      { [type]: followList, count: followList.length }
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
    const userId = req.user._id;

    // Fetch user info with selected fields
    const user = await User.findById(userId).select(
      "username name profilePic createdAt"
    );

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Send user settings data
    sendResponse(res, 200, "User settings fetched", { user });
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

    // Normalize username if provided
    const normalizedUsername = username?.toLowerCase();

    // Fetch user excluding sensitive fields
    const user = await User.findById(userId).select("-password -email");
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // If username change requested, check for conflicts
    if (normalizedUsername && normalizedUsername !== user.username) {
      const existingUser = await User.findOne({ username: normalizedUsername });
      if (existingUser) {
        return next(new AppError("Username is already taken", 400));
      }
      user.username = normalizedUsername;
    }

    // Update name and bio if provided
    const updates = { name, bio };
    for (const key in updates) {
      if (updates[key] !== undefined) {
        user[key] = updates[key];
      }
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
          400
        )
      );
    }

    // Update password (hashed automatically via pre-save hook)
    user.password = newPassword;
    await user.save();

    // Send success response
    sendResponse(res, 200, "Password changed successfully", {});
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

    // Normalize new email
    const normalizedNewEmail = newEmail.toLowerCase();

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

    // Check for email conflict
    const existingUser = await User.findOne({ email: normalizedNewEmail });
    if (existingUser) {
      return next(new AppError("Email already in use", 400));
    }

    // Update email and save
    user.email = normalizedNewEmail;
    await user.save();

    const responseData = {
      email: user.email,
    };

    // Respond with updated email
    sendResponse(res, 200, "Email changed successfully", responseData);
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

    // Delete user document
    await User.findByIdAndDelete(userId);

    // Send success response
    sendResponse(res, 200, "User account deleted successfully", {});
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
    sendResponse(res, 200, "User account deactivated successfully", {});
  } catch (err) {
    console.error("[userController] [deactivateAccount] Error:", err);
    next(err);
  }
};
