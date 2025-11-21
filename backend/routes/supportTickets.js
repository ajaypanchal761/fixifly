const express = require('express');
const router = express.Router();
const {
  createSupportTicket,
  getUserSupportTickets,
  getSupportTicket,
  addTicketResponse,
  getAllSupportTickets,
  getAdminSupportTicket,
  updateSupportTicket,
  addAdminResponse,
  resolveSupportTicket,
  getSupportTicketStats,
  getVendorSupportTickets,
  getVendorSupportTicket,
  acceptSupportTicket,
  declineSupportTicket,
  completeSupportTicket,
  cancelSupportTicket,
  assignVendorToSupportTicket,
  sendInvoiceEmail,
  verifySupportTicketPayment
} = require('../controllers/supportTicketController');
const { protect } = require('../middleware/auth');
const { protectAdmin, requirePermission } = require('../middleware/adminAuth');
const { protectVendor } = require('../middleware/vendorAuth');

// User routes
router.post('/', protect, createSupportTicket);
router.get('/', protect, getUserSupportTickets);
router.get('/:id', protect, getSupportTicket);
router.post('/:id/response', protect, addTicketResponse);
router.post('/send-invoice', protect, sendInvoiceEmail);

// Admin routes
router.get('/admin/all', protectAdmin, requirePermission('supportManagement'), getAllSupportTickets);
router.get('/admin/stats', protectAdmin, requirePermission('supportManagement'), getSupportTicketStats);
router.get('/admin/:id', protectAdmin, requirePermission('supportManagement'), getAdminSupportTicket);
router.put('/admin/:id', protectAdmin, requirePermission('supportManagement'), updateSupportTicket);
router.post('/admin/:id/response', protectAdmin, requirePermission('supportManagement'), addAdminResponse);
router.post('/admin/:id/resolve', protectAdmin, requirePermission('supportManagement'), resolveSupportTicket);
router.patch('/admin/:id/assign-vendor', protectAdmin, requirePermission('supportManagement'), assignVendorToSupportTicket);

// Vendor routes
router.get('/vendor/assigned', protectVendor, getVendorSupportTickets);
router.get('/vendor/:id', protectVendor, getVendorSupportTicket);
router.put('/vendor/:id', protectVendor, updateSupportTicket);
router.put('/vendor/:id/accept', protectVendor, acceptSupportTicket);
router.put('/vendor/:id/decline', protectVendor, declineSupportTicket);
router.put('/vendor/:id/complete', protectVendor, completeSupportTicket);
router.put('/vendor/:id/cancel', protectVendor, cancelSupportTicket);

// Payment verification route (public)
router.post('/payment/verify', verifySupportTicketPayment);

// Payment callback route (public - called by Razorpay)
router.get('/payment-callback', require('../controllers/paymentController').handleSupportTicketPaymentCallback);

module.exports = router;
