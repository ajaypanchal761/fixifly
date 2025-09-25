const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  toggleFeaturedStatus,
  getProductStats,
  addServiceToCategory,
  removeServiceFromCategory
} = require('../controllers/productController');
const { protectAdmin: adminAuth } = require('../middleware/adminAuth');
const uploadMiddleware = require('../middleware/upload');

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// Product routes
router.route('/')
  .post(
    uploadMiddleware.singleProductImage(), // Handle image upload
    uploadMiddleware.handleUploadError,    // Handle upload errors
    createProduct                          // Create new product
  )
  .get(getAllProducts);     // Get all products

router.route('/stats')
  .get(getProductStats);    // Get product statistics

router.route('/:id')
  .get(getProduct)          // Get single product
  .put(
    uploadMiddleware.singleProductImage(), // Handle image upload for updates
    uploadMiddleware.handleUploadError,    // Handle upload errors
    updateProduct                          // Update product
  )
  .delete(deleteProduct);   // Delete product

router.route('/:id/status')
  .patch(updateProductStatus); // Update product status

router.route('/:id/featured')
  .patch(toggleFeaturedStatus); // Toggle featured status

// Popular status route removed as it's not implemented in the simplified model

// Category and service management routes
router.route('/:id/categories/:categoryName/services')
  .post(addServiceToCategory); // Add service to category

router.route('/:id/categories/:categoryName/services/:serviceId')
  .delete(removeServiceFromCategory); // Remove service from category

module.exports = router;