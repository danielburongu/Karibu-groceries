const mongoose = require("mongoose");
const Sale = require("../models/Sale");
const Stock = require("../models/Stock");
const Counter = require("../models/Counter");

/* CREATE CASH SALE */
exports.createSale = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { produceId, tonnageSold, buyerName, discount = 0 } = req.body;

    const qty = Number(tonnageSold);
    if (!produceId || qty <= 0) {
      throw new Error("Invalid sale data");
    }

    const branch = req.user.branch?.toLowerCase();
    if (!branch) {
      throw new Error("User branch not assigned");
    }

    const stock = await Stock.findOneAndUpdate(
      {
        _id: produceId,
        branch,
        tonnage: { $gte: qty }
      },
      { $inc: { tonnage: -qty } },
      { new: true, session }
    );

    if (!stock) {
      throw new Error("Insufficient stock");
    }

    const pricePerKg = stock.currentSellingPrice;
    if (!pricePerKg || pricePerKg <= 0) {
      throw new Error("Selling price not set");
    }

    const subtotal = qty * pricePerKg;
    const discountAmount = Number(discount) || 0;
    const totalAfterDiscount = subtotal - discountAmount;

    const VAT_RATE = 0.18;
    const vatAmount = totalAfterDiscount * VAT_RATE;
    const finalTotal = totalAfterDiscount + vatAmount;

    const counter = await Counter.findOneAndUpdate(
      { name: "receipt" },
      { $inc: { value: 1 } },
      { new: true, upsert: true, session }
    );

    const saleDoc = new Sale({
      receiptNumber: counter.value,
      type: "cash",
      produce: stock.produceName,
      produceId: stock._id,
      tonnageSold: qty,
      pricePerKg,
      subtotal,
      discount: discountAmount,
      totalAfterDiscount,
      vatRate: VAT_RATE,
      vatAmount,
      amountPaid: finalTotal,
      branch,
      buyerName: buyerName || "Anonymous",
      salesAgent: req.user.name,
      createdBy: req.user._id
    });

    await saleDoc.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      sale: saleDoc
    });

  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/* GET SALES */
exports.getSales = async (req, res) => {
  try {
    const filter =
      req.user.role === "director"
        ? {}
        : { branch: req.user.branch?.toLowerCase() };

    const sales = await Sale.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: sales.length,
      sales
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch sales"
    });
  }
};