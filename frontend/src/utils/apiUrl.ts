/**
 * Normalizes API URL to ensure it ends with /api exactly once
 * Handles cases where VITE_API_URL might have:
 * - Trailing slashes
 * - Duplicate /api/api
 * - Missing /api
 */
export const normalizeApiUrl = (url: string): string => {
  if (!url) {
    return 'http://localhost:5000/api';
  }
  
  let normalized = url.trim().replace(/\/+$/, ''); // Remove trailing slashes
  
  // Remove duplicate /api/api if present anywhere in the URL
  normalized = normalized.replace(/\/api\/api(\/|$)/g, '/api$1');
  
  // Ensure it ends with /api exactly once
  if (!normalized.endsWith('/api')) {
    normalized = normalized.endsWith('/') ? `${normalized}api` : `${normalized}/api`;
  }
  
  return normalized;
};

/**
 * Gets the normalized API base URL from environment variable
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  return normalizeApiUrl(envUrl || 'http://localhost:5000/api');
};

