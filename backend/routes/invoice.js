const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/generate-invoice
 * @desc    Generate AMC subscription invoice
 * @access  Private
 */
router.post('/generate-invoice', 
  protect,
  invoiceController.generateInvoice
);

/**
 * @route   POST /api/test-invoice
 * @desc    Test invoice generation (no auth required)
 * @access  Public
 */
router.post('/test-invoice', (req, res) => {
  console.log('Test invoice endpoint hit');
  console.log('Request body:', req.body);
  
  res.json({
    success: true,
    message: 'Test endpoint working',
    data: req.body
  });
});

module.exports = router;
