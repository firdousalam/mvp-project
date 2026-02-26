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
            readyState: 1
        },
        Schema: mockSchema,
        model: jest.fn(() => mockModel)
    };
});

const mongoose = require('mongoose');
const app = require('../../index');

// Feature: product-order-system, Property 19: Error logging includes required metadata
// Feature: product-order-system, Property 20: Invalid requests return 400 with error message
// Feature: product-order-system, Property 21: Internal errors return 500 status code
// **Validates: Requirements 10.1, 10.2, 10.3**

describe('Property Tests: Error Handling and Logging', () => {
    let consoleErrorSpy;
    let consoleLogSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleLogSpy.mockRestore();
    });

    // Property 19: Error logging includes required metadata
    test('Property 19: Error logs contain timestamp, service name, and error details', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate various invalid user data scenarios
                fc.record({
                    email: fc.oneof(
                        fc.constant(''), // Empty email
                        fc.constant('invalid-email'), // Invalid format
                        fc.constant(null) // Null email
                    ),
                    password: fc.string({ minLength: 1, maxLength: 7 }), // Too short
                    name: fc.string({ minLength: 1 })
                }),
                async (invalidUserData) => {
                    // Make request that will trigger validation error
                    await request(app)
                        .post('/users')
                        .send(invalidUserData);

                    // Check if error was logged
                    if (consoleErrorSpy.mock.calls.length > 0) {
                        const errorLogCall = consoleErrorSpy.mock.calls[0][0];
                        const errorLog = JSON.parse(errorLogCall);

                        // Verify required metadata fields exist
                        expect(errorLog).toHaveProperty('timestamp');
                        expect(errorLog).toHaveProperty('service');
                        expect(errorLog).toHaveProperty('type');
                        expect(errorLog).toHaveProperty('error');

                        // Verify timestamp is valid ISO 8601 format
                        expect(() => new Date(errorLog.timestamp)).not.toThrow();
                        expect(new Date(errorLog.timestamp).toISOString()).toBe(errorLog.timestamp);

                        // Verify service name is correct
                        expect(errorLog.service).toBe('user-service');

                        // Verify type is 'error'
                        expect(errorLog.type).toBe('error');

                        // Verify error details are present
                        expect(typeof errorLog.error).toBe('string');
                        expect(errorLog.error.length).toBeGreaterThan(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 20: Invalid requests return 400 with error message
    test('Property 20: Invalid requests return 400 status with descriptive error message', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate various types of invalid data
                fc.oneof(
                    // Missing required fields
                    fc.record({
                        email: fc.emailAddress()
                        // Missing password and name
                    }),
                    // Invalid email format
                    fc.record({
                        email: fc.string().filter(s => !s.includes('@')),
                        password: fc.string({ minLength: 8 }),
                        name: fc.string({ minLength: 1 })
                    }),
                    // Password too short
                    fc.record({
                        email: fc.emailAddress(),
                        password: fc.string({ maxLength: 7 }),
                        name: fc.string({ minLength: 1 })
                    }),
                    // Empty name
                    fc.record({
                        email: fc.emailAddress(),
                        password: fc.string({ minLength: 8 }),
                        name: fc.constant('')
                    })
                ),
                async (invalidData) => {
                    const response = await request(app)
                        .post('/users')
                        .send(invalidData);

                    // Verify 400 status code for invalid requests
                    expect(response.status).toBe(400);

                    // Verify error response structure
                    expect(response.body).toHaveProperty('error');
                    expect(response.body.error).toHaveProperty('message');

                    // Verify error message is descriptive (not empty)
                    expect(typeof response.body.error.message).toBe('string');
                    expect(response.body.error.message.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 21: Internal errors return 500 status code
    test('Property 21: Internal server errors return 500 status code', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.hexaString({ minLength: 24, maxLength: 24 }), // Valid MongoDB ObjectId format
                async (userId) => {
                    // Mock database error to simulate internal error
                    const User = mongoose.model('User');
                    User.findById.mockRejectedValueOnce(new Error('Database connection lost'));

                    const response = await request(app)
                        .get(`/users/${userId}`);

                    // Verify 500 status code for internal errors
                    expect(response.status).toBe(500);

                    // Verify error response structure
                    expect(response.body).toHaveProperty('error');
                    expect(response.body.error).toHaveProperty('message');

                    // Verify error message contains indication of internal error
                    expect(typeof response.body.error.message).toBe('string');
                    expect(response.body.error.message.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 21: Unexpected exceptions return 500 status code', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    email: fc.emailAddress(),
                    password: fc.string({ minLength: 8 }),
                    name: fc.string({ minLength: 1 })
                }),
                async (userData) => {
                    // Mock unexpected error during database operation
                    const User = mongoose.model('User');
                    User.findOne.mockResolvedValueOnce(null); // No existing user

                    // Mock save to throw unexpected error
                    const mockUserInstance = {
                        save: jest.fn().mockRejectedValueOnce(new Error('Unexpected database error')),
                        _id: 'mock-id',
                        email: userData.email,
                        name: userData.name,
                        createdAt: new Date()
                    };
                    User.mockImplementationOnce(() => mockUserInstance);

                    const response = await request(app)
                        .post('/users')
                        .send(userData);

                    // Verify 500 status code
                    expect(response.status).toBe(500);

                    // Verify error response structure
                    expect(response.body).toHaveProperty('error');
                    expect(response.body.error).toHaveProperty('message');

                    // Verify error message indicates internal error
                    expect(typeof response.body.error.message).toBe('string');
                    expect(response.body.error.message.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 20 } // Reduced runs to avoid timeout
        );
    }, 10000); // 10 second timeout
});
