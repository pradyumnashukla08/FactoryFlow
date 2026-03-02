/**
 * Input sanitization utilities for server-side data handling.
 *
 * These helpers strip dangerous HTML/script content from user input
 * to prevent stored XSS attacks. Used in routes where user-generated
 * text is stored in the database (notes, names, addresses, etc.).
 */

/**
 * Escape HTML special characters to prevent XSS.
 * Replaces &, <, >, ", ' with their HTML entity equivalents.
 */
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Strip all HTML tags from a string.
 */
function stripTags(str) {
  if (typeof str !== "string") return str;
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize an object's string fields by stripping HTML tags.
 * Only processes top-level string values. Skips null/undefined.
 *
 * @param {Object} obj - The object to sanitize
 * @param {string[]} fields - Array of field names to sanitize
 * @returns {Object} The original object with sanitized fields
 */
function sanitizeFields(obj, fields) {
  for (const field of fields) {
    if (typeof obj[field] === "string") {
      obj[field] = stripTags(obj[field]).trim();
    }
  }
  return obj;
}

/**
 * Trim all string fields in an object (non-destructive, returns new object).
 */
function trimFields(obj) {
  const trimmed = {};
  for (const [key, value] of Object.entries(obj)) {
    trimmed[key] = typeof value === "string" ? value.trim() : value;
  }
  return trimmed;
}

module.exports = {
  escapeHtml,
  stripTags,
  sanitizeFields,
  trimFields,
};
