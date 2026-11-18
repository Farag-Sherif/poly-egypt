import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { getLocalizedHref } from '@/i18n/navigation';
import { setCurrentLocale } from '@/i18n/server';

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

  const [renderedContent, setRenderedContent] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [redirectTo, setRedirectTo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setRenderedContent(null);
    setMetadata(null);
    setRedirectTo(null);
    setCurrentLocale(locale);

    async function loadPage() {
      try {
        const mod = await importer();
        if (!active) return;

        // 1. Process metadata
        try {
          const nextMeta = mod.generateMetadata
            ? await mod.generateMetadata({ params })
            : mod.metadata || null;
          if (active) setMetadata(nextMeta || null);
        } catch {
          if (active) setMetadata(mod.metadata || null);
        }

        // 2. Render Page component
        const PageComponent = mod.default;
        if (!PageComponent) {
          if (active) setIsLoading(false);
          return;
        }

        if (isAsyncFunction(PageComponent)) {
          const result = await PageComponent({ params });
          if (!active) return;
          if (result && result.__redirect) {
            setRedirectTo(result.__redirect);
            setIsLoading(false);
            return;
          }
          setRenderedContent(result);
        } else {
          // Could be synchronous function or returning a Promise
          try {
            const result = PageComponent({ params });
            if (result && typeof result.then === 'function') {
              const asyncRes = await result;
              if (!active) return;
              if (asyncRes && asyncRes.__redirect) {
                setRedirectTo(asyncRes.__redirect);
                setIsLoading(false);
                return;
              }
              setRenderedContent(asyncRes);
            } else {
              setRenderedContent(<PageComponent params={params} />);
            }
          } catch (renderErr) {
            console.error("Error executing page component:", renderErr);
            setRenderedContent(<PageComponent params={params} />);
          }
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
