const express = require('express');
// Forced restart for env update
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
// Load environment variables
// Prioritize .env file (development)
require('dotenv').config();
// Fallback to production.env if variables are missing
require('dotenv').config({ path: './config/production.env' });

// Set Razorpay environment variables if not set (Live Credentials)
if (!process.env.RAZORPAY_KEY_ID) {
  process.env.RAZORPAY_KEY_ID = 'rzp_live_RyCVwnDNEvO2uL';
}
if (!process.env.RAZORPAY_KEY_SECRET) {
  process.env.RAZORPAY_KEY_SECRET = 'jhc3nFz1B10oWNZZBP1ChVRO';
}

// Import database connection
const connectDB = require('./config/db');

// Import services
const autoRejectService = require('./services/autoRejectService');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const vendorRoutes = require('./routes/vendor');
const adminRoutes = require('./routes/admin');
const cardRoutes = require('./routes/cards');
const blogRoutes = require('./routes/blogs');
const adminBlogRoutes = require('./routes/adminBlogs');
const productRoutes = require('./routes/products');
const publicProductRoutes = require('./routes/publicProducts');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payment');
const adminBookingRoutes = require('./routes/adminBookings');
const adminWalletRoutes = require('./routes/adminWallets');
const adminEmailRoutes = require('./routes/adminEmail');
const vendorWalletRoutes = require('./routes/vendorWallet');
const vendorStatsRoutes = require('./routes/vendorStats');
const amcRoutes = require('./routes/amc');
const warrantyClaimsRoutes = require('./routes/warrantyClaims');
const supportTicketsRoutes = require('./routes/supportTickets');
const uploadRoutes = require('./routes/upload');
const invoiceRoutes = require('./routes/invoice');
const adminBannerRoutes = require('./routes/adminBanners');
const bannerRoutes = require('./routes/banners');
const withdrawalRoutes = require('./routes/withdrawals');
const adminWithdrawalRoutes = require('./routes/adminWithdrawals');
const cityRoutes = require('./routes/cities');
const reviewRoutes = require('./routes/reviews');
const adminNotificationRoutes = require('./routes/adminNotifications');
const userNotificationRoutes = require('./routes/userNotifications');

// Initialize Express app
const app = express();

// Global error handlers to prevent server crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});


// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Explicitly allowed origins
    const allowedOrigins = [
      'https://getfixfly.com',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080'
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Allow other origins to maintain existing functionality (as requested)
      callback(null, true);
    }
  },
  credentials: true
}));


// Body parsers (GLOBAL)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parser
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Fixfly Backend Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    autoRejectService: autoRejectService.getStatus()
  });
});

// Test endpoint for frontend connectivity
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is accessible from frontend',
    timestamp: new Date().toISOString(),
    origin: req.get('Origin'),
    userAgent: req.get('User-Agent')
  });
});

// Debug endpoint for FormData testing
app.post('/debug-formdata', (req, res) => {
  console.log('=== Debug FormData Endpoint ===');
  console.log('Headers:', req.headers);
  console.log('Body keys:', Object.keys(req.body));
  console.log('Body content:', req.body);
  console.log('Files:', req.files);
  console.log('================================');

  res.json({
    success: true,
    message: 'Debug endpoint hit',
    bodyKeys: Object.keys(req.body),
    hasProductData: !!req.body.productData,
    contentType: req.headers['content-type']
  });
});

// Auto-reject service control endpoints (for admin/testing)
app.post('/admin/auto-reject/trigger', async (req, res) => {
  try {
    await autoRejectService.triggerAutoRejectCheck();
    res.status(200).json({
      success: true,
      message: 'Auto-reject check triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger auto-reject check',
      error: error.message
    });
  }
});

app.get('/admin/auto-reject/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auto-reject service status',
    status: autoRejectService.getStatus(),
    timestamp: new Date().toISOString()
  });
});

