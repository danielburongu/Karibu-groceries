const express = require("express");
const router = express.Router();

const {
  createSale,
  getSales,
} = require("../controllers/sale.controller");

const { protect, authorize } = require("../middleware/auth.middleware");

/* =========================================================
   SALES ROUTES — ENTERPRISE MODE
========================================================= */

// All sales routes require authentication
router.use(protect);

/* ==============================
   CREATE SALE
   Only Manager & Sales
============================== */
router.post(
  "/",
  authorize("manager", "sales"),
  createSale
);

/* ==============================
   GET SALES
   Director → All
   Manager/Sales → Branch filtered in controller
============================== */
router.get(
  "/",
  authorize("director", "manager", "sales"),
  getSales
);

module.exports = router;