const mongoose = require("mongoose");
const Procurement = require("../models/Procurement");
const Stock = require("../models/Stock");

/* CREATE PROCUREMENT (Transaction Safe) */
exports.createProcurement = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const {
      produceName,
      produceType,
      sourceType,
      deliveryDate,
      deliveryTime,
      tonnage,
      cost,
      sellingPrice,
      supplierName,
      supplierContact,
      branch: requestedBranch,
    } = req.body;

    // Required fields validation
    const requiredFields = {
      produceName,
      produceType,
      sourceType,
      deliveryDate,
      deliveryTime,
      tonnage,
      cost,
      sellingPrice,
      supplierName,
      supplierContact,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || value === "") {
        throw new Error(`${key} is required`);
      }
    }

    const qty = Number(tonnage);
    if (isNaN(qty) || qty < 1000) {
      throw new Error("Minimum procurement is 1000 KG");
    }

    const totalCost = Number(cost);
    if (isNaN(totalCost) || totalCost < 10000) {
      throw new Error("Cost must be at least USh 10,000");
    }

    const unitPrice = Number(sellingPrice);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      throw new Error("Selling price must be positive");
    }

    // Branch logic
    let branch = req.user.branch?.toLowerCase();

    if (req.user.role === "director" && requestedBranch) {
      branch = requestedBranch.toLowerCase();
    }

    if (!branch) {
      throw new Error("Branch is required");
    }

    /* FIND OR CREATE STOCK */
    let stock = await Stock.findOne({ produceName, branch }).session(session);

    if (!stock) {
      stock = new Stock({
        produceName,
        tonnage: 0,
        currentSellingPrice: unitPrice,
        branch,
        createdBy: req.user._id,
      });

      await stock.save({ session });
    }

    stock.tonnage += qty;
    stock.currentSellingPrice = unitPrice;
    await stock.save({ session });

    /* CREATE PROCUREMENT */
    const procurement = new Procurement({
      produceName,
      produceType,
      sourceType,
      deliveryDate: new Date(deliveryDate),
      deliveryTime,
      tonnage: qty,
      cost: totalCost,
      sellingPrice: unitPrice,
      supplierName,
      supplierContact,
      branch,
      createdBy: req.user._id,
    });

    await procurement.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Procurement recorded successfully",
      procurement,
      updatedStock: {
        id: stock._id,
        tonnage: stock.tonnage,
        currentSellingPrice: stock.currentSellingPrice,
      },
    });

  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error("CREATE PROCUREMENT ERROR:", err.message);

    res.status(400).json({
      success: false,
      message: err.message || "Failed to record procurement",
    });
  }
};

/* GET PROCUREMENTS */
exports.getProcurements = async (req, res) => {
  try {
    const filter =
      req.user.role === "director"
        ? {}
        : { branch: req.user.branch?.toLowerCase() };

    const procurements = await Procurement.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name role branch")
      .lean();

    res.json({
      success: true,
      count: procurements.length,
      procurements,
    });

  } catch (err) {
    console.error("GET PROCUREMENT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch procurements",
    });
  }
};