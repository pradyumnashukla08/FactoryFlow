/**
 * Environment variable validation — fails fast on startup
 * if any required variable is missing.
 */

const REQUIRED_VARS = [
  "PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
];

// Optional vars documented for reference:
// NODE_ENV, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM,
// REMINDER_CRON, CORS_ORIGIN, LOG_LEVEL

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`\n❌  Missing required environment variables:\n   ${missing.join(", ")}\n`);
    console.error("   Copy server/.env.example → server/.env and fill in values.\n");
    process.exit(1);
  }

  // Warn about weak JWT secret
  if (
    process.env.JWT_SECRET &&
    process.env.JWT_SECRET.length < 32 &&
    process.env.NODE_ENV === "production"
  ) {
    console.warn(
      "⚠️  JWT_SECRET is shorter than 32 characters. Use a strong random string in production.",
    );
  }

  // Warn about placeholder JWT secret
  if (process.env.JWT_SECRET === "factoryflow_jwt_secret_key_change_in_production") {
    console.warn("⚠️  Using default JWT_SECRET — change this before deploying to production.");
  }
}

module.exports = validateEnv;
