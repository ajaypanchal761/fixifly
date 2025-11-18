/**
 * Normalizes API URL to ensure it ends with /api exactly once
 * Handles cases where VITE_API_URL might have:
 * - Trailing slashes
 * - Duplicate /api/api
 * - Missing /api
 * 
 * For mobile webview: Uses production URL if localhost is detected on mobile
 */
const FALLBACK_URL = 'http://localhost:5000/api';

// Detect if running in mobile webview
const isMobileWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || 
         /wv|WebView/i.test(ua);
};

// Get production API URL for mobile
const getProductionApiUrl = (): string => {
  // For mobile webview, check if there's a custom API URL set (Flutter can set this)
  if (typeof window !== 'undefined') {
    const customApiUrl = localStorage.getItem('API_BASE_URL');
    if (customApiUrl) {
      console.log('📱 Using custom API URL from localStorage:', customApiUrl);
      return normalizeApiUrl(customApiUrl);
    }
  }
  
  // Check if we're on production domain
  if (typeof window !== 'undefined' && window.location.hostname.includes('getfixfly.com')) {
    // If already on getfixfly.com, use same domain for API
    return 'https://getfixfly.com/api';
  }
  
  // Try different possible production API URLs
  // Option 1: Same domain
  // Option 2: API subdomain (if backend is on separate subdomain)
  // For now, use same domain - update this if your backend is on different URL
  return 'https://getfixfly.com/api';
};

const addProtocolIfMissing = (rawUrl: string): string => {
  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  if (rawUrl.startsWith('//')) {
    return `https:${rawUrl}`;
  }

  const trimmed = rawUrl.replace(/^\/+/, '');
  if (!trimmed) {
    return FALLBACK_URL;
  }

  // Prefer http for localhost-style hosts to avoid SSL issues during development
  if (/^(localhost|127\.0\.0\.1)/i.test(trimmed)) {
    return `http://${trimmed}`;
  }

  return `https://${trimmed}`;
};

export const normalizeApiUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return FALLBACK_URL;
  }

  const sanitized = url.trim();
  if (!sanitized) {
    return FALLBACK_URL;
  }

  const withProtocol = addProtocolIfMissing(sanitized);

  try {
    const parsed = new URL(withProtocol);

    // Always force the pathname to exactly /api
    parsed.pathname = '/api';
    parsed.search = '';
    parsed.hash = '';

    const normalized = parsed.toString().replace(/\/+$/, '');
    return normalized || FALLBACK_URL;
  } catch {
    return FALLBACK_URL;
  }
};

/**
 * Gets the normalized API base URL from environment variable
 * For mobile webview, checks localStorage first, then uses production URL if localhost is detected
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isDev = import.meta.env.MODE === 'development' || import.meta.env.DEV;
  
  // Always check localStorage first (Flutter app can set this)
  if (typeof window !== 'undefined') {
    const customApiUrl = localStorage.getItem('API_BASE_URL');
    if (customApiUrl) {
      console.log('📱 Using API URL from localStorage:', customApiUrl);
      return normalizeApiUrl(customApiUrl);
    }
  }
  
  // If mobile webview in development mode
  if (isMobileWebView() && isDev) {
    console.warn('⚠️ Mobile webview detected in development mode');
    console.warn('💡 For local testing, Flutter app must set:');
    console.warn('   localStorage.setItem("API_BASE_URL", "http://YOUR_LOCAL_IP:5000/api")');
    console.warn('💡 Find your local IP: ipconfig (Windows) or ifconfig (Mac/Linux)');
    console.warn('💡 Example: localStorage.setItem("API_BASE_URL", "http://192.168.1.100:5000/api")');
    
    // In development, don't use production URL - show error instead
    // This forces Flutter team to set the correct local IP
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      console.error('❌ No API_BASE_URL set in localStorage for mobile webview');
      console.error('❌ Cannot use localhost from mobile device');
      // Still return production URL as fallback, but log the issue
      return getProductionApiUrl();
    }
  }
  
  // If mobile webview and using localhost in production, use production URL
  if (isMobileWebView() && !isDev && (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    console.log('📱 Mobile webview detected - using production API URL');
    return getProductionApiUrl();
  }
  
  return normalizeApiUrl(envUrl || 'http://localhost:5000/api');
};

