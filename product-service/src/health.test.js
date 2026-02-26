const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const connectDB = require('./config/database');

describe('Health Check Endpoint', () => {
    afterAll(async () => {
        await connectDB.disconnect();
    });

    test('should return 200 and healthy status when database is connected', async () => {
        // Mock the database connection status to return true
        jest.spyOn(connectDB, 'getConnectionStatus').mockReturnValue(true);

        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'healthy' });

        connectDB.getConnectionStatus.mockRestore();
    });

    test('should return 503 and unhealthy status when database is disconnected', async () => {
        // Mock the database connection status to return false
        jest.spyOn(connectDB, 'getConnectionStatus').mockReturnValue(false);

        const response = await request(app).get('/health');

        expect(response.status).toBe(503);
        expect(response.body).toEqual({ status: 'unhealthy' });

        connectDB.getConnectionStatus.mockRestore();
    });
});
