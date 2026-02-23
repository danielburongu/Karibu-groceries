// report.controller.js — Enterprise Financial Engine
// Fully Backend Driven | Role-Aware | Branch-Safe

const Sale = require("../models/Sale");
const Credit = require("../models/Credit");
const Procurement = require("../models/Procurement");

/* HELPERS */
const num = (v) => Number(v || 0);

const getFromDate = (range) => {
  const from = new Date();
  from.setDate(from.getDate() - Number(range || 30));
  return from;
};

const normalizeDate = (d) =>
  new Date(d).toISOString().split("T")[0];

const ensureBranchObject = (container, branch) => {
  if (!branch) return;

  if (!container[branch]) {
    container[branch] = {
      cash: 0,
      credit: 0,
      kg: 0,
      cost: 0,
      revenue: 0,
      profit: 0,
      margin: 0,
    };
  }
};

/* DIRECTOR SUMMARY */
exports.getDirectorSummary = async (req, res) => {
  try {
    const range = Number(req.query.range || 30);
    const fromDate = getFromDate(range);

    const [cashSales, creditSales, procurements] =
      await Promise.all([
        Sale.find({ createdAt: { $gte: fromDate } }).lean(),
        Credit.find({ createdAt: { $gte: fromDate } }).lean(),
        Procurement.find({ createdAt: { $gte: fromDate } }).lean(),
      ]);

    const totalCash = cashSales.reduce(
      (s, v) => s + num(v.amountPaid),
      0
    );

    const totalCredit = creditSales.reduce(
      (s, v) => s + num(v.amountDue),
      0
    );

    const totalRevenue = totalCash + totalCredit;

    const totalCost = procurements.reduce(
      (s, v) => s + num(v.totalCost || v.cost),
      0
    );

    const profit = totalRevenue - totalCost;

    const margin =
      totalRevenue > 0
        ? Number(((profit / totalRevenue) * 100).toFixed(2))
        : 0;

    const totalTonnage =
      cashSales.reduce((s, v) => s + num(v.tonnageSold), 0) +
      creditSales.reduce((s, v) => s + num(v.tonnage), 0);

    const transactions =
      cashSales.length + creditSales.length;

    /* BRANCH AGGREGATION */

    const branches = {};

    cashSales.forEach((s) => {
      ensureBranchObject(branches, s.branch);
      if (!s.branch) return;
      branches[s.branch].cash += num(s.amountPaid);
      branches[s.branch].kg += num(s.tonnageSold);
    });

    creditSales.forEach((s) => {
      ensureBranchObject(branches, s.branch);
      if (!s.branch) return;
      branches[s.branch].credit += num(s.amountDue);
      branches[s.branch].kg += num(s.tonnage);
    });

    procurements.forEach((p) => {
      ensureBranchObject(branches, p.branch);
      if (!p.branch) return;
      branches[p.branch].cost +=
        num(p.totalCost || p.cost);
    });

    Object.keys(branches).forEach((b) => {
      const revenue =
        branches[b].cash + branches[b].credit;

      const cost = branches[b].cost;

      branches[b].revenue = revenue;
      branches[b].profit = revenue - cost;
      branches[b].margin =
        revenue > 0
          ? Number(
              (((revenue - cost) / revenue) * 100).toFixed(2)
            )
          : 0;
    });

    res.json({
      range,
      totals: {
        revenue: totalRevenue,
        credit: totalCredit,
        tonnage: totalTonnage,
        transactions,
      },
      financials: {
        revenue: totalRevenue,
        procurementCost: totalCost,
        profit,
        margin,
      },
      branches,
    });

  } catch (err) {
    console.error("DIRECTOR SUMMARY ERROR:", err);
    res.status(500).json({
      message: "Failed to generate director summary",
    });
  }
};

