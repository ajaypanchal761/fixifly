import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ClipboardList, DollarSign, Headphones, User, Lock } from 'lucide-react';
import { useVendor } from '@/contexts/VendorContext';

const VendorBottomNav = () => {
  const location = useLocation();
  const { vendor } = useVendor();

  // Check if vendor has made the initial deposit - once deposit is made, always show Yes
  const hasInitialDeposit = vendor?.wallet?.hasInitialDeposit || 
                           (vendor?.wallet?.currentBalance >= 4000) ||
                           (vendor?.wallet?.totalDeposits > 0);

  const navItems = [
    { 
      name: "Task", 
      href: "/vendor", 
      icon: ClipboardList, 
      requiresDeposit: true 
    },
    { 
      name: "Earning", 
      href: "/vendor/earnings", 
      icon: DollarSign, 
      requiresDeposit: false 
    },
    { 
      name: "Support", 
      href: "/vendor/support", 
      icon: Headphones, 
      requiresDeposit: false 
    },
    { 
      name: "Profile", 
      href: "/vendor/profile", 
      icon: User, 
      requiresDeposit: true 
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[9999] md:hidden shadow-lg" style={{ bottom: '-6px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
      {/* White space below navigation */}
      <div className="absolute top-full left-0 right-0 h-5 bg-white"></div>
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.href;
          const isDisabled = item.requiresDeposit && !hasInitialDeposit;
          
          return (
            <div key={item.name} className="relative">
              {isDisabled ? (
                <div className="flex flex-col items-center py-2 px-3 rounded-lg opacity-50 cursor-not-allowed">
                  <div className="relative">
                    <IconComponent 
                      size={20} 
                      className="mb-1 text-gray-400"
                    />
                    <Lock 
                      size={12} 
                      className="absolute -top-1 -right-1 text-gray-400"
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-400">
                    {item.name}
                  </span>
                </div>
              ) : (
                <Link
                  to={item.href}
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 ${
                    isActive 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent 
                    size={20} 
                    className={`mb-1 ${isActive ? 'text-blue-600' : 'text-gray-600'}`}
                  />
                  <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                    {item.name}
                  </span>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VendorBottomNav;
