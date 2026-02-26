const fc = require('fast-check');

// Mock mongoose before requiring database module
jest.mock('mongoose', () => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    connection: {
        readyState: 0
    }
}));

const mongoose = require('mongoose');
const database = require('./database');

// Feature: product-order-system, Property 15: Database connection failures trigger exponential backoff retry
// **Validates: Requirements 5.5**

describe('Property Test: Database Connection Retry with Exponential Backoff', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        database.isConnected = false;
        mongoose.connection.readyState = 0;
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    test('Property 15: Database connection failures trigger exponential backoff retry', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate number of failures before success (1 to 9, since max is 10)
                fc.integer({ min: 1, max: 9 }),
                async (failureCount) => {
                    // Reset database state
                    database.isConnected = false;

                    // Track sleep delays to verify exponential backoff
                    const sleepDelays = [];
                    const originalSleep = database.sleep;
                    database.sleep = jest.fn((ms) => {
                        sleepDelays.push(ms);
                        return Promise.resolve();
                    });

                    // Setup mongoose.connect to fail failureCount times, then succeed
                    mongoose.connect.mockClear();
                    for (let i = 0; i < failureCount; i++) {
                        mongoose.connect.mockRejectedValueOnce(new Error('Connection failed'));
                    }
                    mongoose.connect.mockResolvedValueOnce();
                    mongoose.connection.readyState = 1;

                    // Execute connection
                    await database.connect();

                    // Verify connection succeeded
                    expect(database.isConnected).toBe(true);
                    expect(mongoose.connect).toHaveBeenCalledTimes(failureCount + 1);

                    // Verify exponential backoff was applied
                    expect(sleepDelays.length).toBe(failureCount);

                    // Calculate expected delays with exponential backoff
                    const expectedDelays = [];
                    let delay = database.initialRetryDelay;
                    for (let i = 0; i < failureCount; i++) {
                        expectedDelays.push(delay);
                        delay = Math.min(delay * database.backoffMultiplier, database.maxRetryDelay);
                    }

                    // Verify each delay matches expected exponential backoff
                    expect(sleepDelays).toEqual(expectedDelays);

                    // Verify delays are increasing (exponential) until they hit the cap
                    for (let i = 1; i < sleepDelays.length; i++) {
                        const prevDelay = sleepDelays[i - 1];
                        const currentDelay = sleepDelays[i];

                        // Current delay should be either double the previous or capped at max
                        const expectedDelay = Math.min(prevDelay * database.backoffMultiplier, database.maxRetryDelay);
                        expect(currentDelay).toBe(expectedDelay);
                    }

                    // Verify delays respect the maximum cap
                    sleepDelays.forEach(delay => {
                        expect(delay).toBeLessThanOrEqual(database.maxRetryDelay);
                    });

                    // Restore original sleep
                    database.sleep = originalSleep;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 15: Max retries is respected and connection fails after exhausting retries', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate max retries between 3 and 15
                fc.integer({ min: 3, max: 15 }),
                async (maxRetries) => {
                    // Reset and configure database instance
                    database.isConnected = false;
                    const originalMaxRetries = database.maxRetries;
                    database.maxRetries = maxRetries;
                    database.sleep = jest.fn().mockResolvedValue();

                    // Setup mongoose to always fail
                    mongoose.connect.mockClear();
                    mongoose.connect.mockRejectedValue(new Error('Connection failed'));

                    // Expect connection to fail after max retries
                    await expect(database.connect()).rejects.toThrow('Connection failed');

                    // Verify exactly maxRetries attempts were made
                    expect(mongoose.connect).toHaveBeenCalledTimes(maxRetries);

                    // Verify sleep was called maxRetries - 1 times (no sleep after last failure)
                    expect(database.sleep).toHaveBeenCalledTimes(maxRetries - 1);

                    // Restore original maxRetries
                    database.maxRetries = originalMaxRetries;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 15: Exponential backoff delay calculation is correct', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Test with different numbers of retries
                fc.integer({ min: 2, max: 9 }),
                async (failureCount) => {
                    // Reset database state
                    database.isConnected = false;

                    // Track sleep delays
                    const sleepDelays = [];
                    database.sleep = jest.fn((ms) => {
                        sleepDelays.push(ms);
                        return Promise.resolve();
                    });

                    // Setup failures
                    mongoose.connect.mockClear();
                    for (let i = 0; i < failureCount; i++) {
                        mongoose.connect.mockRejectedValueOnce(new Error('Connection failed'));
                    }
                    mongoose.connect.mockResolvedValueOnce();
                    mongoose.connection.readyState = 1;

                    await database.connect();

                    // Verify exponential growth pattern
                    let expectedDelay = database.initialRetryDelay;
                    for (let i = 0; i < sleepDelays.length; i++) {
                        expect(sleepDelays[i]).toBe(Math.min(expectedDelay, database.maxRetryDelay));
                        expectedDelay = expectedDelay * database.backoffMultiplier;
                    }

                    // Verify first delay is always the initial delay
                    expect(sleepDelays[0]).toBe(database.initialRetryDelay);

                    // Verify delays never exceed max
                    expect(Math.max(...sleepDelays)).toBeLessThanOrEqual(database.maxRetryDelay);
                }
            ),
            { numRuns: 100 }
        );
    });
});
