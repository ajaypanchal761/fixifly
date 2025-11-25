/**
 * Normalizes API URL to ensure it ends with /api exactly once
 * Handles cases where VITE_API_URL might have:
 * - Trailing slashes
 * - Duplicate /api/api
 * - Missing /api
 */
const FALLBACK_URL = 'http://localhost:5000/api';

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
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  return normalizeApiUrl(envUrl || 'http://localhost:5000/api');
};

/**
 * Gets the correct API base URL for WebView/APK scenarios
 * For WebView/APK, always uses production backend URL
 * For regular web, uses environment variable or fallback
 */
export const getApiBaseUrlForWebView = (): string => {
  // Detect WebView/APK context
  const isAPK = !!(window as any).flutter_inappwebview || 
                /flutter|Flutter/i.test(navigator.userAgent) ||
                !!(window as any).cordova ||
                !!(window as any).Capacitor;
  
  const isProduction = import.meta.env.PROD || 
                      window.location.hostname.includes('getfixfly.com') ||
                      window.location.hostname.includes('vercel.app') ||
                      window.location.protocol === 'https:';
  
  // Production backend URL (must be publicly accessible)
  const PRODUCTION_BACKEND_URL = 'https://api.getfixfly.com';
  
  // For WebView/APK, always use production backend
  if (isAPK) {
    return `${PRODUCTION_BACKEND_URL}/api`;
  }
  
  // For production web, use production backend
  if (isProduction) {
    const envUrl = import.meta.env.VITE_API_URL;
    const normalized = normalizeApiUrl(envUrl || 'http://localhost:5000/api');
    
    // If normalized URL is localhost or not production, use production backend
    if (normalized.includes('localhost') || normalized.includes('127.0.0.1') || !normalized.includes('getfixfly.com')) {
      return `${PRODUCTION_BACKEND_URL}/api`;
    }
    
    return normalized;
  }
  
  // For development, use environment variable or fallback
  return getApiBaseUrl();
};

