const rateLimit = require("express-rate-limit");

const isTestEnv =
  process.env.NODE_ENV === "test" || process.env.DISABLE_RATE_LIMIT === "true";

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 60 * 1000, // 1 minute
  max: isTestEnv ? 10000 : 3000, // 3000 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const authHeader =
      req.headers.authorization || req.headers["x-access-token"];
    const url = req.originalUrl || req.url || "";
    if (
      authHeader ||
      url.includes("/admin") ||
      url.includes("/bookings") ||
      url.includes("/accounting") ||
      url.includes("/knowledge") ||
      url.includes("/theme font")
    ) {
      return true;
    }
    return false;
  },
  handler: (req, res) => {
    res.status(429).json({
      status: "error",
      message: "Too many requests, please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
      statusCode: 429,
    });
  },
});

module.exports = apiLimiter;
