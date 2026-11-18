import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import './OptimizedImage.css';

const MAX_RETRIES = 3; // Initial attempt + 3 retries = 4 total attempts
const RETRY_DELAYS = [800, 1600, 2600];
const DEFAULT_FALLBACK = '/images/placeholder.png';

// Failsafe self-contained inline SVG fallback (used if placeholder file is unreachable or missing)
const INLINE_FALLBACK_SVG =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='100%25' height='100%25'%3E%3Crect width='400' height='400' fill='%23f8f9fa'/%3E%3Cg fill='none' stroke='%23adb5bd' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' transform='translate(150, 140)'%3E%3Crect x='0' y='0' width='100' height='80' rx='8' ry='8' fill='%23ffffff' fill-opacity='0.6'/%3E%3Ccircle cx='35' cy='30' r='10'/%3E%3Cpath d='M10 70 L40 40 L65 60 L75 50 L90 70 Z'/%3E%3C/g%3E%3Ctext x='200' y='260' text-anchor='middle' fill='%236c757d' font-family='sans-serif' font-size='15' font-weight='500'%3EPolyEgy%3C/text%3E%3C/svg%3E";

// Fast in-memory cache of successfully loaded URLs to eliminate skeleton flashes during navigation
const loadedImagesCache = new Set();

