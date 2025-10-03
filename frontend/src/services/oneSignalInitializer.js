// OneSignal Initialization Service
// This service handles the proper initialization of OneSignal SDK

class OneSignalInitializer {
  constructor() {
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * Recommended OneSignal initialization function (static)
   * Based on OneSignal's official recommendations for React apps
   */
  static async initOneSignal() {
    if (!window.OneSignalInitialized) {
      // Wait for OneSignal to be available
      if (typeof window.OneSignal === 'undefined') {
        await new Promise((resolve) => {
          const checkOneSignal = () => {
            if (typeof window.OneSignal !== 'undefined') {
              resolve();
            } else {
              setTimeout(checkOneSignal, 100);
            }
          };
          checkOneSignal();
        });
      }

      await window.OneSignal.init({
        appId: '0e3861fd-d24e-4f93-a211-d64dfd966d17',
        notifyButton: {
          enable: false
        },
        allowLocalhostAsSecureOrigin: true,
        autoRegister: false,
        autoResubscribe: true,
        notificationClickHandlerMatch: 'origin'
      });
      
      window.OneSignalInitialized = true; // Mark initialized
      console.log('OneSignal: Static initialization completed');
    }
    return true;
  }

  /**
   * Initialize OneSignal SDK
   */
  async initialize() {
    // Check both internal and global initialization state
    if (this.isInitialized || window.OneSignalInitialized) {
      console.log('OneSignal: Already initialized, skipping');
      this.isInitialized = true;
      return true;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    // Create initialization promise
    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  async _doInitialize() {
    try {
      // Use global flag to prevent multiple initializations (recommended by OneSignal)
      if (window.OneSignalInitialized) {
        console.log('OneSignal: Already initialized (global flag), skipping initialization');
        this.isInitialized = true;
        return true;
      }

      // Check if OneSignal is loaded from CDN
      if (typeof window.OneSignal === 'undefined') {
        console.log('OneSignal: Waiting for CDN script to load...');
        
        // Wait for OneSignal to be available
        await new Promise((resolve, reject) => {
          const checkOneSignal = () => {
            if (typeof window.OneSignal !== 'undefined') {
              resolve();
            } else {
              setTimeout(checkOneSignal, 100);
            }
          };
          
          // Timeout after 10 seconds
          setTimeout(() => {
            if (typeof window.OneSignal === 'undefined') {
              reject(new Error('OneSignal failed to load from CDN'));
            }
          }, 10000);
          
          checkOneSignal();
        });
      }

      // Check if OneSignal is already initialized via SDK method
      if (window.OneSignal.isInitialized && typeof window.OneSignal.isInitialized === 'function' && window.OneSignal.isInitialized()) {
        console.log('OneSignal: Already initialized (SDK method), setting global flag');
        window.OneSignalInitialized = true;
        this.isInitialized = true;
        return true;
      }

      console.log('OneSignal: Initializing for the first time...');

      // Determine App ID based on environment
      const appId = this._getAppId();
      
      // Initialize OneSignal
      await window.OneSignal.init({
        appId: appId,
        notifyButton: {
          enable: false
        },
        allowLocalhostAsSecureOrigin: true,
        autoRegister: false,
        autoResubscribe: true,
        notificationClickHandlerMatch: 'origin'
      });

      // Set global flag and internal state
      window.OneSignalInitialized = true;
      this.isInitialized = true;
      console.log('OneSignal: Initialized successfully with App ID:', appId);

      // Set up global error handler
      if (typeof window.OneSignal.on === 'function') {
        window.OneSignal.on('subscriptionChange', this._onSubscriptionChange.bind(this));
      }
      
      return true;

    } catch (error) {
      console.error('OneSignal: Initialization failed:', error);
      
      // Check if it's an "already initialized" error
      if (error.message && error.message.includes('already initialized')) {
        console.log('OneSignal: Already initialized (error caught), setting global flag');
        window.OneSignalInitialized = true;
        this.isInitialized = true;
        return true;
      }
      
      this.isInitialized = false;
      this.initPromise = null;
      return false;
    }
  }

  /**
   * Get the appropriate App ID based on environment
   */
  _getAppId() {
    // Use the same App ID for all environments for now
    return '0e3861fd-d24e-4f93-a211-d64dfd966d17';
  }

  /**
   * Handle subscription changes
   */
  _onSubscriptionChange(isSubscribed) {
    console.log('OneSignal: Subscription changed:', isSubscribed);
  }

  /**
   * Register vendor for push notifications
   */
  async registerVendor(vendorId, vendorData = {}) {
    const initialized = await this.initialize();
    if (!initialized) {
      throw new Error('OneSignal not initialized');
    }

    try {
      console.log('OneSignal: Registering vendor:', vendorId);
      
      // Check if push notifications are enabled
      const isEnabled = await window.OneSignal.isPushNotificationsEnabled();
      
      if (!isEnabled) {
        console.log('OneSignal: Requesting permission...');
        await window.OneSignal.registerForPushNotifications();
      }

      // Set external user ID (vendor ID)
      await window.OneSignal.setExternalUserId(vendorId);
      
      // DISABLED: Set vendor tags due to OneSignal v16 compatibility issues
      const tags = {
        vendor_id: vendorId,
        user_type: 'vendor',
        vendor_name: `${vendorData.firstName || ''} ${vendorData.lastName || ''}`.trim(),
        service_categories: vendorData.serviceCategories?.join(',') || '',
        city: vendorData.address?.city || '',
        state: vendorData.address?.state || '',
        is_active: vendorData.isActive ? 'true' : 'false',
        registration_date: new Date().toISOString()
      };

      console.log('OneSignal: Tag setting disabled in initializer due to v16 compatibility issues');
      console.log('OneSignal: Tags would have been:', tags);
      // await window.OneSignal.sendTags(tags);
      
      // Get player ID
      const playerId = await window.OneSignal.getPlayerId();
      
      console.log('OneSignal: Vendor registered successfully:', {
        vendorId,
        playerId,
        tags,
        isEnabled
      });

      return {
        success: true,
        playerId,
        isEnabled,
        tags
      };

    } catch (error) {
      console.error('OneSignal: Vendor registration failed:', error);
      throw error;
    }
  }

  /**
   * Update vendor tags
   */
  async updateVendorTags(vendorData) {
    // EARLY RETURN: Tag updates are completely disabled due to OneSignal v16 compatibility issues
    console.log('OneSignal: updateVendorTags disabled due to v16 compatibility issues');
    console.log('OneSignal: Tags update would have been:', {
      vendor_name: `${vendorData.firstName || ''} ${vendorData.lastName || ''}`.trim(),
      service_categories: vendorData.serviceCategories?.join(',') || '',
      city: vendorData.address?.city || '',
      state: vendorData.address?.state || '',
      is_active: vendorData.isActive ? 'true' : 'false',
      last_updated: new Date().toISOString()
    });
    return { success: true, tags: {} };
    
    /* DISABLED CODE BELOW - KEPT FOR REFERENCE
    try {
      // Check if OneSignal is available WITHOUT triggering initialization
      if (!this.isAvailable()) {
        console.log('OneSignal: Not available, skipping tag update');
        return { success: false, error: 'OneSignal not available' };
      }

      // Ensure OneSignal is available
      if (!window.OneSignal || typeof window.OneSignal.sendTags !== 'function') {
        console.log('OneSignal: SDK not available for updating tags');
        return { success: false, error: 'OneSignal SDK not available' };
      }

      // DISABLED: Vendor tag updates due to OneSignal v16 compatibility issues
      const tags = {
        vendor_name: `${vendorData.firstName || ''} ${vendorData.lastName || ''}`.trim(),
        service_categories: vendorData.serviceCategories?.join(',') || '',
        city: vendorData.address?.city || '',
        state: vendorData.address?.state || '',
        is_active: vendorData.isActive ? 'true' : 'false',
        last_updated: new Date().toISOString()
      };

      console.log('OneSignal: Tag update disabled in initializer due to v16 compatibility issues');
      console.log('OneSignal: Tags update would have been:', tags);
      // await window.OneSignal.sendTags(tags);

      console.log('OneSignal: Skipping tag update (functionality preserved without tags)');
      return { success: true, tags };

    } catch (error) {
      console.error('OneSignal: Failed to update tags:', error);
      return { success: false, error: error.message };
    }
    */
  }

  /**
   * Check if OneSignal is available WITHOUT triggering initialization
   */
  isAvailable() {
    return typeof window !== 'undefined' && 
           typeof window.OneSignal !== 'undefined' && 
           (window.OneSignalInitialized === true || 
            (window.OneSignal.isInitialized && typeof window.OneSignal.isInitialized === 'function' && window.OneSignal.isInitialized()));
  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus() {
    if (!this.isAvailable()) {
      return { enabled: false, playerId: null };
    }

    try {
      const enabled = await window.OneSignal.isPushNotificationsEnabled();
      const playerId = await window.OneSignal.getPlayerId();
      
      return { enabled, playerId };
    } catch (error) {
      console.error('OneSignal: Failed to get subscription status:', error);
      return { enabled: false, playerId: null };
    }
  }
}

// Create and export singleton instance
export const oneSignalInitializer = new OneSignalInitializer();
export default oneSignalInitializer;
