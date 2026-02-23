const Stock = require("../models/Stock");

/* GET STOCK (ROLE AWARE) */
exports.getStock = async (req, res) => {
  try {
    const { role, branch } = req.user;

    let filter = {};

    if (role !== "director") {
      filter.branch = branch;
    }

    const stock = await Stock.find(filter).sort({ produceName: 1 });

    res.json(stock);
  } catch (err) {
    console.error("GET STOCK ERROR:", err);
    res.status(500).json({ message: "Failed to fetch stock" });
  }
};

/* =========================================
   ADD / INCREASE STOCK
   Director or Manager
========================================= */
exports.addStock = async (req, res) => {
  try {
    const { produceName, tonnage, branch } = req.body;

    if (!produceName || !tonnage || !branch) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    if (tonnage <= 0) {
      return res.status(400).json({
        message: "Tonnage must be greater than 0",
      });
    }

    const stock = await Stock.findOneAndUpdate(
      { produceName, branch },
      {
        $inc: { tonnage },
        $setOnInsert: {
          createdBy: req.user._id,
        },
      },
      { new: true, upsert: true }
    );

    res.status(201).json({
      message: "Stock updated successfully",
      stock,
    });

  } catch (err) {
    console.error("ADD STOCK ERROR:", err);
    res.status(500).json({ message: "Failed to update stock" });
  }
};

/* =========================================
   REDUCE STOCK (ON SALE)
========================================= */
exports.reduceStock = async (req, res) => {
  try {
    const { produceName, tonnage, branch } = req.body;

    const stock = await Stock.findOne({ produceName, branch });

    if (!stock) {
      return res.status(404).json({
        message: "Stock not found",
      });
    }

    if (stock.tonnage < tonnage) {
      return res.status(400).json({
        message: "Insufficient stock",
      });
    }

    stock.tonnage -= tonnage;
    await stock.save();

    res.json({
      message: "Stock reduced successfully",
      stock,
    });

  } catch (err) {
    console.error("REDUCE STOCK ERROR:", err);
    res.status(500).json({
      message: "Failed to reduce stock",
    });
  }
};
