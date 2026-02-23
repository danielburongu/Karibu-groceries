require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./config/swagger");

const app = express();

/* ==============================
   TRUST PROXY
============================== */
app.set("trust proxy", process.env.TRUST_PROXY || "loopback");

/* ==============================
   CORE SECURITY MIDDLEWARE
============================== */

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5501",
      "http://localhost:5501",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

/* ==============================
   GLOBAL RATE LIMITER
============================== */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests from this IP. Try again later.",
  },
});

app.use(globalLimiter);

/* ==============================
   SWAGGER DOCS
============================== */
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

/* ==============================
   ROUTES
============================== */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/sales", require("./routes/sale.routes"));
app.use("/api/credits", require("./routes/credit.routes"));
app.use("/api/stock", require("./routes/stock.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/procurements", require("./routes/procurement.routes"));

/* ==============================
   HEALTH CHECK
============================== */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "Karibu Groceries API",
    timestamp: new Date().toISOString(),
  });
});

/* ==============================
   404 HANDLER
============================== */
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

/* ==============================
   GLOBAL ERROR HANDLER
============================== */
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

module.exports = app;
