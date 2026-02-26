const mongoose = require('mongoose');

class DatabaseConnection {
    constructor() {
        this.isConnected = false;
        this.maxRetries = 10;
        this.initialRetryDelay = 1000; // 1 second
        this.maxRetryDelay = 30000; // 30 seconds
        this.backoffMultiplier = 2;
    }

    async connect() {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/userdb';

        let retryCount = 0;
        let retryDelay = this.initialRetryDelay;

        while (retryCount < this.maxRetries) {
            try {
                await mongoose.connect(mongoUri);
                this.isConnected = true;
                console.log(`[User Service] Connected to MongoDB at ${mongoUri}`);
                return;
            } catch (error) {
                retryCount++;
                console.error(`[User Service] Database connection attempt ${retryCount} failed:`, error.message);

                if (retryCount >= this.maxRetries) {
                    console.error(`[User Service] Max retry attempts (${this.maxRetries}) reached. Exiting.`);
                    throw error;
                }

                console.log(`[User Service] Retrying in ${retryDelay}ms...`);
                await this.sleep(retryDelay);

                // Exponential backoff with max cap
                retryDelay = Math.min(retryDelay * this.backoffMultiplier, this.maxRetryDelay);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getConnectionStatus() {
        return mongoose.connection.readyState === 1;
    }

    async disconnect() {
        if (this.isConnected) {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log('[User Service] Disconnected from MongoDB');
        }
    }
}

module.exports = new DatabaseConnection();
