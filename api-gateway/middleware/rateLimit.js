const rateLimit = require('express-rate-limit');

// General rate limiter for all routes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP, please try again later',
            retryAfter: '15 minutes'
        }
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        console.log(`[Rate Limit] IP ${req.ip} exceeded rate limit`);
        res.status(429).json({
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later',
                retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
            }
        });
    }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    skipSuccessfulRequests: true, // Don't count successful requests
    message: {
        error: {
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts, please try again later',
            retryAfter: '15 minutes'
        }
    },
    handler: (req, res) => {
        console.log(`[Auth Rate Limit] IP ${req.ip} exceeded auth rate limit`);
        res.status(429).json({
            error: {
                code: 'AUTH_RATE_LIMIT_EXCEEDED',
                message: 'Too many login attempts, please try again later',
                retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
                hint: 'For security, login attempts are limited. Please wait before trying again.'
            }
        });
    }
});

// Moderate rate limiter for write operations (POST, PUT, DELETE)
const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 write operations per windowMs
    skip: (req) => req.method === 'GET', // Only apply to write operations
    message: {
        error: {
            code: 'WRITE_RATE_LIMIT_EXCEEDED',
            message: 'Too many write operations, please try again later',
            retryAfter: '15 minutes'
        }
    }
});

// Lenient rate limiter for read operations
const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 read operations per windowMs
    skip: (req) => req.method !== 'GET',
    message: {
        error: {
            code: 'READ_RATE_LIMIT_EXCEEDED',
            message: 'Too many read operations, please try again later',
            retryAfter: '15 minutes'
        }
    }
});

module.exports = {
    generalLimiter,
    authLimiter,
    writeLimiter,
    readLimiter
};
