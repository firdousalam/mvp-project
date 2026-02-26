const request = require('supertest');
const mongoose = require('mongoose');
const database = require('./src/config/database');

// Import the app but don't start the server
const app = require('./index');

describe('User Service Health Check', () => {
    beforeAll(async () => {
        // Connect to test database
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/userdb-test';
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        // Disconnect from database
        await mongoose.disconnect();
    });

    describe('GET /health', () => {
        it('should return 200 with healthy status when database is connected', async () => {
            // Ensure database is connected
            expect(mongoose.connection.readyState).toBe(1);

            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toEqual({
                status: 'healthy'
            });
        });

        it('should return 503 with unhealthy status when database is disconnected', async () => {
            // Disconnect from database
            await mongoose.disconnect();

            const response = await request(app)
                .get('/health')
                .expect(503);

            expect(response.body).toEqual({
                status: 'unhealthy'
            });

            // Reconnect for cleanup
            const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/userdb-test';
            await mongoose.connect(mongoUri);
        });
    });
});
