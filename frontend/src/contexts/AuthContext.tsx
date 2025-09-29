import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

    checkAuthStatus();
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
    setToken(token);
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
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
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
    checkTokenValidity,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
