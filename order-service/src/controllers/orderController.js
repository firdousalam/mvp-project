const Order = require('../models/Order');
const { userServiceClient, productServiceClient } = require('../clients/ServiceClient');
const mongoose = require('mongoose');

// Validate MongoDB ObjectId format
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// Create new order
const createOrder = async (req, res, next) => {
    try {
        const { userId, items } = req.body;

        // Validation
        if (!userId) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'userId is required'
                }
            });
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid userId format'
                }
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'items array must be non-empty'
                }
            });
        }

        // Validate each item
        for (const item of items) {
            if (!item.productId) {
                return res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Each item must have a productId'
                    }
                });
            }

            if (!isValidObjectId(item.productId)) {
                return res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: `Invalid productId format: ${item.productId}`
                    }
                });
            }

            if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
                return res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Each item must have a positive integer quantity'
                    }
                });
            }
        }

        // Validate user exists
        const userResponse = await userServiceClient.get(`/users/${userId}`);
        if (!userResponse.success) {
            return res.status(400).json({
                error: {
                    code: 'USER_VALIDATION_FAILED',
                    message: `User validation failed: ${userResponse.error}`
                }
            });
        }

        // Validate products and get details
        const orderItems = [];
        for (const item of items) {
            const productResponse = await productServiceClient.get(`/products/${item.productId}`);

            if (!productResponse.success) {
                return res.status(400).json({
                    error: {
                        code: 'PRODUCT_VALIDATION_FAILED',
                        message: `Product validation failed for ${item.productId}: ${productResponse.error}`
                    }
                });
            }

            const product = productResponse.data;
            orderItems.push({
                productId: item.productId,
                productName: product.name,
                price: product.price,
                quantity: item.quantity
            });
        }

        // Calculate total amount
        const totalAmount = orderItems.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        // Create order
        const order = new Order({
            userId,
            items: orderItems,
            totalAmount,
            status: 'pending'
        });

        await order.save();

        res.status(201).json({
            id: order._id.toString(),
            userId: order.userId,
            items: order.items,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt
        });
    } catch (error) {
        next(error);
    }
};

// Get order by ID
const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid order ID format'
                }
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Order not found'
                }
            });
        }

        res.status(200).json({
            id: order._id.toString(),
            userId: order.userId,
            items: order.items,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        });
    } catch (error) {
        next(error);
    }
};

// Get orders by user ID
const getOrdersByUserId = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!isValidObjectId(userId)) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid user ID format'
                }
            });
        }

        const orders = await Order.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json(
            orders.map(order => ({
                id: order._id.toString(),
                userId: order.userId,
                items: order.items,
                totalAmount: order.totalAmount,
                status: order.status,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
            }))
        );
    } catch (error) {
        next(error);
    }
};

// Update order status
const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid order ID format'
                }
            });
        }

        const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: `Status must be one of: ${validStatuses.join(', ')}`
                }
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Order not found'
                }
            });
        }

        order.status = status;
        await order.save();

        res.status(200).json({
            id: order._id.toString(),
            userId: order.userId,
            items: order.items,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder,
    getOrderById,
    getOrdersByUserId,
    updateOrderStatus
};
