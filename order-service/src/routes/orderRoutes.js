const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrderById,
    getOrdersByUserId,
    updateOrderStatus
} = require('../controllers/orderController');

// POST /orders - Create new order
router.post('/', createOrder);

// GET /orders/:id - Get order by ID
router.get('/:id', getOrderById);

// GET /orders/user/:userId - Get orders by user ID
router.get('/user/:userId', getOrdersByUserId);

// PUT /orders/:id/status - Update order status
router.put('/:id/status', updateOrderStatus);

module.exports = router;
