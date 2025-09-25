const nodemailer = require('nodemailer');

// Create transporter for email sending
const createTransporter = () => {
  // For development, we'll use Gmail SMTP
  // You can configure this with your email service
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'fixfly.service@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
  
  return transporter;
};

// Send invoice email
const sendInvoiceEmail = async (to, subject, content, ticketId) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'fixfly.service@gmail.com',
      to: to,
      subject: subject,
      text: content,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">FIXFLY</h1>
            <h2 style="margin: 10px 0 0 0;">INVOICE</h2>
          </div>
          
          <div style="padding: 20px; background-color: #f8f9fa;">
            <h3 style="color: #333; margin-top: 0;">Invoice Details</h3>
            <p><strong>Invoice No:</strong> INV-${ticketId}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="padding: 20px;">
            <pre style="white-space: pre-wrap; font-family: monospace; background-color: #f1f1f1; padding: 15px; border-radius: 5px;">${content}</pre>
          </div>
          
          <div style="background-color: #e9ecef; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #666;">Thank you for using FixFly services!</p>
            <p style="margin: 5px 0 0 0; color: #666;">For any queries, contact us at support@fixfly.com</p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send simple notification email
const sendNotificationEmail = async (to, subject, message) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'fixfly.service@gmail.com',
      to: to,
      subject: subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">FIXFLY</h1>
          </div>
          
          <div style="padding: 20px;">
            <h3 style="color: #333;">${subject}</h3>
            <p style="color: #666; line-height: 1.6;">${message}</p>
          </div>
          
          <div style="background-color: #e9ecef; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #666;">Thank you for using FixFly services!</p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Notification email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending notification email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendInvoiceEmail,
  sendNotificationEmail
};
