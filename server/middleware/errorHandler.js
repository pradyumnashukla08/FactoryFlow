const logger = require("../config/logger");

function errorHandler(err, req, res, next) {
  // Generate a request ID for easier log correlation
  const requestId =
    req.headers["x-request-id"] || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
    requestId,
    stack: err.stack,
    code: err.code,
    userId: req.user?.id,
  });

  // PostgreSQL unique violation
  if (err.code === "23505") {
    return res.status(409).json({
      error: "Duplicate entry. This record already exists.",
      requestId,
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === "23503") {
    return res.status(400).json({
      error: "Referenced record not found.",
      requestId,
    });
  }

  // PostgreSQL check constraint violation
  if (err.code === "23514") {
    return res.status(400).json({
      error: "Value not allowed. Please check your input.",
      requestId,
    });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed.",
      details: err.details,
      requestId,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token.", requestId });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired.", requestId });
  }

  // Payload too large
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: "Request body too large. Maximum size is 10MB.",
      requestId,
    });
  }

  // JSON parse errors
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Invalid JSON in request body.",
      requestId,
    });
  }

  // Default
  res.status(err.status || err.statusCode || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error." : err.message,
    requestId,
  });
}

module.exports = errorHandler;
