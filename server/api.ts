/* eslint-disable @typescript-eslint/no-unused-vars */
import { routing } from '@/i18n/routing';

export interface FetchOptions extends RequestInit {
  cache?: RequestCache;
  tags?: string[];
  credentials?: RequestCredentials;
  forceRefresh?: boolean;
  params?: Record<string, any> | URLSearchParams;
}

const BASE_URL = import.meta.env?.VITE_API_URL || "https://admin.poly-egypt.com/api";

// In-flight request deduplication map
export const pendingRequests = new Map<string, Promise<any>>();

// In-memory session cache for GET requests
export const sessionGetCache = new Map<string, Promise<any>>();

/**
 * Deduplicates concurrent in-flight requests for the same key.
 * If a request for `key` is currently in flight, returns the ongoing Promise.
 * Otherwise, executes `request()`, caches the Promise in `pendingRequests`,
 * and deletes the key once settled.
 */
export function deduplicateRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
  const ongoing = pendingRequests.get(key);
  if (ongoing) {
    return ongoing as Promise<T>;
  }

  let promise: Promise<T>;
  try {
    promise = request().finally(() => {
      pendingRequests.delete(key);
    });
  } catch (error) {
    pendingRequests.delete(key);
    return Promise.reject(error);
  }

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Normalizes an endpoint with its query parameters (from URL string and/or options.params)
 * into a canonical, sorted URL string.
 */
export function buildNormalizedUrl(endpoint: string, options?: FetchOptions): string {
  let path = endpoint;
  let queryString = '';
  const qIndex = endpoint.indexOf('?');
  if (qIndex !== -1) {
    path = endpoint.substring(0, qIndex);
    queryString = endpoint.substring(qIndex + 1);
  }

  const searchParams = new URLSearchParams(queryString);

  if (options?.params) {
    if (options.params instanceof URLSearchParams) {
      options.params.forEach((value, key) => {
        searchParams.set(key, value);
      });
    } else if (typeof options.params === 'object' && options.params !== null) {
      for (const [key, val] of Object.entries(options.params)) {
        if (val !== undefined && val !== null) {
          searchParams.set(key, String(val));
        }
      }
    }
  }

  searchParams.sort();
  const sortedQuery = searchParams.toString();
  return sortedQuery ? `${path}?${sortedQuery}` : path;
}

/**
 * Uniquely generates a cache/deduplication key reflecting endpoint, parameters, locale, and auth token.
 */
export function generateCacheKey(
  endpoint: string,
  options?: FetchOptions,
  locale?: string,
  token?: string | null
): string {
  const currentLocale = locale || getCurrentLocale();
  const currentToken = token !== undefined ? (token || 'guest') : (getAuthToken() || 'guest');
  const normalizedUrl = buildNormalizedUrl(endpoint, options);
  return `locale:${currentLocale}|token:${currentToken}|url:${normalizedUrl}`;
}

/**
 * Attaches an AbortSignal to a promise without aborting the underlying shared promise.
 * If the signal triggers an abort, this individual caller rejects with AbortError,
 * while the shared underlying request and cache continue uninterrupted.
 */
function attachSignal<T>(promise: Promise<T>, signal?: AbortSignal | null): Promise<T> {
  if (!signal) return promise;

  if (signal.aborted) {
    const error = signal.reason ?? (
      typeof DOMException !== 'undefined'
        ? new DOMException('This operation was aborted', 'AbortError')
        : new Error('This operation was aborted')
    );
    return Promise.reject(error);
  }

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      const error = signal.reason ?? (
        typeof DOMException !== 'undefined'
          ? new DOMException('This operation was aborted', 'AbortError')
          : new Error('This operation was aborted')
      );
      reject(error);
    };

    signal.addEventListener('abort', onAbort, { once: true });

    promise.then(
      (val) => {
        signal.removeEventListener('abort', onAbort);
        resolve(val);
      },
      (err) => {
        signal.removeEventListener('abort', onAbort);
        reject(err);
      }
    );
  });
}

export function clearApiCache(pattern?: string): void {
  if (!pattern) {
    sessionGetCache.clear();
    pendingRequests.clear();
    return;
  }
  for (const key of sessionGetCache.keys()) {
    if (key.includes(pattern)) {
      sessionGetCache.delete(key);
    }
  }
  for (const key of pendingRequests.keys()) {
    if (key.includes(pattern)) {
      pendingRequests.delete(key);
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

/**
 * Underlying network fetcher with retry logic for 5xx server errors and 401 token clearing.
 */
async function executeFetchWithRetry<T>(
  endpoint: string,
  options: FetchOptions = {},
  retries = 2
): Promise<T> {
  const locale = getCurrentLocale();
  const { cache = 'no-store', tags = [], forceRefresh, params, signal, ...restOptions } = options;

  const normalizedUrl = buildNormalizedUrl(endpoint, options);
  const cleanBaseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanPath = normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;
  const fullUrl = normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')
    ? normalizedUrl
    : `${cleanBaseUrl}${cleanPath}`;

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

      const fetchInit: RequestInit = {
        ...restOptions,
        cache,
        headers,
      };

      // Only pass signal directly for non-GET mutations; GET requests handle AbortSignal non-destructively
      const method = (restOptions.method || 'GET').toUpperCase();
      if (method !== 'GET' && signal) {
        fetchInit.signal = signal;
      }

      const response = await fetch(fullUrl, fetchInit);

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
      // Do not retry aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, 400 * (attempt + 1)));
        continue;
      }
    }
  }

  console.error(`API request failed [${endpoint}]:`, lastError);
  throw lastError;
}

/**
 * Fetch with in-flight deduplication for GET requests and automatic retries for 5xx errors.
 */
export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {},
  retries = 2
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();

  if (method === 'GET') {
    const cacheKey = generateCacheKey(endpoint, options);
    const { signal, ...restOptions } = options;
    const promise = deduplicateRequest<T>(cacheKey, () =>
      executeFetchWithRetry<T>(endpoint, { method: 'GET', ...restOptions }, retries)
    );
    return attachSignal(promise, signal);
  }

  return executeFetchWithRetry<T>(endpoint, options, retries);
}

/**
 * Performs a cached GET request.
 * Shares in-flight requests and caches responses in sessionGetCache during the session.
 */
export async function get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  const cacheKey = generateCacheKey(endpoint, options);

  if (!options?.forceRefresh && sessionGetCache.has(cacheKey)) {
    return attachSignal(sessionGetCache.get(cacheKey) as Promise<T>, options?.signal);
  }

  const { signal, ...restOptions } = options || {};

  const promise = deduplicateRequest<T>(cacheKey, () =>
    executeFetchWithRetry<T>(endpoint, { method: 'GET', ...restOptions })
  ).catch((error) => {
    // Remove failed request from session cache so subsequent attempts can retry
    sessionGetCache.delete(cacheKey);
    throw error;
  });

  sessionGetCache.set(cacheKey, promise);
  return attachSignal(promise, signal);
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
