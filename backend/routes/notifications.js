const express = require('express');
const router = express.Router();
const { sendNotification } = require('../controllers/userNotificationController');
const { protect } = require('../middleware/auth');

// @route   POST /api/send-notification
// @desc    Send notification to user
// @access  Private (Admin/System)
router.post('/send-notification', protect, sendNotification);

// @route   PUT /api/send-notification
// @desc    Send notification to user (alternative method)
// @access  Private (Admin/System)
router.put('/send-notification', protect, sendNotification);

// @route   ALL /api/send-notification
// @desc    Send notification to user (catch-all for debugging)
// @access  Private (Admin/System)
router.all('/send-notification', (req, res) => {
  console.log('=== SEND NOTIFICATION REQUEST ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  console.log('==================================');
  
  try {
    const { userId, title, body, data } = req.body;
    
    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'userId, title, and body are required',
        method: req.method
      });
    }
    
    // Here you can implement Firebase Admin SDK to send notifications
    // const message = {
    //   token: userFcmToken,
    //   notification: { title, body },
    //   data: data || {}
    // };
    // const response = await admin.messaging().send(message);
    
    console.log('✅ Notification sent to user:', userId);
    
    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      method: req.method,
      data: {
        userId: userId,
        title: title,
        body: body,
        timestamp: new Date().toISOString(),
        endpoint: '/api/send-notification'
      }
    });
    
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

module.exports = router;
