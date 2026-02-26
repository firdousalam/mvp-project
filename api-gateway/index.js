const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

// Import custom middleware
const { authMiddleware } = require('./middleware/auth');
const { generalLimiter, authLimiter, writeLimiter, readLimiter } = require('./middleware/rateLimit');
const { cacheMiddleware, invalidateCache, clearCache, getCacheStats } = require('./middleware/cache');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable authentication (set to false to disable)
const AUTH_ENABLED = process.env.AUTH_ENABLED !== 'false';

// Service URLs from environment or defaults
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

console.log('========================================');
console.log('API Gateway Configuration:');
console.log('- User Service:', USER_SERVICE_URL);
console.log('- Product Service:', PRODUCT_SERVICE_URL);
console.log('- Order Service:', ORDER_SERVICE_URL);
console.log('- Authentication:', AUTH_ENABLED ? 'ENABLED' : 'DISABLED');
console.log('- Rate Limiting: ENABLED');
console.log('- Caching: ENABLED');
console.log('========================================');

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors());

// Request logging
app.use(morgan('combined'));

// Body parser
app.use(express.json());

// Apply general rate limiter to all routes
app.use(generalLimiter);

// Authentication middleware (if enabled)
if (AUTH_ENABLED) {
    app.use(authMiddleware);
}

// Health check endpoint for the gateway itself
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
        features: {
            authentication: AUTH_ENABLED,
            rateLimiting: true,
            caching: true
        },
        upstreamServices: {
            userService: USER_SERVICE_URL,
            productService: PRODUCT_SERVICE_URL,
            orderService: ORDER_SERVICE_URL
        }
    });
});

// Gateway info endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Product Order System API Gateway',
        version: '2.0.0',
        features: {
            authentication: AUTH_ENABLED ? 'enabled' : 'disabled',
            rateLimiting: 'enabled',
            caching: 'enabled',
            cors: 'enabled',
            security: 'helmet enabled'
        },
        endpoints: {
            users: '/users',
            auth: '/auth',
            products: '/products',
            orders: '/orders',
            health: '/health',
            admin: '/admin'
        },
        documentation: {
            userService: '/users/docs',
            productService: '/products/docs',
            orderService: '/orders/docs'
        },
        rateLimit: {
            general: '100 requests per 15 minutes',
            auth: '5 attempts per 15 minutes',
            write: '50 requests per 15 minutes',
            read: '200 requests per 15 minutes'
        }
    });
});

// Admin endpoints for cache management
app.get('/admin/cache/stats', (req, res) => {
    const stats = getCacheStats();
    res.json({
        cache: stats,
        timestamp: new Date().toISOString()
    });
});

app.post('/admin/cache/clear', (req, res) => {
    const clearedKeys = clearCache();
    res.json({
        message: 'Cache cleared successfully',
        keysCleared: clearedKeys,
        timestamp: new Date().toISOString()
    });
});

// Proxy options with error handling
const proxyOptions = (target, serviceName) => ({
    target,
    changeOrigin: true,
    pathRewrite: (path, req) => {
        return path;
    },
    onError: (err, req, res) => {
        console.error(`[API Gateway] Error proxying to ${serviceName}:`, err.message);
        res.status(503).json({
            error: {
                code: 'SERVICE_UNAVAILABLE',
                message: `${serviceName} is currently unavailable`,
                details: err.message
            }
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[API Gateway] ${req.method} ${req.path} -> ${serviceName}`);

        // Forward user info if authenticated
        if (req.user) {
            proxyReq.setHeader('X-User-Id', req.user.userId);
            proxyReq.setHeader('X-User-Email', req.user.email);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[API Gateway] ${serviceName} responded with status ${proxyRes.statusCode}`);
    }
});

// User Service Routes
// Apply auth rate limiter to login endpoint
app.use('/auth/login', authLimiter);

// Apply cache to GET requests, invalidate on writes
app.use('/users',
    cacheMiddleware(300), // Cache for 5 minutes
    invalidateCache('/users'),
    createProxyMiddleware(proxyOptions(USER_SERVICE_URL, 'User Service'))
);

app.use('/auth',
    createProxyMiddleware(proxyOptions(USER_SERVICE_URL, 'User Service'))
);

// Product Service Routes
// Apply read/write limiters and caching
app.use('/products',
    readLimiter,
    writeLimiter,
    cacheMiddleware(600), // Cache for 10 minutes (products change less frequently)
    invalidateCache('/products'),
    createProxyMiddleware(proxyOptions(PRODUCT_SERVICE_URL, 'Product Service'))
);

// Order Service Routes
// Apply write limiter and shorter cache (orders change frequently)
app.use('/orders',
    writeLimiter,
    cacheMiddleware(60), // Cache for 1 minute only
    invalidateCache('/orders'),
    createProxyMiddleware(proxyOptions(ORDER_SERVICE_URL, 'Order Service'))
);

// Health check routes for individual services
app.get('/health/user', createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/health/user': '/health' }
}));

app.get('/health/product', createProxyMiddleware({
    target: PRODUCT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/health/product': '/health' }
}));

app.get('/health/order', createProxyMiddleware({
    target: ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/health/order': '/health' }
}));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found',
            path: req.path,
            availableEndpoints: ['/users', '/auth', '/products', '/orders', '/health', '/admin']
        }
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[API Gateway] Error:', err);
    res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred in the API Gateway',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        }
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log('========================================');
    console.log('API Gateway started successfully!');
    console.log(`Listening on port ${PORT}`);
    console.log(`Gateway URL: http://localhost:${PORT}`);
    console.log('========================================');
    console.log('Available routes:');
    console.log('  GET  /              - Gateway info');
    console.log('  GET  /health        - Gateway health check');
    console.log('  *    /users/*       - User Service');
    console.log('  *    /auth/*        - Authentication (User Service)');
    console.log('  *    /products/*    - Product Service');
    console.log('  *    /orders/*      - Order Service');
    console.log('  GET  /health/user   - User Service health');
    console.log('  GET  /health/product - Product Service health');
    console.log('  GET  /health/order  - Order Service health');
    console.log('  GET  /admin/cache/stats - Cache statistics');
    console.log('  POST /admin/cache/clear - Clear cache');
    console.log('========================================');
    console.log('Features:');
    console.log(`  ✓ Authentication: ${AUTH_ENABLED ? 'ENABLED' : 'DISABLED'}`);
    console.log('  ✓ Rate Limiting: ENABLED');
    console.log('  ✓ Request Caching: ENABLED');
    console.log('  ✓ CORS: ENABLED');
    console.log('  ✓ Security Headers: ENABLED');
    console.log('========================================');
    if (!AUTH_ENABLED) {
        console.log('⚠️  WARNING: Authentication is DISABLED');
        console.log('   Set AUTH_ENABLED=true to enable authentication');
        console.log('========================================');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
