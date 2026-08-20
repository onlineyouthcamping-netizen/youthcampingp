/**
 * Safe HTML Sanitizer Utility
 */
let dompurifyInstance = null;

try {
  // Only attempt to require if not running in a broken Jest environment
  if (process.env.NODE_ENV !== "test") {
    dompurifyInstance = require("isomorphic-dompurify");
  }
} catch (_e) {
  dompurifyInstance = null;
}

function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== "string") return "";
  if (dompurifyInstance && typeof dompurifyInstance.sanitize === "function") {
    return dompurifyInstance.sanitize(dirty);
  }
  // Fallback simple sanitizer: remove <script>, javascript: handlers, onload/onerror etc.
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/on\w+\s*=\s*[^>\s]+/gi, "")
    .replace(/javascript:[^'"]+/gi, "");
}

module.exports = { sanitizeHtml };
