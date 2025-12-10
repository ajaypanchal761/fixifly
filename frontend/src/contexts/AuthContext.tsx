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

    // Set a timeout to force loading to stop after 5 seconds (safety net)
    const timeoutId = setTimeout(() => {
      console.warn('AuthContext: Loading timeout reached, forcing loading to stop');
      setIsLoading(false);
    }, 5000);

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
    setTimeout(() => {
      if (isWebView) {
        // For webview/APK: Get FCM token from Flutter bridge and save using mobile endpoint
        console.log('📱 Detected webview/APK environment, using mobile FCM token endpoint');
        
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
          if (fcmToken && userData.phone) {
            // Clean phone number (remove +91 if present)
            const cleanPhone = userData.phone.replace(/\D/g, '').replace(/^91/, '');
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
            console.warn('⚠️ FCM token or phone not available for mobile save');
          }
        });
      } else {
        // For web: Use web FCM token endpoint
        console.log('🌐 Detected web environment, using web FCM token endpoint');
        registerFCMToken(true).catch((error) => {
          console.error('Failed to register FCM token after login:', error);
        });
      }
    }, 2000); // Wait 2 seconds for Flutter bridge to be ready
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
      const response = await apiService.getUserProfile();
      
      if (response.success && response.data?.user) {
        const freshUserData = response.data.user;
        console.log('AuthContext: Refreshing user data from backend:', freshUserData);
        console.log('AuthContext: Fresh address data:', freshUserData.address);
        setUser(freshUserData);
        localStorage.setItem('userData', JSON.stringify(freshUserData));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
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
