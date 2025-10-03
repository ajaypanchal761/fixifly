// Centralized OneSignal initialization utility


// Import environment detector that runs BEFORE OneSignal loads







import './oneSignalDetector';

export class OneSignalUtils {
  private static initializationPromise: Promise<boolean> | null = null;
  private static isInitialized = false;

  /**
   * Set up global error handler for OneSignal IndexedDB errors
   */
  private static setupGlobalErrorHandler(): void {
    // Handle unhandled promises that might contain IndexedDB errors
    const originalConsoleError = console.error;
    console.error = function(...args: any[]) {
      // Check if it's an IndexedDB error from OneSignal
      const message = args.join(' ').toLowerCase();
      if (message.includes('indexeddb') || message.includes('backing store')) {
        console.warn('🚨 OneSignal: Detected IndexedDB error in console - setting error flag');
        window.OneSignalIndexedDBError = true;
      }
      // Call original console.error
      originalConsoleError.apply(console, args);
    };

    // Handle uncaught promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const errorMessage = (event.reason?.message || event.reason || '').toString();
      if (errorMessage.includes('indexedDB.open') || errorMessage.includes('backing store')) {
        console.warn('🚨 OneSignal: Detected IndexedDB error in unhandled promise rejection');
        window.OneSignalIndexedDBError = true;
        event.preventDefault(); // Prevent the error from crashing the app
      }
    });
  }

  /**
   * Check if browser has proper storage capabilities for OneSignal
   * This prevents IndexedDB errors in incognito mode, restricted browsers, etc.
   */
  private static _checkBrowserStorageCapabilities(): boolean {
    try {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        console.warn('🚫 OneSignal: IndexedDB not available - browser in restricted mode');
        return false;
      }

      // Check if we're in incognito/private browsing mode
      const userAgent = navigator.userAgent.toLowerCase();
      const isPrivateBrowsing = userAgent.includes('private') || userAgent.includes('incognito');
      
      if (isPrivateBrowsing) {
        console.warn('🚫 OneSignal: Private/incognito browsing detected - IndexedDB will fail');
        return false;
      }

      // Check storage quota (incognito mode often has limited storage)
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(quota => {
          if (quota.quota < 1000000) { // Less than 1MB available
            console.warn('🚫 OneSignal: Storage quota insufficient:', quota.quota);
            return false;
          }
        }).catch(() => {
          console.warn('🚫 OneSignal: Could not check storage quota');
          return false;
        });
      }

      return true;
    } catch (error) {
      console.warn('🚫 OneSignal: Browser capability check failed:', error.message);
      return false;
    }
  }

  /**
   * Initialize OneSignal once for the entire app
   * This should be called by App.tsx and nowhere else
   */
  static async initialize(): Promise<boolean> {
    // Return existing promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return true immediately if already initialized
    if (this.isInitialized || window.OneSignalInitialized) {
      this.isInitialized = true;
      return true;
    }

    // Create initialization promise
    this.initializationPromise = this._performInitialization();
    
    try {
      const result = await this.initializationPromise;
      this.isInitialized = result;
      return result;
    } catch (error) {
      this.initializationPromise = null;
      console.error('OneSignal initialization failed:', error);
      return false;
    }
  }

  private static async _performInitialization(): Promise<boolean> {
    try {
      // IMMEDIATE CHECK: If environment detector found issues, skip OneSignal entirely
      if (window.OneSignalForceDisabled) {
        console.warn('🚫 OneSignal: Completely disabled due to environment detection');
        window.OneSignalIndexedDBError = true;
        return false;
      }

      // Set up global error handler for IndexedDB errors first
      this.setupGlobalErrorHandler();
      
      // Check browser storage capabilities first
      if (!this._checkBrowserStorageCapabilities()) {
        console.warn('🚫 OneSignal: Browser storage capabilities insufficient - skipping push notifications');
        window.OneSignalIndexedDBError = true;
        return false;
      }
      
      // Wait for OneSignal SDK to load from CDN OR check if it was force-disabled
      if (typeof window.OneSignal === 'undefined') {
        await this._waitForOneSignal();
      }

      // Check if OneSignal was force-disabled by environment detection
      if (window.OneSignal && window.OneSignal.__FORCE_DISABLED) {
        console.warn('🚫 OneSignal: Detected force-disabled flag from environment detection');
        window.OneSignalIndexedDBError = true;
        return false;
      }

      // Check if already initialized
      if (window.OneSignal.isInitialized && typeof window.OneSignal.isInitialized === 'function' && window.OneSignal.isInitialized()) {
        console.log('OneSignal: Already initialized');
        window.OneSignalInitialized = true;
        return true;
      }

      // Initialize OneSignal with modern configuration
      try {
        await window.OneSignal.init({
          appId: '0e3861fd-d24e-4f93-a211-d64dfd966d17',
          notifyButton: {
            enable: false
          },
          allowLocalhostAsSecureOrigin: true,
          autoRegister: false, // Don't auto-register 
          autoResubscribe: true,
          notificationClickHandlerMatch: 'origin',
          // Prevent automatic welcome messages
          autoPromptForNotificationPermission: false,
          disableWelcomeNotification: true,
          // Modern OneSignal configuration
          safari_web_id: 'fixifly-vendor-notifications',
          path: '/',
          serviceWorkerParam: {
            scope: '/'
          }
        });

        window.OneSignalInitialized = true;
        console.log('OneSignal: Successfully initialized');
        return true;
        
      } catch (initError) {
        // Handle IndexedDB errors specifically during init
        const errorMessage = initError.message || initError.toString();
        
        if (errorMessage.includes('indexedDB.open') || errorMessage.includes('backing store')) {
          console.warn('OneSignal: IndexedDB initialization failed during init - continuing without push notifications');
          console.info('OneSignal: This is usually due to browser storage limitations or incognito mode');
          console.info('OneSignal: Vendor notifications will still work via SMS/email fallback');
          
          // Set global flag to prevent further initialization attempts
          window.OneSignalInitialized = false;
          window.OneSignalIndexedDBError = true;
          return false;
        }
        
        // Re-throw other errors to be caught by outer catch
        throw initError;
      }

    } catch (error) {
      console.error('OneSignal: Initialization error:', error);
      
      // Handle specific error cases
      const errorMessage = error.message || error.toString();
      
      // If it's an "already initialized" error, mark as initialized
      if (errorMessage.includes('already initialized')) {
        console.log('OneSignal: Already initialized (error recovery)');
        window.OneSignalInitialized = true;
        return true;
      }
      
      // Handle IndexedDB errors gracefully
      if (errorMessage.includes('indexedDB.open') || errorMessage.includes('backing store')) {
        console.warn('OneSignal: IndexedDB initialization failed - continuing without push notifications');
        console.info('OneSignal: This is usually due to browser storage limitations or incognito mode');
        console.info('OneSignal: Vendor notifications will still work via SMS/email fallback');
        
        // Set global flag to prevent further initialization attempts
        window.OneSignalInitialized = false;
        window.OneSignalIndexedDBError = true;
        return false;
      }
      
      throw error;
    }
  }

  private static async _waitForOneSignal(): Promise<void> {
    return new Promise((resolve) => {
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
          throw new Error('OneSignal failed to load from CDN');
        }
      }, 10000);
      
      checkOneSignal();
    });
  }

  /**
   * Check if OneSignal is ready to use
   */
  static isReady(): boolean {
    return this.isInitialized || window.OneSignalInitialized === true;
  }

  /**
   * Wait for OneSignal to be initialized (for other components/services)
   */
  static async waitForReady(): Promise<void> {
    if (this.isReady()) {
      return;
    }

    await this.initialize();
  }
}
