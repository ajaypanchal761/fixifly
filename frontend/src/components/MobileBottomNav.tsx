import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Calendar, Wrench, Phone } from 'lucide-react';

const MobileBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Booking", href: "/booking", icon: Calendar },
    { name: "AMC", href: "/amc", icon: Wrench },
    { name: "Support", href: "/support", icon: Phone },
  ];

  return (
    <>
      {/* White background to cover the gap below navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-6 bg-white z-[59] md:hidden"></div>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[60] md:hidden shadow-lg" style={{ bottom: '24px' }}>
        {/* White space below navigation */}
        <div className="absolute top-full left-0 right-0 h-5 bg-white"></div>
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.href;
          
          if (item.isExternal) {
            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              >
                <IconComponent 
                  size={20} 
                  className="mb-1 text-gray-600"
                />
                <span className="text-xs font-medium text-gray-600">
                  {item.name}
                </span>
              </a>
            );
          }
          
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
     </>
   );
 };

export default MobileBottomNav;
