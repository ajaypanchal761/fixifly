const express = require('express');
const {
  // AMC Plans
  getAMCPlans,
  getAMCPlan,
  createAMCPlan,
  updateAMCPlan,
  deleteAMCPlan,
  seedAMCPlans,

  // AMC Subscriptions
  getAMCSubscriptions,
  getAMCSubscription,
  updateAMCSubscriptionStatus,
  updateAMCSubscriptionUsage,
  addServiceToSubscription,

  // Statistics
  getAMCStats
} = require('../controllers/adminAMCController');

const {
  // AMC Plans
  getAMCPlans: getUserAMCPlans,
  getAMCPlan: getUserAMCPlan,

  // AMC Subscriptions
  getUserAMCSubscriptions,
  getUserAMCSubscription,
  createAMCSubscription,
  verifyAMCSubscriptionPayment,
  updateAMCSubscription,
  cancelAMCSubscription,
  renewAMCSubscription,

  // AMC Services
  requestAMCService,
  getAMCServiceHistory,

  // Usage Tracking
  getAMCUsage,

  // Debug
  debugSubscription
} = require('../controllers/userAMCController');

const {
  protectAdmin,
  requirePermission
} = require('../middleware/adminAuth');

const {
  protect: protectUser,
  optionalAuth
} = require('../middleware/auth');

const router = express.Router();

// ==================== ADMIN AMC ROUTES ====================

// AMC Plans Management
router.get('/admin/plans', protectAdmin, requirePermission('amcManagement'), getAMCPlans);
router.get('/admin/plans/:id', protectAdmin, requirePermission('amcManagement'), getAMCPlan);
router.post('/admin/plans', protectAdmin, requirePermission('amcManagement'), createAMCPlan);
router.put('/admin/plans/:id', protectAdmin, requirePermission('amcManagement'), updateAMCPlan);
router.delete('/admin/plans/:id', protectAdmin, requirePermission('amcManagement'), deleteAMCPlan);
router.post('/admin/seed-plans', protectAdmin, requirePermission('amcManagement'), seedAMCPlans);

// AMC Subscriptions Management
router.get('/admin/subscriptions', protectAdmin, requirePermission('amcManagement'), getAMCSubscriptions);
router.get('/admin/subscriptions/:id', protectAdmin, requirePermission('amcManagement'), getAMCSubscription);
router.put('/admin/subscriptions/:id/status', protectAdmin, requirePermission('amcManagement'), updateAMCSubscriptionStatus);
router.put('/admin/subscriptions/:id/usage', protectAdmin, requirePermission('amcManagement'), updateAMCSubscriptionUsage);
router.post('/admin/subscriptions/:id/services', protectAdmin, requirePermission('amcManagement'), addServiceToSubscription);

// AMC Statistics
router.get('/admin/stats', protectAdmin, requirePermission('amcManagement'), getAMCStats);

// ==================== USER AMC ROUTES ====================

// AMC Plans for Users (Public access for viewing plans)
router.get('/plans', getUserAMCPlans);
router.get('/plans/:id', getUserAMCPlan);

// User AMC Subscriptions
router.get('/subscriptions', protectUser, getUserAMCSubscriptions);
router.get('/subscriptions/:id', protectUser, getUserAMCSubscription);
router.post('/subscriptions', optionalAuth, createAMCSubscription);

// Debug route to test payment verification endpoint
router.post('/subscriptions/:id/verify-payment', (req, res, next) => {
  console.log('🔍 PAYMENT VERIFICATION ROUTE HIT');
  console.log('URL:', req.originalUrl);
  console.log('Method:', req.method);
  console.log('Params:', req.params);
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  next();
}, optionalAuth, verifyAMCSubscriptionPayment);

router.put('/subscriptions/:id', protectUser, updateAMCSubscription);
router.post('/subscriptions/:id/cancel', protectUser, cancelAMCSubscription);
router.post('/subscriptions/:id/renew', protectUser, renewAMCSubscription);

// AMC Services
router.post('/subscriptions/:id/services', protectUser, requestAMCService);
router.get('/subscriptions/:id/services', protectUser, getAMCServiceHistory);

// Usage Tracking
router.get('/subscriptions/:id/usage', protectUser, getAMCUsage);

// Debug route
router.get('/subscriptions/:id/debug', protectUser, debugSubscription);

module.exports = router;
