// Webview detection utility for better compatibility
export const isWebView = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Common webview patterns
  const webviewPatterns = [
    /wv|webview/,
    /android.*wv/,
    /iphone.*wv/,
    /ipad.*wv/,
    /mobile.*safari.*version/,
    /mobile.*chrome.*version/
  ];
  
  return webviewPatterns.some(pattern => pattern.test(userAgent));
};

export const isMobileWebView = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /wv|webview/.test(userAgent) && 
         (/android|iphone|ipad/.test(userAgent));
};

export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

export const getEnvironmentInfo = () => {
  return {
    isWebView: isWebView(),
    isMobileWebView: isMobileWebView(),
    isPWA: isPWA(),
    userAgent: navigator.userAgent,
    hasServiceWorker: 'serviceWorker' in navigator,
    hasNotifications: 'Notification' in window,
    hasPushManager: 'PushManager' in window
  };
};

export default {
  isWebView,
  isMobileWebView,
  isPWA,
  getEnvironmentInfo
};
