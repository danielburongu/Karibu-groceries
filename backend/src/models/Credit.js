const mongoose = require("mongoose");

const creditSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["credit"],
      default: "credit",
      required: true,
      index: true,
    },

    produceName: {
      type: String,
      required: true,
      trim: true,
    },

    produceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      required: true,
      index: true,
    },

    tonnage: {
      type: Number,
      required: true,
      min: 0.01,
    },

    pricePerKg: {
      type: Number,
      required: true,
      min: 0,
    },

    amountDue: {
      type: Number,
      required: true,
      min: 0,
    },

    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    contact: {
      type: String,
      trim: true,
    },

    nin: {
      type: String,
      trim: true,
      uppercase: true,
    },

    location: {
      type: String,
      trim: true,
    },

    dueDate: {
      type: Date,
      required: true,
      index: true,
    },

    branch: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "partial", "paid", "overdue"],
      default: "pending",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* =========================================================
   VIRTUALS
========================================================= */

// Remaining balance
creditSchema.virtual("remaining").get(function () {
  return Math.max(0, this.amountDue - this.amountPaid);
});

// Formatted remaining
creditSchema.virtual("remainingFormatted").get(function () {
  return `USh ${new Intl.NumberFormat("en-UG").format(
    Math.round(this.remaining)
  )}`;
});

// Overdue check
creditSchema.virtual("isOverdue").get(function () {
  return this.status !== "paid" && this.dueDate < new Date();
});

/* =========================================================
   PRE-SAVE HOOK (Modern Mongoose Safe Version)
   - No next()
   - Safe for transactions
========================================================= */
creditSchema.pre("save", function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (this.amountPaid >= this.amountDue) {
    this.status = "paid";
  } else if (this.amountPaid > 0) {
    this.status = "partial";
  } else {
    this.status = "pending";
  }

  if (this.status !== "paid" && this.dueDate < today) {
    this.status = "overdue";
  }
});

/* =========================================================
   INDEXES
========================================================= */
creditSchema.index({ branch: 1, status: 1, dueDate: 1 });
creditSchema.index({ createdBy: 1, createdAt: -1 });
creditSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model("Credit", creditSchema);