// Request logging middleware
// Captures method, path, status code in structured JSON format

function requestLogger(req, res, next) {
    const startTime = Date.now();

    // Capture the original end function
    const originalEnd = res.end;

    // Override res.end to log after response is sent
    res.end = function (...args) {
        const duration = Date.now() - startTime;

        // Structured JSON logging format
        const logEntry = {
            timestamp: new Date().toISOString(),
            service: 'user-service',
            type: 'request',
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration}ms`
        };

        console.log(JSON.stringify(logEntry));

        // Call the original end function
        originalEnd.apply(res, args);
    };

    next();
}

module.exports = requestLogger;
