import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import './OptimizedImage.css';

const MAX_RETRIES = 2; // Max 2 retries (Attempt 1: immediate, Retry 1: ~700ms, Retry 2: ~1800ms)
const RETRY_1_DELAY = 700;
const RETRY_2_DELAY = 1800;
const DEFAULT_FALLBACK = '/images/placeholder.png';
const FAILED_URLS_KEY = 'polyegy_failed_images_v1';

// Failsafe self-contained inline SVG fallback (used if placeholder file is unreachable or missing)
const INLINE_FALLBACK_SVG =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='100%25' height='100%25'%3E%3Crect width='400' height='400' fill='%23f8f9fa'/%3E%3Cg fill='none' stroke='%23adb5bd' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' transform='translate(150, 140)'%3E%3Crect x='0' y='0' width='100' height='80' rx='8' ry='8' fill='%23ffffff' fill-opacity='0.6'/%3E%3Ccircle cx='35' cy='30' r='10'/%3E%3Cpath d='M10 70 L40 40 L65 60 L75 50 L90 70 Z'/%3E%3C/g%3E%3Ctext x='200' y='260' text-anchor='middle' fill='%236c757d' font-family='sans-serif' font-size='15' font-weight='500'%3EPolyEgy%3C/text%3E%3C/svg%3E";

// Module-level in-memory cache of definitively failed image URLs
const failedImageUrls = new Set();

// Safely hydrate failed image URLs from sessionStorage on client
if (typeof window !== 'undefined') {
  try {
    const raw = window.sessionStorage?.getItem(FAILED_URLS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((url) => {
          if (typeof url === 'string') failedImageUrls.add(url);
        });
      }
    }
  } catch {
    // Ignore sessionStorage quota or access errors
  }
}

/**
 * Records a URL as definitively failed across memory and sessionStorage
 */
function recordPermanentFailure(url) {
  if (!url || typeof url !== 'string' || url.startsWith('data:') || url.startsWith('blob:')) return;
  failedImageUrls.add(url);
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const list = Array.from(failedImageUrls).slice(-200); // Bound storage to latest 200 items
      window.sessionStorage.setItem(FAILED_URLS_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Checks if a URL is already marked as a definitive failure
 */
function isKnownFailure(url) {
  if (!url || typeof url !== 'string') return false;
  return failedImageUrls.has(url);
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
 * Removes retry-specific query params (_retry, _t) to obtain the canonical clean URL.
 * Preserves all application query parameters to maintain browser HTTP caching.
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
 * Builds a retry URL ONLY during retry attempts.
 * Preserves original params while appending attempt count and timestamp.
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

/**
 * OptimizedImage Component
 *
 * Provides:
 * - Native lazy loading & priority hints (`fetchPriority`)
 * - Async image decoding
 * - Cumulative Layout Shift (CLS) prevention via aspect ratio styling and dimension attributes
 * - Smooth fade-in and skeleton placeholder (`loading` vs `loaded` class)
 * - Exponential backoff jittered retry policy (Max 2 retries)
 * - Definitively failed URL prevention (memory + sessionStorage)
 * - Cascading fallback (/images/placeholder.png -> inline SVG)
 * - Full browser HTTP cache preservation (zero query params on successful/initial loads)
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
    if (isKnownFailure(normalizedSrc)) return targetFallback;
    // DO NOT append query parameters on initial loads!
    return normalizedSrc;
  };

  const [currentSrc, setCurrentSrc] = useState(getInitialSrc);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFallback, setIsFallback] = useState(() => !normalizedSrc || isKnownFailure(normalizedSrc));

  const localRef = useRef(null);
  const isMountedRef = useRef(true);
  const retryTimerRef = useRef(null);
  const isFallbackRef = useRef(isFallback);

  useImperativeHandle(forwardedRef, () => localRef.current);

  // Synchronize ref for immediate access inside async callbacks
  useEffect(() => {
    isFallbackRef.current = isFallback;
  }, [isFallback]);

  // Synchronize state when src or fallbackSrc changes
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

    if (isKnownFailure(clean)) {
      setCurrentSrc(targetFallback);
      setIsFallback(true);
      isFallbackRef.current = true;
      setIsLoaded(true);
      setRetryCount(0);
      return;
    }

    // New valid source
    setCurrentSrc(clean);
    setIsFallback(false);
    isFallbackRef.current = false;
    setIsLoaded(false);
    setRetryCount(0);
  }, [src, targetFallback]);

  // Component mount & unmount lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    // Check if image was already cached by browser
    if (localRef.current && localRef.current.complete && localRef.current.naturalWidth > 0) {
      setIsLoaded(true);
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
        // If external placeholder failed, fallback to the inline SVG failsafe
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

      // Check if URL was already marked as definitive failure in another component
      if (isKnownFailure(clean)) {
        setIsFallback(true);
        isFallbackRef.current = true;
        setCurrentSrc(targetFallback);
        setIsLoaded(true);
        if (typeof onError === 'function') onError(e);
        return;
      }

      // 2. Smart Retry Mechanism: Max 2 retries
      if (retryCount < MAX_RETRIES) {
        const nextRetry = retryCount + 1;
        // Retry 1: ~700ms + random jitter (0-200ms)
        // Retry 2: ~1800ms + random jitter (0-300ms)
        const baseDelay = nextRetry === 1 ? RETRY_1_DELAY : RETRY_2_DELAY;
        const jitter = Math.floor(Math.random() * (nextRetry === 1 ? 200 : 300));
        const delay = baseDelay + jitter;

        if (retryTimerRef.current) {
          clearTimeout(retryTimerRef.current);
        }

        retryTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          // Apply cache-busting query param ONLY on retry attempts
          const retryUrl = buildRetryUrl(clean || normalizedSrc, nextRetry);
          setRetryCount(nextRetry);
          setCurrentSrc(retryUrl);
        }, delay);

        if (typeof onError === 'function') {
          onError(e);
        }
        return;
      }

      // 3. Retries exhausted (>= MAX_RETRIES): Record definitive failure
      if (clean) {
        recordPermanentFailure(clean);
      }
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
      // Clear any pending retry timers
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      setIsLoaded(true);

      if (typeof onLoad === 'function') {
        onLoad(e);
      }
    },
    [onLoad]
  );

  // Aspect ratio calculation to prevent Cumulative Layout Shift (CLS)
  const computedStyle = { ...style };

  // Resolve dimensions from props or imported image objects
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
    // If not fill, prevent CLS by defining aspect ratio
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
      fetchPriority={priorityHint}
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
