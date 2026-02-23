const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* =========================================================
   EXTRACT TOKEN
========================================================= */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
}

/* =========================================================
   PROTECT ROUTE (JWT REQUIRED)
   - Verifies token, attaches user, checks active status
========================================================= */
exports.protect = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({ message: "Authentication token required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Session expired. Please login again." });
      }
      return res.status(401).json({ message: "Invalid token" });
    }

    // Fetch user (exclude password)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account has been disabled" });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error("PROTECT MIDDLEWARE ERROR:", err.message);
    res.status(500).json({ message: "Authentication error" });
  }
};

/* =========================================================
   ROLE AUTHORIZATION
   Usage: authorize("director", "manager")
========================================================= */
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Access denied – no role" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Insufficient permissions. Required: ${allowedRoles.join(", ")}`
      });
    }

    next();
  };
};

/* =========================================================
   BRANCH RESTRICTION (for manager/sales)
   Directors bypass
========================================================= */
exports.restrictToBranch = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (req.user.role === "director") {
    return next();
  }

  const branchFromReq =
    req.body.branch ||
    req.query.branch ||
    req.params.branch ||
    req.user.branch;

  if (!branchFromReq) {
    return res.status(400).json({ message: "Branch identifier required" });
  }

  if (branchFromReq.toLowerCase() !== req.user.branch?.toLowerCase()) {
    return res.status(403).json({ message: "Access denied for this branch" });
  }

  next();
};