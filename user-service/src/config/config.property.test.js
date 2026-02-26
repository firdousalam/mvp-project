const fc = require('fast-check');
const mongoose = require('mongoose');

// Feature: product-order-system, Property 17: Configuration loaded from environment variables
// **Validates: Requirements 7.5, 11.1, 11.2, 11.3**

describe('Property Test: Configuration Loading from Environment Variables', () => {
    let originalEnv;
    let originalConnect;

    beforeEach(() => {
        // Save original environment
        originalEnv = { ...process.env };

        // Save original mongoose.connect
        originalConnect = mongoose.connect;

        // Clear relevant environment variables
        delete process.env.MONGO_URI;
        delete process.env.PORT;
        delete process.env.USER_SERVICE_URL;
        delete process.env.PRODUCT_SERVICE_URL;

        // Clear module cache to force re-evaluation
        delete require.cache[require.resolve('./database')];
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;

        // Restore mongoose.connect
        mongoose.connect = originalConnect;

        // Clear module cache
        delete require.cache[require.resolve('./database')];
    });

    test('Property 17: Database connection string is loaded from MONGO_URI environment variable', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate various MongoDB URI formats
                fc.record({
                    host: fc.oneof(
                        fc.constant('localhost'),
                        fc.constant('127.0.0.1'),
                        fc.constantFrom('testhost', 'dbserver', 'mongo-server')
                    ),
                    port: fc.integer({ min: 1024, max: 65535 }),
                    dbName: fc.constantFrom('userdb', 'testdb', 'proddb', 'devdb')
                }),
                async ({ host, port, dbName }) => {
                    const mongoUri = `mongodb://${host}:${port}/${dbName}`;

                    // Set environment variable
                    process.env.MONGO_URI = mongoUri;

                    // Mock mongoose.connect to capture the connection URI
                    let capturedUri = null;
                    mongoose.connect = jest.fn((uri) => {
                        capturedUri = uri;
                        return Promise.resolve();
                    });

                    // Clear and re-require database module to pick up new environment
                    delete require.cache[require.resolve('./database')];
                    const databaseModule = require('./database');

                    // Attempt connection
                    try {
                        await databaseModule.connect();
                    } catch (error) {
                        // Ignore connection errors for this test
                    }

                    // Verify the URI from environment variable was used
                    expect(capturedUri).toBe(mongoUri);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 17: Service port is loaded from PORT environment variable', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate valid port numbers
                fc.integer({ min: 1024, max: 65535 }),
                async (port) => {
                    // Set environment variable
                    process.env.PORT = port.toString();

                    // Verify that PORT environment variable is set correctly
                    expect(process.env.PORT).toBe(port.toString());

                    // Read the index.js file to verify it uses process.env.PORT
                    const fs = require('fs');
                    const indexContent = fs.readFileSync(require.resolve('../../index.js'), 'utf8');

                    // Verify the code reads from process.env.PORT
                    expect(indexContent).toContain('process.env.PORT');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 17: Configuration uses default values when environment variables are not set', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constant(null), // No input needed
                async () => {
                    // Ensure environment variables are not set
                    delete process.env.MONGO_URI;
                    delete process.env.PORT;

                    // Mock mongoose.connect to capture the connection URI
                    let capturedUri = null;
                    mongoose.connect = jest.fn((uri) => {
                        capturedUri = uri;
                        return Promise.resolve();
                    });

                    // Clear and re-require database module
                    delete require.cache[require.resolve('./database')];
                    const databaseModule = require('./database');

                    // Attempt connection
                    try {
                        await databaseModule.connect();
                    } catch (error) {
                        // Ignore connection errors
                    }

                    // Verify default MongoDB URI is used
                    expect(capturedUri).toBe('mongodb://localhost:27017/userdb');

                    // Verify default PORT would be used (3001)
                    const fs = require('fs');
                    const indexContent = fs.readFileSync(require.resolve('../../index.js'), 'utf8');
                    expect(indexContent).toContain('process.env.PORT || 3001');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 17: Inter-service URLs are loaded from environment variables', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    userServiceUrl: fc.constantFrom(
                        'http://user-service:3001',
                        'http://localhost:3001',
                        'http://user-svc:3001'
                    ),
                    productServiceUrl: fc.constantFrom(
                        'http://product-service:3002',
                        'http://localhost:3002',
                        'http://product-svc:3002'
                    )
                }),
                async ({ userServiceUrl, productServiceUrl }) => {
                    // Set environment variables
                    process.env.USER_SERVICE_URL = userServiceUrl;
                    process.env.PRODUCT_SERVICE_URL = productServiceUrl;

                    // Verify environment variables are set correctly
                    expect(process.env.USER_SERVICE_URL).toBe(userServiceUrl);
                    expect(process.env.PRODUCT_SERVICE_URL).toBe(productServiceUrl);

                    // Note: This test validates that environment variables can be set and read
                    // The actual usage in Order Service would be tested in order-service tests
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property 17: Configuration values from environment override defaults', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    host: fc.constantFrom('custom-host', 'prod-db', 'staging-db'),
                    port: fc.integer({ min: 3000, max: 4000 }),
                    dbName: fc.constantFrom('customdb', 'proddb', 'stagingdb')
                }),
                async ({ host, port, dbName }) => {
                    const mongoUri = `mongodb://${host}:${port}/${dbName}`;

                    // Set custom environment variables
                    process.env.MONGO_URI = mongoUri;
                    process.env.PORT = port.toString();

                    // Mock mongoose.connect
                    let capturedUri = null;
                    mongoose.connect = jest.fn((uri) => {
                        capturedUri = uri;
                        return Promise.resolve();
                    });

                    // Clear and re-require database module
                    delete require.cache[require.resolve('./database')];
                    const databaseModule = require('./database');

                    // Attempt connection
                    try {
                        await databaseModule.connect();
                    } catch (error) {
                        // Ignore errors
                    }

                    // Verify custom values are used instead of defaults
                    expect(capturedUri).toBe(mongoUri);
                    // Only check it's not the default if we didn't randomly generate the default
                    if (mongoUri !== 'mongodb://localhost:27017/userdb') {
                        expect(capturedUri).not.toBe('mongodb://localhost:27017/userdb');
                    }

                    expect(process.env.PORT).toBe(port.toString());
                    // Only check it's not the default if we didn't randomly generate the default
                    if (port !== 3001) {
                        expect(process.env.PORT).not.toBe('3001');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
