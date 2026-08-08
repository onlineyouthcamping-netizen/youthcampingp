/**
 * Circuit Breaker Middleware Factory
 *
 * Tracks consecutive failures per route group. After FAILURE_THRESHOLD
 * failures within WINDOW_MS, the breaker trips open and immediately
 * returns 503 for COOLDOWN_MS before auto-resetting.
 *
 * Usage:
 *   const { circuitBreakerFor } = require('./middleware/circuitBreaker');
 *   app.use('/api/website', circuitBreakerFor('website'));
 *
 * Or use the global middleware that groups by first path segment:
 *   app.use('/api', circuitBreaker);
 */

const FAILURE_THRESHOLD = 5;
const WINDOW_MS = 60_000; // Track failures within this window
const COOLDOWN_MS = 60_000; // Stay open (503) for this duration

// In-memory state per circuit group
const circuits = new Map();

function getCircuit(group) {
  if (!circuits.has(group)) {
    circuits.set(group, {
      failures: [], // timestamps of recent failures
      openUntil: 0, // timestamp when circuit should close again
    });
  }
  return circuits.get(group);
}

function recordFailure(group) {
  const circuit = getCircuit(group);
  const now = Date.now();

  // Add failure timestamp, prune old entries outside the window
  circuit.failures.push(now);
  circuit.failures = circuit.failures.filter((t) => now - t < WINDOW_MS);

  // Trip the breaker if threshold exceeded
  if (circuit.failures.length >= FAILURE_THRESHOLD) {
    if (process.env.NODE_ENV === "production") {
      circuit.openUntil = now + COOLDOWN_MS;
      circuit.failures = [];
      console.warn(
        `🔴 [CircuitBreaker] "${group}" tripped open for ${COOLDOWN_MS / 1000}s after ${FAILURE_THRESHOLD} failures`,
      );
    } else {
      console.warn(
        `⚠️ [CircuitBreaker Dev Notice] "${group}" encountered ${FAILURE_THRESHOLD} failures (Bypassed in local dev)`,
      );
      circuit.failures = [];
    }
  }
}

function isOpen(group) {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }
  const circuit = getCircuit(group);
  if (circuit.openUntil > Date.now()) {
    return true;
  }
  // Auto-reset if cooldown expired
  if (circuit.openUntil > 0 && circuit.openUntil <= Date.now()) {
    circuit.openUntil = 0;
    console.log(
      `🟢 [CircuitBreaker] "${group}" reset — accepting requests again`,
    );
  }
  return false;
}

/**
 * Create a circuit breaker middleware for a specific group name.
 */
function circuitBreakerFor(group) {
  return (req, res, next) => {
    if (isOpen(group)) {
      return res.status(503).json({
        success: false,
        message: "Service temporarily unavailable — circuit breaker open",
        retryAfterMs: Math.max(0, getCircuit(group).openUntil - Date.now()),
      });
    }

    // Intercept response to track failures
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode >= 500) {
        recordFailure(group);
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Global circuit breaker that auto-groups by the second path segment.
 * e.g. /api/website/pages → group "website"
 *      /api/bookings/123  → group "bookings"
 */
function circuitBreaker(req, res, next) {
  // Extract group from path: /api/{group}/...
  const segments = req.path.split("/").filter(Boolean);
  const group = segments[0] || "default"; // first segment after /api

  if (isOpen(group)) {
    return res.status(503).json({
      success: false,
      message: "Service temporarily unavailable — circuit breaker open",
      retryAfterMs: Math.max(0, getCircuit(group).openUntil - Date.now()),
    });
  }

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode >= 500) {
      recordFailure(group);
    }
    return originalJson(body);
  };

  next();
}

module.exports = circuitBreaker;
module.exports.circuitBreaker = circuitBreaker;
module.exports.circuitBreakerFor = circuitBreakerFor;
module.exports.isOpen = isOpen;
module.exports.recordFailure = recordFailure;
