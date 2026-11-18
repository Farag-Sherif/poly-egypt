/* eslint-disable @typescript-eslint/no-unused-vars */
import { routing } from '@/i18n/routing';

interface FetchOptions extends RequestInit {
  cache?: RequestCache;
  tags?: string[];
  credentials?: RequestCredentials;
  forceRefresh?: boolean;
}

const BASE_URL = import.meta.env.VITE_API_URL || "https://admin.poly-egypt.com/api";

// In-memory session cache for GET requests
const sessionGetCache = new Map<string, Promise<any>>();

export function clearApiCache(pattern?: string): void {
  if (!pattern) {
    sessionGetCache.clear();
    return;
  }
  for (const key of sessionGetCache.keys()) {
    if (key.includes(pattern)) {
      sessionGetCache.delete(key);
    }
  }
}

function invalidateRelatedCache(endpoint: string) {
  if (endpoint.includes('cart')) {
    clearApiCache('cart');
  } else if (endpoint.includes('fav')) {
    clearApiCache('fav');
    clearApiCache('favorite');
  } else if (
    endpoint.includes('user') ||
    endpoint.includes('address') ||
    endpoint.includes('login') ||
    endpoint.includes('register')
  ) {
    clearApiCache('user');
    clearApiCache('addresse');
  }
}

function getCurrentLocale(): string {
  if (typeof window === 'undefined') return routing.defaultLocale;
  const locale = window.location.pathname.split('/').filter(Boolean)[0];
  return routing.locales.includes(locale) ? locale : routing.defaultLocale;
}

function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )PolyEgy-token=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  try {
    return localStorage.getItem('PolyEgy-token');
  } catch {
    return null;
  }
}

function setCookieToken(token: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `PolyEgy-token=${encodeURIComponent(token)}; path=/; SameSite=Strict`;
  }
  try {
    localStorage.setItem('PolyEgy-token', token);
  } catch {}
}

function clearCookieToken() {
  if (typeof document !== 'undefined') {
    document.cookie = 'PolyEgy-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
  }
  try {
    localStorage.removeItem('PolyEgy-token');
  } catch {}
}

export async function setAuthToken(token: string): Promise<void> {
  setCookieToken(token);
  clearApiCache();
}

export async function clearAuthToken(): Promise<void> {
  clearCookieToken();
  clearApiCache();
}

export async function revalidateLocaleCache(locale: string): Promise<void> {
  clearApiCache(locale);
}

export async function revalidateCurrentLocaleCache(): Promise<void> {
  clearApiCache(getCurrentLocale());
}

export async function invalidateLocaleCache(newLocale: string): Promise<void> {
  clearApiCache();
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}, retries = 2): Promise<T> {
  const locale = getCurrentLocale();
  const { cache = 'no-store', tags = [], forceRefresh, ...restOptions } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const token = getAuthToken();

      // Construct headers ensuring 'Accept': 'application/json' is always present
      const headers = new Headers();
      headers.set('Accept', 'application/json');
      headers.set('X-Localization', locale);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      if (restOptions.headers) {
        if (restOptions.headers instanceof Headers) {
          restOptions.headers.forEach((value, key) => {
            headers.set(key, value);
          });
        } else if (Array.isArray(restOptions.headers)) {
          restOptions.headers.forEach(([key, value]) => {
            headers.set(key, value);
          });
        } else {
          Object.entries(restOptions.headers).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              headers.set(key, String(value));
            }
          });
        }
      }

      // Force Accept header to stay application/json
      headers.set('Accept', 'application/json');

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...restOptions,
        cache,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          clearCookieToken();
          clearApiCache();
          console.warn(`[API] 401 Unauthorized for ${endpoint}. Cleared session token and cache.`);
          let errorData: any = { status: 401, error: 'Unauthorized', message: 'Unauthenticated.', items: [] };
          try {
            const text = await response.text();
            if (text) {
              const parsed = JSON.parse(text);
              errorData = { ...errorData, ...parsed };
            }
          } catch {
            // Keep default errorData on text parse failure
          }
          return errorData as unknown as T;
        }

        // Intermittent 5xx server/database error: retry up to retries times
        if (response.status >= 500 && attempt < retries) {
          await new Promise((res) => setTimeout(res, 400 * (attempt + 1)));
          continue;
        }

        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText, status: response.status };
        }
        throw new Error(JSON.stringify(errorData));
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, 400 * (attempt + 1)));
        continue;
      }
    }
  }

  console.error(`API request failed [${endpoint}]:`, lastError);
  throw lastError;
}

export async function get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  const locale = getCurrentLocale();
  const token = getAuthToken() || 'guest';
  const cacheKey = `${locale}:${token}:${endpoint}`;

  if (!options?.forceRefresh && sessionGetCache.has(cacheKey)) {
    return sessionGetCache.get(cacheKey) as Promise<T>;
  }

  const promise = fetchApi<T>(endpoint, { method: 'GET', ...options })
    .catch((error) => {
      // Remove failed request so it can be retried later
      sessionGetCache.delete(cacheKey);
      throw error;
    });

  sessionGetCache.set(cacheKey, promise);
  return promise;
}

export async function post<T>(endpoint: string, data: unknown, options?: FetchOptions): Promise<T> {
  invalidateRelatedCache(endpoint);
  return fetchApi<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
}

export async function postFormData<T>(endpoint: string, data: FormData, options?: FetchOptions): Promise<T> {
  invalidateRelatedCache(endpoint);
  return fetchApi<T>(endpoint, { method: 'POST', body: data, ...options });
}

export async function put<T>(endpoint: string, data: unknown, options?: FetchOptions): Promise<T> {
  invalidateRelatedCache(endpoint);
  return fetchApi<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
}

export async function putFormData<T>(endpoint: string, data: FormData, options?: FetchOptions): Promise<T> {
  invalidateRelatedCache(endpoint);
  return fetchApi<T>(endpoint, { method: 'PUT', body: data, ...options });
}

export async function del<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  invalidateRelatedCache(endpoint);
  return fetchApi<T>(endpoint, { method: 'DELETE', ...options });
}
