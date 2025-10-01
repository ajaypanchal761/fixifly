// OneSignal configuration for different environments
export const oneSignalConfig = {
  // Production domains where OneSignal is allowed
  allowedDomains: [
    'fixifly.vercel.app',
    'fixifly.com',
    'localhost',
    '127.0.0.1'
  ],
  
  // OneSignal App ID
  appId: 'fee060ab-695d-45ca-8e35-8fa71ae5b6e0',
  
  // Check if current domain is allowed
  isDomainAllowed(): boolean {
    if (typeof window === 'undefined') return false;
    
    const currentDomain = window.location.hostname;
    return this.allowedDomains.includes(currentDomain);
  },
  
  // Get current domain
  getCurrentDomain(): string {
    if (typeof window === 'undefined') return '';
    return window.location.hostname;
  },
  
  // Check if we're in development
  isDevelopment(): boolean {
    if (typeof window === 'undefined') return false;
    
    const currentDomain = window.location.hostname;
    return currentDomain === 'localhost' || currentDomain === '127.0.0.1';
  },
  
  // Check if we're in production
  isProduction(): boolean {
    if (typeof window === 'undefined') return false;
    
    const currentDomain = window.location.hostname;
    return currentDomain === 'fixifly.vercel.app' || currentDomain === 'fixifly.com';
  }
};

export default oneSignalConfig;
