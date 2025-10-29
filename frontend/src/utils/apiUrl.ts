/**
 * Normalizes API URL to ensure it ends with /api exactly once
 * Handles cases where VITE_API_URL might have:
 * - Trailing slashes
 * - Duplicate /api/api
 * - Missing /api
 */
export const normalizeApiUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return 'http://localhost:5000/api';
  }
  
  let normalized = url.trim();
  
  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');
  
  // Recursively remove ALL duplicate /api/api patterns
  let previous = '';
  while (previous !== normalized) {
    previous = normalized;
    normalized = normalized.replace(/\/api\/api/g, '/api');
    normalized = normalized.replace(/\/api\/\/api/g, '/api'); // Handle /api//api
  }
  
  // Split by /api to get base and any remaining /api parts
  const parts = normalized.split('/api');
  const base = parts[0] || '';
  
  // Reconstruct with exactly one /api at the end
  if (base) {
    const cleanBase = base.replace(/\/+$/, '');
    normalized = `${cleanBase}/api`;
  } else {
    normalized = '/api';
  }
  
  // If no protocol, assume localhost (edge case)
  if (!normalized.match(/^https?:\/\//)) {
    normalized = `http://localhost:5000${normalized}`;
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

