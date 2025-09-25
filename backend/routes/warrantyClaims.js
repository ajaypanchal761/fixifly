const express = require('express');
const {
  submitWarrantyClaim,
  getUserWarrantyClaims,
  getWarrantyClaim,
  testSubscription
} = require('../controllers/warrantyClaimController');

const {
  protect
} = require('../middleware/auth');

const router = express.Router();

// User warranty claim routes
router.post('/', protect, submitWarrantyClaim);
router.get('/', protect, getUserWarrantyClaims);
router.get('/:id', protect, getWarrantyClaim);
router.get('/test-subscription/:id', protect, testSubscription);

module.exports = router;
