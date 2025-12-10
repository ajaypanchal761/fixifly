import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import vendorApiService from '@/services/vendorApi';

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

    // Set a timeout to force loading to stop after 5 seconds (safety net)
    const timeoutId = setTimeout(() => {
      console.warn('VendorContext: Loading timeout reached, forcing loading to stop');
      setIsLoading(false);
    }, 5000);

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

    // Vendor notifications will be handled via email/SMS only
    console.log('✅ VendorContext: Login completed - notifications via email/SMS only');
    
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
      const response = await vendorApiService.getVendorProfile();
      
      if (response.success && response.data?.vendor) {
        const updatedVendor = response.data.vendor;
        console.log('✅ VendorContext: Vendor data refreshed from API');
        console.log('Updated wallet data:', updatedVendor.wallet);
        
        // Update localStorage and state
        localStorage.setItem('vendorData', JSON.stringify(updatedVendor));
        setVendor(updatedVendor);
        
        return Promise.resolve();
      }
    } catch (error) {
      console.error('❌ VendorContext: Failed to refresh vendor data:', error);
      // Don't throw error, just log it
    }
  };

  // Set up periodic refresh when vendor is logged in
  useEffect(() => {
    if (vendor) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Refresh immediately on mount
      refreshVendor();

      // Set up periodic refresh every 15 seconds for instant access
      refreshIntervalRef.current = setInterval(() => {
        refreshVendor();
      }, 15000); // 15 seconds for faster updates

      console.log('✅ VendorContext: Periodic refresh enabled (every 15 seconds)');

      // Listen for account access granted notifications
      const handleAccountAccessGranted = (event: CustomEvent) => {
        console.log('🔄 VendorContext: Account access granted notification received');
        // Refresh vendor data immediately
        refreshVendor();
      };

      // Listen for custom event
      window.addEventListener('accountAccessGranted' as any, handleAccountAccessGranted as EventListener);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
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
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
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
