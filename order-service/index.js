const express = require('express');
const connectDB = require('./src/config/database');
const logger = require('./src/middleware/logger');
const errorHandler = require('./src/middleware/errorHandler');
const orderRoutes = require('./src/routes/orderRoutes');
const healthRoutes = require('./src/routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(express.json());
app.use(logger);

// Routes
app.use('/orders', orderRoutes);
app.use('/health', healthRoutes);

// Error handling
app.use(errorHandler);

// Start server only after database connection
const startServer = async () => {
    try {
        await connectDB.connect();
        app.listen(PORT, () => {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                service: 'order-service',
                message: `Server running on port ${PORT}`
            }));
        });
    } catch (error) {
        console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            service: 'order-service',
            level: 'error',
            message: 'Failed to start server',
            error: error.message
        }));
        process.exit(1);
    }
};

startServer();

module.exports = app;
