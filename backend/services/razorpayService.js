const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpay;
let razorpaySignature = '';

const sanitizeEnvValue = (value) => {
  if (!value) return '';
  return String(value).trim().replace(/^['"]|['"]$/g, '');
};

const getRazorpayCredentials = () => {
  const keyId = sanitizeEnvValue(process.env.RAZORPAY_KEY_ID);
  const keySecret = sanitizeEnvValue(process.env.RAZORPAY_KEY_SECRET);
  return { keyId, keySecret };
};

const initializeRazorpay = () => {
  const { keyId, keySecret } = getRazorpayCredentials();
  const signature = `${keyId}:${keySecret}`;

  if (!keyId || !keySecret) {
    console.error('⚠️  RAZORPAY ENVIRONMENT VARIABLES NOT CONFIGURED!');
    console.error('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
    razorpay = null;
    razorpaySignature = '';
    return;
  }

  if (razorpay && razorpaySignature === signature) {
    return;
  }

  try {
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    razorpaySignature = signature;
    console.log('✅ Razorpay service initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Razorpay service:', error.message);
    razorpay = null;
    razorpaySignature = '';
  }
};

// Initialize on module load
initializeRazorpay();

const getRazorpayClient = () => {
  initializeRazorpay();
  return razorpay;
};

const getRazorpaySecret = () => {
  const { keySecret } = getRazorpayCredentials();
  return keySecret;
}

class RazorpayService {
  /**
   * Check if Razorpay is properly configured
   */
  static isConfigured() {
    const { keyId, keySecret } = getRazorpayCredentials();
    const hasKeyId = !!keyId;
    const hasKeySecret = !!keySecret;

    // Ensure client is initialized with sanitized keys
    initializeRazorpay();
    const hasInstance = !!razorpay;
    
    if (!hasKeyId || !hasKeySecret || !hasInstance) {
      console.error('Razorpay configuration issues:', {
        hasKeyId,
        hasKeySecret,
        hasInstance,
        keyIdLength: keyId ? keyId.length : 0,
        keySecretLength: keySecret ? keySecret.length : 0
      });
    }
    
    return hasKeyId && hasKeySecret && hasInstance;
  }

  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @param {number} orderData.amount - Amount in paise (1 INR = 100 paise)
   * @param {string} orderData.currency - Currency code (default: INR)
   * @param {string} orderData.receipt - Receipt ID
   * @param {Object} orderData.notes - Additional notes
   * @returns {Promise<Object>} Razorpay order
   */
  static async createOrder(orderData) {
    let options = null;
    
    try {
      if (!this.isConfigured()) {
        throw new Error('Razorpay service not configured. Please check environment variables.');
      }

      const client = getRazorpayClient();
      if (!client) {
        throw new Error('Razorpay instance not initialized');
      }

      // Validate amount
      if (!orderData.amount || orderData.amount <= 0) {
        throw new Error('Invalid amount provided');
      }

      // Frontend sends amount in rupees, Razorpay expects amount in paise
      // So we need to convert rupees to paise (1 INR = 100 paise)
      const amountInPaise = Math.round(parseFloat(orderData.amount) * 100);
      
      const sanitizedNotes = Object.entries(orderData.notes || {}).reduce((acc, [key, value]) => {
        acc[key] = value === undefined || value === null ? '' : String(value);
        return acc;
      }, {});

      const sanitizedReceipt = String(orderData.receipt || `rcpt_${Date.now()}`).slice(0, 40);

      options = {
        amount: amountInPaise,
        currency: orderData.currency || 'INR',
        receipt: sanitizedReceipt,
        notes: sanitizedNotes
      };

      console.log('Creating Razorpay order with options:', {
        ...options,
        amountInRupees: orderData.amount,
        amountInPaise: amountInPaise,
        razorpayInstance: !!razorpay,
        razorpayType: typeof razorpay
      });

      console.log('About to call razorpay.orders.create with options:', options);
      const order = await client.orders.create(options);
      console.log('Razorpay order created successfully:', {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status
      });
      
      if (!order || !order.id) {
        throw new Error('Razorpay returned invalid order object');
      }
      
      return order; // Return the raw Razorpay order object
    } catch (error) {
      console.error('Razorpay order creation failed:', {
        error: error.message || error,
        stack: error.stack,
        options: options,
        orderData: orderData,
        errorType: typeof error,
        errorString: String(error),
        fullError: error
      });
      
      // Handle Razorpay specific errors
      let errorMessage = 'Unknown error';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error.description || error.error.message || JSON.stringify(error.error);
      } else if (typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }

      if (error?.statusCode === 401) {
        errorMessage = 'Authentication failed. Please check Razorpay key ID/secret configuration.';
      }
      
      throw new Error(`Failed to create order: ${errorMessage}`);
    }
  }

  /**
   * Verify payment signature
   * @param {string} razorpayOrderId - Razorpay order ID
   * @param {string} razorpayPaymentId - Razorpay payment ID
   * @param {string} razorpaySignature - Razorpay signature
   * @returns {boolean} Signature verification result
   */
  static verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    try {
      console.log('=== SIGNATURE VERIFICATION START ===');
      console.log('Order ID:', razorpayOrderId);
      console.log('Payment ID:', razorpayPaymentId);
      console.log('Received Signature:', razorpaySignature);
      console.log('Secret Key exists:', !!process.env.RAZORPAY_KEY_SECRET);
      
      // Validate input parameters
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        console.error('Missing required parameters for signature verification');
        return false;
      }
      
      const razorpaySecret = getRazorpaySecret();
      if (!razorpaySecret) {
        console.error('RAZORPAY_KEY_SECRET not configured');
        return false;
      }
      
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      console.log('Body to hash:', body);
      
      const expectedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(body.toString())
        .digest('hex');
      
      console.log('Expected Signature:', expectedSignature);
      console.log('Signatures match:', expectedSignature === razorpaySignature);
      console.log('=== SIGNATURE VERIFICATION END ===');
      
      return expectedSignature === razorpaySignature;
    } catch (error) {
      console.error('Payment signature verification failed:', error);
      return false;
    }
  }

  /**
   * Capture payment
   * @param {string} paymentId - Razorpay payment ID
   * @param {number} amount - Amount to capture in paise
   * @returns {Promise<Object>} Capture result
   */
  static async capturePayment(paymentId, amount) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Razorpay service not configured. Please check environment variables.');
      }
      const client = getRazorpayClient();
      if (!client) {
        throw new Error('Razorpay instance not initialized');
      }

      // Amount should already be in paise when calling this function
      const captureData = {
        amount: Math.round(amount), // Ensure it's a whole number
        currency: 'INR',
      };

      console.log('Capturing payment with data:', {
        paymentId,
        amountInPaise: amount,
        amountInRupees: amount / 100
      });

      const payment = await client.payments.capture(paymentId, captureData);
      return {
        success: true,
        paymentId: payment.id,
        status: payment.status,
        capturedAt: payment.captured_at,
        amount: payment.amount,
        currency: payment.currency,
      };
    } catch (error) {
      console.error('Payment capture failed:', error);
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  }

  /**
   * Get payment details
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<Object>} Payment details
   */
  static async getPaymentDetails(paymentId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Razorpay service not configured. Please check environment variables.');
      }
      const client = getRazorpayClient();
      if (!client) {
        throw new Error('Razorpay instance not initialized');
      }
      
      if (!paymentId) {
        throw new Error('Payment ID is required');
      }
      
      console.log('Fetching payment details for ID:', paymentId);
      const payment = await client.payments.fetch(paymentId);
      console.log('Payment details fetched successfully:', payment.id);
      
      return {
        success: true,
        paymentId: payment.id,
        orderId: payment.order_id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        bank: payment.bank,
        card: payment.card,
        upi: payment.upi,
        wallet: payment.wallet,
        vpa: payment.vpa,
        email: payment.email,
        contact: payment.contact,
        name: payment.name,
        description: payment.description,
        notes: payment.notes,
        createdAt: payment.created_at,
        capturedAt: payment.captured_at,
      };
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      throw new Error(`Failed to fetch payment details: ${error.message}`);
    }
  }

  /**
   * Process refund
   * @param {string} paymentId - Razorpay payment ID
   * @param {number} amount - Amount to refund in paise
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>} Refund result
   */
  static async processRefund(paymentId, amount, reason = 'Customer request') {
    try {
      if (!this.isConfigured()) {
        throw new Error('Razorpay service not configured. Please check environment variables.');
      }
      const client = getRazorpayClient();
      if (!client) {
        throw new Error('Razorpay instance not initialized');
      }

      if (!paymentId) {
        throw new Error('Payment ID is required for refund');
      }

      if (!amount || amount <= 0) {
        throw new Error('Valid refund amount is required');
      }

      console.log('Processing Razorpay refund:', {
        paymentId,
        amountInRupees: amount,
        amountInPaise: amount * 100,
        reason
      });

      const refundData = {
        amount: Math.round(amount * 100), // Convert to paise
        speed: 'normal', // or 'optimum'
        notes: {
          reason: reason,
        },
      };

      const refund = await client.payments.refund(paymentId, refundData);
      
      console.log('Razorpay refund successful:', {
        refundId: refund.id,
        paymentId: refund.payment_id,
        status: refund.status,
        amount: refund.amount
      });

      return {
        success: true,
        refundId: refund.id,
        paymentId: refund.payment_id,
        status: refund.status,
        amount: refund.amount,
        currency: refund.currency,
        speed: refund.speed,
        notes: refund.notes,
        createdAt: refund.created_at,
      };
    } catch (error) {
      console.error('Razorpay refund processing failed:', {
        paymentId,
        amount,
        reason,
        error: error.message,
        stack: error.stack
      });
      
      // Provide more specific error messages
      if (error.error && error.error.description) {
        throw new Error(`Razorpay refund failed: ${error.error.description}`);
      } else if (error.message) {
        throw new Error(`Razorpay refund failed: ${error.message}`);
      } else {
        throw new Error('Razorpay refund failed: Unknown error occurred');
      }
    }
  }

  /**
   * Get refund details
   * @param {string} refundId - Razorpay refund ID
   * @returns {Promise<Object>} Refund details
   */
  static async getRefundDetails(refundId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Razorpay service not configured. Please check environment variables.');
      }
      const client = getRazorpayClient();
      if (!client) {
        throw new Error('Razorpay instance not initialized');
      }
      const refund = await client.refunds.fetch(refundId);
      return {
        success: true,
        refundId: refund.id,
        paymentId: refund.payment_id,
        status: refund.status,
        amount: refund.amount,
        currency: refund.currency,
        speed: refund.speed,
        notes: refund.notes,
        createdAt: refund.created_at,
        processedAt: refund.processed_at,
      };
    } catch (error) {
      console.error('Failed to fetch refund details:', error);
      throw new Error(`Failed to fetch refund details: ${error.message}`);
    }
  }

  /**
   * Get all refunds for a payment
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<Array>} Array of refunds
   */
  static async getPaymentRefunds(paymentId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Razorpay service not configured. Please check environment variables.');
      }
      const client = getRazorpayClient();
      if (!client) {
        throw new Error('Razorpay instance not initialized');
      }
      const refunds = await client.payments.fetchAllRefunds(paymentId);
      return {
        success: true,
        refunds: refunds.items.map(refund => ({
          refundId: refund.id,
          paymentId: refund.payment_id,
          status: refund.status,
          amount: refund.amount,
          currency: refund.currency,
          speed: refund.speed,
          notes: refund.notes,
          createdAt: refund.created_at,
          processedAt: refund.processed_at,
        })),
        count: refunds.count,
      };
    } catch (error) {
      console.error('Failed to fetch payment refunds:', error);
      throw new Error(`Failed to fetch payment refunds: ${error.message}`);
    }
  }

  /**
   * Get payment methods
   * @returns {Object} Available payment methods
   */
  static getPaymentMethods() {
    return {
      upi: {
        name: 'UPI',
        description: 'Pay using UPI ID',
        icon: '📱',
        supported: true,
      },
      card: {
        name: 'Credit/Debit Card',
        description: 'Pay using credit or debit card',
        icon: '💳',
        supported: true,
      },
      netbanking: {
        name: 'Net Banking',
        description: 'Pay using net banking',
        icon: '🏦',
        supported: true,
      },
      wallet: {
        name: 'Digital Wallet',
        description: 'Pay using digital wallets',
        icon: '👛',
        supported: true,
      },
      emi: {
        name: 'EMI',
        description: 'Pay in easy installments',
        icon: '📅',
        supported: true,
      },
    };
  }
}

module.exports = RazorpayService;
