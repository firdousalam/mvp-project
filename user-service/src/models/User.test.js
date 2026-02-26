const mongoose = require('mongoose');
const User = require('./User');

describe('User Model', () => {
    test('should create a user schema with required fields', () => {
        const userSchema = User.schema;

        expect(userSchema.path('email')).toBeDefined();
        expect(userSchema.path('email').isRequired).toBe(true);
        expect(userSchema.path('email').options.unique).toBe(true);

        expect(userSchema.path('password')).toBeDefined();
        expect(userSchema.path('password').isRequired).toBe(true);

        expect(userSchema.path('name')).toBeDefined();
        expect(userSchema.path('name').isRequired).toBe(true);
    });

    test('should have timestamps enabled', () => {
        const userSchema = User.schema;
        expect(userSchema.options.timestamps).toBe(true);
    });
});
