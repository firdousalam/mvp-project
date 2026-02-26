const jwt = require('jsonwebtoken');

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
    '/health',
    '/auth/login',
    '/users', // POST only (registration)
    '/'
];

// Check if route is public
function isPublicRoute(path, method) {
    // Health checks are always public
    if (path.startsWith('/health')) {
        return true;
    }

    // Root path is public
    if (path === '/') {
        return true;
    }

    // Login is public
    if (path === '/auth/login') {
        return true;
    }

    // User registration (POST /users) is public
    if (path === '/users' && method === 'POST') {
        return true;
    }

    return false;
}

// Authentication middleware
function authMiddleware(req, res, next) {
    // Skip authentication for public routes
    if (isPublicRoute(req.path, req.method)) {
        return next();
    }

    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: 'No authorization token provided',
                hint: 'Include Authorization header with Bearer token'
            }
        });
    }

    // Extract token (format: "Bearer TOKEN")
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            error: {
                code: 'INVALID_TOKEN_FORMAT',
                message: 'Invalid authorization header format',
                hint: 'Use format: Authorization: Bearer YOUR_TOKEN'
            }
        });
    }

    const token = parts[1];

    // Verify token
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Add user info to request
        req.user = decoded;

        // Add user ID to headers for downstream services
        req.headers['x-user-id'] = decoded.userId;
        req.headers['x-user-email'] = decoded.email;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Authentication token has expired',
                    hint: 'Please login again to get a new token'
                }
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid authentication token',
                    hint: 'Please login again to get a valid token'
                }
            });
        }

        return res.status(500).json({
            error: {
                code: 'AUTH_ERROR',
                message: 'Error verifying authentication token'
            }
        });
    }
}

// Optional: Middleware to check specific roles/permissions
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                }
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions',
                    requiredRole: roles,
                    userRole: req.user.role
                }
            });
        }

        next();
    };
}

module.exports = {
    authMiddleware,
    requireRole,
    JWT_SECRET
};
