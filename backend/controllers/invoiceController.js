const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');

/**
 * @desc    Generate AMC subscription invoice as PDF
 * @route   POST /api/generate-invoice
 * @access  Private
 */
const generateInvoice = asyncHandler(async (req, res) => {
  try {
    const invoiceData = req.body;
    
    logger.info('Generating AMC invoice', {
      userId: req.user?.userId,
      subscriptionId: invoiceData.subscriptionId
    });

    // Validate required fields
    if (!invoiceData.subscriptionId || !invoiceData.planName || !invoiceData.amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required invoice data',
        received: invoiceData
      });
    }

    // Create invoice HTML
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>AMC Invoice - ${invoiceData.planName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: white;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .invoice-title {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 20px;
          }
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            flex-wrap: wrap;
          }
          .invoice-info, .customer-info {
            flex: 1;
            min-width: 300px;
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
          }
          .info-value {
            color: #1f2937;
          }
          .plan-details {
            background: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 30px;
          }
          .plan-name {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .plan-amount {
            font-size: 24px;
            font-weight: bold;
            color: #059669;
          }
          .devices-section {
            margin-bottom: 30px;
          }
          .device-item {
            background: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 10px;
            border-left: 4px solid #3b82f6;
          }
          .device-type {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 5px;
          }
          .device-details {
            font-size: 14px;
            color: #6b7280;
          }
          .payment-info {
            background: #ecfdf5;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #10b981;
          }
          .payment-status {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="logo">FixFly</div>
            <div class="invoice-title">AMC Subscription Invoice</div>
          </div>

          <div class="invoice-details">
            <div class="invoice-info">
              <div class="section-title">Invoice Details</div>
              <div class="info-row">
                <span class="info-label">Invoice ID:</span>
                <span class="info-value">AMC-${invoiceData.subscriptionId.slice(-8).toUpperCase()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Issue Date:</span>
                <span class="info-value">${new Date().toLocaleDateString('en-IN')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Subscription ID:</span>
                <span class="info-value">${invoiceData.subscriptionId}</span>
              </div>
              ${invoiceData.razorpayOrderId ? `
              <div class="info-row">
                <span class="info-label">Order ID:</span>
                <span class="info-value">${invoiceData.razorpayOrderId}</span>
              </div>
              ` : ''}
            </div>

            <div class="customer-info">
              <div class="section-title">Subscription Period</div>
              <div class="info-row">
                <span class="info-label">Start Date:</span>
                <span class="info-value">${new Date(invoiceData.startDate).toLocaleDateString('en-IN')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">End Date:</span>
                <span class="info-value">${new Date(invoiceData.endDate).toLocaleDateString('en-IN')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Duration:</span>
                <span class="info-value">1 Year</span>
              </div>
            </div>
          </div>

          <div class="plan-details">
            <div class="plan-name">${invoiceData.planName}</div>
            <div class="plan-amount">${invoiceData.amount}</div>
            <div style="margin-top: 10px; color: #6b7280;">
              Annual Maintenance Contract for comprehensive device protection
            </div>
          </div>

          ${invoiceData.devices && invoiceData.devices.length > 0 ? `
          <div class="devices-section">
            <div class="section-title">Registered Devices</div>
            ${invoiceData.devices.map(device => `
              <div class="device-item">
                <div class="device-type">${device.deviceType ? device.deviceType.charAt(0).toUpperCase() + device.deviceType.slice(1) : 'Unknown'}</div>
                <div class="device-details">
                  <div>Serial Number: ${device.serialNumber}</div>
                  <div>Model Number: ${device.modelNumber}</div>
                  ${device.brand ? `<div>Brand: ${device.brand}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <div class="payment-info">
            <div class="section-title">Payment Information</div>
            <div class="info-row">
              <span class="info-label">Payment Method:</span>
              <span class="info-value">${invoiceData.paymentMethod ? invoiceData.paymentMethod.charAt(0).toUpperCase() + invoiceData.paymentMethod.slice(1) : 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Status:</span>
              <span class="info-value">
                <span class="payment-status">${invoiceData.paymentStatus}</span>
              </span>
            </div>
            ${invoiceData.razorpayPaymentId ? `
            <div class="info-row">
              <span class="info-label">Transaction ID:</span>
              <span class="info-value">${invoiceData.razorpayPaymentId}</span>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>Thank you for choosing FixFly for your AMC needs!</p>
            <p>For support, contact us at support@fixfly.com or call +91-XXXXXXXXXX</p>
            <p>This is a computer-generated invoice and does not require a signature.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // For now, return HTML invoice (we'll add PDF later)
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="AMC-Invoice-${invoiceData.subscriptionId}.html"`);
    
    logger.info('AMC invoice generated successfully', {
      userId: req.user?.userId,
      subscriptionId: invoiceData.subscriptionId
    });

    res.send(invoiceHtml);

  } catch (error) {
    logger.error('Failed to generate AMC invoice', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: error.message
    });
  }
});

module.exports = {
  generateInvoice
};
