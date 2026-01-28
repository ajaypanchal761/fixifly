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

