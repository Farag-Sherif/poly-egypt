import React, { useState, useEffect, useRef, useCallback } from 'react';

const MAX_RETRIES = 3; // 3 retries = 4 attempts total (initial + 3 retries)
const BASE_RETRY_DELAY = 500; // 500ms * (retryCount + 1) -> 500ms, 1000ms, 1500ms
const DEFAULT_FALLBACK = '/images/placeholder.png';
const CACHE_STORAGE_KEY = 'polyegy_image_cache_v1';
const MAX_PERSISTED_URLS = 200;

// High-reliability inline SVG fallback (failsafe if placeholder file is unreachable)
const INLINE_FALLBACK_SVG =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='100%25' height='100%25'%3E%3Crect width='400' height='400' fill='%23f8f9fa'/%3E%3Cg fill='none' stroke='%23adb5bd' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' transform='translate(150, 140)'%3E%3Crect x='0' y='0' width='100' height='80' rx='8' ry='8' fill='%23ffffff' fill-opacity='0.6'/%3E%3Ccircle cx='35' cy='30' r='10'/%3E%3Cpath d='M10 70 L40 40 L65 60 L75 50 L90 70 Z'/%3E%3C/g%3E%3Ctext x='200' y='260' text-anchor='middle' fill='%236c757d' font-family='sans-serif' font-size='15' font-weight='500'%3EPolyEgy%3C/text%3E%3C/svg%3E";

// Module-level in-memory cache of successfully loaded image URLs
const successfulImageCache = new Set();
// Session-level memory map of known failed URLs to prevent repeated wasteful retries
const knownFailures = new Set();

// Safely initialize cache from localStorage on client
if (typeof window !== 'undefined') {
  try {
    const raw = window.localStorage?.getItem(CACHE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((url) => {
          if (typeof url === 'string') successfulImageCache.add(url);
        });
      }
    }
  } catch {
    // Ignore localStorage access errors
  }
}

/**
 * Persists successfully loaded URLs to in-memory cache and localStorage
 */
function persistSuccessfulUrl(url) {
  if (!url || typeof url !== 'string') return;
  if (url.startsWith('data:') || url.startsWith('blob:')) return;
  successfulImageCache.add(url);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
      let list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      if (!list.includes(url)) {
        list.push(url);
        if (list.length > MAX_PERSISTED_URLS) {
          list = list.slice(-MAX_PERSISTED_URLS);
        }
        window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(list));
      }
    }
  } catch {
    // Ignore quota or security errors
  }
}

/**
 * Normalizes any incoming src prop (string, imported object, null, undefined)
 */
function normalizeSrc(src) {
  if (!src) return '';
  if (typeof src === 'string') return src.trim();
  if (typeof src === 'object') {
    if (typeof src.src === 'string') return src.src.trim();
    if (typeof src.default === 'string') return src.default.trim();
    if (src.default && typeof src.default.src === 'string') return src.default.src.trim();
  }
  return String(src).trim();
}

/**
 * Removes retry-specific query params to obtain the canonical clean URL
 */
function getCleanUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  try {
    const [withoutHash, hash] = url.split('#');
    const [baseUrl, query] = withoutHash.split('?');
    if (!query) return url;
    const params = new URLSearchParams(query);
    params.delete('_retry');
    params.delete('_t');
    const remaining = params.toString();
    const clean = remaining ? `${baseUrl}?${remaining}` : baseUrl;
    return hash !== undefined ? `${clean}#${hash}` : clean;
  } catch {
    return url;
  }
}

/**
 * Appends or updates retry parameters on a URL
 */
