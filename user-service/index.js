// User Service Entry Point
const express = require('express');
const database = require('./src/config/database');
const userRoutes = require('./src/routes/userRoutes');
const requestLogger = require('./src/middleware/logger');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/', userRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
    const isHealthy = database.getConnectionStatus();
    if (isHealthy) {
        res.status(200).json({ status: 'healthy' });
    } else {
        res.status(503).json({ status: 'unhealthy' });
    }
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server only after database connection is established
async function startServer() {
    try {
        await database.connect();
        app.listen(PORT, () => {
            console.log(`User Service listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start User Service:', error.message);
        process.exit(1);
    }
}

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
    startServer();
}

module.exports = app;
