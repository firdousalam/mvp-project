const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Validation helper functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    return password && password.length >= 8;
}

function isValidName(name) {
    return name && name.trim().length > 0;
}

// User registration
async function registerUser(req, res) {
    try {
        const { email, password, name } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields: email, password, and name are required'
                }
            });
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid email format'
                }
            });
        }

        // Validate password length
        if (!isValidPassword(password)) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Password must be at least 8 characters long'
                }
            });
        }

        // Validate name presence
        if (!isValidName(name)) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Name cannot be empty'
                }
            });
        }

        // Check for duplicate email
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                error: {
                    code: 'DUPLICATE_EMAIL',
                    message: 'A user with this email already exists'
                }
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = new User({
            email: email.toLowerCase(),
            password: hashedPassword,
            name: name.trim()
        });

        await user.save();

        // Return user data (excluding password)
        return res.status(201).json({
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            createdAt: user.createdAt.toISOString()
        });

    } catch (error) {
        console.error('[User Service] Registration error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred during registration'
            }
        });
    }
}

// User authentication
async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields: email and password are required'
                }
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }

        // Compare password with bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }

        // Generate JWT token
        const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
        const token = jwt.sign(
            { userId: user._id.toString(), email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return token and userId
        return res.status(200).json({
            token,
            userId: user._id.toString()
        });

    } catch (error) {
        console.error('[User Service] Login error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred during authentication'
            }
        });
    }
}

// Get user by ID
async function getUserById(req, res) {
    try {
        const { id } = req.params;

        // Find user by ID
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        // Return user data (excluding password)
        return res.status(200).json({
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            createdAt: user.createdAt.toISOString()
        });

    } catch (error) {
        console.error('[User Service] Get user error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while retrieving user'
            }
        });
    }
}

// Update user profile
async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { email, name } = req.body;

        // Find user by ID
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        // Validate email if provided
        if (email !== undefined) {
            if (!isValidEmail(email)) {
                return res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid email format'
                    }
                });
            }

            // Check for duplicate email (excluding current user)
            const existingUser = await User.findOne({
                email: email.toLowerCase(),
                _id: { $ne: id }
            });
            if (existingUser) {
                return res.status(400).json({
                    error: {
                        code: 'DUPLICATE_EMAIL',
                        message: 'A user with this email already exists'
                    }
                });
            }

            user.email = email.toLowerCase();
        }

        // Validate name if provided
        if (name !== undefined) {
            if (!isValidName(name)) {
                return res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Name cannot be empty'
                    }
                });
            }
            user.name = name.trim();
        }

        // Save updated user
        await user.save();

        // Return updated user data (excluding password)
        return res.status(200).json({
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            createdAt: user.createdAt.toISOString()
        });

    } catch (error) {
        console.error('[User Service] Update user error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while updating user'
            }
        });
    }
}

// Delete user
async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        // Find and delete user by ID
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        // Return success response
        return res.status(200).json({
            message: 'User deleted successfully',
            id: user._id.toString()
        });

    } catch (error) {
        console.error('[User Service] Delete user error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while deleting user'
            }
        });
    }
}

module.exports = {
    registerUser,
    loginUser,
    getUserById,
    updateUser,
    deleteUser
};