function buildRetryUrl(originalUrl, retryAttempt) {
  if (!originalUrl || typeof originalUrl !== 'string') return '';
  if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) return originalUrl;
  try {
    const [withoutHash, hash] = originalUrl.split('#');
    const [baseUrl, query] = withoutHash.split('?');
    const params = new URLSearchParams(query || '');
    params.set('_retry', String(retryAttempt));
    params.set('_t', String(Date.now()));
    const result = `${baseUrl}?${params.toString()}`;
    return hash !== undefined ? `${result}#${hash}` : result;
  } catch {
    const sep = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${sep}_retry=${retryAttempt}&_t=${Date.now()}`;
  }
}

export default function AppImage({
  src,
  alt = '',
  width,
  height,
  className,
  style,
  priority = false,
  fill = false,
  sizes,
  quality,
  placeholder,
  blurDataURL,
  loader,
  unoptimized,
  loading,
  decoding = 'async',
  fallbackSrc = DEFAULT_FALLBACK,
  onLoad,
  onError,
  ...rest
}) {
  const normalizedSrc = normalizeSrc(src);
  const targetFallback = fallbackSrc || DEFAULT_FALLBACK;

  // Determine initial image source
  const getInitialSrc = () => {
    if (!normalizedSrc) return targetFallback;
    if (knownFailures.has(normalizedSrc)) return targetFallback;
    return normalizedSrc;
  };

  const [currentSrc, setCurrentSrc] = useState(getInitialSrc);
  const [retryCount, setRetryCount] = useState(0);
  const [isFallback, setIsFallback] = useState(() => !normalizedSrc || knownFailures.has(normalizedSrc));

  const isMountedRef = useRef(true);
  const retryTimerRef = useRef(null);
  const isFallbackRef = useRef(isFallback);
  const triedOldCacheRef = useRef(false);
  const lastSuccessfulSrcRef = useRef(null);

  // Keep ref synchronized for immediate check in onError handler
  useEffect(() => {
    isFallbackRef.current = isFallback;
  }, [isFallback]);

  // Synchronize on src or fallback change
  useEffect(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    const clean = normalizeSrc(src);
    triedOldCacheRef.current = false;

    if (!clean) {
      setCurrentSrc(targetFallback);
      setIsFallback(true);
      isFallbackRef.current = true;
      setRetryCount(0);
      return;
    }

    if (knownFailures.has(clean)) {
      setCurrentSrc(targetFallback);
      setIsFallback(true);
      isFallbackRef.current = true;
      setRetryCount(0);
      return;
    }

    setCurrentSrc(clean);
    setIsFallback(false);
    isFallbackRef.current = false;
    setRetryCount(0);
  }, [src, targetFallback]);

  // Cleanup timers on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const handleError = useCallback((e) => {
    // 1. If we are already displaying fallback or inline SVG:
    if (isFallbackRef.current || currentSrc === targetFallback || currentSrc === INLINE_FALLBACK_SVG) {
      // If primary fallback (e.g. placeholder.png) failed, fallback once to inline SVG failsafe
      if (currentSrc !== INLINE_FALLBACK_SVG) {
        setCurrentSrc(INLINE_FALLBACK_SVG);
        setIsFallback(true);
        isFallbackRef.current = true;
      }
      // Never loop or retry fallback!
      if (typeof onError === 'function') {
        onError(e);
      }
      return;
    }

    const clean = getCleanUrl(currentSrc) || normalizedSrc;

    // 2. Intelligent retry mechanism: retry up to MAX_RETRIES (3 times)
    if (retryCount < MAX_RETRIES) {
      const nextRetry = retryCount + 1;
      const delay = BASE_RETRY_DELAY * nextRetry; // 500ms, 1000ms, 1500ms

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }

      retryTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        const retryUrl = buildRetryUrl(clean || normalizedSrc, nextRetry);
        setRetryCount(nextRetry);
        setCurrentSrc(retryUrl);
      }, delay);

      if (typeof onError === 'function') {
        onError(e);
      }
      return;
    }

    // 3. Retries exhausted (>= MAX_RETRIES). Check cache from previous successful images:
    // "لو ما جاتش هاتها من الكاش من الصور القديمة"
    if (!triedOldCacheRef.current) {
      triedOldCacheRef.current = true;

      // A) Check if this component previously rendered a working image (e.g. before variant switch)
      if (lastSuccessfulSrcRef.current && lastSuccessfulSrcRef.current !== clean) {
        setCurrentSrc(lastSuccessfulSrcRef.current);
        if (typeof onError === 'function') onError(e);
        return;
      }

      // B) Check if clean URL was previously cached in memory/localStorage
      if (clean && successfulImageCache.has(clean) && currentSrc !== clean) {
        setCurrentSrc(clean);
        if (typeof onError === 'function') onError(e);
        return;
      }
    }

    // 4. If all retries and old cache attempts failed: permanently switch to fallback
    if (clean) {
      knownFailures.add(clean);
    }
    setIsFallback(true);
    isFallbackRef.current = true;
    setCurrentSrc(targetFallback);

    if (typeof onError === 'function') {
      onError(e);
    }
  }, [currentSrc, normalizedSrc, retryCount, targetFallback, onError]);

  const handleLoad = useCallback((e) => {
    // Clear any active retry timer
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    // Cache successful URL if it's not a fallback
    if (!isFallbackRef.current && currentSrc !== targetFallback && currentSrc !== INLINE_FALLBACK_SVG) {
      const clean = getCleanUrl(currentSrc);
      if (clean) {
        lastSuccessfulSrcRef.current = clean;
        persistSuccessfulUrl(clean);
        knownFailures.delete(clean);
      }
      if (retryCount !== 0) {
        setRetryCount(0);
      }
    }

    if (typeof onLoad === 'function') {
      onLoad(e);
    }
  }, [currentSrc, targetFallback, retryCount, onLoad]);

  // Compute layout and styles
  const computedStyle = { ...style };
  if (fill) {
    computedStyle.position = computedStyle.position || 'absolute';
    computedStyle.inset = computedStyle.inset || 0;
    computedStyle.width = computedStyle.width || '100%';
    computedStyle.height = computedStyle.height || '100%';
    computedStyle.objectFit = computedStyle.objectFit || 'cover';
  }

  if (placeholder === 'blur' && blurDataURL) {
    computedStyle.backgroundImage = computedStyle.backgroundImage || `url("${blurDataURL}")`;
    computedStyle.backgroundSize = computedStyle.backgroundSize || 'cover';
    computedStyle.backgroundPosition = computedStyle.backgroundPosition || 'center';
  }

  // Lazy loading by default: priority ? 'eager' : 'lazy'
  const computedLoading = loading || (priority ? 'eager' : 'lazy');
  const computedDecoding = decoding || 'async';

  return (
    <img
      src={currentSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      style={computedStyle}
      loading={computedLoading}
      decoding={computedDecoding}
      fetchpriority={priority ? 'high' : undefined}
      sizes={sizes}
      onLoad={handleLoad}
      onError={handleError}
      {...rest}
    />
  );
}
