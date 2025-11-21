const express = require('express');
const { getFeaturedProducts, getAllActiveProducts, getPublicProductById, getProductsByServiceType } = require('../controllers/productController');

const router = express.Router();

// Public routes (no authentication required)
router.route('/featured')
  .get(getFeaturedProducts); // Get top 3 featured products for hero section

router.route('/all')
  .get(getAllActiveProducts); // Get all active products

router.route('/service-type/:serviceType')
  .get(getProductsByServiceType); // Get products by service type

router.route('/:id')
  .get(getPublicProductById); // Get single product by ID

module.exports = router;
