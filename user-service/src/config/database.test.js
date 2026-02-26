const mongoose = require('mongoose');
const database = require('./database');

// Mock mongoose.connect
jest.mock('mongoose', () => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    connection: {
        readyState: 0
    }
}));

describe('Database Connection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        database.isConnected = false;
        jest.clearAllTimers();
    });

    test('should connect successfully on first attempt', async () => {
        mongoose.connect.mockResolvedValueOnce();
        mongoose.connection.readyState = 1;

        await database.connect();

        expect(mongoose.connect).toHaveBeenCalledTimes(1);
        expect(database.isConnected).toBe(true);
    });

    test('should retry with exponential backoff on connection failure', async () => {
        // Mock the sleep function to track delays
        const originalSleep = database.sleep;
        const sleepDelays = [];
        database.sleep = jest.fn((ms) => {
            sleepDelays.push(ms);
            return Promise.resolve();
        });

        // Fail first 2 attempts, succeed on 3rd
        mongoose.connect
            .mockRejectedValueOnce(new Error('Connection failed'))
            .mockRejectedValueOnce(new Error('Connection failed'))
            .mockResolvedValueOnce();

        mongoose.connection.readyState = 1;

        await database.connect();

        expect(mongoose.connect).toHaveBeenCalledTimes(3);
        expect(database.isConnected).toBe(true);

        // Verify exponential backoff: 1000ms, then 2000ms
        expect(sleepDelays).toEqual([1000, 2000]);

        // Restore original sleep
        database.sleep = originalSleep;
    });

    test('should throw error after max retries', async () => {
        // Mock the sleep function to avoid waiting
        const originalSleep = database.sleep;
        database.sleep = jest.fn().mockResolvedValue();

        mongoose.connect.mockRejectedValue(new Error('Connection failed'));

        await expect(database.connect()).rejects.toThrow('Connection failed');
        expect(mongoose.connect).toHaveBeenCalledTimes(10); // maxRetries

        // Restore original sleep
        database.sleep = originalSleep;
    });

    test('should read MONGO_URI from environment variable', async () => {
        process.env.MONGO_URI = 'mongodb://test:27017/testdb';
        mongoose.connect.mockResolvedValueOnce();
        mongoose.connection.readyState = 1;

        await database.connect();

        expect(mongoose.connect).toHaveBeenCalledWith('mongodb://test:27017/testdb');
        delete process.env.MONGO_URI;
    });

    test('should return connection status correctly', () => {
        mongoose.connection.readyState = 1;
        expect(database.getConnectionStatus()).toBe(true);

        mongoose.connection.readyState = 0;
        expect(database.getConnectionStatus()).toBe(false);
    });

    test('should disconnect from database', async () => {
        database.isConnected = true;
        mongoose.disconnect.mockResolvedValueOnce();

        await database.disconnect();

        expect(mongoose.disconnect).toHaveBeenCalledTimes(1);
        expect(database.isConnected).toBe(false);
    });
});
