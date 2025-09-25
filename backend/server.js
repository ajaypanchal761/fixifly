const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: './config/production.env' });

// Set Razorpay environment variables if not set
if (!process.env.RAZORPAY_KEY_ID) {
  process.env.RAZORPAY_KEY_ID = 'rzp_test_8sYbzHWidwe5Zw';
}
if (!process.env.RAZORPAY_KEY_SECRET) {
  process.env.RAZORPAY_KEY_SECRET = 'GkxKRQ2B0U63BKBoayuugS3D';
}

// Import database connection
const connectDB = require('./config/db');

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
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:8080', // Frontend Vite dev server
    'http://localhost:5173'  // Alternative Vite port
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    message: 'Fixifly Backend Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Fixifly Backend API',
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
    
    app.listen(PORT, () => {
      console.log(`
🚀 Fixifly Backend Server Started!
📡 Server running on port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API Base URL: http://localhost:${PORT}/api
📊 Health Check: http://localhost:${PORT}/health
🔐 Auth Endpoints: http://localhost:${PORT}/api/auth
👤 User Endpoints: http://localhost:${PORT}/api/users
🏪 Vendor Endpoints: http://localhost:${PORT}/api/vendors
👨‍💼 Admin Endpoints: http://localhost:${PORT}/api/admin
🃏 Card Endpoints: http://localhost:${PORT}/api/cards
📝 Blog Endpoints: http://localhost:${PORT}/api/blogs
📝 Admin Blog Endpoints: http://localhost:${PORT}/api/admin/blogs
      `);
    });
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