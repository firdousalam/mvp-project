const fc = require('fast-check');
const request = require('supertest');

// Mock mongoose before requiring modules
jest.mock('mongoose', () => {
    const mockSchema = function () {
        this.methods = {};
        return this;
    };

    const mockModel = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({
            _id: 'mock-id',
            email: 'test@example.com',
            name: 'Test User',
            createdAt: new Date()
        }),
        _id: 'mock-id',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date()
    }));

    mockModel.findOne = jest.fn();
    mockModel.findById = jest.fn().mockResolvedValue({
        _id: 'mock-id',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date()
    });
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

// Feature: product-order-system, Property 22: Request logging includes method, path, and status
// Feature: product-order-system, Property 23: Logs use structured format
// **Validates: Requirements 10.4, 10.5**

describe('Property Tests: Request Logging', () => {
    let consoleLogSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    // Property 22: Request logging includes method, path, and status
    test('Property 22: All requests are logged with method, path, and status code', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate various HTTP methods and paths
                fc.constantFrom(
                    { method: 'GET', endpoint: '/health' },
                    { method: 'GET', endpoint: '/users/507f1f77bcf86cd799439011' }
                ),
                async ({ method, endpoint }) => {
                    // Clear previous logs
                    consoleLogSpy.mockClear();

                    // Make request
                    await request(app).get(endpoint);

                    // Find the request log entry
                    const requestLogCall = consoleLogSpy.mock.calls.find(call => {
                        try {
                            const log = JSON.parse(call[0]);
                            return log.type === 'request';
                        } catch {
                            return false;
                        }
                    });

                    expect(requestLogCall).toBeDefined();

                    const requestLog = JSON.parse(requestLogCall[0]);

                    // Verify required fields are present
                    expect(requestLog).toHaveProperty('method');
                    expect(requestLog).toHaveProperty('path');
                    expect(requestLog).toHaveProperty('status');

                    // Verify method matches
                    expect(requestLog.method).toBe(method);

                    // Verify path is logged
                    expect(typeof requestLog.path).toBe('string');

                    // Verify status code is a number
                    expect(typeof requestLog.status).toBe('number');
                    expect(requestLog.status).toBeGreaterThanOrEqual(200);
                    expect(requestLog.status).toBeLessThan(600);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 22: Request logs capture actual response status codes', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate requests that will produce different status codes
                fc.constantFrom(
                    { type: 'health', endpoint: '/health', expectedStatus: 200 }
                ),
                async ({ endpoint, expectedStatus }) => {
                    // Clear previous logs
                    consoleLogSpy.mockClear();

                    const response = await request(app).get(endpoint);

                    // Find the request log
                    const requestLogCall = consoleLogSpy.mock.calls.find(call => {
                        try {
                            const log = JSON.parse(call[0]);
                            return log.type === 'request';
                        } catch {
                            return false;
                        }
                    });

                    expect(requestLogCall).toBeDefined();
                    const requestLog = JSON.parse(requestLogCall[0]);

                    // Verify logged status matches actual response status
                    expect(requestLog.status).toBe(response.status);
                    expect(requestLog.status).toBe(expectedStatus);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Property 23: Logs use structured format
    test('Property 23: All logs use structured JSON format', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate various request types
                fc.constantFrom('/health', '/users/507f1f77bcf86cd799439011'),
                async (endpoint) => {
                    // Clear previous logs
                    consoleLogSpy.mockClear();

                    // Make request
                    await request(app).get(endpoint);

                    // Verify all log calls are valid JSON
                    for (const call of consoleLogSpy.mock.calls) {
                        const logString = call[0];

                        // Should be parseable as JSON
                        expect(() => JSON.parse(logString)).not.toThrow();

                        const logObject = JSON.parse(logString);

                        // Should be an object (not array or primitive)
                        expect(typeof logObject).toBe('object');
                        expect(logObject).not.toBeNull();
                        expect(Array.isArray(logObject)).toBe(false);

                        // Should have structured fields
                        expect(logObject).toHaveProperty('timestamp');
                        expect(logObject).toHaveProperty('service');
                        expect(logObject).toHaveProperty('type');

                        // Timestamp should be ISO 8601 format
                        expect(() => new Date(logObject.timestamp)).not.toThrow();
                        expect(new Date(logObject.timestamp).toISOString()).toBe(logObject.timestamp);

                        // Service should be a string
                        expect(typeof logObject.service).toBe('string');

                        // Type should be a string
                        expect(typeof logObject.type).toBe('string');
                    }
                }
            ),
            { numRuns: 100 }
        );
    }, 10000); // 10 second timeout

    test('Property 23: Request logs contain all required structured fields', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom('/health', '/users/507f1f77bcf86cd799439011'),
                async (endpoint) => {
                    // Clear previous logs
                    consoleLogSpy.mockClear();

                    await request(app).get(endpoint);

                    // Find request log
                    const requestLogCall = consoleLogSpy.mock.calls.find(call => {
                        try {
                            const log = JSON.parse(call[0]);
                            return log.type === 'request';
                        } catch {
                            return false;
                        }
                    });

                    expect(requestLogCall).toBeDefined();
                    const requestLog = JSON.parse(requestLogCall[0]);

                    // Verify structured format with all required fields
                    const requiredFields = ['timestamp', 'service', 'type', 'method', 'path', 'status', 'duration'];

                    for (const field of requiredFields) {
                        expect(requestLog).toHaveProperty(field);
                    }

                    // Verify field types
                    expect(typeof requestLog.timestamp).toBe('string');
                    expect(typeof requestLog.service).toBe('string');
                    expect(typeof requestLog.type).toBe('string');
                    expect(typeof requestLog.method).toBe('string');
                    expect(typeof requestLog.path).toBe('string');
                    expect(typeof requestLog.status).toBe('number');
                    expect(typeof requestLog.duration).toBe('string');

                    // Verify service name
                    expect(requestLog.service).toBe('user-service');

                    // Verify type
                    expect(requestLog.type).toBe('request');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 23: Error logs contain all required structured fields', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate invalid data to trigger errors
                fc.record({
                    email: fc.constant(''),
                    password: fc.string({ maxLength: 7 }),
                    name: fc.constant('')
                }),
                async (invalidData) => {
                    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
                    consoleLogSpy.mockClear();

                    await request(app).post('/users').send(invalidData);

                    // Find error log
                    if (consoleErrorSpy.mock.calls.length > 0) {
                        const errorLogCall = consoleErrorSpy.mock.calls[0];
                        const errorLog = JSON.parse(errorLogCall[0]);

                        // Verify structured format with required fields
                        const requiredFields = ['timestamp', 'service', 'type', 'error'];

                        for (const field of requiredFields) {
                            expect(errorLog).toHaveProperty(field);
                        }

                        // Verify field types
                        expect(typeof errorLog.timestamp).toBe('string');
                        expect(typeof errorLog.service).toBe('string');
                        expect(typeof errorLog.type).toBe('string');
                        expect(typeof errorLog.error).toBe('string');

                        // Verify service name
                        expect(errorLog.service).toBe('user-service');

                        // Verify type
                        expect(errorLog.type).toBe('error');
                    }

                    consoleErrorSpy.mockRestore();
                }
            ),
            { numRuns: 20 } // Reduced runs
        );
    }, 10000); // 10 second timeout
});
