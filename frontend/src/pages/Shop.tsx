import React from 'react';
import { ShoppingBag, Bell } from 'lucide-react';

const Shop = () => {
  return (
    <div className="relative overflow-hidden h-[84vh] bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden h-[84vh] md:h-screen flex items-start justify-center pt-16 md:items-center md:pt-0">
        <div className="relative overflow-hidden h-[84vh] absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 "></div>
        <div className="relative overflow-hidden h-[84vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 md:pt-24">
          <div className="text-center ">
             {/* Coming Soon Badge - Moved to top */}
             <div className="flex justify-center mb-6">
               <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium shadow-lg">
                 Coming Soon
               </div>
             </div>
             
             {/* Main Icon */}
             <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 shadow-lg">
               <ShoppingBag className="w-12 h-12 text-white" />
             </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Fixfly
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Shop
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Get ready for an amazing shopping experience! We're building something special 
              where you can find all your appliance needs, spare parts, and accessories in one place.
            </p>
            
            {/* Notify Me Button */}
            <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              <Bell className="w-5 h-5 mr-2" />
              Notify Me When Ready
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Shop;
