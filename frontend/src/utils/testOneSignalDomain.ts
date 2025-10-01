// Test utility for OneSignal domain configuration
import oneSignalConfig from '../config/oneSignalConfig';

export const testOneSignalDomain = () => {
  console.log('🧪 Testing OneSignal Domain Configuration...\n');
  
  const currentDomain = oneSignalConfig.getCurrentDomain();
  const isAllowed = oneSignalConfig.isDomainAllowed();
  const isDevelopment = oneSignalConfig.isDevelopment();
  const isProduction = oneSignalConfig.isProduction();
  
  console.log('📊 Domain Information:');
  console.log('- Current Domain:', currentDomain);
  console.log('- Is Allowed:', isAllowed);
  console.log('- Is Development:', isDevelopment);
  console.log('- Is Production:', isProduction);
  console.log('- Allowed Domains:', oneSignalConfig.allowedDomains);
  
  if (isAllowed) {
    console.log('✅ OneSignal should work on this domain');
  } else {
    console.log('❌ OneSignal will not work on this domain');
    console.log('💡 To enable OneSignal, use one of these domains:');
    oneSignalConfig.allowedDomains.forEach(domain => {
      console.log(`   - ${domain}`);
    });
  }
  
  console.log('\n🔧 How to fix:');
  if (isDevelopment) {
    console.log('1. Use localhost or 127.0.0.1 for development');
    console.log('2. Or add your current domain to the allowed domains list');
  } else if (!isProduction) {
    console.log('1. Deploy to fixifly.vercel.app or fixifly.com');
    console.log('2. Or add your current domain to the allowed domains list');
  }
  
  return {
    currentDomain,
    isAllowed,
    isDevelopment,
    isProduction,
    allowedDomains: oneSignalConfig.allowedDomains
  };
};

// Auto-run test in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run test after a short delay to ensure DOM is ready
  setTimeout(() => {
    testOneSignalDomain();
  }, 1000);
}

export default testOneSignalDomain;
