// Product Service Entry Point
const express = require('express');
const connectDB = require('./src/config/database');
const productRoutes = require('./src/routes/productRoutes');
const requestLogger = require('./src/middleware/logger');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/', productRoutes);

// Health check endpoint with database connectivity check
app.get('/health', (req, res) => {
    const isHealthy = connectDB.getConnectionStatus();
    if (isHealthy) {
        res.status(200).json({ status: 'healthy' });
    } else {
        res.status(503).json({ status: 'unhealthy' });
    }
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
    try {
        // Connect to database first
        await connectDB.connect();

        app.listen(PORT, () => {
            console.log(`Product Service listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start Product Service:', error.message);
        process.exit(1);
    }
}

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
    startServer();
}

module.exports = app;
