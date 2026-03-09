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
  wallet?: {
    currentBalance: number;
    hasInitialDeposit: boolean;
    initialDepositAmount: number;
    totalDeposits: number;
    totalWithdrawals: number;
    securityDeposit: number;
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
    // During hot reload, context might not be available yet
    // Return a safe default instead of throwing to prevent app crashes
    if (import.meta.env.DEV) {
      console.warn('useVendor called outside VendorProvider - using default values (this may happen during hot reload)');
      return {
        vendor: null,
        isAuthenticated: false,
        login: async () => { },
        logout: async () => { },
        updateVendor: async () => { },
        refreshVendor: async () => { },
        isLoading: true,
      } as VendorContextType;
    }
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
              totalWithdrawals: 0,
              securityDeposit: 0
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

    // Set a timeout to force loading to stop after 1.5 seconds (safety net for localStorage read)
    // localStorage reads are instant, but timeout ensures app loads even if something goes wrong
    // Reduced from 2 seconds to 1.5 seconds for faster app startup
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ VendorContext: Loading timeout reached, forcing loading to stop');
      setIsLoading(false);
    }, 1500);

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
        totalWithdrawals: 0,
        securityDeposit: 0
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

        // Try to get FCM token from Flutter bridge with retries
        const getFCMTokenFromFlutter = (retryCount = 0, maxRetries = 3): Promise<string | null> => {
          return new Promise((resolve) => {
            try {
              // Check if Flutter bridge is available
              if (typeof (window as any).flutter_inappwebview !== 'undefined') {
                // Flutter InAppWebView
                console.log(`📱 [Vendor] Attempting to get FCM token from Flutter bridge (attempt ${retryCount + 1}/${maxRetries + 1})...`);
                (window as any).flutter_inappwebview.callHandler('getFCMToken')
                  .then((token: string) => {
                    if (token) {
                      console.log('✅ [Vendor] FCM token retrieved from Flutter bridge:', token.substring(0, 30) + '...');
                      resolve(token);
                    } else {
                      console.warn('⚠️ [Vendor] Flutter bridge returned null/empty token');
                      if (retryCount < maxRetries) {
                        setTimeout(() => resolve(getFCMTokenFromFlutter(retryCount + 1, maxRetries)), 2000);
                      } else {
                        resolve(null);
                      }
                    }
                  })
                  .catch((error: any) => {
                    console.warn(`⚠️ [Vendor] Flutter bridge call failed (attempt ${retryCount + 1}):`, error);
                    if (retryCount < maxRetries) {
                      setTimeout(() => resolve(getFCMTokenFromFlutter(retryCount + 1, maxRetries)), 2000);
                    } else {
                      resolve(null);
                    }
                  });
              } else if (typeof (window as any).Android !== 'undefined') {
                // Android WebView
                console.log('📱 [Vendor] Attempting to get FCM token from Android bridge...');
                const token = (window as any).Android.getFCMToken();
                if (token) {
                  console.log('✅ [Vendor] FCM token retrieved from Android bridge:', token.substring(0, 30) + '...');
                  resolve(token);
                } else {
                  console.warn('⚠️ [Vendor] Android bridge returned null/empty token');
                  if (retryCount < maxRetries) {
                    setTimeout(() => resolve(getFCMTokenFromFlutter(retryCount + 1, maxRetries)), 2000);
                  } else {
                    resolve(null);
                  }
                }
              } else {
                // Try to get from localStorage (if Flutter saved it)
                const savedToken = localStorage.getItem('fcmToken');
                if (savedToken) {
                  console.log('✅ [Vendor] FCM token found in localStorage:', savedToken.substring(0, 30) + '...');
                  resolve(savedToken);
                } else {
                  console.log('📱 [Vendor] Listening for FCM token from Flutter...');
                  // Listen for token from Flutter
                  let messageListener: ((event: MessageEvent) => void) | null = null;
                  const timeout = setTimeout(() => {
                    if (messageListener) {
                      window.removeEventListener('message', messageListener);
                    }
                    if (retryCount < maxRetries) {
                      console.log(`⏳ [Vendor] FCM token not received, retrying (${retryCount + 1}/${maxRetries})...`);
                      resolve(getFCMTokenFromFlutter(retryCount + 1, maxRetries));
                    } else {
                      console.warn('⚠️ [Vendor] FCM token not received after all retries');
                      resolve(null);
                    }
                  }, 5000); // Increased timeout to 5 seconds

                  messageListener = function (event: MessageEvent) {
                    if (event.data && event.data.type === 'FCM_TOKEN') {
                      clearTimeout(timeout);
                      window.removeEventListener('message', messageListener!);
                      console.log('✅ [Vendor] FCM token received via message event:', event.data.token.substring(0, 30) + '...');
                      resolve(event.data.token);
                    }
                  };

                  window.addEventListener('message', messageListener);
                }
              }
            } catch (error) {
              console.error('❌ [Vendor] Error getting FCM token from Flutter:', error);
              if (retryCount < maxRetries) {
                setTimeout(() => resolve(getFCMTokenFromFlutter(retryCount + 1, maxRetries)), 2000);
              } else {
                resolve(null);
              }
            }
          });
        };

        getFCMTokenFromFlutter().then((fcmToken) => {
          const vendorEmail = vendorWithWallet.email;

          console.log('📱 [Vendor] FCM Token Save Check:', {
            hasToken: !!fcmToken,
            hasEmail: !!vendorEmail,
            tokenPreview: fcmToken ? fcmToken.substring(0, 30) + '...' : 'null',
            emailValue: vendorEmail || 'null'
          });

          if (fcmToken && vendorEmail) {
            saveMobileFCMToken(fcmToken, '', vendorEmail).then((success) => {
              if (success) {
                console.log('✅ Vendor mobile FCM token saved after login');
              } else {
                console.warn('⚠️ Failed to save vendor mobile FCM token after login');
              }
            }).catch((error) => {
              console.error('❌ Error saving vendor mobile FCM token after login:', error);
            });
          } else {
            const missingItems = [];
            if (!fcmToken) missingItems.push('FCM token');
            if (!vendorEmail) missingItems.push('email');
            console.warn(`⚠️ [Vendor] FCM token or email not available for mobile save. Missing: ${missingItems.join(', ')}`);

            // If we have email but no token, try one more time after delay
            if (vendorEmail && !fcmToken) {
              console.log('⏳ [Vendor] Retrying FCM token retrieval in 3 seconds...');
              setTimeout(() => {
                getFCMTokenFromFlutter(0, 2).then((retryToken) => {
                  if (retryToken && vendorEmail) {
                    saveMobileFCMToken(retryToken, '', vendorEmail).then((success) => {
                      if (success) {
                        console.log('✅ [Vendor] Mobile FCM token saved after retry');
                      }
                    });
                  }
                });
              }, 3000);
            }
          }
        });
      } else {
        // For web: Use web FCM token endpoint
        console.log('🌐 Detected web environment for vendor, using web FCM token endpoint');
        registerFCMToken(true).catch((error) => {
          console.error('Failed to register vendor FCM token after login:', error);
        });
      }
    }, 3000); // Wait 3 seconds for Flutter bridge to be ready (increased for APK)

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

  // Refresh vendor data from API - with timeout protection to prevent hanging
  const refreshVendor = async () => {
    try {
      const token = localStorage.getItem('vendorToken');
      if (!token || !vendor) {
        return;
      }

      console.log('🔄 VendorContext: Refreshing vendor data from API...');

      // Wrap API call in Promise.race with timeout to prevent hanging
      const refreshPromise = vendorApiService.getVendorProfile();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Refresh timeout after 25 seconds')), 25000);
      });

      const response = await Promise.race([refreshPromise, timeoutPromise]) as any;

      if (response.success && response.data?.vendor) {
        const updatedVendor = response.data.vendor;
        console.log('✅ VendorContext: Vendor data refreshed from API');
        console.log('Updated wallet data:', updatedVendor.wallet);

        // Only update if vendor ID hasn't changed (prevent infinite loops)
        if (updatedVendor.id === vendor.id) {
          // Update localStorage and state
          localStorage.setItem('vendorData', JSON.stringify(updatedVendor));
          setVendor(updatedVendor);
        } else {
          console.warn('⚠️ VendorContext: Vendor ID changed during refresh, skipping update to prevent loop');
        }

        return Promise.resolve();
      }
    } catch (error: any) {
      // Handle timeout and network errors - use cached data silently
      if (error?.message?.includes('timeout') ||
        error?.message?.includes('Request timeout') ||
        error?.message?.includes('Refresh timeout') ||
        error?.message?.includes('Network error') ||
        error?.message?.includes('Failed to fetch') ||
        error?.name === 'TypeError' ||
        error?.isNetworkError) {
        console.warn('⚠️ VendorContext: Refresh failed - using cached data:', error.message);
        // Don't throw - just use existing cached data
        return;
      }

      // Log other errors but don't break the app
      console.warn('⚠️ VendorContext: Error refreshing vendor data (non-critical):', error.message);

      // Don't throw error, just log it - this prevents breaking the app
      // The app will continue with cached data
    }
  };

  // Set up refresh when vendor is logged in (single refresh on mount + on notifications)
  // Use ref to track if refresh is in progress to prevent multiple simultaneous refreshes
  const isRefreshingRef = useRef(false);
  
  useEffect(() => {
    if (!vendor) {
      // Clear interval when vendor logs out
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      isRefreshingRef.current = false;
      return;
    }

    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Prevent multiple simultaneous refreshes
    if (isRefreshingRef.current) {
      console.log('⚠️ VendorContext: Refresh already in progress, skipping');
      return;
    }

    // Refresh in background after a short delay to avoid blocking initial render
    const refreshTimeoutId = setTimeout(() => {
      if (!isRefreshingRef.current) {
        isRefreshingRef.current = true;
        refreshVendor().finally(() => {
          isRefreshingRef.current = false;
        });
      }
    }, 100); // Small delay to let UI render first
    console.log('✅ VendorContext: Background refresh scheduled; UI loads instantly from cache');

    // Listen for account access granted notifications
    const handleAccountAccessGranted = (event: CustomEvent) => {
      console.log('🔄 VendorContext: Account access granted notification received');
      // Refresh vendor data immediately (but check if already refreshing)
      if (!isRefreshingRef.current) {
        isRefreshingRef.current = true;
        refreshVendor().finally(() => {
          isRefreshingRef.current = false;
        });
      }
    };

    // Listen for custom event
    window.addEventListener('accountAccessGranted' as any, handleAccountAccessGranted as EventListener);

    // Cleanup function
    return () => {
      clearTimeout(refreshTimeoutId);
      window.removeEventListener('accountAccessGranted' as any, handleAccountAccessGranted as EventListener);
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
