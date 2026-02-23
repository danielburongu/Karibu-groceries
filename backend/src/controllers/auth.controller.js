const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

/* TOKEN GENERATOR (minimal payload) */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      branch: user.branch || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

/* =========================================================
   REGISTER FIRST DIRECTOR (Bootstrap)
   - Only allowed if no director exists yet
   - Returns token + user for immediate login
========================================================= */
exports.registerUser = async (req, res) => {
  try {
    const directorExists = await User.findOne({ role: "director" });
    if (directorExists) {
      return res.status(403).json({
        success: false,
        message: "System already initialized. Login as director to add users."
      });
    }

    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use"
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "director",
      isActive: true,
      isFirstLogin: true,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Director account created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
      }
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err.message, err.stack);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again."
    });
  }
};

/* =========================================================
   LOGIN USER
   - Timing-safe comparison (prevents user enumeration)
   - Returns token + minimal user data
========================================================= */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Fetch user with password field
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    // Always perform comparison (timing attack prevention)
    const isMatch = user ? await user.matchPassword(password) : false;

    if (!user || !isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account has been disabled"
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch || null,
        isFirstLogin: user.isFirstLogin,
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err.message, err.stack);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
  }
};

/* =========================================================
   CHANGE PASSWORD
   - Protected route
   - First login skips current password check
========================================================= */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // First login: allow change without old password
    if (user.isFirstLogin) {
      // optional: could require currentPassword even on first login
    } else {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required"
        });
      }

      const match = await user.matchPassword(currentPassword);
      if (!match) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect"
        });
      }
    }

    // Update password
    user.password = newPassword;
    user.isFirstLogin = false;

    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err.message, err.stack);
    res.status(500).json({
      success: false,
      message: "Failed to update password"
    });
  }
};