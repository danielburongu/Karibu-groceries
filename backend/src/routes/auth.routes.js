const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  registerUser,
  loginUser,
  changePassword,
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

/* =========================================================
   RATE LIMITING (LOGIN PROTECTION)
========================================================= */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // 5 attempts
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

/* =========================================================
   PUBLIC ROUTES
========================================================= */

// Bootstrap first director (only works once)
router.post("/register", registerUser);

// Login with rate limit
router.post("/login", loginLimiter, loginUser);

/* =========================================================
   PROTECTED ROUTES
========================================================= */

// Change password (requires JWT)
router.put("/change-password", protect, changePassword);

module.exports = router;