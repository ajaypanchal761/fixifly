import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import vendorApiService from '@/services/vendorApi';
import { registerFCMToken, saveMobileFCMToken } from '@/services/pushNotificationService';

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
  refreshVendor: () => Promise<void>;
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
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // VendorContext loaded - notifications will be handled via push notifications
    console.log('VendorContext: Loaded - push notifications enabled');
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

          // Vendor notifications will be handled via push notifications
          console.log('Vendor logged in - push notifications enabled');
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

    // Set a timeout to force loading to stop after 2 seconds (safety net for faster loading)
    const timeoutId = setTimeout(() => {
      console.warn('VendorContext: Loading timeout reached, forcing loading to stop');
      setIsLoading(false);
    }, 2000);

    checkAuthStatus();

    // Cleanup timeout
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const login = async (vendorData: Vendor, token: string) => {
    console.log('🔄 VendorContext: Login function called');
    
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
    
    console.log('🔄 VendorContext: Setting vendor token and data...');
    
    // APK-safe localStorage access
    try {
      localStorage.setItem('vendorToken', token);
      localStorage.setItem('vendorData', JSON.stringify(vendorWithWallet));
      console.log('✅ VendorContext: localStorage updated');
    } catch (error) {
      console.error('❌ VendorContext: localStorage failed:', error);
      // Continue anyway - state will be updated
    }
    
    console.log('🔄 VendorContext: Updating vendor state...');
    setVendor(vendorWithWallet);
    console.log('✅ VendorContext: Vendor state updated, vendorId:', vendorWithWallet.vendorId);

    // Register FCM token after successful login
    setTimeout(() => {
      const isWebView = (() => {
        try {
          return /wv|WebView/.test(navigator.userAgent) || 
                 window.matchMedia('(display-mode: standalone)').matches ||
                 (typeof window !== 'undefined' && (window as any).flutter_inappwebview !== undefined) ||
                 (typeof window !== 'undefined' && (window as any).Android !== undefined);
        } catch (error) {
          console.error('Error detecting webview:', error);
          return false;
        }
      })();
      
      if (isWebView) {
        // For webview/APK: Get FCM token from Flutter bridge and save using mobile endpoint
        console.log('📱 Detected webview/APK environment for vendor, using mobile FCM token endpoint');
        
        // Try to get FCM token from Flutter bridge
        const getFCMTokenFromFlutter = (): Promise<string | null> => {
          return new Promise((resolve) => {
            try {
              // Check if Flutter bridge is available
              if (typeof (window as any).flutter_inappwebview !== 'undefined') {
                // Flutter InAppWebView
                (window as any).flutter_inappwebview.callHandler('getFCMToken').then((token: string) => {
                  resolve(token);
                }).catch(() => {
                  resolve(null);
                });
              } else if (typeof (window as any).Android !== 'undefined') {
                // Android WebView
                const token = (window as any).Android.getFCMToken();
                resolve(token || null);
              } else {
                // Try to get from localStorage (if Flutter saved it)
                const savedToken = localStorage.getItem('fcmToken');
                if (savedToken) {
                  resolve(savedToken);
                } else {
                  // Listen for token from Flutter
                  window.addEventListener('message', function(event) {
                    if (event.data && event.data.type === 'FCM_TOKEN') {
                      resolve(event.data.token);
                    }
                  });
                  // Timeout after 3 seconds
                  setTimeout(() => resolve(null), 3000);
                }
              }
            } catch (error) {
              console.error('Error getting FCM token from Flutter:', error);
              resolve(null);
            }
          });
        };
        
        getFCMTokenFromFlutter().then((fcmToken) => {
          if (fcmToken && vendorWithWallet.email) {
            saveMobileFCMToken(fcmToken, '', vendorWithWallet.email).then((success) => {
              if (success) {
                console.log('✅ Vendor mobile FCM token saved after login');
              } else {
                console.warn('⚠️ Failed to save vendor mobile FCM token after login');
              }
            }).catch((error) => {
              console.error('❌ Error saving vendor mobile FCM token after login:', error);
            });
          } else {
            console.warn('⚠️ FCM token or email not available for vendor mobile save');
          }
        });
      } else {
        // For web: Use web FCM token endpoint
        console.log('🌐 Detected web environment for vendor, using web FCM token endpoint');
        registerFCMToken(true).catch((error) => {
          console.error('Failed to register vendor FCM token after login:', error);
        });
      }
    }, 2000); // Wait 2 seconds for Flutter bridge to be ready
    
    // In APK, ensure state is fully updated before resolving
    const isAPK = /wv|WebView/.test(navigator.userAgent) || 
                  window.matchMedia('(display-mode: standalone)').matches;
    
    if (isAPK) {
      // Give APK webview time to sync state
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('📱 APK: State sync delay completed');
    }
    
    // Return a promise that resolves immediately (for await support)
    return Promise.resolve();
  };

  const logout = async () => {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorData');
    setVendor(null);
    console.log('Vendor logged out');
  };

  const updateVendor = async (updatedData: Partial<Vendor>) => {
    if (vendor) {
      console.log('VendorContext: Updating vendor data with:', updatedData);
      const updatedVendor = { ...vendor, ...updatedData };
      console.log('VendorContext: Updated vendor object:', updatedVendor);
      localStorage.setItem('vendorData', JSON.stringify(updatedVendor));
      setVendor(updatedVendor);

      // Vendor data updated - notifications via email/SMS only
      console.log('VendorContext: Vendor data updated successfully');
    } else {
      console.log('VendorContext: No vendor found to update');
    }
  };

  // Refresh vendor data from API
  const refreshVendor = async () => {
    try {
      const token = localStorage.getItem('vendorToken');
      if (!token || !vendor) {
        return;
      }

      console.log('🔄 VendorContext: Refreshing vendor data from API...');
      
      // Add timeout wrapper to prevent hanging (reduced to 5 seconds for faster failure)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Refresh timeout: Request took too long')), 5000);
      });
      
      const response = await Promise.race([
        vendorApiService.getVendorProfile(),
        timeoutPromise
      ]) as any;
      
      if (response.success && response.data?.vendor) {
        const updatedVendor = response.data.vendor;
        console.log('✅ VendorContext: Vendor data refreshed from API');
        console.log('Updated wallet data:', updatedVendor.wallet);
        
        // Update localStorage and state
        localStorage.setItem('vendorData', JSON.stringify(updatedVendor));
        setVendor(updatedVendor);
        
        return Promise.resolve();
      }
    } catch (error: any) {
      console.error('❌ VendorContext: Failed to refresh vendor data:', error);
      
      // Handle timeout errors specifically
      if (error?.message?.includes('timeout') || error?.message?.includes('Request timeout')) {
        console.warn('⚠️ Refresh timeout - request took too long. Using cached data.');
        // Don't throw - just use existing data
        return;
      }
      
      // If it's a network error, don't spam the console with repeated errors
      if (error?.isNetworkError) {
        console.warn('⚠️ Network error detected - backend might be down. Using cached data.');
      }
      
      // Don't throw error, just log it - this prevents breaking the app
      // The app will continue with cached data
    }
  };

  // Set up refresh when vendor is logged in (single refresh on mount + on notifications)
  useEffect(() => {
    if (vendor) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Refresh in background after a short delay to avoid blocking initial render
      setTimeout(() => {
        refreshVendor();
      }, 100); // Small delay to let UI render first
      console.log('✅ VendorContext: Background refresh scheduled; UI loads instantly from cache');

      // Listen for account access granted notifications
      const handleAccountAccessGranted = (event: CustomEvent) => {
        console.log('🔄 VendorContext: Account access granted notification received');
        // Refresh vendor data immediately
        refreshVendor();
      };

      // Listen for custom event
      window.addEventListener('accountAccessGranted' as any, handleAccountAccessGranted as EventListener);

      return () => {
        window.removeEventListener('accountAccessGranted' as any, handleAccountAccessGranted as EventListener);
      };
    } else {
      // Clear interval when vendor logs out
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
    };
  }, [vendor?.id]); // Only depend on vendor ID to avoid infinite loops

  const value: VendorContextType = {
    vendor,
    isAuthenticated: !!vendor,
    login,
    logout,
    updateVendor,
    refreshVendor,
    isLoading,
  };

  return (
    <VendorContext.Provider value={value}>
      {children}
    </VendorContext.Provider>
  );
};
