const express = require('express');
const router = express.Router();
const {
    createProduct,
    getProductById,
    getAllProducts,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

// Product CRUD routes
router.post('/products', createProduct);
router.get('/products/:id', getProductById);
router.get('/products', getAllProducts);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;
