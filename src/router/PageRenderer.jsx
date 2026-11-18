import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { getLocalizedHref } from '@/i18n/navigation';
import { setCurrentLocale } from '@/i18n/server';

function isAsyncFunction(fn) {
  return fn && fn.constructor && fn.constructor.name === 'AsyncFunction';
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
  const [module, setModule] = useState(null);
  const [asyncElement, setAsyncElement] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [redirectTo, setRedirectTo] = useState(null);

  useEffect(() => {
    let active = true;
    importer().then((mod) => {
      if (active) setModule(mod);
    });
    return () => {
      active = false;
    };
  }, [importer]);

  useEffect(() => {
    let active = true;
    if (!module) return undefined;

    const run = async () => {
      setCurrentLocale(locale);
      setRedirectTo(null);
      setAsyncElement(null);

      try {
        const nextMetadata = module.generateMetadata
          ? await module.generateMetadata({ params })
          : module.metadata || null;
        if (active) setMetadata(nextMetadata || null);
      } catch {
        if (active) setMetadata(module.metadata || null);
      }

      const PageComponent = module.default;
      if (isAsyncFunction(PageComponent)) {
        const rendered = await PageComponent({ params });
        if (!active) return;
        if (rendered && rendered.__redirect) {
          setRedirectTo(rendered.__redirect);
          return;
        }
        setAsyncElement(rendered);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [module, locale, location.key, JSON.stringify(params)]);

  if (!module) return null;
  if (redirectTo) return <Navigate to={getLocalizedHref(redirectTo, locale)} replace />;

  const PageComponent = module.default;
  return (
    <>
      <MetadataHelmet metadata={metadata} />
      {isAsyncFunction(PageComponent) ? asyncElement : <PageComponent params={params} />}
    </>
  );
}
