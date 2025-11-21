import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

    checkAuthStatus();
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
