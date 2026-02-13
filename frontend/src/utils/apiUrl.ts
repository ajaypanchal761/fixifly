/**
 * Normalizes API URL to ensure it ends with /api exactly once
 * Handles cases where VITE_API_URL might have:
 * - Trailing slashes
 * - Duplicate /api/api
 * - Missing /api
 */
const FALLBACK_URL = '/api';

const addProtocolIfMissing = (rawUrl: string): string => {
  if (!rawUrl) return FALLBACK_URL;

  // If it's a relative path, return as is
  if (rawUrl.startsWith('/')) {
    return rawUrl;
  }

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

  // Handle localhost, 127.0.0.1, or local IP addresses (192.168.x.x, 10.x.x.x, 172.x.x.x)
  const isLocal = /^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/i.test(trimmed);
  // Also check if it's any numeric IP with a port (e.g., 1.2.3.4:5000)
  const isNumericIPWithPort = /^(\d{1,3}\.){3}\d{1,3}:\d+/.test(trimmed);

  if (isLocal || isNumericIPWithPort) {
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

  // Special case for relative API paths (like "/api")
  if (sanitized.startsWith('/')) {
    // Ensure it doesn't end with a slash
    return sanitized.replace(/\/+$/, '');
  }

  const withProtocol = addProtocolIfMissing(sanitized);

  try {
    const parsed = new URL(withProtocol);

    // Only force /api if pathname is root or empty
    // This allows VITE_API_URL to contain custom paths like /v1 or /api/v2
    if (parsed.pathname === '/' || parsed.pathname === '') {
      parsed.pathname = '/api';
    }
    // If it already has a path, we trust the environment variable

    parsed.search = '';
    parsed.hash = '';

    const normalized = parsed.toString().replace(/\/+$/, '');
    return normalized || FALLBACK_URL;
  } catch {
    // If URL parsing fails but it started with http/https, maybe it's just invalid
    // but we can try to return it sanitized
    if (withProtocol.startsWith('http')) {
      return withProtocol.replace(/\/+$/, '');
    }
    return FALLBACK_URL;
  }
};

/**
 * Gets the normalized API base URL from environment variable
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // If in production or running on network IP (e.g. mobile testing), 
  // we prefer relative path proxy (/api) if VITE_API_URL is missing or local
  if (import.meta.env.PROD || !isLocalhost) {
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return '/api';
    }
  }

  if (envUrl) {
    return normalizeApiUrl(envUrl);
  }

  // Fallback for local development
  return 'http://localhost:5000/api';
};

