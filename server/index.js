require("dotenv").config();

// ── Validate environment before anything else ──────────────
const validateEnv = require("./config/validateEnv");
validateEnv();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const hpp = require("hpp");
const path = require("path");

const logger = require("./config/logger");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter, authLimiter, demoLimiter } = require("./middleware/rateLimiter");
const runMigrations = require("./db/migrate");
const { startReminderJobs } = require("./jobs/reminders");
const { pool } = require("./config/db");

// Route imports
const authRoutes = require("./routes/auth");
const customerRoutes = require("./routes/customers");
const orderRoutes = require("./routes/orders");
const productionRoutes = require("./routes/production");
const invoiceRoutes = require("./routes/invoices");
const paymentRoutes = require("./routes/payments");
const dashboardRoutes = require("./routes/dashboard");
const demoRequestRoutes = require("./routes/demoRequests");
const exportRoutes = require("./routes/export");
const insightsRoutes = require("./routes/insights");
const importRoutes = require("./routes/import");

const app = express();
const PORT = process.env.PORT || 5001;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(
  helmet({
    contentSecurityPolicy: IS_PRODUCTION
      ? undefined // use helmet defaults in production
      : false, // disable in dev (CRA injects inline scripts)
  }),
);

// CORS — read allowed origins from env in production
const corsOrigins = IS_PRODUCTION
  ? (process.env.CORS_ORIGIN || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : ["http://localhost:3000", "http://localhost:3001"];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);

// Prevent HTTP Parameter Pollution
app.use(hpp());

// ============================================
// PERFORMANCE MIDDLEWARE
// ============================================
app.use(compression()); // gzip responses

// ============================================
// PARSING & LOGGING
// ============================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(IS_PRODUCTION ? "combined" : "dev", { stream: logger.stream }));

// ============================================
// RATE LIMITING
// ============================================
app.use("/api/", apiLimiter); // global API limiter
app.use("/api/auth", authLimiter); // strict auth limiter
app.use("/api/demo-requests", demoLimiter); // demo form limiter

// ============================================
// API ROUTES
// ============================================
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/demo-requests", demoRequestRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/import", importRoutes);

// ============================================
// HEALTH CHECK — enhanced for monitoring
// ============================================
app.get("/api/health", async (req, res) => {
  let dbStatus = "ok";
  try {
    await pool.query("SELECT 1");
  } catch {
    dbStatus = "error";
  }

  const health = {
    status: dbStatus === "ok" ? "ok" : "degraded",
    service: "FactoryFlow API",
    version: require("./package.json").version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    memory: process.memoryUsage(),
  };

  res.status(dbStatus === "ok" ? 200 : 503).json(health);
});

// ============================================
// SERVE REACT BUILD IN PRODUCTION
// ============================================
if (IS_PRODUCTION) {
  app.use(express.static(path.join(__dirname, "..", "build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "build", "index.html"));
  });
}

// ============================================
// ERROR HANDLER
// ============================================
app.use(errorHandler);

// ============================================
// START SERVER + GRACEFUL SHUTDOWN
// ============================================
let server;

async function start() {
  try {
    // Run database migrations
    await runMigrations();

    // Start background reminder jobs
    startReminderJobs();

    // Start Express server
    server = app.listen(PORT, () => {
      logger.info(`🚀 FactoryFlow API running on http://localhost:${PORT}`);
      logger.info(`📋 Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`📡 API Base: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    logger.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function shutdown(signal) {
  logger.info(`\n${signal} received — shutting down gracefully...`);

  if (server) {
    server.close(() => {
      logger.info("HTTP server closed.");
    });
  }

  try {
    await pool.end();
    logger.info("Database pool closed.");
  } catch (err) {
    logger.error("Error closing database pool:", err);
  }

  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Catch unhandled errors so the process doesn't crash silently
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

start();
