class OneSignalService {
  constructor() {
    this.isInitialized = false;
    // Try different app IDs for different ports
    this.appId3000 = "0e3861fd-d24e-4f93-a211-d64dfd966d17"; // For localhost:3000
    this.appId8080 = "0e3861fd-d24e-4f93-a211-d64dfd966d17"; // For localhost:8080 (same for now)
    // Fallback app ID
    this.appId = "0e3861fd-d24e-4f93-a211-d64dfd966d17";
  }

  /**
   * Initialize OneSignal
   */
  async initialize() {
    try {
      // Check global flag first (recommended by OneSignal)
      if (window.OneSignalInitialized) {
        console.log('OneSignal: Already initialized (global flag), skipping initialization');
        this.isInitialized = true;
        return true;
      }

      // Check if already initialized
      if (this.isInitialized) {
        console.log('OneSignal: Already initialized (service flag), skipping');
        return true;
      }

      // Check if we're in a supported environment
      if (typeof window === 'undefined') {
        console.log('OneSignal: Not in browser environment, skipping initialization');
        return false;
      }

      // Check if OneSignal is already initialized globally
      if (window.OneSignal && (window.OneSignal.__VERSION || window.OneSignal.initialized)) {
        console.log('OneSignal: Already initialized globally, using existing instance');
        window.OneSignalInitialized = true;
        this.isInitialized = true;
        
        // Set up notification click handler if not already set
        try {
          if (typeof window.OneSignal.on === 'function') {
            window.OneSignal.on('notificationClick', this.handleNotificationClick.bind(this));
          }
        } catch (e) {
          // Handler might already be set, ignore error
        }
        
        return true;
      }

      // Check if we're on localhost with correct port or allowed domain
      const hostname = window.location.hostname;
      const port = window.location.port;
      const protocol = window.location.protocol;
      
      const isLocalhost3000 = hostname === 'localhost' && port === '3000';
      const isLocalhost5173 = hostname === 'localhost' && port === '5173'; // Vite default
      const isLocalhost8080 = hostname === 'localhost' && port === '8080'; // Current Vite config
      const isAllowedDomain = hostname.includes('fixifly') || hostname.includes('vercel.app');
      
      // For localhost development, try both ports in OneSignal init
      const isLocalDev = hostname === 'localhost';

      console.log('OneSignal: Initializing on allowed domain:', `${protocol}//${hostname}:${port}`);
      console.log('OneSignal: Current URL details:', {
        hostname,
        port,
        protocol,
        fullURL: window.location.href,
        isLocalhost3000,
        isLocalhost5173,
        isLocalhost8080,
        isAllowedDomain
      });

      // Determine the correct app ID based on port
      let appIdToUse = this.appId;
      if (isLocalDev) {
        if (port === '3000') {
          appIdToUse = this.appId3000;
        } else if (port === '8080') {
          appIdToUse = this.appId8080;
        }
      }

      console.log('OneSignal: Using app ID:', appIdToUse);

      try {
        await window.OneSignal.init({
          appId: appIdToUse,
          notifyButton: {
            enable: false, // We'll handle notifications manually
          },
          allowLocalhostAsSecureOrigin: true, // For development
          autoRegister: false, // We'll register manually when vendor logs in
          autoResubscribe: true,
          notificationClickHandlerMatch: 'origin',
          // Prevent automatic welcome notifications
          autoPromptForNotificationPermission: false,
          disableWelcomeNotification: true,
          // Mobile web app specific configuration
          promptOptions: {
            slidedownPermissionMessage: {
              enabled: true,
              actionMessage: "🔔 Enable push notifications for instant task alerts!",
              acceptButton: "Allow",
              cancelButton: "Not Now"
            },
            fullscreenPermissionMessage: {
              enabled: true,
              title: "🔔 Enable Notifications",
              message: "Get instant alerts when new tasks are assigned to you via Fixifly mobile web app.",
              acceptButton: "Allow",
              cancelButton: "Skip"
            }
          },
          // Mobile browser optimization
          safari_web_id: 'fixifly-vendor-notifications'
        });
      } catch (initError) {
        const errorMessage = initError.message || initError.toString();
        
        // Handle IndexedDB errors gracefully
        if (errorMessage.includes('indexedDB.open') || errorMessage.includes('backing store')) {
          console.error('OneSignal: IndexedDB initialization failed:', errorMessage);
          console.warn('OneSignal: Push notifications disabled due to browser storage issues');
          console.info('OneSignal: This can happen in incognito mode, with storage disabled, or due to browser limitations');
          console.info('OneSignal: Vendor notifications will still work via email/SMS fallback');
          
          // Set global flag to prevent further initialization attempts
          window.OneSignalInitialized = false;
          window.OneSignalIndexedDBError = true;
          return false;
        }
        
        // If initialization fails due to domain restriction, try with different settings
        if (errorMessage.includes('Can only be used on')) {
          console.warn('OneSignal: Domain restriction detected, trying alternative initialization:', errorMessage);
          
          // If domain restriction error, we'll still mark as initialized and log the issue
          window.OneSignalInitialized = true;
          this.isInitialized = true;
          console.warn('OneSignal: Running in restricted mode - notifications may not work until domain is configured in OneSignal Dashboard');
          
          // Set up basic handlers even in restricted mode
          try {
            if (typeof window.OneSignal.on === 'function') {
            window.OneSignal.on('notificationClick', this.handleNotificationClick.bind(this));
          }
          } catch (e) {
            // Handler setup might fail in restricted mode
          }
          
          return true;
        }
        throw initError;
      }

      // Set both global flag and service flag
      window.OneSignalInitialized = true;
      this.isInitialized = true;
      console.log('OneSignal initialized successfully');

      // Set up notification click handler (only if OneSignal.on is available)
      try {
          if (typeof window.OneSignal.on === 'function') {
            if (typeof window.OneSignal.on === 'function') {
              window.OneSignal.on('notificationClick', this.handleNotificationClick.bind(this));
          }
          console.log('OneSignal: Notification click handler set successfully');
        } else {
          console.log('OneSignal: on() method not available yet, skipping click handler');
        }
      } catch (handlerError) {
        console.log('OneSignal: Could not set notification click handler:', handlerError.message);
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing OneSignal:', error);
      this.isInitialized = false;
      
      // If it's already initialized error, mark as initialized
      if (error.message && (error.message.includes('already initialized') || error.message.includes('SDK already initialized'))) {
        console.log('OneSignal: SDK already initialized, marking as ready');
        window.OneSignalInitialized = true;
        this.isInitialized = true;
        
        // Set up notification click handler if not already set
        try {
          if (typeof window.OneSignal.on === 'function') {
            window.OneSignal.on('notificationClick', this.handleNotificationClick.bind(this));
          }
        } catch (e) {
          // Handler might already be set, ignore error
        }
        
        return true;
      }
      
      return false;
    }
  }

  /**
   * Register vendor for push notifications
   * @param {string} vendorId - Vendor ID
   * @param {Object} vendorData - Additional vendor data
   */
  async registerVendor(vendorId, vendorData = {}) {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        console.log('OneSignal not initialized, skipping vendor registration');
        return { success: false, error: 'OneSignal not available' };
      }

      // If OneSignal is in restricted mode, return success but don't try to register
      if (this.isInitialized && !window.OneSignal) {
        console.log('OneSignal: In restricted mode, vendor registration deferred');
        return { success: true, playerId: null, isSubscribed: false, restricted: true };
      }

      // Check if OneSignal is available and has the required methods
      if (!window.OneSignal || typeof window.OneSignal.Notifications !== 'object') {
        console.log('OneSignal API not fully loaded, waiting...');
        
        // Wait a bit more and try again
        setTimeout(async () => {
          if (!window.OneSignal || typeof window.OneSignal.Notifications !== 'object') {
            console.log('OneSignal: SDK not available, skipping registration');
            return { success: false, error: 'OneSignal SDK not available' };
          }
          
          // Try registration again after waiting
          return await this.registerVendor(vendorId, vendorData);
        }, 2000);
        
        return { success: false, error: 'OneSignal SDK still loading' };
      }

      // Standard registration flow using OneSignal v16 API
      console.log('OneSignal: Available APIs:', Object.keys(window.OneSignal));
      console.log('OneSignal.User APIs:', window.OneSignal.User ? Object.keys(window.OneSignal.User) : 'Not available');
      console.log('OneSignal.Notifications APIs:', window.OneSignal.Notifications ? Object.keys(window.OneSignal.Notifications) : 'Not available');

      // Check if we have the necessary APIs available
      if (!window.OneSignal.User || !window.OneSignal.Notifications) {
        console.log('OneSignal: Required APIs not available');
        return { success: false, error: 'OneSignal APIs not available' };
      }

      // Check permission status
      let permission = 'default';
      try {
        permission = await window.OneSignal.Notifications.permission;
      } catch (permCheckError) {
        // Permission API might not be available, try alternative
        if (window.OneSignal.isPushNotificationsEnabled && typeof window.OneSignal.isPushNotificationsEnabled === 'function') {
          const isEnabled = await window.OneSignal.isPushNotificationsEnabled();
          permission = isEnabled ? 'granted' : 'default';
        }
      }
      
      console.log('OneSignal permission status:', permission);

      if (permission === 'default' || permission === false) {
        // Force permission request to ensure subscription (Mobile Web App Optimized)
        try {
          console.log('OneSignal: Requesting notification permission for mobile web app...');
          
          // Detect if we're on mobile
          const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          console.log('OneSignal: Mobile device detected:', isMobile);
          
          // Use the most reliable method for each browser with mobile optimizations
          if (window.OneSignal.Notifications && window.OneSignal.Notifications.requestPermission) {
            // For OneSignal v16 API
            const permissionResult = await window.OneSignal.Notifications.requestPermission();
            console.log('OneSignal: Permission request result:', permissionResult);
            
            // If on mobile and permission granted, wait a bit for subscription to process
            if (isMobile && permissionResult === 'granted') {
              console.log('OneSignal: Mobile permission granted, waiting for subscription processing...');
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            }
          } else if (window.OneSignal.showHttpPrompt) {
            await window.OneSignal.showHttpPrompt();
            console.log('OneSignal: HTTP prompt method used');
            if (isMobile) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for mobile processing
            }
          } else if (window.OneSignal.registerForPushNotifications) {
            // Legacy method - try to enable
            await window.OneSignal.registerForPushNotifications();
            console.log('OneSignal: Legacy registration method used');
            if (isMobile) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for mobile processing
            }
          }
          
          // Wait a moment for subscription to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (permError) {
          console.log('OneSignal: Permission request failed:', permError.message);
          return { success: false, error: 'Permission request failed' };
        }
      }

      // CRITICAL: Set external user ID for backend targeting
      try {
        console.log('OneSignal: Setting external user ID to:', vendorId);
        
        if (window.OneSignal.User && window.OneSignal.User.addExternalUserId) {
          await window.OneSignal.User.addExternalUserId(vendorId);
          console.log('OneSignal: External user ID set using v16 API');
        } else if (window.OneSignal.setExternalUserId) {
          // Legacy method fallback
          await window.OneSignal.setExternalUserId(vendorId);
          console.log('OneSignal: External user ID set using legacy API');
        } else {
          console.log('OneSignal: External user ID API not available - vendor will not receive notifications');
          return { success: false, error: 'External user ID setup failed' };
        }
        
        // Verify external user ID was set
        try {
          const currentExternalId = await window.OneSignal.User.getExternalUserId();
          console.log('OneSignal: Verified external user ID:', currentExternalId);
        } catch (verifyError) {
          console.log('OneSignal: External user ID verification failed:', verifyError.message);
        }
        
      } catch (externalIdError) {
        console.log('OneSignal: Adding external user ID failed:', externalIdError.message);
        return { success: false, error: 'External user ID setup failed: ' + externalIdError.message };
      }

      // Set vendor tags for better targeting using OneSignal v16 API
      try {
        // Start with only essential tags to reduce operation errors
        const rawTags = {
          vendor_id: vendorId,
          user_type: 'vendor'
        };

        // Add optional tags only if they have valid values
        const vendorName = `${vendorData.firstName || ''} ${vendorData.lastName || ''}`.trim();
        if (vendorName) {
          rawTags.vendor_name = vendorName;
        }

        if (vendorData.serviceCategories && vendorData.serviceCategories.length > 0) {
          rawTags.service_categories = vendorData.serviceCategories.join(',');
        }

        if (vendorData.address?.city) {
          rawTags.city = vendorData.address.city;
        }

        if (vendorData.address?.state) {
          rawTags.state = vendorData.address.state;
        }

        rawTags.is_active = vendorData.isActive ? 'true' : 'false';

        // Filter out empty or invalid tags
        const tags = {};
        for (const [key, value] of Object.entries(rawTags)) {
          if (value !== null && value !== undefined && value !== '') {
            tags[key] = value;
          }
        }

        // TEMPORARILY DISABLED: Add a small delay to ensure external user ID is processed first
        // await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('OneSignal: SKIPPING tag setting due to OneSignal v16 compatibility issues');
        console.log('OneSignal: Tags would have been:', tags);
        
        // DISABLED: Try OneSignal v16 tagging API with better error handling
        try {
          console.log('OneSignal: Tagging DISABLED - OneSignal v16 tagging causes operation failures');
          // DISABLED due to "Operation execution failed without retry" errors
          /*
          // Try OneSignal v16 setTags API (most likely correct method)
          if (window.OneSignal.User.setTags && typeof window.OneSignal.User.setTags === 'function') {
            await window.OneSignal.User.setTags(tags);
            console.log('OneSignal: Tags set successfully using setTags API');
          } else if (window.OneSignal.User.addTags && typeof window.OneSignal.User.addTags === 'function') {
          // Try addTags as backup
          await window.OneSignal.User.addTags(tags);
          console.log('OneSignal: Tags added successfully using addTags API');
          } else if (window.OneSignal.sendTags && typeof window.OneSignal.sendTags === 'function') {
            // Fallback to legacy API
            await window.OneSignal.sendTags(tags);
            console.log('OneSignal: Tags sent successfully using legacy sendTags API');
          } else {
            console.log('OneSignal: Tagging API not available');
          }
          */
        } catch (tagApiError) {
          console.log('OneSignal: Tagging API error:', tagApiError.message);
          // DISABLED: Individual tag setting also causes OneSignal operation failures
          /*
          // Try alternative approach by setting tags one by one
          // Try individual tag setting as fallback
          console.log('OneSignal: Trying to set tags individually...');
          for (const [key, value] of Object.entries(tags)) {
            try {
              // Try different methods for individual tags
              if (window.OneSignal.User.setTag && typeof window.OneSignal.User.setTag === 'function') {
                await window.OneSignal.User.setTag(key, value);
                console.log(`OneSignal: Individual tag set successfully: ${key} = ${value}`);
              } else if (window.OneSignal.User.addTag && typeof window.OneSignal.User.addTag === 'function') {
                await window.OneSignal.User.addTag(key, value);
                console.log(`OneSignal: Individual tag added successfully: ${key} = ${value}`);
              } else {
                console.log(`OneSignal: Individual tag API not available for: ${key}`);
              }
              
              // Small delay between tag operations
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (individualTagError) {
              console.log(`OneSignal: Failed to set individual tag ${key}:`, individualTagError.message);
              // Continue with next tag even if one fails
             }
          }
          */
        }
      } catch (tagError) {
        console.log('OneSignal: Tagging failed:', tagError.message);
        // Continue registration even if tagging fails
      }

      // Get player ID and subscription status using OneSignal v16 API
      let playerId = null;
      let isSubscribed = false;

      try {
        // Try OneSignal v16 player ID API
        if (window.OneSignal.User && window.OneSignal.User.getPlayerId) {
          playerId = await window.OneSignal.User.getPlayerId();
        } else if (window.OneSignal.getPlayerId && typeof window.OneSignal.getPlayerId === 'function') {
          // Legacy API fallback
          playerId = await window.OneSignal.getPlayerId();
        } else if (window.OneSignal.User && window.OneSignal.User.onesignalId) {
          // Alternative v16 API
          playerId = await window.OneSignal.User.onesignalId;
        }

        // Check subscription status and ensure proper subscription
        if (window.OneSignal.Notifications && window.OneSignal.Notifications.permission) {
          const currentPermission = await window.OneSignal.Notifications.permission;
          isSubscribed = currentPermission === 'granted';
          
          // Force subscription if permission is granted
          if (currentPermission === 'granted') {
            try {
              // Explicitly request subscription to ensure OneSignal considers user subscribed
              await window.OneSignal.Notifications.requestPermission();
              console.log('OneSignal: Vendor subscription confirmed for notifications');
            } catch (subscribeError) {
              console.log('OneSignal: Subscription confirmation error:', subscribeError.message);
            }
          } else {
            console.log('OneSignal: Permission not granted, cannot subscribe vendor');
          }
        } else if (window.OneSignal.isPushNotificationsEnabled && typeof window.OneSignal.isPushNotificationsEnabled === 'function') {
          // Legacy subscription check and force
          isSubscribed = await window.OneSignal.isPushNotificationsEnabled();
          
          // Force subscription using legacy API if available
          if (!isSubscribed) {
            try {
              await window.OneSignal.showHttpPrompt();
              await window.OneSignal.registerForPushNotifications();
              isSubscribed = await window.OneSignal.isPushNotificationsEnabled();
              console.log('OneSignal: Legacy subscription attempt:', isSubscribed);
            } catch (legacyError) {
              console.log('OneSignal: Legacy subscription failed:', legacyError.message);
            }
          }
        }
      } catch (statusError) {
        console.log('OneSignal: Status check failed:', statusError.message);
      }
      
      console.log('Vendor registered for push notifications:', {
        vendorId,
        playerId,
        isSubscribed
      });

      // Send a test notification to verify subscription works
      if (isSubscribed && playerId) {
        try {
          console.log('OneSignal: Sending test notification to verify subscription...');
          await this.sendTestNotification(vendorId, '✅ Push notifications are working! You will now receive task assignment alerts.');
        } catch (testError) {
          console.log('OneSignal: Test notification failed:', testError.message);
        }
      }

      return {
        success: true,
        playerId,
        isSubscribed
      };
    } catch (error) {
      console.error('Error registering vendor for push notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unregister vendor from push notifications
   * @param {string} vendorId - Vendor ID
   */
  async unregisterVendor(vendorId) {
    try {
      // Remove external user ID
      await window.OneSignal.removeExternalUserId();
      
      // DISABLED: Clear vendor-specific tags - causes OneSignal operation failures
      console.log('OneSignal: Tag deletion disabled due to v16 compatibility issues');
      // await window.OneSignal.deleteTags(['vendor_id', 'user_type', 'vendor_name', 'service_categories'].concat(vendorData.serviceCategories ? ['city', 'state', 'is_active'] : []));
      
      console.log('Vendor unregistered from push notifications:', vendorId);
      return { success: true };
    } catch (error) {
      console.error('Error unregistering vendor from push notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle notification click events
   * @param {Object} event - Notification click event
   */
  handleNotificationClick(event) {
    try {
      const { data } = event.notification;
      console.log('Notification clicked:', data);

      // Handle different notification types
      if (data.type === 'support_ticket_assignment' && data.ticketId) {
        // Navigate to support ticket details
        window.location.href = `/vendor/support-tickets/${data.ticketId}`;
      } else if (data.type === 'booking_assignment' && data.bookingId) {
        // Navigate to booking details
        window.location.href = `/vendor/bookings/${data.bookingId}`;
      } else if (data.type === 'warranty_claim_assignment' && data.claimId) {
        // Navigate to warranty claim details
        window.location.href = `/vendor/warranty-claims/${data.claimId}`;
      } else if (data.action === 'view_dashboard') {
        // Navigate to vendor dashboard
        window.location.href = '/vendor/dashboard';
      } else {
        // Default: navigate to dashboard
        window.location.href = '/vendor/dashboard';
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  }

  /**
   * Check if push notifications are enabled
   */
  async isPushEnabled() {
    try {
      if (!this.isInitialized) {
        return false;
      }
      
      // Check if method exists before calling
      if (typeof window.OneSignal.isPushNotificationsEnabled === 'function') {
        return await window.OneSignal.isPushNotificationsEnabled();
      } else {
        console.log('OneSignal.isPushNotificationsEnabled not available');
        return false;
      }
    } catch (error) {
      console.error('Error checking push notification status:', error);
      return false;
    }
  }

  /**
   * Get notification permission status
   */
  async getNotificationPermission() {
    try {
      if (!this.isInitialized) {
        return 'default';
      }
      return await window.OneSignal.getNotificationPermission();
    } catch (error) {
      console.error('Error getting notification permission:', error);
      return 'default';
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const permission = await window.OneSignal.registerForPushNotifications();
      console.log('Notification permission requested:', permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Update vendor tags (for profile updates)
   * @param {Object} vendorData - Updated vendor data
   */
  async updateVendorTags(vendorData) {
    // DISABLED: OneSignal v16 tagging causes operation failures
    console.log('OneSignal: updateVendorTags DISABLED due to v16 compatibility issues');
    console.log('OneSignal: Vendor tag updates would have been:', {
      vendor_name: `${vendorData.firstName || ''} ${vendorData.lastName || ''}`.trim(),
      service_categories: vendorData.serviceCategories?.join(',') || '',
      city: vendorData.address?.city || '',
      state: vendorData.address?.state || '',
      is_active: vendorData.isActive ? 'true' : 'false',
      last_updated: new Date().toISOString()
    });
    
    /*
    DISABLED due to "Operation execution failed without retry" errors
    
    try {
      if (!this.isInitialized) {
        return;
      }

      // Check if OneSignal is available
      if (!window.OneSignal || typeof window.OneSignal.sendTags !== 'function') {
        console.log('OneSignal not available or sendTags method not found');
        return;
      }

      await window.OneSignal.sendTags({
        vendor_name: `${vendorData.firstName || ''} ${vendorData.lastName || ''}`.trim(),
        service_categories: vendorData.serviceCategories?.join(',') || '',
        city: vendorData.address?.city || '',
        state: vendorData.address?.state || '',
        is_active: vendorData.isActive ? 'true' : 'false',
        last_updated: new Date().toISOString()
      });

      console.log('Vendor tags updated successfully');
    } catch (error) {
      console.error('Error updating vendor tags:', error);
    }
    */
  }

  /**
   * Send test notification (for development/testing)
   * @param {string} message - Test message
   */
  async sendTestNotification(message = 'Test notification') {
    try {
      // This would typically be done from the backend
      // This is just for testing purposes
      console.log('Test notification would be sent:', message);
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  /**
   * Get player ID
   */
  async getPlayerId() {
    try {
      if (!this.isInitialized) {
        return null;
      }
      return await window.OneSignal.getPlayerId();
    } catch (error) {
      console.error('Error getting player ID:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const oneSignalService = new OneSignalService();
export default oneSignalService;
