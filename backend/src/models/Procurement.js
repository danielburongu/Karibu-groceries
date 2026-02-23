const mongoose = require("mongoose");

const procurementSchema = new mongoose.Schema(
  {
    produceName: {
      type: String,
      required: [true, "Produce name is required"],
      trim: true,
      lowercase: true,
      index: true,
    },

    produceType: {
      type: String,
      required: [true, "Produce type is required"],
      trim: true,
    },

    sourceType: {
      type: String,
      enum: ["individual", "company", "farm"],
      required: [true, "Source type is required"],
    },

    deliveryDate: {
      type: Date,
      required: [true, "Delivery date is required"],
    },

    deliveryTime: {
      type: String,
      required: [true, "Delivery time is required"],
    },

    tonnage: {
      type: Number,
      required: [true, "Tonnage is required"],
      min: [1000, "Minimum procurement is 1000 KG"],
    },

    cost: {
      type: Number,
      required: [true, "Total cost is required"],
      min: [10000, "Cost must be at least USh 10,000"],
    },

    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price cannot be negative"],
    },

    supplierName: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
    },

    supplierContact: {
      type: String,
      required: [true, "Supplier contact is required"],
      trim: true,
    },

    branch: {
      type: String,
      required: [true, "Branch is required"],
      lowercase: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* =========================================================
   MODERN PRE-SAVE HOOK (NO next)
========================================================= */
procurementSchema.pre("save", async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (this.deliveryDate < today) {
    throw new Error("Delivery date cannot be in the past");
  }
});

/* =========================================================
   VIRTUAL: Cost Per KG
========================================================= */
procurementSchema.virtual("costPerKg").get(function () {
  return this.tonnage > 0 ? this.cost / this.tonnage : 0;
});

procurementSchema.set("toJSON", { virtuals: true });
procurementSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Procurement", procurementSchema);