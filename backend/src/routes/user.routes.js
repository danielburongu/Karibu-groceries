const express = require("express");
const router = express.Router();

const {
  createUser,
  getAllUsers,
  toggleUserStatus,
} = require("../controllers/user.controller");

const {
  protect,
  authorize,
} = require("../middleware/auth.middleware");

/* =====================================================
   USER MANAGEMENT ROUTES (DIRECTOR ONLY)
   All routes below require:
   1. Valid JWT
   2. Role = director
===================================================== */

// Apply protection first
router.use(protect);

// Apply role restriction
router.use(authorize("director"));

/* ===============================
   CREATE STAFF USER
   POST /api/users
================================ */
router.post("/", createUser);

/* ===============================
   GET ALL STAFF USERS
   GET /api/users
================================ */
router.get("/", getAllUsers);

/* ===============================
   ACTIVATE / DISABLE USER
   PATCH /api/users/:id/toggle
================================ */
router.patch("/:id/toggle", toggleUserStatus);

module.exports = router;
