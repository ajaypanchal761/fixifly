import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import oneSignalService from '../services/oneSignalService';
import oneSignalInitializer from '../services/oneSignalInitializer';

interface ServiceLocation {
  _id: string;
  from: string;
  to: string;
  isActive: boolean;
  addedAt: string;
}

interface Vendor {
  id: string;
  vendorId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  serviceCategories: string[];
  customServiceCategory?: string;
  experience: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  };
  serviceLocations?: ServiceLocation[];
  profileImage?: string;
  specialty?: string;
  bio?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isProfileComplete: boolean;
  isApproved: boolean;
  isActive: boolean;
  isBlocked: boolean;
  rating: {
    average: number;
    count: number;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    cancelledTasks: number;
    totalEarnings: number;
    lastLoginAt?: string;
    joinedDate: string;
  };
  wallet: {
    currentBalance: number;
    hasInitialDeposit: boolean;
    initialDepositAmount: number;
    totalDeposits: number;
    totalWithdrawals: number;
  };
  preferences?: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    language: string;
    workingHours: {
      start: string;
      end: string;
    };
    workingDays: string[];
  };
}

interface VendorContextType {
  vendor: Vendor | null;
  isAuthenticated: boolean;
  login: (vendorData: Vendor, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateVendor: (vendorData: Partial<Vendor>) => Promise<void>;
  isLoading: boolean;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const useVendor = () => {
  const context = useContext(VendorContext);
  if (context === undefined) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};

interface VendorProviderProps {
  children: ReactNode;
}

export const VendorProvider: React.FC<VendorProviderProps> = ({ children }) => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // OneSignal will be initialized by App.tsx, we just need to wait for it
  useEffect(() => {
    // Simply log that VendorContext is loaded - OneSignal initialization is handled by App.tsx
    console.log('VendorContext: Loaded, OneSignal initialization handled by App.tsx');
  }, []);

  useEffect(() => {
    // Check if vendor is already logged in
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem('vendorToken');
        const vendorData = localStorage.getItem('vendorData');

        if (token && vendorData) {
          const parsedVendorData = JSON.parse(vendorData);
          // Ensure vendor has wallet data, set defaults if missing
          const vendorWithWallet = {
            ...parsedVendorData,
            wallet: parsedVendorData.wallet || {
              currentBalance: 0,
              hasInitialDeposit: false,
              initialDepositAmount: 0,
              totalDeposits: 0,
              totalWithdrawals: 0
            }
          };
          setVendor(vendorWithWallet);

          // Register for push notifications if not disabled (wait for App.tsx initialization)
          if (vendorWithWallet.preferences?.notifications?.push !== false) {
            setTimeout(async () => {
              // Wait for OneSignal to be initialized (by App.tsx)
              const OneSignalUtils = await import('../utils/oneSignalUtils');
              await OneSignalUtils.OneSignalUtils.waitForReady();
              
              // Check if OneSignal had IndexedDB errors or was force disabled
              if (window.OneSignalIndexedDBError || window.OneSignalForceDisabled) {
                console.log('OneSignal: Push notifications disabled due to IndexedDB error');
                console.log('OneSignal: Vendor will still receive notifications via email/SMS');
                
                // Use fallback notification service
                try {
                  const notificationFallback = await import('../services/notificationFallback');
                  await notificationFallback.default.registerVendor(vendorWithWallet.vendorId, vendorWithWallet);
                  console.log('✅ Vendor registered with fallback notification service');
                } catch (e) {
                  console.error('❌ Failed to register vendor with fallback service:', e);
                }
                return;
              }

              // Only register if OneSignal is not already initialized or in restricted mode
              oneSignalService.registerVendor(vendorWithWallet.vendorId, vendorWithWallet)
                .then((result) => {
                  if (result.success) {
                    console.log('Existing vendor registered for push notifications');
                  } else {
                    console.log('Existing vendor registration skipped:', result.error || 'OneSignal not available');
                  }
                })
                .catch(error => {
                  console.error('Error registering existing vendor for push notifications:', error);
                  // Check if it's an IndexedDB-related error
                  const errorMessage = error.message || error.toString();
                  if (errorMessage.includes('indexedDB.open') || errorMessage.includes('backing store')) {
                    console.warn('OneSignal: IndexedDB error detected - push notifications disabled for this session');
                    window.OneSignalIndexedDBError = true;
                  }
                });
            }, 2000); // Wait 2 seconds for OneSignal to initialize
          }
        }
      } catch (error) {
        console.error('Error checking vendor auth status:', error);
        // Clear invalid data
        localStorage.removeItem('vendorToken');
        localStorage.removeItem('vendorData');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (vendorData: Vendor, token: string) => {
    // Ensure vendor has wallet data, set defaults if missing
    const vendorWithWallet = {
      ...vendorData,
      wallet: vendorData.wallet || {
        currentBalance: 0,
        hasInitialDeposit: false,
        initialDepositAmount: 0,
        totalDeposits: 0,
        totalWithdrawals: 0
      }
    };
    
    localStorage.setItem('vendorToken', token);
    localStorage.setItem('vendorData', JSON.stringify(vendorWithWallet));
    setVendor(vendorWithWallet);

    // Register vendor for push notifications (wait for App.tsx initialization)
    try {
      if (vendorWithWallet.preferences?.notifications?.push !== false) {
        setTimeout(async () => {
          try {
            // Wait for OneSignal to be initialized (by App.tsx)
            const OneSignalUtils = await import('../utils/oneSignalUtils');
            await OneSignalUtils.OneSignalUtils.waitForReady();
            
            // Check if OneSignal had IndexedDB errors or was force disabled
            if (window.OneSignalIndexedDBError || window.OneSignalForceDisabled) {
              console.log('OneSignal: Push notifications disabled due to IndexedDB error');
              console.log('OneSignal: Vendor will still receive notifications via email/SMS');
              
              // Use fallback notification service
              try {
                const notificationFallback = await import('../services/notificationFallback');
                await notificationFallback.default.registerVendor(vendorWithWallet.vendorId, vendorWithWallet);
                console.log('✅ Vendor registered with fallback notification service');
              } catch (e) {
                console.error('❌ Failed to register vendor with fallback service:', e);
              }
              return;
            }

            // Register vendor for notifications
            await oneSignalService.registerVendor(vendorWithWallet.vendorId, vendorWithWallet);
            console.log('Vendor registered for push notifications');
          } catch (error) {
            console.error('Error registering vendor for push notifications:', error);
            // Check if it's an IndexedDB-related error
            const errorMessage = error.message || error.toString();
            if (errorMessage.includes('indexedDB.open') || errorMessage.includes('backing store')) {
              console.warn('OneSignal: IndexedDB error detected - push notifications disabled for this session');
              window.OneSignalIndexedDBError = true;
              
              // Set up fallback service immediately
              try {
                const notificationFallback = await import('../services/notificationFallback');
                await notificationFallback.default.initialize(`IndexedDB error: ${errorMessage}`);
                await notificationFallback.default.registerVendor(vendorWithWallet.vendorId, vendorWithWallet);
                console.log('✅ Fallback notification system activated due to IndexedDB error');
              } catch (fallbackError) {
                console.error('❌ Failed to initialize fallback service:', fallbackError);
              }
            }
          }
        }, 1000); // Wait 1 second for App.tsx to initialize OneSignal
      }
    } catch (error) {
      console.error('Error setting up vendor push notification registration:', error);
    }
  };

  const logout = async () => {
    // Unregister from push notifications
    try {
      if (vendor) {
        await oneSignalService.unregisterVendor(vendor.vendorId);
        console.log('Vendor unregistered from push notifications');
      }
    } catch (error) {
      console.error('Error unregistering vendor from push notifications:', error);
    }

    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorData');
    setVendor(null);
  };

  const updateVendor = async (updatedData: Partial<Vendor>) => {
    if (vendor) {
      const updatedVendor = { ...vendor, ...updatedData };
      localStorage.setItem('vendorData', JSON.stringify(updatedVendor));
      setVendor(updatedVendor);

      // Update OneSignal tags if vendor data changed
      try {
        // Use the new initializer service
        await oneSignalInitializer.updateVendorTags(updatedVendor);
      } catch (error) {
        // Fallback to old service if new one fails
        try {
          await oneSignalService.updateVendorTags(updatedVendor);
        } catch (fallbackError) {
          // Don't fail the vendor update if OneSignal fails
          console.error('Error updating OneSignal tags:', fallbackError);
          // Continue with the update - this is not critical
        }
      }
    }
  };

  const value: VendorContextType = {
    vendor,
    isAuthenticated: !!vendor,
    login,
    logout,
    updateVendor,
    isLoading,
  };

  return (
    <VendorContext.Provider value={value}>
      {children}
    </VendorContext.Provider>
  );
};
