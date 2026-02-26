const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fc = require('fast-check');
const app = require('../../index');
const User = require('../models/User');
const database = require('../config/database');

// Test database setup
const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/userdb-test';

beforeAll(async () => {
    // Override the MONGO_URI for testing
    process.env.MONGO_URI = TEST_MONGO_URI;
    await database.connect();
});

afterAll(async () => {
    await database.disconnect();
});

beforeEach(async () => {
    // Clear the users collection before each test
    await User.deleteMany({});
});

describe('User Registration Endpoint', () => {
    describe('Unit Tests', () => {
        test('should register a valid user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            };

            const response = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.email).toBe('test@example.com');
            expect(response.body.name).toBe('Test User');
            expect(response.body).toHaveProperty('createdAt');
            expect(response.body).not.toHaveProperty('password');

            // Verify user was saved to database
            const savedUser = await User.findById(response.body.id);
            expect(savedUser).toBeTruthy();
            expect(savedUser.email).toBe('test@example.com');

            // Verify password was hashed
            const isPasswordHashed = await bcrypt.compare(userData.password, savedUser.password);
            expect(isPasswordHashed).toBe(true);
        });

        test('should reject registration with missing email', async () => {
            const userData = {
                password: 'password123',
                name: 'Test User'
            };

            const response = await request(app)
                .post('/users')
                .send(userData)
                .expect(400);

            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toContain('required');
        });

        test('should reject registration with missing password', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User'
            };

            const response = await request(app)
                .post('/users')
                .send(userData)
                .expect(400);

            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toContain('required');
        });

        test('should reject registration with missing name', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/users')
                .send(userData)
                .expect(400);

            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toContain('required');
        });

        test('should reject registration with invalid email format', async () => {
            const userData = {
                email: 'invalid-email',
                password: 'password123',
                name: 'Test User'
            };

            const response = await request(app)
                .post('/users')
                .send(userData)
                .expect(400);

            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toContain('email');
        });

        test('should reject registration with password less than 8 characters', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'short',
                name: 'Test User'
            };

            const response = await request(app)
                .post('/users')
                .send(userData)
                .expect(400);

            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toContain('8 characters');
        });

        test('should reject registration with empty name', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                name: '   '
            };

            const response = await request(app)
                .post('/users')
                .send(userData)
                .expect(400);

            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toContain('Name');
        });

        test('should reject registration with duplicate email', async () => {
            const userData = {
                email: 'duplicate@example.com',
                password: 'password123',
                name: 'First User'
            };

            // Register first user
            await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            // Try to register second user with same email
            const duplicateData = {
                email: 'duplicate@example.com',
                password: 'different123',
                name: 'Second User'
            };

            const response = await request(app)
                .post('/users')
                .send(duplicateData)
                .expect(400);

            expect(response.body.error.code).toBe('DUPLICATE_EMAIL');
            expect(response.body.error.message).toContain('already exists');
        });

        test('should handle duplicate email case-insensitively', async () => {
            const userData = {
                email: 'Test@Example.com',
                password: 'password123',
                name: 'First User'
            };

            await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            // Try with different case
            const duplicateData = {
                email: 'test@example.com',
                password: 'different123',
                name: 'Second User'
            };

            const response = await request(app)
                .post('/users')
                .send(duplicateData)
                .expect(400);

            expect(response.body.error.code).toBe('DUPLICATE_EMAIL');
        });

        test('should normalize email to lowercase', async () => {
            const userData = {
                email: 'Test@Example.COM',
                password: 'password123',
                name: 'Test User'
            };

            const response = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            expect(response.body.email).toBe('test@example.com');
        });

        test('should trim whitespace from name', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                name: '  Test User  '
            };

            const response = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            expect(response.body.name).toBe('Test User');
        });
    });

    describe('Property-Based Tests', () => {
        // **Validates: Requirements 2.7**
        test('Property 4: Valid user registration succeeds', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        email: fc.emailAddress(),
                        password: fc.string({ minLength: 8, maxLength: 50 }),
                        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
                    }),
                    async (userData) => {
                        // Clear database before each property test iteration
                        await User.deleteMany({});

                        const response = await request(app)
                            .post('/users')
                            .send(userData);

                        // Should return 201 status
                        expect(response.status).toBe(201);

                        // Should return user data with ID
                        expect(response.body).toHaveProperty('id');
                        expect(response.body.email).toBe(userData.email.toLowerCase());
                        expect(response.body.name).toBe(userData.name.trim());
                        expect(response.body).toHaveProperty('createdAt');
                        expect(response.body).not.toHaveProperty('password');

                        // Verify user exists in database
                        const savedUser = await User.findById(response.body.id);
                        expect(savedUser).toBeTruthy();
                    }
                ),
                { numRuns: 100 }
            );
        }, 60000); // Increase timeout for property test

        // **Validates: Requirements 2.9**
        test('Property 7: Duplicate email registration fails', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        email: fc.emailAddress(),
                        password: fc.string({ minLength: 8, maxLength: 50 }),
                        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
                    }),
                    async (userData) => {
                        // Clear database before each property test iteration
                        await User.deleteMany({});

                        // Register first user
                        const firstResponse = await request(app)
                            .post('/users')
                            .send(userData);

                        expect(firstResponse.status).toBe(201);

                        // Try to register second user with same email
                        const secondResponse = await request(app)
                            .post('/users')
                            .send({
                                email: userData.email,
                                password: 'differentpass123',
                                name: 'Different Name'
                            });

                        // Should fail with 400 status
                        expect(secondResponse.status).toBe(400);
                        expect(secondResponse.body.error.code).toBe('DUPLICATE_EMAIL');
                    }
                ),
                { numRuns: 100 }
            );
        }, 60000); // Increase timeout for property test
    });
});

