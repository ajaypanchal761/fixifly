/**
 * OneSignal Environment Detector
 * Detects browser environments that will cause IndexedDB errors
 * Sets global flags to prevent OneSignal initialization
 */

(function() {
  'use strict';

  // Check for problematic environments BEFORE OneSignal loads
  function detectProblematicEnvironment() {
    try {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        console.warn('🚫 OneSignal: IndexedDB not available - preventing initialization');
        return 'indexeddb_unavailable';
      }

      // Check user agent for private browsing indicators
      const userAgent = navigator.userAgent.toLowerCase();
      const isPrivateAgent = userAgent.includes('private') || userAgent.includes('incognito');
      
      if (isPrivateAgent) {
        console.warn('🚫 OneSignal: Private browsing detected via user agent');
        return 'private_browsing';
      }

      // Try a minimal IndexedDB test
      try {
        const testRequest = indexedDB.open('detection-test');
        let errorDetected = false;
        
        testRequest.onerror = () => {
          errorDetected = true;
          console.warn('🚫 OneSignal: IndexedDB open failed during detection');
        };
        
        testRequest.onsuccess = () => {
          try {
            testRequest.result.close();
            indexedDB.deleteDatabase('detection-test');
          } catch (e) {
            // Cleanup failed - likely restricted
          }
        };

        // Small delay to catch immediate errors
        setTimeout(() => {
          if (errorDetected) {
            window.OneSignalIndexedDBError = true;
            console.warn('🚫 OneSignal: IndexedDB capability test failed');
          }
        }, 50);

      } catch (e) {
        console.warn('🚫 OneSignal: IndexedDB test threw error:', e.message);
        return 'indexeddb_blocked';
      }

      // Check for other problematic environments
      if (window.opener && window.opener.location && window.opener.location.href.includes('chrome-extension://')) {
        console.warn('🚫 OneSignal: Chrome extension environment detected');
        return 'chrome_extension';
      }

      return null; // Environment looks good

    } catch (error) {
      console.warn('🚫 OneSignal: Environment detection failed:', error.message);
      return 'detection_error';
    }
  }

  // Run detection immediately
  const problematicReason = detectProblematicEnvironment();
  
  if (problematicReason) {
    console.warn(`🚫 OneSignal: Disabled due to ${problematicReason}`);
    window.OneSignalIndexedDBError = true;
    window.OneSignalForceDisabled = true;
    console.info('📧 Email/SMS notifications will be used instead');
  } else {
    console.info('✅ OneSignal: Environment looks good for initialization');
  }
})();
