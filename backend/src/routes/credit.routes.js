const express = require("express");
const router = express.Router();

const {
  createCredit,
  getCredits,
  recordCreditPayment,
} = require("../controllers/credit.controller");

const { protect, authorize } = require("../middleware/auth.middleware");

/* =========================================================
   CREDIT ROUTES (ENTERPRISE MODE)
========================================================= */

router.use(protect);

/* ===============================
   CREATE CREDIT SALE
   - Manager, Sales, Director
=============================== */
router.post(
  "/",
  authorize("manager", "sales", "director"),
  createCredit
);

/* ===============================
   GET CREDIT SALES
   - All roles (branch filtered in controller)
=============================== */
router.get(
  "/",
  authorize("director", "manager", "sales"),
  getCredits
);

/* ===============================
   RECORD CREDIT PAYMENT
   - Director & Manager only
   - Supports partial payments
=============================== */
router.patch(
  "/:id/pay",
  authorize("director", "manager"),
  recordCreditPayment
);

module.exports = router;