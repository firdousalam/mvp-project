const fc = require('fast-check');
const request = require('supertest');

// Mock mongoose before requiring modules
jest.mock('mongoose', () => {
    const mockSchema = function () {
        this.methods = {};
        return this;
    };

    const mockModel = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({}),
        _id: 'mock-id',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date()
    }));

    mockModel.findOne = jest.fn();
    mockModel.findById = jest.fn();
    mockModel.findByIdAndDelete = jest.fn();

    return {
        connect: jest.fn(),
        disconnect: jest.fn(),
        connection: {
            readyState: 1 // Default to connected state
        },
        Schema: mockSchema,
        model: jest.fn(() => mockModel)
    };
});

const mongoose = require('mongoose');
const app = require('../index');
const database = require('./config/database');

// Feature: product-order-system, Property 18: Health check verifies database connectivity
// **Validates: Requirements 9.4, 9.5**

describe('Property Test: Health Check Verifies Database Connectivity', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Property 18: Health check returns 200 when database is connected', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate various connected states (readyState 1 = connected)
                fc.constant(1),
                async (readyState) => {
                    // Set database to connected state
                    mongoose.connection.readyState = readyState;

                    // Make health check request
                    const response = await request(app).get('/health');

                    // Verify healthy response
                    expect(response.status).toBe(200);
                    expect(response.body).toEqual({ status: 'healthy' });
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 18: Health check returns 503 when database is disconnected', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate various disconnected states (0 = disconnected, 2 = connecting, 3 = disconnecting)
                fc.constantFrom(0, 2, 3),
                async (readyState) => {
                    // Set database to disconnected/non-ready state
                    mongoose.connection.readyState = readyState;

                    // Make health check request
                    const response = await request(app).get('/health');

                    // Verify unhealthy response with 503 status
                    expect(response.status).toBe(503);
                    expect(response.body).toEqual({ status: 'unhealthy' });
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 18: Health check status reflects actual database connection state', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate random connection states (0-3)
                fc.integer({ min: 0, max: 3 }),
                async (readyState) => {
                    // Set database connection state
                    mongoose.connection.readyState = readyState;

                    // Make health check request
                    const response = await request(app).get('/health');

                    // Verify response matches connection state
                    if (readyState === 1) {
                        // Connected state should return healthy
                        expect(response.status).toBe(200);
                        expect(response.body.status).toBe('healthy');
                    } else {
                        // Any other state should return unhealthy
                        expect(response.status).toBe(503);
                        expect(response.body.status).toBe('unhealthy');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 18: Health check consistently verifies database connectivity', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate sequences of connection state changes
                fc.array(fc.integer({ min: 0, max: 3 }), { minLength: 1, maxLength: 10 }),
                async (stateSequence) => {
                    // Test multiple health checks with changing connection states
                    for (const readyState of stateSequence) {
                        mongoose.connection.readyState = readyState;

                        const response = await request(app).get('/health');

                        // Verify each response correctly reflects the current state
                        const isConnected = readyState === 1;
                        expect(response.status).toBe(isConnected ? 200 : 503);
                        expect(response.body.status).toBe(isConnected ? 'healthy' : 'unhealthy');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