/* MANAGER SUMMARY (Branch Auto-Filtered) */
exports.getManagerSummary = async (req, res) => {
  try {
    const branch = req.user.branch;

    if (!branch) {
      return res.status(400).json({
        message: "Manager branch not assigned",
      });
    }

    const range = Number(req.query.range || 30);
    const fromDate = getFromDate(range);

    const [cashSales, creditSales, procurements] =
      await Promise.all([
        Sale.find({
          branch,
          createdAt: { $gte: fromDate },
        }).lean(),

        Credit.find({
          branch,
          createdAt: { $gte: fromDate },
        }).lean(),

        Procurement.find({
          branch,
          createdAt: { $gte: fromDate },
        }).lean(),
      ]);

    const revenue =
      cashSales.reduce((s, v) => s + num(v.amountPaid), 0) +
      creditSales.reduce((s, v) => s + num(v.amountDue), 0);

    const cost = procurements.reduce(
      (s, v) => s + num(v.totalCost || v.cost),
      0
    );

    const profit = revenue - cost;

    const margin =
      revenue > 0
        ? Number(((profit / revenue) * 100).toFixed(2))
        : 0;

    const tonnage =
      cashSales.reduce((s, v) => s + num(v.tonnageSold), 0) +
      creditSales.reduce((s, v) => s + num(v.tonnage), 0);

    const transactions =
      cashSales.length + creditSales.length;

    res.json({
      branch,
      range,
      financials: {
        revenue,
        procurementCost: cost,
        profit,
        margin,
      },
      totals: {
        creditOutstanding:
          creditSales.reduce(
            (s, v) => s + num(v.amountDue),
            0
          ),
        tonnage,
        transactions,
      },
    });

  } catch (err) {
    console.error("MANAGER SUMMARY ERROR:", err);
    res.status(500).json({
      message: "Failed to generate manager summary",
    });
  }
};

/* BRANCH PERFORMANCE (Sorted) */
exports.getBranchPerformance = async (req, res) => {
  try {
    const range = Number(req.query.range || 30);
    const fromDate = getFromDate(range);

    const [sales, credits, procurements] =
      await Promise.all([
        Sale.find({ createdAt: { $gte: fromDate } }).lean(),
        Credit.find({ createdAt: { $gte: fromDate } }).lean(),
        Procurement.find({ createdAt: { $gte: fromDate } }).lean(),
      ]);

    const branches = {};

    [...sales, ...credits].forEach((s) => {
      ensureBranchObject(branches, s.branch);
      if (!s.branch) return;
      branches[s.branch].revenue +=
        num(s.amountPaid || s.amountDue);
    });

    procurements.forEach((p) => {
      ensureBranchObject(branches, p.branch);
      if (!p.branch) return;
      branches[p.branch].cost +=
        num(p.totalCost || p.cost);
    });

    Object.keys(branches).forEach((b) => {
      branches[b].profit =
        branches[b].revenue - branches[b].cost;
    });

    res.json({
      range,
      branches,
    });

  } catch (err) {
    console.error("BRANCH PERFORMANCE ERROR:", err);
    res.status(500).json({
      message: "Failed to generate branch performance",
    });
  }
};

/* PERFORMANCE TRENDS (Sorted for Charts) */
exports.getPerformanceTrends = async (req, res) => {
  try {
    const range = Number(req.query.range || 30);
    const fromDate = getFromDate(range);

    const [sales, credits, procurements] =
      await Promise.all([
        Sale.find({ createdAt: { $gte: fromDate } }).lean(),
        Credit.find({ createdAt: { $gte: fromDate } }).lean(),
        Procurement.find({ createdAt: { $gte: fromDate } }).lean(),
      ]);

    const trends = {};

    const ensure = (date) => {
      if (!trends[date]) {
        trends[date] = {
          revenue: 0,
          cost: 0,
          profit: 0,
        };
      }
    };

    [...sales, ...credits].forEach((s) => {
      const date = normalizeDate(s.createdAt);
      ensure(date);
      trends[date].revenue +=
        num(s.amountPaid || s.amountDue);
    });

    procurements.forEach((p) => {
      const date = normalizeDate(p.createdAt);
      ensure(date);
      trends[date].cost +=
        num(p.totalCost || p.cost);
    });

    Object.keys(trends).forEach((d) => {
      trends[d].profit =
        trends[d].revenue - trends[d].cost;
    });

    // Sort by date ascending
    const sorted = Object.keys(trends)
      .sort()
      .reduce((acc, key) => {
        acc[key] = trends[key];
        return acc;
      }, {});

    res.json({
      range,
      trends: sorted,
    });

  } catch (err) {
    console.error("TREND ERROR:", err);
    res.status(500).json({
      message: "Failed to generate performance trends",
    });
  }
};
