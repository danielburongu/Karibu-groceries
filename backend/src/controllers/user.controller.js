const crypto = require("crypto");
const User = require("../models/User");

/* HELPER: GENERATE TEMP PASSWORD */
function generateTempPassword() {
  return crypto.randomBytes(4).toString("hex"); // 8-char password
}

/* =========================================================
   CREATE STAFF USER (DIRECTOR ONLY)
   - Auto temp password
   - Audit tracking
   - First login enforcement
========================================================= */
exports.createUser = async (req, res) => {
  try {
    const { name, email, role, branch } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        message: "Name, email and role are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!["manager", "sales"].includes(role)) {
      return res.status(400).json({
        message: "Only manager or sales roles can be created",
      });
    }

    if (!branch) {
      return res.status(400).json({
        message: "Branch is required for this role",
      });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const tempPassword = generateTempPassword();

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: tempPassword,
      role,
      branch: branch.toLowerCase().trim(),
      isFirstLogin: true,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: "User created successfully",
      temporaryPassword: tempPassword, // shown once
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        isActive: user.isActive,
        isFirstLogin: user.isFirstLogin,
      },
    });

  } catch (err) {
    console.error("CREATE USER ERROR:", err.message);

    return res.status(500).json({
      message: "Failed to create user",
    });
  }
};

/* =========================================================
   GET ALL USERS (DIRECTOR ONLY)
   - Sorted
   - Excludes passwords
========================================================= */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json(users);

  } catch (err) {
    console.error("GET USERS ERROR:", err.message);

    return res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

/* =========================================================
   ACTIVATE / DISABLE USER
   - Cannot disable yourself
   - Must keep at least one active director
   - Audit tracking
========================================================= */
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Prevent disabling yourself
    if (user._id.equals(req.user._id)) {
      return res.status(400).json({
        message: "You cannot disable your own account",
      });
    }

    // Prevent disabling last active director
    if (user.role === "director" && user.isActive) {
      const activeDirectors = await User.countDocuments({
        role: "director",
        isActive: true,
      });

      if (activeDirectors <= 1) {
        return res.status(400).json({
          message: "At least one active director must remain",
        });
      }
    }

    user.isActive = !user.isActive;
    user.updatedBy = req.user._id;

    await user.save();

    return res.json({
      message: `User ${user.isActive ? "activated" : "disabled"}`,
    });

  } catch (err) {
    console.error("TOGGLE USER ERROR:", err.message);

    return res.status(500).json({
      message: "Failed to update user status",
    });
  }
};
