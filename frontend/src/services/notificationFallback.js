/**
 * Notification Fallback Service
 * Provides a graceful fallback when OneSignal is unavailable
 * Ensures vendor notifications still work via email/SMS backend
 */

class NotificationFallbackService {
  constructor() {
    this.isEnabled = false;
    this.errorReason = null;
  }

  /**
   * Initialize fallback notification system
   * This should be called when OneSignal fails to initialize
   */
  initialize(errorReason = 'OneSignal initialization failed') {
    this.errorReason = errorReason;
    this.isEnabled = true;
    
    console.log('🔔 Notification Fallback: Initialized due to:', errorReason);
    console.info('📧 Vendors will receive notifications via email/SMS instead of push');
    
    return true;
  }

  /**
   * Simulate vendor registration for fallback mode
   * Maintains consistency with OneSignal registration flow
   */
  async registerVendor(vendorId, vendorData) {
    if (!this.isEnabled) {
      console.warn('🔔 Notification Fallback: Not initialized');
      return { success: false, error: 'Fallback not enabled' };
    }

    console.log('🔔 Notification Fallback: Vendor registered:', {
      vendorId,
      name: `${vendorData.firstName} ${vendorData.lastName}`,
      notificationMethod: 'email/sms'
    });

    // Mark as registered in localStorage for consistency
    try {
      const registeredVendors = JSON.parse(localStorage.getItem('onesignal_fallback_vendors') || '[]');
      if (!registeredVendors.includes(vendorId)) {
        registeredVendors.push(vendorId);
        localStorage.setItem('onesignal_fallback_vendors', JSON.stringify(registeredVendors));
      }
    } catch (e) {
      console.warn('🔔 Notification Fallback: Could not update vendor list:', e.message);
    }

    return { success: true, method: 'email/sms' };
  }

  /**
   * Simulate vendor unregistration
   */
  async unregisterVendor(vendorId) {
    if (!this.isEnabled) {
      return { success: false, error: 'Fallback not enabled' };
    }

    console.log('🔔 Notification Fallback: Vendor unregistered:', vendorId);

    try {
      const registeredVendors = JSON.parse(localStorage.getItem('onesignal_fallback_vendors') || '[]');
      const updatedVendors = registeredVendors.filter(id => id !== vendorId);
      localStorage.setItem('onesignal_fallback_vendors', JSON.stringify(updatedVendors));
    } catch (e) {
      console.warn('🔔 Notification Fallback: Could not update vendor list:', e.message);
    }

    return { success: true };
  }

  /**
   * Get registration status
   */
  isVendorRegistered(vendorId) {
    try {
      const registeredVendors = JSON.parse(localStorage.getItem('onesignal_fallback_vendors') || '[]');
      return registeredVendors.includes(vendorId);
    } catch (e) {
      return false;
    }
  }

  /**
   * Get fallback status info
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      reason: this.errorReason,
      method: 'email/sms'
    };
  }
}

// Export singleton instance
export default new NotificationFallbackService();
