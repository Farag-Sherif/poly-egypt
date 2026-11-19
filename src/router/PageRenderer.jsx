import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { getLocalizedHref } from '@/i18n/navigation';
import { setCurrentLocale } from '@/i18n/server';

// Module-level in-memory cache for dynamic module imports
const moduleCache = new Map();

// Module-level in-memory cache for rendered pages (persists during SPA session, resets on full refresh)
const pageCache = new Map();

function isAsyncFunction(fn) {
  if (!fn) return false;
  return (
    fn.constructor?.name === 'AsyncFunction' ||
    fn[Symbol.toStringTag] === 'AsyncFunction' ||
    Object.prototype.toString.call(fn) === '[object AsyncFunction]'
  );
}

function buildPageParams(rawParams, paramMap) {
  const params = {};
  Object.entries(rawParams).forEach(([key, value]) => {
    params[paramMap[key] || key] = value;
  });
  return params;
}

function MetadataHelmet({ metadata }) {
  if (!metadata) return null;
  return (
    <Helmet>
      {metadata.title ? <title>{metadata.title}</title> : null}
      {metadata.description ? (
        <meta name="description" content={metadata.description} />
      ) : null}
    </Helmet>
  );
}

export default function PageRenderer({ importer, paramMap = {} }) {
  const rawParams = useParams();
  const location = useLocation();
  const params = useMemo(() => buildPageParams(rawParams, paramMap), [rawParams, paramMap]);
  const locale = params.locale || 'en';

  const pageKey = `${locale}:${location.pathname}${location.search}`;
  const cachedPage = pageCache.get(pageKey);

  const [renderedContent, setRenderedContent] = useState(() => cachedPage?.content || null);
  const [metadata, setMetadata] = useState(() => cachedPage?.metadata || null);
  const [redirectTo, setRedirectTo] = useState(null);
  const [isLoading, setIsLoading] = useState(() => !cachedPage);

  useEffect(() => {
    let active = true;
    setCurrentLocale(locale);

    const currentKey = `${locale}:${location.pathname}${location.search}`;
    const existingCache = pageCache.get(currentKey);

    // If page was already visited and cached, restore instantly without showing loading spinner
    if (existingCache) {
      setRenderedContent(existingCache.content);
      setMetadata(existingCache.metadata);
      setIsLoading(false);
      return;
    }

    // New page: start loading
    setIsLoading(true);
    setRenderedContent(null);
    setMetadata(null);
    setRedirectTo(null);

    async function loadPage() {
      try {
        let mod = moduleCache.get(importer);
        if (!mod) {
          mod = await importer();
          moduleCache.set(importer, mod);
        }
        if (!active) return;

        // 1. Process metadata
        let nextMeta = mod.metadata || null;
        try {
          if (mod.generateMetadata) {
            nextMeta = (await mod.generateMetadata({ params })) || mod.metadata || null;
          }
        } catch {
          nextMeta = mod.metadata || null;
        }
        if (active) setMetadata(nextMeta);

        // 2. Render Page component
        const PageComponent = mod.default;
        if (!PageComponent) {
          if (active) setIsLoading(false);
          return;
        }

        let contentToRender = null;
        if (isAsyncFunction(PageComponent)) {
          const result = await PageComponent({ params });
          if (!active) return;
          if (result && result.__redirect) {
            setRedirectTo(result.__redirect);
            setIsLoading(false);
            return;
          }
          contentToRender = result;
        } else {
          contentToRender = <PageComponent params={params} />;
        }

        if (active && contentToRender) {
          pageCache.set(currentKey, {
            content: contentToRender,
            metadata: nextMeta,
          });
          setRenderedContent(contentToRender);
        }
      } catch (err) {
        console.error("Failed to load page module:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [importer, locale, location.pathname, location.search]);

  if (redirectTo) {
    return <Navigate to={getLocalizedHref(redirectTo, locale)} replace />;
  }

  return (
    <>
      <MetadataHelmet metadata={metadata} />
      {isLoading ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "60vh" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        renderedContent
      )}
    </>
  );
}
