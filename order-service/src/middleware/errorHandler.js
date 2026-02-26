// Error handling middleware
// Returns appropriate status codes with structured error responses

function errorHandler(err, req, res, next) {
    // Structured JSON logging for errors
    const errorLog = {
        timestamp: new Date().toISOString(),
        service: 'order-service',
        type: 'error',
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    };

    console.error(JSON.stringify(errorLog));

    // Determine status code
    let statusCode = err.statusCode || err.status || 500;

    // Handle validation errors (400)
    if (err.name === 'ValidationError' || err.name === 'CastError') {
        statusCode = 400;
    }

    // Handle MongoDB duplicate key errors (400)
    if (err.code === 11000) {
        statusCode = 400;
    }

    // Prepare error response
    const errorResponse = {
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message: statusCode === 500
                ? 'Internal server error'
                : err.message || 'An error occurred',
            ...(statusCode === 400 && err.details && { details: err.details })
        }
    };

    res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;
