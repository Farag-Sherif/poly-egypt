/* eslint-disable @typescript-eslint/no-unused-vars */
import { routing } from '@/i18n/routing';

interface FetchOptions extends RequestInit {
  cache?: RequestCache;
  tags?: string[];
  credentials?: RequestCredentials;
}

const BASE_URL = import.meta.env.VITE_API_URL;

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
}

export async function clearAuthToken(): Promise<void> {
  clearCookieToken();
}

export async function revalidateLocaleCache(locale: string): Promise<void> {}
export async function revalidateCurrentLocaleCache(): Promise<void> {}
export async function invalidateLocaleCache(newLocale: string): Promise<void> {}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const locale = getCurrentLocale();
  const { cache = 'no-store', tags = [], ...restOptions } = options;

  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...restOptions,
      cache,
      headers: {
        'X-Localization': locale,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(restOptions.headers || {}),
      },
    });

    if (!response.ok) {
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
    console.error('API request failed:', error);
    throw error;
  }
}

export async function get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  return fetchApi<T>(endpoint, { method: 'GET', ...options });
}

export async function post<T>(endpoint: string, data: unknown, options?: FetchOptions): Promise<T> {
  return fetchApi<T>(endpoint, { method: 'POST', body: JSON.stringify(data), ...options });
}

export async function postFormData<T>(endpoint: string, data: FormData, options?: FetchOptions): Promise<T> {
  return fetchApi<T>(endpoint, { method: 'POST', body: data, ...options });
}

export async function put<T>(endpoint: string, data: unknown, options?: FetchOptions): Promise<T> {
  return fetchApi<T>(endpoint, { method: 'PUT', body: JSON.stringify(data), ...options });
}

export async function putFormData<T>(endpoint: string, data: FormData, options?: FetchOptions): Promise<T> {
  return fetchApi<T>(endpoint, { method: 'PUT', body: data, ...options });
}

export async function del<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  return fetchApi<T>(endpoint, { method: 'DELETE', ...options });
}
