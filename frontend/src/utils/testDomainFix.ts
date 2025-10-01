// Test utility to verify OneSignal domain fix
export const testDomainFix = () => {
  console.log('🧪 Testing OneSignal Domain Fix...\n');
  
  const currentDomain = window.location.hostname;
  const allowedDomains = ['fixifly.vercel.app', 'fixifly.com', 'localhost', '127.0.0.1'];
  const isAllowed = allowedDomains.includes(currentDomain);
  
  console.log('📊 Domain Information:');
  console.log('- Current Domain:', currentDomain);
  console.log('- Is Allowed:', isAllowed);
  console.log('- Allowed Domains:', allowedDomains);
  
  // Check OneSignal availability
  const oneSignalAvailable = typeof window.OneSignal !== 'undefined';
  const isMockOneSignal = window.OneSignal?._isMock === true;
  
  console.log('\n📱 OneSignal Status:');
  console.log('- OneSignal Available:', oneSignalAvailable);
  console.log('- Is Mock OneSignal:', isMockOneSignal);
  console.log('- OneSignal Object:', window.OneSignal);
  
  if (isAllowed) {
    if (oneSignalAvailable && !isMockOneSignal) {
      console.log('✅ OneSignal should work correctly on this domain');
    } else if (oneSignalAvailable && isMockOneSignal) {
      console.log('⚠️ OneSignal is mocked - this should not happen on allowed domains');
    } else {
      console.log('⚠️ OneSignal not available - check initialization');
    }
  } else {
    if (oneSignalAvailable && isMockOneSignal) {
      console.log('✅ OneSignal is properly mocked on unauthorized domain');
    } else if (oneSignalAvailable && !isMockOneSignal) {
      console.log('❌ OneSignal is available on unauthorized domain - this should not happen');
    } else {
      console.log('✅ OneSignal not loaded on unauthorized domain');
    }
  }
  
  // Test OneSignal methods
  if (oneSignalAvailable) {
    console.log('\n🔧 Testing OneSignal Methods:');
    
    try {
      const initResult = window.OneSignal.init();
      console.log('- init() result:', initResult);
    } catch (error) {
      console.log('- init() error:', error);
    }
    
    try {
      const setUserIdResult = window.OneSignal.setExternalUserId('test');
      console.log('- setExternalUserId() result:', setUserIdResult);
    } catch (error) {
      console.log('- setExternalUserId() error:', error);
    }
  }
  
  console.log('\n🎯 Expected Behavior:');
  if (isAllowed) {
    console.log('- OneSignal should initialize normally');
    console.log('- Push notifications should work');
    console.log('- No domain restriction errors');
  } else {
    console.log('- OneSignal should be mocked');
    console.log('- No domain restriction errors');
    console.log('- App should work without push notifications');
  }
  
  return {
    currentDomain,
    isAllowed,
    oneSignalAvailable,
    isMockOneSignal,
    allowedDomains
  };
};

// Auto-run test in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run test after a short delay to ensure everything is loaded
  setTimeout(() => {
    testDomainFix();
  }, 2000);
}

export default testDomainFix;
