const fc = require('fast-check');
const mongoose = require('mongoose');
const User = require('./User');
const database = require('../config/database');

// Feature: product-order-system, Property 1: User data persistence round trip
// **Validates: Requirements 2.5**

describe('Property Test: User Data Persistence Round Trip', () => {
    beforeAll(async () => {
        // Connect to test database
        await database.connect();
    });

    afterAll(async () => {
        // Clean up and disconnect
        await User.deleteMany({});
        await database.disconnect();
    });

    beforeEach(async () => {
        // Clear users collection before each test
        await User.deleteMany({});
    });

    test('Property 1: User data persistence round trip', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    email: fc.emailAddress(),
                    password: fc.string({ minLength: 8, maxLength: 50 }),
                    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
                }),
                async (userData) => {
                    // Store user in database
                    const user = new User({
                        email: userData.email,
                        password: userData.password,
                        name: userData.name
                    });
                    await user.save();

                    // Retrieve user by ID
                    const retrievedUser = await User.findById(user._id);

                    // Assert user was retrieved
                    expect(retrievedUser).not.toBeNull();

                    // Assert all fields are preserved
                    expect(retrievedUser.email).toBe(userData.email.toLowerCase());
                    expect(retrievedUser.password).toBe(userData.password);
                    expect(retrievedUser.name).toBe(userData.name.trim());

                    // Assert timestamps are present
                    expect(retrievedUser.createdAt).toBeInstanceOf(Date);
                    expect(retrievedUser.updatedAt).toBeInstanceOf(Date);

                    // Assert ID is preserved
                    expect(retrievedUser._id.toString()).toBe(user._id.toString());
                }
            ),
            { numRuns: 100 }
        );
    });
});
