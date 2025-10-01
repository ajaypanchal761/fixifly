// OneSignal service for handling push notifications
import oneSignalConfig from '../config/oneSignalConfig';

declare global {
  interface Window {
    OneSignal: any & { _isMock?: boolean };
    OneSignalDeferred: any[];
  }
}

class OneSignalService {
  private isInitialized = false;
  private isVendorLoggedIn = false;
  private vendorId: string | null = null;

  /**
   * Initialize OneSignal service
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Check if we're on an allowed domain
      if (!oneSignalConfig.isDomainAllowed()) {
        console.warn('OneSignal not available - domain not allowed:', oneSignalConfig.getCurrentDomain());
        return false;
      }

      // Check if OneSignal is available (not mocked)
      if (typeof window !== 'undefined' && window.OneSignal) {
        // Check if it's the real OneSignal or our mock
        const isMockOneSignal = window.OneSignal._isMock === true;
        
        if (isMockOneSignal) {
          console.warn('OneSignal is mocked - not available on this domain');
          return false;
        }

        this.isInitialized = true;
        console.log('OneSignal initialized successfully');
        return true;
      }

      // Wait for OneSignal to load
      return new Promise((resolve) => {
        const checkOneSignal = () => {
          if (typeof window !== 'undefined' && window.OneSignal) {
            // Check if it's the real OneSignal or our mock
            const isMockOneSignal = window.OneSignal._isMock === true;
            
            if (isMockOneSignal) {
              console.warn('OneSignal is mocked - not available on this domain');
              resolve(false);
              return;
            }

            this.isInitialized = true;
            console.log('OneSignal initialized successfully');
            resolve(true);
          } else {
            setTimeout(checkOneSignal, 100);
          }
        };
        checkOneSignal();
      });
    } catch (error) {
      console.error('Error initializing OneSignal:', error);
      return false;
    }
  }

  /**
   * Set external user ID for vendor
   * @param vendorId - Vendor ID to set as external user ID
   */
  async setVendorExternalId(vendorId: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.warn('OneSignal not available - cannot set external user ID');
          return false;
        }
      }

      if (!window.OneSignal) {
        console.error('OneSignal not available');
        return false;
      }

      await window.OneSignal.setExternalUserId(vendorId);
      this.vendorId = vendorId;
      this.isVendorLoggedIn = true;
      
      console.log('OneSignal external user ID set:', vendorId);
      return true;
    } catch (error) {
      console.error('Error setting OneSignal external user ID:', error);
      return false;
    }
  }

  /**
   * Clear external user ID (for logout)
   */
  async clearExternalId(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.warn('OneSignal not available - cannot clear external user ID');
          return false;
        }
      }

      if (!window.OneSignal) {
        console.error('OneSignal not available');
        return false;
      }

      await window.OneSignal.removeExternalUserId();
      this.vendorId = null;
      this.isVendorLoggedIn = false;
      
      console.log('OneSignal external user ID cleared');
      return true;
    } catch (error) {
      console.error('Error clearing OneSignal external user ID:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!window.OneSignal) {
        console.error('OneSignal not available');
        return false;
      }

      const permission = await window.OneSignal.showNativePrompt();
      console.log('OneSignal permission requested:', permission);
      return permission;
    } catch (error) {
      console.error('Error requesting OneSignal permission:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async isNotificationEnabled(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!window.OneSignal) {
        return false;
      }

      const permission = await window.OneSignal.getNotificationPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error checking OneSignal notification permission:', error);
      return false;
    }
  }

  /**
   * Get OneSignal player ID
   */
  async getPlayerId(): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!window.OneSignal) {
        return null;
      }

      const playerId = await window.OneSignal.getUserId();
      return playerId;
    } catch (error) {
      console.error('Error getting OneSignal player ID:', error);
      return null;
    }
  }

  /**
   * Set up notification event listeners
   */
  setupEventListeners(): void {
    try {
      if (!window.OneSignal) {
        console.error('OneSignal not available for event listeners');
        return;
      }

      // Listen for notification received
      window.OneSignal.on('notificationDisplay', (event: any) => {
        console.log('OneSignal notification received:', event);
        // Handle notification received
        this.handleNotificationReceived(event);
      });

      // Listen for notification clicked
      window.OneSignal.on('notificationClick', (event: any) => {
        console.log('OneSignal notification clicked:', event);
        // Handle notification clicked
        this.handleNotificationClicked(event);
      });

      // Listen for subscription change
      window.OneSignal.on('subscriptionChange', (event: any) => {
        console.log('OneSignal subscription changed:', event);
        // Handle subscription change
        this.handleSubscriptionChange(event);
      });

      console.log('OneSignal event listeners set up successfully');
    } catch (error) {
      console.error('Error setting up OneSignal event listeners:', error);
    }
  }

  /**
   * Handle notification received
   */
  private handleNotificationReceived(event: any): void {
    try {
      // You can add custom logic here for when a notification is received
      console.log('Notification received:', event);
      
      // Example: Show a toast notification or update UI
      if (event.notification && event.notification.title) {
        // You can integrate with your toast system here
        console.log('New notification:', event.notification.title);
      }
    } catch (error) {
      console.error('Error handling notification received:', error);
    }
  }

  /**
   * Handle notification clicked
   */
  private handleNotificationClicked(event: any): void {
    try {
      console.log('Notification clicked:', event);
      
      // Handle navigation based on notification data
      if (event.notification && event.notification.additionalData) {
        const data = event.notification.additionalData;
        
        // Navigate based on notification type
        if (data.type === 'vendor_assignment') {
          this.navigateToAssignment(data);
        } else if (data.type === 'wallet_transaction') {
          this.navigateToWallet();
        } else if (data.type === 'account_status') {
          this.navigateToDashboard();
        }
      }
    } catch (error) {
      console.error('Error handling notification clicked:', error);
    }
  }

  /**
   * Handle subscription change
   */
  private handleSubscriptionChange(event: any): void {
    try {
      console.log('Subscription changed:', event);
      
      // Handle subscription state changes
      if (event.isSubscribed) {
        console.log('User subscribed to notifications');
      } else {
        console.log('User unsubscribed from notifications');
      }
    } catch (error) {
      console.error('Error handling subscription change:', error);
    }
  }

  /**
   * Navigate to assignment based on type
   */
  private navigateToAssignment(data: any): void {
    try {
      const { assignmentType, assignmentId } = data;
      
      switch (assignmentType) {
        case 'booking':
          window.location.href = `/vendor/bookings/${assignmentId}`;
          break;
        case 'support_ticket':
          window.location.href = `/vendor/support-tickets/${assignmentId}`;
          break;
        case 'warranty_claim':
          window.location.href = `/vendor/warranty-claims/${assignmentId}`;
          break;
        default:
          window.location.href = '/vendor/dashboard';
      }
    } catch (error) {
      console.error('Error navigating to assignment:', error);
      window.location.href = '/vendor/dashboard';
    }
  }

  /**
   * Navigate to wallet
   */
  private navigateToWallet(): void {
    try {
      window.location.href = '/vendor/wallet';
    } catch (error) {
      console.error('Error navigating to wallet:', error);
    }
  }

  /**
   * Navigate to dashboard
   */
  private navigateToDashboard(): void {
    try {
      window.location.href = '/vendor/dashboard';
    } catch (error) {
      console.error('Error navigating to dashboard:', error);
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    isInitialized: boolean;
    isVendorLoggedIn: boolean;
    vendorId: string | null;
  } {
    return {
      isInitialized: this.isInitialized,
      isVendorLoggedIn: this.isVendorLoggedIn,
      vendorId: this.vendorId
    };
  }
}

// Create singleton instance
const oneSignalService = new OneSignalService();

export default oneSignalService;
