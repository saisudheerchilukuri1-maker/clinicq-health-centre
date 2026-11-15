/**
 * Centralized Error Handling Middleware for ClinicQ Health Centre
 *
 * Provides:
 * - notFoundHandler: 404 response for unmatched routes
 * - errorHandler: Central error responder handling JSON parse errors,
 *   database constraints, and general server exceptions.
 */

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`
  });
}

function errorHandler(err, req, res, next) {
  // If response headers were already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle JSON parse errors from invalid body payload
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request body'
    });
  }

  // Handle SQLite constraint violations
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      success: false,
      message: 'A conflicting record already exists with the provided unique constraint'
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({
      success: false,
      message: 'Invalid foreign key reference or record has dependent relationships'
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
