const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../index');
const Product = require('../models/Product');

// Test database connection
beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/productdb-test';
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.connection.close();
});

beforeEach(async () => {
    await Product.deleteMany({});
});

describe('Product CRUD Endpoints', () => {
    describe('POST /products', () => {
        it('should create a product with valid data', async () => {
            const productData = {
                name: 'Test Product',
                description: 'Test Description',
                price: 99.99,
                stock: 10
            };

            const response = await request(app)
                .post('/products')
                .send(productData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(productData.name);
            expect(response.body.description).toBe(productData.description);
            expect(response.body.price).toBe(productData.price);
            expect(response.body.stock).toBe(productData.stock);
            expect(response.body).toHaveProperty('createdAt');
        });

        it('should reject product with missing name', async () => {
            const productData = {
                price: 99.99,
                stock: 10
            };

            const response = await request(app)
                .post('/products')
                .send(productData)
                .expect(400);

            expect(response.body.error.message).toContain('name');
        });

        it('should reject product with price <= 0', async () => {
            const productData = {
                name: 'Test Product',
                price: 0,
                stock: 10
            };

            const response = await request(app)
                .post('/products')
                .send(productData)
                .expect(400);

            expect(response.body.error.message).toContain('Price');
        });

        it('should reject product with negative stock', async () => {
            const productData = {
                name: 'Test Product',
                price: 99.99,
                stock: -1
            };

            const response = await request(app)
                .post('/products')
                .send(productData)
                .expect(400);

            expect(response.body.error.message).toContain('Stock');
        });
    });

    describe('GET /products/:id', () => {
        it('should retrieve product by ID', async () => {
            const product = await Product.create({
                name: 'Test Product',
                description: 'Test Description',
                price: 99.99,
                stock: 10
            });

            const response = await request(app)
                .get(`/products/${product._id}`)
                .expect(200);

            expect(response.body.id).toBe(product._id.toString());
            expect(response.body.name).toBe(product.name);
        });

        it('should return 404 for non-existent product', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/products/${fakeId}`)
                .expect(404);

            expect(response.body.error.code).toBe('NOT_FOUND');
        });
    });

    describe('GET /products', () => {
        it('should return all products as array', async () => {
            await Product.create([
                { name: 'Product 1', price: 10, stock: 5 },
                { name: 'Product 2', price: 20, stock: 10 }
            ]);

            const response = await request(app)
                .get('/products')
                .expect(200);

            expect(response.body.products).toBeInstanceOf(Array);
            expect(response.body.products).toHaveLength(2);
        });

        it('should return empty array when no products exist', async () => {
            const response = await request(app)
                .get('/products')
                .expect(200);

            expect(response.body.products).toEqual([]);
        });
    });

    describe('PUT /products/:id', () => {
        it('should update product', async () => {
            const product = await Product.create({
                name: 'Original Name',
                price: 50,
                stock: 5
            });

            const updates = {
                name: 'Updated Name',
                price: 75
            };

            const response = await request(app)
                .put(`/products/${product._id}`)
                .send(updates)
                .expect(200);

            expect(response.body.name).toBe(updates.name);
            expect(response.body.price).toBe(updates.price);
            expect(response.body.stock).toBe(5); // Unchanged
        });

        it('should return 404 for non-existent product', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            await request(app)
                .put(`/products/${fakeId}`)
                .send({ name: 'Updated' })
                .expect(404);
        });
    });

    describe('DELETE /products/:id', () => {
        it('should delete product', async () => {
            const product = await Product.create({
                name: 'To Delete',
                price: 50,
                stock: 5
            });

            const response = await request(app)
                .delete(`/products/${product._id}`)
                .expect(200);

            expect(response.body.message).toContain('deleted');

            // Verify deletion
            const found = await Product.findById(product._id);
            expect(found).toBeNull();
        });

        it('should return 404 for non-existent product', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            await request(app)
                .delete(`/products/${fakeId}`)
                .expect(404);
        });
    });
});