// Clear any toxic permanent blacklists from previous sessions
if (typeof window !== 'undefined') {
  try {
    window.sessionStorage?.removeItem('polyegy_failed_images_v1');
    window.sessionStorage?.removeItem('polyegy_failed_images');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Normalizes any incoming src prop and fixes backend redirect/ORB issues:
 * - Handles strings, imported image objects, null, undefined
 * - Ensures HTTPS on admin.poly-egypt.com
 * - Bypasses Laravel 302 redirection (which triggers Chromium net::ERR_BLOCKED_BY_ORB)
 *   by rewriting admin.poly-egypt.com/images/... to admin.poly-egypt.com/ar/images/...
 */
export function normalizeSrc(src) {
  if (!src) return '';
  let str = '';
  if (typeof src === 'string') {
    str = src.trim();
  } else if (typeof src === 'object') {
    if (typeof src.src === 'string') str = src.src.trim();
    else if (typeof src.default === 'string') str = src.default.trim();
    else if (src.default && typeof src.default.src === 'string') str = src.default.src.trim();
  } else {
    str = String(src).trim();
  }

  if (!str) return '';

  // Ensure HTTPS for admin domain
  if (str.startsWith('http://admin.poly-egypt.com')) {
    str = str.replace('http://', 'https://');
  }

  // Bypass Hostinger/Laravel 302 redirect by ensuring /ar/ prefix
  // admin.poly-egypt.com/images/... -> admin.poly-egypt.com/ar/images/...
  // Directly returns 200 OK with image binary, avoiding HTML 302 body and Chromium ORB blocking
  if (str.includes('admin.poly-egypt.com/images/')) {
    str = str.replace('admin.poly-egypt.com/images/', 'admin.poly-egypt.com/ar/images/');
  }

  return str;
}

/**
 * Removes retry-specific query params (_retry, _t) to obtain the canonical clean URL.
 * Preserves all application query parameters to maintain browser HTTP caching.
 */
export function getCleanUrl(url) {
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
 * Smart retry URL generator:
 * - Retry 1: Switches locale route (/ar/images/ <-> /en/images/)
 * - Retry 2: Applies fresh timestamp parameter
 * - Retry 3: Final backoff with new timestamp
 */
function buildRetryUrl(originalUrl, retryAttempt) {
  if (!originalUrl || typeof originalUrl !== 'string') return '';
  if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) return originalUrl;

  const clean = getCleanUrl(originalUrl);

  // Attempt 1: Alternate route
  if (retryAttempt === 1) {
    if (clean.includes('/ar/images/')) {
      return clean.replace('/ar/images/', '/en/images/');
    }
    if (clean.includes('/en/images/')) {
      return clean.replace('/en/images/', '/ar/images/');
    }
  }

  // Attempts 2 & 3: Timestamp cache buster
  try {
    const [withoutHash, hash] = clean.split('#');
    const [baseUrl, query] = withoutHash.split('?');
    const params = new URLSearchParams(query || '');
    params.set('_retry', String(retryAttempt));
    params.set('_t', String(Date.now()));
    const result = `${baseUrl}?${params.toString()}`;
    return hash !== undefined ? `${result}#${hash}` : result;
  } catch {
    const sep = clean.includes('?') ? '&' : '?';
    return `${clean}${sep}_retry=${retryAttempt}&_t=${Date.now()}`;
  }
}


/**
 * OptimizedImage Component
 *
 * Provides:
 * - Native lazy loading & priority hints
 * - Async image decoding
 * - CLS prevention via aspect-ratio styling
 * - Smooth skeleton shimmer & fade-in
 * - 4-Tier Smart Retry with route alternation and exponential backoff
 * - In-memory and CacheStorage caching
 * - Instant fallback protection
 */
const OptimizedImage = forwardRef(function OptimizedImage(
  {
    src,
    alt = '',
    width,
    height,
    priority = false,
    fetchPriority,
    loading,
    decoding = 'async',
    className = '',
    style = {},
    sizes,
    fill = false,
    layout,
    aspectRatio,
    objectFit,
    objectPosition,
    fallbackSrc = DEFAULT_FALLBACK,
    placeholder,
    blurDataURL,
    quality,
    unoptimized,
    loader,
    onClick,
    onLoad,
    onError,
    ...rest
  },
  forwardedRef
) {
  const normalizedSrc = normalizeSrc(src);
  const targetFallback = fallbackSrc || DEFAULT_FALLBACK;
  const isFill = Boolean(fill || layout === 'fill');

  // Determine initial state
  const getInitialSrc = () => {
    if (!normalizedSrc) return targetFallback;
    return normalizedSrc;
  };

  const [currentSrc, setCurrentSrc] = useState(getInitialSrc);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(() => {
    return Boolean(normalizedSrc && loadedImagesCache.has(getCleanUrl(normalizedSrc)));
  });
  const [isFallback, setIsFallback] = useState(() => !normalizedSrc);

  const localRef = useRef(null);
  const isMountedRef = useRef(true);
  const retryTimerRef = useRef(null);
  const isFallbackRef = useRef(isFallback);

  useImperativeHandle(forwardedRef, () => localRef.current);

  // Synchronize fallback ref
  useEffect(() => {
    isFallbackRef.current = isFallback;
  }, [isFallback]);

  // Synchronize state when src prop changes
  useEffect(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    const clean = normalizeSrc(src);

    if (!clean) {
      setCurrentSrc(targetFallback);
      setIsFallback(true);
      isFallbackRef.current = true;
      setIsLoaded(true);
      setRetryCount(0);
      return;
    }

    const isAlreadyCached = loadedImagesCache.has(getCleanUrl(clean));
    setCurrentSrc(clean);
    setIsFallback(false);
    isFallbackRef.current = false;
    setIsLoaded(isAlreadyCached);
    setRetryCount(0);
  }, [src, targetFallback]);

  // Component mount & unmount lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    // Check if image was already cached by browser DOM
    if (localRef.current && localRef.current.complete && localRef.current.naturalWidth > 0) {
      setIsLoaded(true);
      const clean = getCleanUrl(currentSrc);
      if (clean) loadedImagesCache.add(clean);
    }

    return () => {
      isMountedRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [currentSrc]);

  // Smart Error & Retry Handler
  const handleError = useCallback(
    (e) => {
      // 1. If we are already displaying a fallback
      if (isFallbackRef.current || currentSrc === targetFallback || currentSrc === INLINE_FALLBACK_SVG) {
        if (currentSrc !== INLINE_FALLBACK_SVG) {
          setCurrentSrc(INLINE_FALLBACK_SVG);
          setIsFallback(true);
          isFallbackRef.current = true;
          setIsLoaded(true);
        }
        if (typeof onError === 'function') {
          onError(e);
        }
        return;
      }

      const clean = getCleanUrl(currentSrc) || normalizedSrc;

      // 2. Smart Retry Mechanism: Max 3 retries (Total 4 attempts)
      if (retryCount < MAX_RETRIES) {
        const nextRetry = retryCount + 1;
        const baseDelay = RETRY_DELAYS[nextRetry - 1] || 1500;
        const jitter = Math.floor(Math.random() * 250);
        const delay = baseDelay + jitter;

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

      // 3. Retries exhausted (>= MAX_RETRIES): Switch to fallback
      setIsFallback(true);
      isFallbackRef.current = true;
      setCurrentSrc(targetFallback);
      setIsLoaded(true);

      if (typeof onError === 'function') {
        onError(e);
      }
    },
    [currentSrc, normalizedSrc, retryCount, targetFallback, onError]
  );

  // Load Handler
  const handleLoad = useCallback(
    (e) => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      setIsLoaded(true);
      const clean = getCleanUrl(currentSrc);
      if (clean) {
        loadedImagesCache.add(clean);
      }

      if (typeof onLoad === 'function') {
        onLoad(e);
      }
    },
    [currentSrc, onLoad]
  );

  // Aspect ratio calculation to prevent Cumulative Layout Shift (CLS)
  const computedStyle = { ...style };

  // Resolve dimensions
  const resolvedWidth = width !== undefined ? width : (typeof src === 'object' ? src?.width : undefined);
  const resolvedHeight = height !== undefined ? height : (typeof src === 'object' ? src?.height : undefined);

  if (isFill) {
    computedStyle.position = computedStyle.position || 'absolute';
    computedStyle.inset = computedStyle.inset || 0;
    computedStyle.width = computedStyle.width || '100%';
    computedStyle.height = computedStyle.height || '100%';
    computedStyle.objectFit = objectFit || computedStyle.objectFit || 'cover';
    if (objectPosition) {
      computedStyle.objectPosition = objectPosition;
    }
  } else {
    if (aspectRatio) {
      computedStyle.aspectRatio = computedStyle.aspectRatio || aspectRatio;
    } else if (resolvedWidth && resolvedHeight && !computedStyle.aspectRatio) {
      const numW = typeof resolvedWidth === 'number' ? resolvedWidth : parseFloat(resolvedWidth);
      const numH = typeof resolvedHeight === 'number' ? resolvedHeight : parseFloat(resolvedHeight);
      if (!isNaN(numW) && !isNaN(numH) && numH > 0) {
        computedStyle.aspectRatio = `${numW} / ${numH}`;
      }
    }

    if (objectFit) {
      computedStyle.objectFit = objectFit;
    }
    if (objectPosition) {
      computedStyle.objectPosition = objectPosition;
    }
  }

  // Next.js blur placeholder support
  if (placeholder === 'blur' && blurDataURL && !isLoaded) {
    computedStyle.backgroundImage = computedStyle.backgroundImage || `url("${blurDataURL}")`;
    computedStyle.backgroundSize = computedStyle.backgroundSize || 'cover';
    computedStyle.backgroundPosition = computedStyle.backgroundPosition || 'center';
  }

  // Native lazy loading & priority hints
  const computedLoading = loading || (priority ? 'eager' : 'lazy');
  const computedDecoding = decoding || 'async';
  const priorityHint = fetchPriority || (priority ? 'high' : 'auto');

  // CSS classes for smooth skeleton and fade-in
  const computedClassName = [
    'optimized-image',
    isFill ? 'optimized-image-fill' : '',
    isLoaded ? 'loaded' : 'loading',
    isFallback ? 'fallback' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <img
      ref={localRef}
      src={currentSrc}
      alt={alt}
      width={isFill ? undefined : resolvedWidth}
      height={isFill ? undefined : resolvedHeight}
      className={computedClassName}
      style={computedStyle}
      loading={computedLoading}
      decoding={computedDecoding}
      fetchpriority={priorityHint}
      sizes={sizes}
      onClick={onClick}
      onLoad={handleLoad}
      onError={handleError}
      {...rest}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
