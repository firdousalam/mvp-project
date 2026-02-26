const Product = require('../models/Product');

// Create a new product
async function createProduct(req, res) {
    try {
        const { name, description, price, stock } = req.body;

        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Product name is required'
                }
            });
        }

        if (price === undefined || price === null || price <= 0) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Price must be greater than 0'
                }
            });
        }

        if (stock === undefined || stock === null || stock < 0) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Stock must be non-negative'
                }
            });
        }

        if (!Number.isInteger(stock)) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Stock must be an integer'
                }
            });
        }

        const product = new Product({
            name: name.trim(),
            description: description ? description.trim() : '',
            price,
            stock
        });

        await product.save();

        res.status(201).json({
            id: product._id.toString(),
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            createdAt: product.createdAt.toISOString()
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to create product'
            }
        });
    }
}

// Get product by ID
async function getProductById(req, res) {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Product not found'
                }
            });
        }

        res.status(200).json({
            id: product._id.toString(),
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            createdAt: product.createdAt.toISOString()
        });
    } catch (error) {
        console.error('Error retrieving product:', error);

        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Product not found'
                }
            });
        }

        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve product'
            }
        });
    }
}

// Get all products
async function getAllProducts(req, res) {
    try {
        const products = await Product.find();

        const productList = products.map(product => ({
            id: product._id.toString(),
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            createdAt: product.createdAt.toISOString()
        }));

        res.status(200).json({
            products: productList
        });
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve products'
            }
        });
    }
}

// Update product by ID
async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const { name, description, price, stock } = req.body;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Product not found'
                }
            });
        }

        // Update fields if provided
        if (name !== undefined) {
            if (name.trim() === '') {
                return res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Product name cannot be empty'
                    }
                });
            }
            product.name = name.trim();
        }

        if (description !== undefined) {
            product.description = description.trim();
        }

        if (price !== undefined) {
            if (price <= 0) {
                return res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Price must be greater than 0'
                    }
                });
            }
            product.price = price;
        }

        if (stock !== undefined) {
            if (stock < 0) {
                return res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Stock must be non-negative'
                    }
                });
            }
            if (!Number.isInteger(stock)) {
                return res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Stock must be an integer'
                    }
                });
            }
            product.stock = stock;
        }

        await product.save();

        res.status(200).json({
            id: product._id.toString(),
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            createdAt: product.createdAt.toISOString(),
            updatedAt: product.updatedAt.toISOString()
        });
    } catch (error) {
        console.error('Error updating product:', error);

        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Product not found'
                }
            });
        }

        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to update product'
            }
        });
    }
}

// Delete product by ID
async function deleteProduct(req, res) {
    try {
        const { id } = req.params;

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Product not found'
                }
            });
        }

        res.status(200).json({
            message: 'Product deleted successfully',
            id: product._id.toString()
        });
    } catch (error) {
        console.error('Error deleting product:', error);

        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Product not found'
                }
            });
        }

        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to delete product'
            }
        });
    }
}

module.exports = {
    createProduct,
    getProductById,
    getAllProducts,
    updateProduct,
    deleteProduct
};