// SMS Test endpoint for debugging
app.get('/test-sms', async (req, res) => {
  const smsService = require('./services/smsService');

  const credentials = {
    apiKey: process.env.SMS_INDIA_HUB_API_KEY,
    senderId: process.env.SMS_INDIA_HUB_SENDER_ID,
    isConfigured: !!(process.env.SMS_INDIA_HUB_API_KEY && process.env.SMS_INDIA_HUB_SENDER_ID)
  };

  // Test SMS India Hub connection with dummy OTP
  let testResult = { status: 'not_tested' };

  if (credentials.isConfigured) {
    try {
      testResult = await smsService.sendOTP('9999999999', '123456');
      testResult.status = testResult.success ? 'working' : 'template_approval_needed';
    } catch (error) {
      testResult = {
        status: 'error',
        error: error.message,
        note: 'SMS India Hub connection error or template approval needed'
      };
    }
  }

  res.status(200).json({
    success: true,
    message: 'SMS India Hub Service Status',
    credentials: credentials,
    testResult: testResult,
    timestamp: new Date().toISOString(),
    solution: testResult.status !== 'working' ? 'Contact SMS India Hub to approve OTP template for sender ID SMSHUB' : 'SMS service is working correctly'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', cardRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/admin/blogs', adminBlogRoutes);
app.use('/api/admin/products', productRoutes);
app.use('/api/public/products', publicProductRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin/bookings', adminBookingRoutes);
app.use('/api/admin/wallets', adminWalletRoutes);
app.use('/api/admin/email', adminEmailRoutes);
app.use('/api/vendor/wallet', vendorWalletRoutes);
app.use('/api/vendor/stats', vendorStatsRoutes);
app.use('/api/amc', amcRoutes);
app.use('/api/warranty-claims', warrantyClaimsRoutes);
app.use('/api/support-tickets', supportTicketsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', invoiceRoutes);
app.use('/api/admin/banners', adminBannerRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/vendors/withdrawal', withdrawalRoutes);
app.use('/api/admin/withdrawals', adminWithdrawalRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);
app.use('/api/user/notifications', userNotificationRoutes);
app.use('/api', cityRoutes);
app.use('/api/reviews', reviewRoutes);

// Test routes for push notifications (development only)
if (process.env.NODE_ENV !== 'production') {
  const testPushRoutes = require('./routes/testPushRoutes');
  app.use('/api/test', testPushRoutes);
}

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Fixfly Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      vendors: '/api/vendors',
      admin: '/api/admin',
      cards: '/api/cards',
      blogs: '/api/blogs',
      adminBlogs: '/api/admin/blogs',
      products: '/api/admin/products',
      publicProducts: '/api/public/products',
      bookings: '/api/bookings',
      payment: '/api/payment',
      adminBookings: '/api/admin/bookings',
      amc: '/api/amc',
      reviews: '/api/reviews',
      health: '/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server only after database connection is established
const startServer = async () => {
  try {
    // Connect to MongoDB Atlas first
    await connectDB();

    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
      // Start auto-reject service
      autoRejectService.start();

      console.log(`
🚀 Fixfly Backend Server Started!
📡 Server running on port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API Base URL: http://localhost:${PORT}/api
📊 Health Check: http://localhost:${PORT}/health
📱 SMS Test: http://localhost:${PORT}/test-sms
🔐 Auth Endpoints: http://localhost:${PORT}/api/auth
👤 User Endpoints: http://localhost:${PORT}/api/users
🏪 Vendor Endpoints: http://localhost:${PORT}/api/vendors
👨‍💼 Admin Endpoints: http://localhost:${PORT}/api/admin
🃏 Card Endpoints: http://localhost:${PORT}/api/cards
📝 Blog Endpoints: http://localhost:${PORT}/api/blogs
📝 Admin Blog Endpoints: http://localhost:${PORT}/api/admin/blogs
⏰ Auto-Reject Service: Active (25-minute timer)

⚠️  SMS India Hub Template Approval Needed:
   Contact SMS India Hub support to approve OTP template for sender ID: SMSHUB
   Current status: Template pending approval (Error Code: 006)
   Users are getting OTP through fallback mechanism for testing
      `);
    });

    // Set timeout to 5 minutes (300000 ms) to handle slow file uploads
    server.setTimeout(300000);
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;