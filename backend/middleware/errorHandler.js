/**
 * Global Error Handler Middleware
 * Returns consistent JSON response:
 * {
 *   "status": "error",
 *   "message": "...",
 *   "code": "...",
 *   "statusCode": ###
 * }
 */

function errorHandler(err, req, res, next) {
  console.error(`💥 Error [${req.method} ${req.url}]:`, err);

  const statusCode = err.statusCode || err.status || 500;
  let code = err.code || 'SERVER_ERROR';
  let message = err.message || 'Internal Server Error';

  if (err.code === 'TIMEOUT' || err.message?.includes('timeout') || statusCode === 408) {
    return res.status(408).json({
      status: 'error',
      message: 'Request timed out after 3 seconds',
      code: 'REQUEST_TIMEOUT',
      statusCode: 408,
    });
  }

  if (statusCode === 404) {
    code = 'NOT_FOUND';
  } else if (statusCode === 400) {
    code = 'BAD_REQUEST';
  } else if (statusCode === 500 && code === 'SERVER_ERROR') {
    message = message || 'Failed to complete request';
  }

  return res.status(statusCode).json({
    status: 'error',
    message,
    code,
    statusCode,
  });
}

module.exports = errorHandler;
