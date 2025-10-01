import React, { useEffect, useState } from 'react';
import oneSignalConfig from '../config/oneSignalConfig';

interface OneSignalFallbackProps {
  children: React.ReactNode;
}

const OneSignalFallback: React.FC<OneSignalFallbackProps> = ({ children }) => {
  const [isDomainAllowed, setIsDomainAllowed] = useState(false);
  const [currentDomain, setCurrentDomain] = useState('');

  useEffect(() => {
    const domain = oneSignalConfig.getCurrentDomain();
    const allowed = oneSignalConfig.isDomainAllowed();
    
    setCurrentDomain(domain);
    setIsDomainAllowed(allowed);

    if (!allowed) {
      console.warn('OneSignal not available on this domain:', domain);
      console.log('To enable OneSignal, use one of these domains:', oneSignalConfig.allowedDomains);
    }
  }, []);

  // Show a development notice if OneSignal is not available
  if (!isDomainAllowed && oneSignalConfig.isDevelopment()) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Development Notice */}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Development Mode:</strong> OneSignal push notifications are not available on this domain.
                <br />
                <strong>Current domain:</strong> {currentDomain}
                <br />
                <strong>Allowed domains:</strong> {oneSignalConfig.allowedDomains.join(', ')}
                <br />
                <strong>Note:</strong> Push notifications will work on production domains (fixifly.vercel.app, fixifly.com)
              </p>
            </div>
          </div>
        </div>
        
        {/* Render the actual app */}
        {children}
      </div>
    );
  }

  // For production domains, just render the app normally
  return <>{children}</>;
};

export default OneSignalFallback;
