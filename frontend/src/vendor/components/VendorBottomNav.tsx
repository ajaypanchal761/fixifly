import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ClipboardList, DollarSign, Headphones, Store } from 'lucide-react';

const VendorBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { name: "Task", href: "/vendor", icon: ClipboardList },
    { name: "Earning", href: "/vendor/earnings", icon: DollarSign },
    { name: "Support", href: "/vendor/support", icon: Headphones },
    { name: "Shop", href: "/vendor/shop", icon: Store },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[9999] md:hidden shadow-lg">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
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
          );
        })}
      </div>
    </div>
  );
};

export default VendorBottomNav;
