import razorpayService from './razorpayService';

interface DepositOrderResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    amount: number;
    currency: string;
    transactionId: string;
  };
}

interface DepositVerificationResponse {
  success: boolean;
  message: string;
  data: {
    transactionId: string;
    amount: number;
    newBalance: number;
    hasInitialDeposit: boolean;
  };
}

interface WalletResponse {
  success: boolean;
  data: {
    wallet: {
      currentBalance: number;
      hasInitialDeposit: boolean;
      initialDepositAmount: number;
      totalDeposits: number;
      totalWithdrawals: number;
      securityDeposit: number;
      depositHistory: Array<{
        amount: number;
        type: string;
        description: string;
        transactionId: string;
        razorpayOrderId?: string;
        razorpayPaymentId?: string;
        status: string;
        createdAt: string;
      }>;
    };
  };
}

// RAZORPAY ACCOUNT CONFIGURATION
// To change the account, update the key below.
// OLD ACCOUNT (Backup):
// const RAZORPAY_KEY = 'rzp_live_RyCVwnDNEvO2uL';

// NEW ACCOUNT (Active):
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_RyCVwnDNEvO2uL';

class VendorDepositService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('vendorToken');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Create a deposit order
   */
  async createDepositOrder(amount: number): Promise<DepositOrderResponse> {
    return this.makeRequest<DepositOrderResponse>('/vendors/deposit/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  /**
   * Verify deposit payment
   */
  async verifyDepositPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    transactionId: string
  ): Promise<DepositVerificationResponse> {
    return this.makeRequest<DepositVerificationResponse>('/vendors/deposit/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        transactionId,
      }),
    });
  }

  /**
   * Get vendor wallet information
   */
  async getWallet(): Promise<WalletResponse> {
    return this.makeRequest<WalletResponse>('/vendors/wallet');
  }

  /**
   * Process vendor deposit payment with Razorpay
   */
  async processDepositPayment(
    amount: number,
    vendorName: string,
    vendorEmail: string,
    vendorPhone: string,
    onSuccess: (response: any) => void,
    onError: (error: any) => void
  ): Promise<void> {
    try {
      // Create deposit order
      const orderResponse = await this.createDepositOrder(amount);

      if (!orderResponse.success) {
        throw new Error(orderResponse.message);
      }

      const { orderId, transactionId } = orderResponse.data;

      // Process payment with Razorpay
      await razorpayService.processPayment({
        orderId,
        amount,
        currency: 'INR',
        name: vendorName,
        email: vendorEmail,
        phone: vendorPhone,
        description: 'Vendor Initial Deposit',
        keyId: RAZORPAY_KEY, // Use configured key
        onSuccess: async (paymentResponse) => {
          try {
            // Verify payment
            const verifyResponse = await this.verifyDepositPayment(
              orderId,
              paymentResponse.razorpay_payment_id,
              paymentResponse.razorpay_signature,
              transactionId
            );

            if (verifyResponse.success) {
              onSuccess(verifyResponse.data);
            } else {
              onError(new Error('Payment verification failed'));
            }
          } catch (error) {
            console.error('Error verifying payment:', error);
            onError(error);
          }
        },
        onError: (error) => {
          console.error('Payment failed:', error);
          onError(error);
        }
      });
    } catch (error) {
      console.error('Error processing deposit payment:', error);
      onError(error);
    }
  }
}

export const vendorDepositService = new VendorDepositService();