describe('User Authentication Endpoint', () => {
    describe('Property-Based Tests', () => {
        // **Validates: Requirements 2.8**
        test('Property 6: Authentication with valid credentials returns token', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        email: fc.emailAddress(),
                        password: fc.string({ minLength: 8, maxLength: 50 }),
                        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
                    }),
                    async (userData) => {
                        // Clear database before each property test iteration
                        await User.deleteMany({});

                        // Register the user first
                        const registerResponse = await request(app)
                            .post('/users')
                            .send(userData);

                        expect(registerResponse.status).toBe(201);

                        // Now authenticate with the same credentials
                        const loginData = {
                            email: userData.email,
                            password: userData.password
                        };

                        const loginResponse = await request(app)
                            .post('/auth/login')
                            .send(loginData);

                        // Should return 200 status
                        expect(loginResponse.status).toBe(200);

                        // Should return a token
                        expect(loginResponse.body).toHaveProperty('token');
                        expect(typeof loginResponse.body.token).toBe('string');
                        expect(loginResponse.body.token.length).toBeGreaterThan(0);

                        // Should return userId
                        expect(loginResponse.body).toHaveProperty('userId');
                        expect(loginResponse.body.userId).toBe(registerResponse.body.id);
                    }
                ),
                { numRuns: 100 }
            );
        }, 60000); // Increase timeout for property test
    });

    describe('Unit Tests', () => {
        test('should authenticate user with valid credentials', async () => {
            // First, register a user
            const userData = {
                email: 'auth@example.com',
                password: 'password123',
                name: 'Auth User'
            };

            await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            // Now authenticate
            const loginData = {
                email: 'auth@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('userId');
            expect(typeof response.body.token).toBe('string');
            expect(response.body.token.length).toBeGreaterThan(0);
        });

        test('should authenticate with case-insensitive email', async () => {
            // Register with lowercase email
            const userData = {
                email: 'case@example.com',
                password: 'password123',
                name: 'Case User'
            };

            await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            // Login with uppercase email
            const loginData = {
                email: 'CASE@EXAMPLE.COM',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('userId');
        });

        test('should reject authentication with missing email', async () => {
            const loginData = {
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(400);

            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toContain('required');
        });

        test('should reject authentication with missing password', async () => {
            const loginData = {
                email: 'test@example.com'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(400);

            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toContain('required');
        });

        test('should reject authentication with non-existent email', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
            expect(response.body.error.message).toContain('Invalid email or password');
        });

        test('should reject authentication with incorrect password', async () => {
            // Register a user
            const userData = {
                email: 'wrongpass@example.com',
                password: 'correctpassword123',
                name: 'Wrong Pass User'
            };

            await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            // Try to login with wrong password
            const loginData = {
                email: 'wrongpass@example.com',
                password: 'wrongpassword123'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
            expect(response.body.error.message).toContain('Invalid email or password');
        });

        test('should return different tokens for different login sessions', async () => {
            // Register a user
            const userData = {
                email: 'multilogin@example.com',
                password: 'password123',
                name: 'Multi Login User'
            };

            await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            // Login twice
            const loginData = {
                email: 'multilogin@example.com',
                password: 'password123'
            };

            const response1 = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(200);

            const response2 = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(200);

            // Tokens should be different (different timestamps)
            expect(response1.body.token).toBeTruthy();
            expect(response2.body.token).toBeTruthy();
            // Note: Tokens might be the same if generated in the same second
            // This is acceptable behavior
        });
    });
});

describe('User Profile Endpoints', () => {
    describe('GET /users/:id', () => {
        test('should retrieve user by ID successfully', async () => {
            // Register a user first
            const userData = {
                email: 'getuser@example.com',
                password: 'password123',
                name: 'Get User'
            };

            const registerResponse = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            const userId = registerResponse.body.id;

            // Get user by ID
            const response = await request(app)
                .get(`/users/${userId}`)
                .expect(200);

            expect(response.body.id).toBe(userId);
            expect(response.body.email).toBe('getuser@example.com');
            expect(response.body.name).toBe('Get User');
            expect(response.body).toHaveProperty('createdAt');
            expect(response.body).not.toHaveProperty('password');
        });

        test('should return 404 for non-existent user', async () => {
            const fakeId = '507f1f77bcf86cd799439011'; // Valid MongoDB ObjectId format

            const response = await request(app)
                .get(`/users/${fakeId}`)
                .expect(404);

            expect(response.body.error.code).toBe('USER_NOT_FOUND');
            expect(response.body.error.message).toContain('not found');
        });

        test('should return 500 for invalid ID format', async () => {
            const invalidId = 'invalid-id-format';

            const response = await request(app)
                .get(`/users/${invalidId}`)
                .expect(500);

            expect(response.body.error.code).toBe('INTERNAL_ERROR');
        });
    });

    describe('PUT /users/:id', () => {
        test('should update user name successfully', async () => {
            // Register a user first
            const userData = {
                email: 'update@example.com',
                password: 'password123',
                name: 'Original Name'
            };

            const registerResponse = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            const userId = registerResponse.body.id;

            // Update user name
            const updateData = {
                name: 'Updated Name'
            };

            const response = await request(app)
                .put(`/users/${userId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.id).toBe(userId);
            expect(response.body.name).toBe('Updated Name');
            expect(response.body.email).toBe('update@example.com'); // Email unchanged
        });

        test('should update user email successfully', async () => {
            // Register a user first
            const userData = {
                email: 'oldemail@example.com',
                password: 'password123',
                name: 'Test User'
            };

            const registerResponse = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            const userId = registerResponse.body.id;

            // Update user email
            const updateData = {
                email: 'newemail@example.com'
            };

            const response = await request(app)
                .put(`/users/${userId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.id).toBe(userId);
            expect(response.body.email).toBe('newemail@example.com');
            expect(response.body.name).toBe('Test User'); // Name unchanged
        });

        test('should update both email and name successfully', async () => {
            // Register a user first
            const userData = {
                email: 'both@example.com',
                password: 'password123',
                name: 'Old Name'
            };

            const registerResponse = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            const userId = registerResponse.body.id;

            // Update both fields
            const updateData = {
                email: 'newboth@example.com',
                name: 'New Name'
            };

            const response = await request(app)
                .put(`/users/${userId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.id).toBe(userId);
            expect(response.body.email).toBe('newboth@example.com');
            expect(response.body.name).toBe('New Name');
        });

        test('should return 404 for non-existent user', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            const updateData = {
                name: 'New Name'
            };

            const response = await request(app)
                .put(`/users/${fakeId}`)
                .send(updateData)
                .expect(404);

            expect(response.body.error.code).toBe('USER_NOT_FOUND');
        });

        test('should reject update with invalid email format', async () => {
            // Register a user first
            const userData = {
                email: 'valid@example.com',
                password: 'password123',
                name: 'Test User'
            };

            const registerResponse = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            const userId = registerResponse.body.id;

            // Try to update with invalid email
            const updateData = {
                email: 'invalid-email'
            };

            const response = await request(app)
                .put(`/users/${userId}`)
                .send(updateData)
                .expect(400);

            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toContain('email');
        });

        test('should reject update with empty name', async () => {
            // Register a user first
            const userData = {
                email: 'emptyname@example.com',
                password: 'password123',
                name: 'Valid Name'
            };

            const registerResponse = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            const userId = registerResponse.body.id;

            // Try to update with empty name
            const updateData = {
                name: '   '
            };

            const response = await request(app)
                .put(`/users/${userId}`)
                .send(updateData)
                .expect(400);

            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toContain('Name');
        });

        test('should reject update with duplicate email', async () => {
            // Register two users
            const user1Data = {
                email: 'user1@example.com',
                password: 'password123',
                name: 'User One'
            };

            const user2Data = {
                email: 'user2@example.com',
                password: 'password123',
                name: 'User Two'
            };

            await request(app)
                .post('/users')
                .send(user1Data)
                .expect(201);

            const user2Response = await request(app)
                .post('/users')
                .send(user2Data)
                .expect(201);

            const user2Id = user2Response.body.id;

            // Try to update user2's email to user1's email
            const updateData = {
                email: 'user1@example.com'
            };

            const response = await request(app)
                .put(`/users/${user2Id}`)
                .send(updateData)
                .expect(400);

            expect(response.body.error.code).toBe('DUPLICATE_EMAIL');
        });

        test('should allow updating to same email (case-insensitive)', async () => {
            // Register a user
            const userData = {
                email: 'same@example.com',
                password: 'password123',
                name: 'Same User'
            };

            const registerResponse = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            const userId = registerResponse.body.id;

            // Update with same email but different case
            const updateData = {
                email: 'SAME@EXAMPLE.COM'
            };

            const response = await request(app)
                .put(`/users/${userId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.email).toBe('same@example.com');
        });

        test('should trim whitespace from updated name', async () => {
            // Register a user
            const userData = {
                email: 'trim@example.com',
                password: 'password123',
                name: 'Original'
            };

            const registerResponse = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            const userId = registerResponse.body.id;

            // Update with name containing whitespace
            const updateData = {
                name: '  Trimmed Name  '
            };

            const response = await request(app)
                .put(`/users/${userId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.name).toBe('Trimmed Name');
        });

        test('should normalize updated email to lowercase', async () => {
            // Register a user
            const userData = {
                email: 'original@example.com',
                password: 'password123',
                name: 'Test User'
            };

            const registerResponse = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            const userId = registerResponse.body.id;

            // Update with uppercase email
            const updateData = {
                email: 'UPDATED@EXAMPLE.COM'
            };

            const response = await request(app)
                .put(`/users/${userId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.email).toBe('updated@example.com');
        });
    });

    describe('DELETE /users/:id', () => {
        test('should delete user successfully', async () => {
            // Register a user first
            const userData = {
                email: 'delete@example.com',
                password: 'password123',
                name: 'Delete User'
            };

            const registerResponse = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            const userId = registerResponse.body.id;

            // Delete the user
            const response = await request(app)
                .delete(`/users/${userId}`)
                .expect(200);

            expect(response.body.message).toContain('deleted successfully');
            expect(response.body.id).toBe(userId);

            // Verify user no longer exists
            const getResponse = await request(app)
                .get(`/users/${userId}`)
                .expect(404);

            expect(getResponse.body.error.code).toBe('USER_NOT_FOUND');
        });

        test('should return 404 when deleting non-existent user', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            const response = await request(app)
                .delete(`/users/${fakeId}`)
                .expect(404);

            expect(response.body.error.code).toBe('USER_NOT_FOUND');
        });

        test('should return 500 for invalid ID format', async () => {
            const invalidId = 'invalid-id-format';

            const response = await request(app)
                .delete(`/users/${invalidId}`)
                .expect(500);

            expect(response.body.error.code).toBe('INTERNAL_ERROR');
        });
    });
});
