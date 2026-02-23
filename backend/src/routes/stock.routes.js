const express = require("express");
const router = express.Router();

const {
  getStock,
  addStock,
  reduceStock,
} = require("../controllers/stock.controller");

const { protect, authorize } = require("../middleware/auth.middleware");

/* =====================================
   STOCK ROUTES
===================================== */

// All must be authenticated
router.use(protect);

// View stock (All roles)
router.get("/", getStock);

// Add stock (Director + Manager)
router.post("/", authorize("director", "manager"), addStock);

// Reduce stock (Director + Manager)
router.patch("/reduce", authorize("director", "manager"), reduceStock);

module.exports = router;
