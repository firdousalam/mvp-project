const express = require('express');
const { registerUser, loginUser, getUserById, updateUser, deleteUser } = require('../controllers/userController');

const router = express.Router();

// POST /users - User registration
router.post('/users', registerUser);

// GET /users/:id - Get user by ID
router.get('/users/:id', getUserById);

// PUT /users/:id - Update user profile
router.put('/users/:id', updateUser);

// DELETE /users/:id - Delete user
router.delete('/users/:id', deleteUser);

// POST /auth/login - User authentication
router.post('/auth/login', loginUser);

module.exports = router;
