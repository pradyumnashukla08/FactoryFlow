const logger = require("../config/logger");

function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
    stack: err.stack,
    code: err.code,
  });

  // PostgreSQL unique violation
  if (err.code === "23505") {
    return res.status(409).json({
      error: "Duplicate entry. This record already exists.",
      detail: err.detail,
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === "23503") {
    return res.status(400).json({
      error: "Referenced record not found.",
      detail: err.detail,
    });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed.",
      details: err.details,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token." });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired." });
  }

  // Default
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error." : err.message,
  });
}

module.exports = errorHandler;
