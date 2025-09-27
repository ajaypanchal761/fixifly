const express = require('express');
const {
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  declineWithdrawalRequest
} = require('../controllers/withdrawalController');
const { protectAdmin, requirePermission } = require('../middleware/adminAuth');

const router = express.Router();

// @route   GET /api/admin/withdrawals
// @desc    Get all withdrawal requests
// @access  Private (Admin with vendorManagement permission)
router.get('/', protectAdmin, requirePermission('vendorManagement'), getAllWithdrawalRequests);

// @route   PUT /api/admin/withdrawals/:requestId/approve
// @desc    Approve withdrawal request
// @access  Private (Admin with vendorManagement permission)
router.put('/:requestId/approve', protectAdmin, requirePermission('vendorManagement'), approveWithdrawalRequest);

// @route   PUT /api/admin/withdrawals/:requestId/decline
// @desc    Decline withdrawal request
// @access  Private (Admin with vendorManagement permission)
router.put('/:requestId/decline', protectAdmin, requirePermission('vendorManagement'), declineWithdrawalRequest);

module.exports = router;
