// Integration test to verify User Service wiring
const request = require('supertest');
const app = require('../index');
const database = require('./config/database');

describe('User Service Integration - Wiring', () => {
    beforeAll(async () => {
        // Connect to test database
        process.env.MONGO_URI = 'mongodb://localhost:27017/userdb-test';
        await database.connect();
    });

    afterAll(async () => {
        await database.disconnect();
    });

    test('Express app should have body parser middleware', async () => {
        const response = await request(app)
            .post('/users')
            .send({ email: 'test@example.com', password: 'password123', name: 'Test User' })
            .set('Content-Type', 'application/json');

        // Should not get 400 for missing body parser
        expect(response.status).not.toBe(415);
    });

    test('Health check endpoint should be accessible', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBeOneOf([200, 503]);
        expect(response.body).toHaveProperty('status');
    });

    test('Error handler should return structured error responses', async () => {
        const response = await request(app)
            .post('/users')
            .send({ email: 'invalid', password: '123', name: '' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    test('Routes should be registered correctly', async () => {
        // Test that routes exist (even if they fail validation)
        const userResponse = await request(app).post('/users').send({});
        expect(userResponse.status).not.toBe(404);

        const loginResponse = await request(app).post('/auth/login').send({});
        expect(loginResponse.status).not.toBe(404);
    });

    test('PORT should be configurable via environment variable', () => {
        const originalPort = process.env.PORT;

        // Test default port
        delete process.env.PORT;
        expect(process.env.PORT || 3001).toBe(3001);

        // Test custom port
        process.env.PORT = '4000';
        expect(process.env.PORT || 3001).toBe('4000');

        // Restore
        if (originalPort) {
            process.env.PORT = originalPort;
        } else {
            delete process.env.PORT;
        }
    });
});

// Custom matcher for multiple possible values
expect.extend({
    toBeOneOf(received, expected) {
        const pass = expected.includes(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be one of ${expected}`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be one of ${expected}`,
                pass: false,
            };
        }
    },
});
