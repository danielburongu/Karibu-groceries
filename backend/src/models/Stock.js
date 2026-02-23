const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    produceName: {
      type: String,
      required: [true, "Produce name is required"],
      trim: true,
      lowercase: true,
      index: true,
    },

    tonnage: {
      type: Number,
      required: true,
      min: [0, "Tonnage cannot be negative"],
      default: 0,
    },

    branch: {
      type: String,
      required: [true, "Branch is required"],
      trim: true,
      lowercase: true,
      index: true,
    },

    lowStockThreshold: {
      type: Number,
      default: 2000,
      min: 0,
    },

    currentSellingPrice: {
      type: Number,
      min: [0, "Selling price cannot be negative"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// UNIQUE INDEX: one produce per branch
stockSchema.index({ produceName: 1, branch: 1 }, { unique: true });

// NO pre-save hook here — validation moved to controller
// If you really need a hook, make it single and async as below (but not needed now)

// stockSchema.pre("save", async function (next) {
//   try {
//     if (this.tonnage < 0) {
//       return next(new Error("Stock tonnage cannot be negative"));
//     }
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// Virtual: is low stock?
stockSchema.virtual("isLowStock").get(function () {
  return this.tonnage <= this.lowStockThreshold;
});

stockSchema.set("toJSON", { virtuals: true });
stockSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Stock", stockSchema);