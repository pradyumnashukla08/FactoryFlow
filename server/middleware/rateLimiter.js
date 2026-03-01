const rateLimit = require("express-rate-limit");

/**
 * General API rate limiter — 100 requests per 15 minutes per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again after 15 minutes.",
  },
});

/**
 * Stricter limiter for auth endpoints — 10 attempts per 15 minutes.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many login attempts. Please try again after 15 minutes.",
  },
});

/**
 * Demo request limiter — 5 per hour per IP.
 */
const demoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many demo requests. Please try again later.",
  },
});

module.exports = { apiLimiter, authLimiter, demoLimiter };
