const mongoose = require("mongoose");
const Credit = require("../models/Credit");
const Stock = require("../models/Stock");

/* =========================================================
   CREATE CREDIT SALE
   - Sales, Manager, Director
   - Uses produceId
   - Server calculates price + amountDue
   - Atomic stock deduction
   - Safe middleware execution
========================================================= */
exports.createCredit = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const {
      produceId,
      tonnage,
      customerName,
      contact,
      nin,
      location,
      dueDate
    } = req.body;

    /* VALIDATION */
    if (!produceId || !tonnage || !customerName) {
      throw new Error("produceId, tonnage, and customerName are required");
    }

    const qty = Number(tonnage);
    if (isNaN(qty) || qty <= 0) {
      throw new Error("Tonnage must be a positive number");
    }

    if (!dueDate || isNaN(new Date(dueDate).getTime())) {
      throw new Error("Valid future dueDate is required");
    }

    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (due <= today) {
      throw new Error("Due date must be in the future");
    }

    /* BRANCH LOGIC */
    const branch =
      req.user.role === "director"
        ? (req.body.branch || "").toLowerCase()
        : req.user.branch?.toLowerCase();

    if (!branch) {
      throw new Error("Branch is required");
    }

    /* ============================
       ATOMIC STOCK CHECK + DEDUCT
    ============================ */
    const stock = await Stock.findOneAndUpdate(
      {
        _id: produceId,
        branch,
        tonnage: { $gte: qty }
      },
      { $inc: { tonnage: -qty } },
      {
        new: true,
        session
      }
    );

    if (!stock) {
      throw new Error(
        "Stock not found, insufficient quantity, or wrong branch"
      );
    }

    /* ============================
       PRICE + CALCULATION
    ============================ */
    const pricePerKg = stock.currentSellingPrice;

    if (!pricePerKg || pricePerKg <= 0) {
      throw new Error("Stock selling price is not set");
    }

    const amountDue = qty * pricePerKg;

    /* ============================
       SAFE CREDIT DOCUMENT CREATION
    ============================ */
    const creditDoc = new Credit({
      produceName: stock.produceName,
      produceId: stock._id,
      tonnage: qty,
      pricePerKg,
      amountDue,
      amountPaid: 0,
      customerName: customerName.trim(),
      contact: contact?.trim() || null,
      nin: nin?.trim().toUpperCase() || null,
      location: location?.trim() || null,
      dueDate: due,
      branch,
      createdBy: req.user._id
    });

    await creditDoc.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Credit sale recorded successfully",
      credit: creditDoc
    });

  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error("CREATE CREDIT ERROR:", err);

    res.status(400).json({
      success: false,
      message: err.message || "Failed to record credit sale"
    });
  }
};

/* =========================================================
   GET CREDIT SALES
   - Director → all
   - Others → branch only
========================================================= */
exports.getCredits = async (req, res) => {
  try {
    const filter =
      req.user.role === "director"
        ? {}
        : { branch: req.user.branch?.toLowerCase() };

    const credits = await Credit.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name role branch")
      .lean();

    res.json({
      success: true,
      count: credits.length,
      credits
    });

  } catch (err) {
    console.error("GET CREDITS ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch credit records"
    });
  }
};

/* =========================================================
   RECORD CREDIT PAYMENT
   - Partial & full payments supported
   - Status auto-updates via model pre-save
========================================================= */
exports.recordCreditPayment = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be positive"
      });
    }

    const credit = await Credit.findById(req.params.id);

    if (!credit) {
      return res.status(404).json({
        success: false,
        message: "Credit record not found"
      });
    }

    // Branch protection
    if (
      req.user.role !== "director" &&
      credit.branch !== req.user.branch?.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this branch"
      });
    }

    const newPaid = credit.amountPaid + Number(amount);

    credit.amountPaid = Math.min(newPaid, credit.amountDue);

    await credit.save(); // triggers pre-save status update

    res.json({
      success: true,
      message: "Payment recorded successfully",
      credit
    });

  } catch (err) {
    console.error("RECORD CREDIT PAYMENT ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to record payment"
    });
  }
};