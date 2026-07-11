const { redactSensitive } = require('../utils/auditLogger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Always log errors for debugging, including production (Render)
  console.error(`[ERROR] ${req.method} ${req.url} - ${err.message}`);
  if (err.stack) console.error(err.stack);
  if (req.body && Object.keys(req.body).length > 0 && !req.url.includes('login')) {
    const redacted = redactSensitive(req.body);
    console.log('[BODY]', JSON.stringify(redacted));
  }
  if (req.file) console.log('[FILE]', req.file.originalname);
  if (req.files) console.log('[FILES]', req.files.length);

  // Prisma unique key constraint
  if (err.code === 'P2002') {
    const targets = err.meta?.target || ['field'];
    const message = `Duplicate value error: ${targets.join(', ')} already exists`;
    return res.status(400).json({
      success: false,
      message
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: err.meta?.cause || 'Record not found'
    });
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    const details = err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: details
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authorization token has expired'
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size limit exceeded'
    });
  }

  // Structured error classification — never infer from error text
  let finalStatus = error.statusCode || error.status || 500;
  let finalMessage = error.message || 'An unexpected error occurred';

  if (finalStatus >= 500) {
    if (process.env.NODE_ENV === 'production') {
      finalMessage = 'An unexpected error occurred';
    }
  }

  res.status(finalStatus).json({
    success: false,
    message: finalMessage
  });
};

module.exports = errorHandler;

