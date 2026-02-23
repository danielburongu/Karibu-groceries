const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      index: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: ["director", "manager", "sales"],
        message: "{VALUE} is not a valid role",
      },
      default: "sales",
      required: true,
      index: true,
    },

    branch: {
      type: String,
      lowercase: true,
      trim: true,
      // Required conditionally (validated in pre-save)
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isFirstLogin: {
      type: Boolean,
      default: true,
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* =========================================================
   PRE-SAVE HOOK (Modern Async Style)
   - Enforces branch rules
   - Hashes password securely
========================================================= */
userSchema.pre("save", async function () {
  // Branch rules
  if (this.role === "director") {
    this.branch = undefined;
  } else if (!this.branch) {
    throw new Error("Branch is required for managers and sales agents");
  }

  // Hash password only if modified
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

/* =========================================================
   PASSWORD MATCH METHOD
========================================================= */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/* =========================================================
   VIRTUAL: displayName
========================================================= */
userSchema.virtual("displayName").get(function () {
  return this.name || this.email?.split("@")[0] || "User";
});

module.exports = mongoose.model("User", userSchema);
