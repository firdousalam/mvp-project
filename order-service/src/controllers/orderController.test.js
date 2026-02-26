const Order = require('../models/Order');
const { createOrder, getOrderById, getOrdersByUserId, updateOrderStatus } = require('./orderController');
const { userServiceClient, productServiceClient } = require('../clients/ServiceClient');

// Mock the service clients
jest.mock('../clients/ServiceClient', () => ({
    userServiceClient: {
        get: jest.fn()
    },
    productServiceClient: {
        get: jest.fn()
    }
}));

// Mock the Order model
jest.mock('../models/Order');

describe('Order Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('createOrder', () => {
        it('should create order successfully with valid data', async () => {
            req.body = {
                userId: '507f1f77bcf86cd799439011',
                items: [
                    { productId: '507f1f77bcf86cd799439012', quantity: 2 }
                ]
            };

            // Mock user service response
            userServiceClient.get.mockResolvedValue({
                success: true,
                data: { id: '507f1f77bcf86cd799439011', name: 'Test User' }
            });

            // Mock product service response
            productServiceClient.get.mockResolvedValue({
                success: true,
                data: { id: '507f1f77bcf86cd799439012', name: 'Test Product', price: 10.99 }
            });

            // Mock Order save
            const mockOrder = {
                _id: '507f1f77bcf86cd799439013',
                userId: '507f1f77bcf86cd799439011',
                items: [{
                    productId: '507f1f77bcf86cd799439012',
                    productName: 'Test Product',
                    price: 10.99,
                    quantity: 2
                }],
                totalAmount: 21.98,
                status: 'pending',
                createdAt: new Date(),
                save: jest.fn().mockResolvedValue(true)
            };

            Order.mockImplementation(() => mockOrder);

            await createOrder(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'pending',
                totalAmount: 21.98
            }));
        });

        it('should return 400 if userId is missing', async () => {
            req.body = {
                items: [{ productId: '507f1f77bcf86cd799439012', quantity: 2 }]
            };

            await createOrder(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.objectContaining({
                    message: 'userId is required'
                })
            }));
        });

        it('should return 400 if items array is empty', async () => {
            req.body = {
                userId: '507f1f77bcf86cd799439011',
                items: []
            };

            await createOrder(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.objectContaining({
                    message: 'items array must be non-empty'
                })
            }));
        });

        it('should return 400 if user validation fails', async () => {
            req.body = {
                userId: '507f1f77bcf86cd799439011',
                items: [{ productId: '507f1f77bcf86cd799439012', quantity: 2 }]
            };

            userServiceClient.get.mockResolvedValue({
                success: false,
                error: 'User not found'
            });

            await createOrder(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.objectContaining({
                    code: 'USER_VALIDATION_FAILED'
                })
            }));
        });

        it('should return 400 if product validation fails', async () => {
            req.body = {
                userId: '507f1f77bcf86cd799439011',
                items: [{ productId: '507f1f77bcf86cd799439012', quantity: 2 }]
            };

            userServiceClient.get.mockResolvedValue({
                success: true,
                data: { id: '507f1f77bcf86cd799439011' }
            });

            productServiceClient.get.mockResolvedValue({
                success: false,
                error: 'Product not found'
            });

            await createOrder(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.objectContaining({
                    code: 'PRODUCT_VALIDATION_FAILED'
                })
            }));
        });
    });

    describe('getOrderById', () => {
        it('should return order when found', async () => {
            req.params.id = '507f1f77bcf86cd799439013';

            const mockOrder = {
                _id: '507f1f77bcf86cd799439013',
                userId: '507f1f77bcf86cd799439011',
                items: [],
                totalAmount: 21.98,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            Order.findById = jest.fn().mockResolvedValue(mockOrder);

            await getOrderById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                id: '507f1f77bcf86cd799439013',
                status: 'pending'
            }));
        });

        it('should return 404 when order not found', async () => {
            req.params.id = '507f1f77bcf86cd799439013';

            Order.findById = jest.fn().mockResolvedValue(null);

            await getOrderById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.objectContaining({
                    message: 'Order not found'
                })
            }));
        });
    });

    describe('updateOrderStatus', () => {
        it('should update order status successfully', async () => {
            req.params.id = '507f1f77bcf86cd799439013';
            req.body.status = 'completed';

            const mockOrder = {
                _id: '507f1f77bcf86cd799439013',
                userId: '507f1f77bcf86cd799439011',
                items: [],
                totalAmount: 21.98,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date(),
                save: jest.fn().mockResolvedValue(true)
            };

            Order.findById = jest.fn().mockResolvedValue(mockOrder);

            await updateOrderStatus(req, res, next);

            expect(mockOrder.status).toBe('completed');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 for invalid status', async () => {
            req.params.id = '507f1f77bcf86cd799439013';
            req.body.status = 'invalid_status';

            await updateOrderStatus(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.objectContaining({
                    message: expect.stringContaining('Status must be one of')
                })
            }));
        });
    });
});
