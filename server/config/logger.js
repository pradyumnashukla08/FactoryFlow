const { createLogger, format, transports } = require("winston");
const path = require("path");

const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const logger = createLogger({
  level: LOG_LEVEL,
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    IS_PRODUCTION
      ? format.json()
      : format.combine(
          format.colorize(),
          format.printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} ${level}: ${stack || message}`;
          }),
        ),
  ),
  defaultMeta: { service: "factoryflow-api" },
  transports: [new transports.Console()],
});

// In production, also write to files
if (IS_PRODUCTION) {
  const logDir = path.join(__dirname, "..", "logs");

  logger.add(
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
    }),
  );

  logger.add(
    new transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
  );
}

/**
 * Morgan stream adapter — pipes HTTP request logs into Winston.
 */
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;
