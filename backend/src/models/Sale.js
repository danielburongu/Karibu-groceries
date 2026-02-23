const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["cash", "credit"],
      default: "cash",
      required: true,
      index: true,
    },

    produce: {
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

    tonnageSold: {
      type: Number,
      required: true,
      min: [0.01, "Tonnage sold must be positive"],
    },

    pricePerKg: {
      type: Number,
      required: true,
      min: [0, "Price per KG cannot be negative"],
    },

    amountPaid: {
      type: Number,
      required: true,
      min: [0, "Amount paid cannot be negative"],
    },

    branch: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    buyerName: {
      type: String,
      trim: true,
      default: "Anonymous",
    },

    salesAgent: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    creditRemaining: {
      type: Number,
      default: 0,
      min: 0,
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

// Virtual: formatted total
saleSchema.virtual("totalFormatted").get(function () {
  return `USh ${new Intl.NumberFormat("en-UG").format(this.amountPaid)}`;
});

// Indexes for common queries
saleSchema.index({ branch: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model("Sale", saleSchema);