const mongoose = require("mongoose");
const { logger } = require('../utils/logger');

const connectDB = async () => {
  try {
    logger.info('Attempting to connect to MongoDB Atlas', {
      uri: process.env.MONGODB_URI ? 'MongoDB URI provided' : 'MongoDB URI missing',
      timestamp: new Date().toISOString()
    });

    // MongoDB Atlas connection with optimized settings
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: true, // Enable mongoose buffering to handle connection timing issues
    });
    
    logger.system('MongoDB Atlas Connected Successfully', {
      host: conn.connection.host,
      database: conn.connection.name,
      connectionState: conn.connection.readyState,
      readyState: conn.connection.readyState === 1 ? 'connected' : 'disconnected'
    });

    console.log(`🎉 MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔌 Connection State: ${conn.connection.readyState}`);
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      logger.system('Mongoose connected to MongoDB Atlas', {
        host: conn.connection.host,
        database: conn.connection.name
      });
      console.log('🎉 Mongoose connected to MongoDB Atlas');
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      console.error('❌ Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB Atlas', {
        timestamp: new Date().toISOString()
      });
      console.log('⚠️ Mongoose disconnected from MongoDB Atlas');
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      logger.system('Application termination signal received, closing MongoDB connection');
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (err) {
    logger.error('MongoDB Atlas connection failed', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    });
    
    console.error('❌ MongoDB Atlas connection error:', err.message);
    console.error('❌ Error Details:', err);
    
    // Retry connection after 5 seconds
    logger.info('Retrying MongoDB connection in 5 seconds', {
      retryCount: 'N/A',
      timestamp: new Date().toISOString()
    });
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

module.exports = connectDB;
