import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { registerFCMToken, saveMobileFCMToken } from '../services/pushNotificationService';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  profileImage?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUserData: () => Promise<void>;
  checkTokenValidity: () => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During hot reload, context might not be available yet
    // Return a safe default instead of throwing to prevent app crashes
    if (import.meta.env.DEV) {
      console.warn('useAuth called outside AuthProvider - using default values (this may happen during hot reload)');
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        login: () => {},
        logout: () => {},
        updateUser: () => {},
        refreshUserData: async () => {},
        checkTokenValidity: () => false,
        isLoading: true,
      } as AuthContextType;
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = () => {
      try {
        // Check for new token key first
        let token = localStorage.getItem('accessToken');
        let userData = localStorage.getItem('userData');

        // If not found, check for old token key (migration)
        if (!token) {
          const oldToken = localStorage.getItem('userToken');
          if (oldToken) {
            console.log('Migrating from old token key...');
            localStorage.setItem('accessToken', oldToken);
            localStorage.removeItem('userToken');
            token = oldToken;
          }
        }

        if (token && userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            setUser(parsedUserData);
            setToken(token);
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            // Clear invalid data
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userToken');
            localStorage.removeItem('userData');
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Clear invalid data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userToken'); // Clear old key too
        localStorage.removeItem('userData');
      } finally {
        setIsLoading(false);
      }
    };

    // Set a timeout to force loading to stop after 2 seconds (safety net for localStorage read)
    // localStorage reads are instant, but timeout ensures app loads even if something goes wrong
    const timeoutId = setTimeout(() => {
      console.warn('AuthContext: Loading timeout reached, forcing loading to stop');
      setIsLoading(false);
    }, 2000);

    checkAuthStatus();

    // Cleanup timeout
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
    setToken(token);
    
    // Detect if running in webview/APK
    const isWebView = (() => {
      try {
        // Check for webview user agent
        const userAgent = navigator.userAgent || '';
        const isWebViewUA = /wv|WebView/.test(userAgent);
        
        // Check for standalone mode (PWA)
        const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
        
        // Check for iOS standalone
        const isIOSStandalone = (window.navigator as any).standalone === true;
        
        // Check if Flutter bridge is available (for APK)
        const hasFlutterBridge = typeof (window as any).flutter_inappwebview !== 'undefined' || 
                                 typeof (window as any).Android !== 'undefined';
        
        return isWebViewUA || isStandalone || isIOSStandalone || hasFlutterBridge;
      } catch (error) {
        console.error('Error detecting webview:', error);
        return false;
      }
    })();
    
    // Register FCM token after successful login
    // Increase timeout to give Flutter bridge more time to initialize
    setTimeout(() => {
      if (isWebView) {
        // For webview/APK: Get FCM token from Flutter bridge and save using mobile endpoint
        console.log('📱 Detected webview/APK environment, using mobile FCM token endpoint');
        
        // Try to get FCM token from Flutter bridge with retries
        const getFCMTokenFromFlutter = (retryCount = 0, maxRetries = 3): Promise<string | null> => {
          return new Promise((resolve) => {
            try {
              // Check if Flutter bridge is available
              if (typeof (window as any).flutter_inappwebview !== 'undefined') {
                // Flutter InAppWebView
                console.log(`📱 Attempting to get FCM token from Flutter bridge (attempt ${retryCount + 1}/${maxRetries + 1})...`);
                (window as any).flutter_inappwebview.callHandler('getFCMToken')
                  .then((token: string) => {
                    if (token) {
                      console.log('✅ FCM token retrieved from Flutter bridge:', token.substring(0, 30) + '...');
                      resolve(token);
                    } else {
                      console.warn('⚠️ Flutter bridge returned null/empty token');
                      if (retryCount < maxRetries) {
                        setTimeout(() => resolve(getFCMTokenFromFlutter(retryCount + 1, maxRetries)), 2000);
                      } else {
                        resolve(null);
                      }
                    }
                  })
                  .catch((error: any) => {
                    console.warn(`⚠️ Flutter bridge call failed (attempt ${retryCount + 1}):`, error);
                    if (retryCount < maxRetries) {
                      setTimeout(() => resolve(getFCMTokenFromFlutter(retryCount + 1, maxRetries)), 2000);
                    } else {
                      resolve(null);
                    }
                  });
              } else if (typeof (window as any).Android !== 'undefined') {
                // Android WebView
                console.log('📱 Attempting to get FCM token from Android bridge...');
                const token = (window as any).Android.getFCMToken();
                if (token) {
                  console.log('✅ FCM token retrieved from Android bridge:', token.substring(0, 30) + '...');
                  resolve(token);
                } else {
                  console.warn('⚠️ Android bridge returned null/empty token');
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
                  console.log('✅ FCM token found in localStorage:', savedToken.substring(0, 30) + '...');
                  resolve(savedToken);
                } else {
                  console.log('📱 Listening for FCM token from Flutter...');
                  // Listen for token from Flutter
                  let messageListener: ((event: MessageEvent) => void) | null = null;
                  const timeout = setTimeout(() => {
                    if (messageListener) {
                      window.removeEventListener('message', messageListener);
                    }
                    if (retryCount < maxRetries) {
                      console.log(`⏳ FCM token not received, retrying (${retryCount + 1}/${maxRetries})...`);
                      resolve(getFCMTokenFromFlutter(retryCount + 1, maxRetries));
                    } else {
                      console.warn('⚠️ FCM token not received after all retries');
                      resolve(null);
                    }
                  }, 5000); // Increased timeout to 5 seconds
                  
                  messageListener = function(event: MessageEvent) {
                    if (event.data && event.data.type === 'FCM_TOKEN') {
                      clearTimeout(timeout);
                      window.removeEventListener('message', messageListener!);
                      console.log('✅ FCM token received via message event:', event.data.token.substring(0, 30) + '...');
                      resolve(event.data.token);
                    }
                  };
                  
                  window.addEventListener('message', messageListener);
                }
              }
            } catch (error) {
              console.error('❌ Error getting FCM token from Flutter:', error);
              if (retryCount < maxRetries) {
                setTimeout(() => resolve(getFCMTokenFromFlutter(retryCount + 1, maxRetries)), 2000);
              } else {
                resolve(null);
              }
            }
          });
        };
        
        getFCMTokenFromFlutter().then((fcmToken) => {
          // Get phone from userData or try to extract from user state
          const phoneNumber = userData.phone || (user ? user.phone : null);
          
          console.log('📱 FCM Token Save Check:', {
            hasToken: !!fcmToken,
            hasPhone: !!phoneNumber,
            tokenPreview: fcmToken ? fcmToken.substring(0, 30) + '...' : 'null',
            phoneValue: phoneNumber || 'null',
            userDataPhone: userData.phone || 'null',
            userPhone: user ? user.phone : 'null'
          });
          
          if (fcmToken && phoneNumber) {
            // Clean phone number (remove +91 if present)
            const cleanPhone = phoneNumber.replace(/\D/g, '').replace(/^91/, '');
            console.log(`💾 Saving FCM token for phone: ${cleanPhone}`);
            
            saveMobileFCMToken(fcmToken, cleanPhone).then((success) => {
              if (success) {
                console.log('✅ Mobile FCM token saved after login');
              } else {
                console.warn('⚠️ Failed to save mobile FCM token after login');
              }
            }).catch((error) => {
              console.error('❌ Error saving mobile FCM token after login:', error);
            });
          } else {
            const missingItems = [];
            if (!fcmToken) missingItems.push('FCM token');
            if (!phoneNumber) missingItems.push('phone number');
            console.warn(`⚠️ FCM token or phone not available for mobile save. Missing: ${missingItems.join(', ')}`);
            
            // If we have phone but no token, try one more time after delay
            if (phoneNumber && !fcmToken) {
              console.log('⏳ Retrying FCM token retrieval in 3 seconds...');
              setTimeout(() => {
                getFCMTokenFromFlutter(0, 2).then((retryToken) => {
                  if (retryToken && phoneNumber) {
                    const cleanPhone = phoneNumber.replace(/\D/g, '').replace(/^91/, '');
                    saveMobileFCMToken(retryToken, cleanPhone).then((success) => {
                      if (success) {
                        console.log('✅ Mobile FCM token saved after retry');
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
        console.log('🌐 Detected web environment, using web FCM token endpoint');
        registerFCMToken(true).catch((error) => {
          console.error('Failed to register FCM token after login:', error);
        });
      }
    }, 3000); // Wait 3 seconds for Flutter bridge to be ready (increased for APK)
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
    setUser(null);
    setToken(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      console.log('AuthContext: Updating user data:', updatedUser);
      console.log('AuthContext: Address data:', updatedUser.address);
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
    }
  };

  const refreshUserData = async () => {
    if (!token) return;
    
    try {
      // Import apiService dynamically to avoid circular dependency
      const { default: apiService } = await import('@/services/api');
      
      // Use API service directly - it has built-in timeout with AbortController
      const response = await apiService.getUserProfile();
      
      if (response.success && response.data?.user) {
        const freshUserData = response.data.user;
        console.log('AuthContext: Refreshing user data from backend:', freshUserData);
        console.log('AuthContext: Fresh address data:', freshUserData.address);
        setUser(freshUserData);
        localStorage.setItem('userData', JSON.stringify(freshUserData));
      }
    } catch (error: any) {
      // Handle authorization/user not found errors - clear invalid token and logout
      if (error?.message?.includes('Not authorized') || 
          error?.message?.includes('user not found') ||
          error?.message?.includes('User not found') ||
          error?.status === 401 ||
          error?.status === 404) {
        console.warn('⚠️ User not found or unauthorized - clearing invalid session');
        logout();
        return;
      }
      
      // Handle timeout and network errors - use cached data silently
      if (error?.message?.includes('timeout') || 
          error?.message?.includes('Request timeout') ||
          error?.message?.includes('Network error') ||
          error?.message?.includes('Failed to fetch')) {
        console.warn('⚠️ Refresh failed - using cached data:', error.message);
        // Don't throw - just use existing cached data
        return;
      }
      
      // For other errors, log but don't break the app
      // The app will continue with cached data
      console.warn('⚠️ Error refreshing user data (non-critical):', error.message);
    }
  };

  const checkTokenValidity = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    
    try {
      // Basic token format check (JWT tokens have 3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('Invalid token format');
        return false;
      }
      
      // Check if token is expired (basic check)
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        console.log('Token is expired');
        logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking token validity:', error);
      logout();
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    refreshUserData,
    checkTokenValidity,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
