const mongoose = require('mongoose');

const healthCheck = (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
        res.status(200).json({ status: 'healthy' });
    } else {
        res.status(503).json({ status: 'unhealthy' });
    }
};

module.exports = {
    healthCheck
};
