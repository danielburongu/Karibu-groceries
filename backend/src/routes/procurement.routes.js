const express = require("express");
const router = express.Router();

const {
  createProcurement,
  getProcurements,
} = require("../controllers/procurement.controller");

const { protect, authorize } = require("../middleware/auth.middleware");

router.use(protect);

router.post(
  "/",
  authorize("director", "manager"),
  createProcurement
);

router.get(
  "/",
  authorize("director", "manager", "sales"),
  getProcurements
);

module.exports = router;