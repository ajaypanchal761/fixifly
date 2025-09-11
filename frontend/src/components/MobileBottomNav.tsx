import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Calendar, Wrench, Phone, Store } from 'lucide-react';

const MobileBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Booking", href: "/booking", icon: Calendar },
    { name: "AMC", href: "/amc", icon: Wrench },
    { name: "Support", href: "/support", icon: Phone },
    { name: "Shop", href: "/shop", icon: Store },
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

export default MobileBottomNav;
