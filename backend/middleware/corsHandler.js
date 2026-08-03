/**
 * CORS & Cache Control Middleware
 * Supports credentials and dynamic origin matching for both public frontend and admin panel.
 */

function corsHandlerMiddleware(req, res, next) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, x-tenant-id, X-Tenant-Id, Cache-Control, Pragma');
  res.setHeader('Access-Control-Exposed-Headers', 'Content-Range, X-Total-Count, Authorization, X-Response-Time');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'max-age=300, public');
    res.setHeader('Content-Type', 'application/json');
  }

  next();
}

module.exports = corsHandlerMiddleware;
