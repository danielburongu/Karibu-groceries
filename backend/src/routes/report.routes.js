const express = require("express");
const router = express.Router();

const controllers = require("../controllers/report.controller");
const middleware = require("../middleware/auth.middleware");

const {
  getDirectorSummary,
  getBranchPerformance,
  getPerformanceTrends,
  getManagerSummary,
} = controllers;

const { protect, authorize } = middleware;

/* =========================================================
   REPORT ROUTES — ENTERPRISE ANALYTICS ENGINE
========================================================= */

router.get(
  "/director-summary",
  protect,
  authorize("director"),
  getDirectorSummary
);

router.get(
  "/branches",
  protect,
  authorize("director"),
  getBranchPerformance
);

router.get(
  "/performance",
  protect,
  authorize("director"),
  getPerformanceTrends
);

router.get(
  "/manager-summary",
  protect,
  authorize("manager"),
  getManagerSummary
);

module.exports = router;
