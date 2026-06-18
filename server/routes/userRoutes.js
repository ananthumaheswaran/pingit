import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserSettings,
  updateUserProfile,
  getUserProfile,
  searchUsers,
  getFollowList,
  changePassword,
  changeEmail,
  deleteAccount,
  deactivateAccount,
} from "../controllers/userController.js";

import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  changeEmailSchema,
  confirmPasswordSchema,
  updateProfileSchema,
} from "../validators/userValidation.js";

import { validate } from "../middlewares/validate.js"; //  Validates req.body against Joi schema
import { protect } from "../middlewares/authMiddleware.js"; //  Verifies JWT token and attaches user to req
import { loginLimiter, registerLimiter } from "../middlewares/rateLimiter.js"; //  Limits brute-force attacks per IP
import { profilePicUpload } from "../middlewares/uploadPresets.js";

const router = express.Router();

/**
 * @route   POST /api/users/register
 * @desc    Register a new user account
 * @access  Public
 * @middleware
 *    - registerLimiter: restricts account creation to 20/hour per IP
 *    - validate(registerSchema): validates username, email, password, name
 */
router.post(
  "/register",
  registerLimiter,
  validate(registerSchema),
  registerUser
);

/**
 * @route   POST /api/users/login
 * @desc    Log in user and return JWT token
 * @access  Public
 * @middleware
 *    - loginLimiter: max 5 login attempts per 15 minutes
 *    - validate(loginSchema): validates email/username and password
 */
router.post("/login", loginLimiter, validate(loginSchema), loginUser);

/**
 * @route   POST /api/users/logout
 * @desc    Log out user (frontend deletes token)
 * @access  Public
 */
router.post("/logout", logoutUser);

/**
 * @route   GET /api/users/search?username=
 * @desc    Search users by partial username match
 * @access  Private
 * @middleware
 *    - protect: ensures user is authenticated
 */
router.get("/search", protect, searchUsers);

/**
 * @route   GET /api/users/:userId
 * @desc    Get another user's public profile and their posts
 * @access  Private
 * @middleware
 *    - protect: ensures user is authenticated
 */
router.get("/:userId", protect, getUserProfile);

/**
 * @route   GET /api/users/:userId/:type
 * @desc    Get a user's followers or following list
 * @access  Private
 * @middleware
 *    - protect: ensures user is authenticated
 */
router.get("/:userId/:type", protect, getFollowList);

/**
 * @route   GET /api/users/me/settings
 * @desc    Fetch current user's basic account settings
 * @access  Private
 * @middleware
 *    - protect: ensures user is authenticated
 */
router.get("/me/settings", protect, getUserSettings);

/**
 * @route   PATCH /api/users/me/settings/profile/update
 * @desc    Update profile: username, name, bio, profilePic
 * @access  Private
 * @middleware
 *    - protect: ensures user is authenticated
 */
router.patch(
  "/me/settings/profile/update",
  protect,
  profilePicUpload,
  validate(updateProfileSchema),
  updateUserProfile
);

/**
 * @route   PATCH /api/users/me/settings/security/change-email
 * @desc    Change email (requires current password)
 * @access  Private
 * @middleware
 *    - protect: ensures user is authenticated
 *    - validate(changeEmailSchema): validates currentPassword & newEmail
 */
router.patch(
  "/me/settings/security/change-email",
  protect,
  validate(changeEmailSchema),
  changeEmail
);

/**
 * @route   PATCH /api/users/me/settings/security/change-password
 * @desc    Change password (requires current password)
 * @access  Private
 * @middleware
 *    - protect: ensures user is authenticated
 *    - validate(changePasswordSchema): validates current & new passwords
 */
router.patch(
  "/me/settings/security/change-password",
  protect,
  validate(changePasswordSchema),
  changePassword
);

/**
 * @route   PATCH /api/users/me/settings/account/deactivate
 * @desc    Temporarily deactivate user account
 * @access  Private
 * @middleware
 *    - protect: ensures user is authenticated
 *    - validate(confirmPasswordSchema): validates currentPassword
 */
router.patch(
  "/me/settings/account/deactivate",
  protect,
  validate(confirmPasswordSchema),
  deactivateAccount
);

/**
 * @route   DELETE /api/users/me/settings/account/delete
 * @desc    Permanently delete user account
 * @access  Private
 * @middleware
 *    - protect: ensures user is authenticated
 *    - validate(confirmPasswordSchema): validates currentPassword
 */
router.delete(
  "/me/settings/account/delete",
  protect,
  validate(confirmPasswordSchema),
  deleteAccount
);

export default router;
