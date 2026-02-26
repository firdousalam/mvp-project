const NodeCache = require('node-cache');

// Create cache instance
// stdTTL: default time to live in seconds
// checkperiod: period in seconds to check for expired keys
const cache = new NodeCache({
    stdTTL: 300, // 5 minutes default
    checkperiod: 60, // Check every minute
    useClones: false
});

// Cache middleware for GET requests
function cacheMiddleware(duration = 300) {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Skip caching for health checks
        if (req.path.includes('/health')) {
            return next();
        }

        // Create cache key from URL and query params
        const key = `__express__${req.originalUrl || req.url}`;

        // Check if we have cached response
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            console.log(`[Cache] HIT: ${key}`);

            // Add cache header
            res.set('X-Cache', 'HIT');
            res.set('X-Cache-Key', key);

            return res.json(cachedResponse);
        }

        console.log(`[Cache] MISS: ${key}`);

        // Store original res.json function
        const originalJson = res.json.bind(res);

        // Override res.json to cache the response
        res.json = (body) => {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(key, body, duration);
                console.log(`[Cache] STORED: ${key} (TTL: ${duration}s)`);
            }

            // Add cache header
            res.set('X-Cache', 'MISS');
            res.set('X-Cache-Key', key);

            return originalJson(body);
        };

        next();
    };
}

// Middleware to invalidate cache for specific patterns
function invalidateCache(pattern) {
    return (req, res, next) => {
        // Only invalidate on write operations
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            const keys = cache.keys();
            const matchingKeys = keys.filter(key => key.includes(pattern));

            if (matchingKeys.length > 0) {
                cache.del(matchingKeys);
                console.log(`[Cache] INVALIDATED: ${matchingKeys.length} keys matching "${pattern}"`);
            }
        }

        next();
    };
}

// Clear all cache
function clearCache() {
    const keys = cache.keys();
    cache.flushAll();
    console.log(`[Cache] CLEARED: ${keys.length} keys removed`);
    return keys.length;
}

// Get cache statistics
function getCacheStats() {
    return {
        keys: cache.keys().length,
        hits: cache.getStats().hits,
        misses: cache.getStats().misses,
        ksize: cache.getStats().ksize,
        vsize: cache.getStats().vsize
    };
}

// Cache warming - preload common data
async function warmCache(url, data, duration = 300) {
    const key = `__express__${url}`;
    cache.set(key, data, duration);
    console.log(`[Cache] WARMED: ${key}`);
}

module.exports = {
    cacheMiddleware,
    invalidateCache,
    clearCache,
    getCacheStats,
    warmCache,
    cache
};
