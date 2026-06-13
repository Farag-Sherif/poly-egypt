import React from 'react';
import { Navigate } from 'react-router-dom';
import PageRenderer from './PageRenderer';
import NotFoundPage from '@/app/not-found';
import { routing } from '@/i18n/routing';

const pageModules = import.meta.glob('../../app/[locale]/**/page.jsx');

function sanitizeParamName(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

function buildRouteEntry(filePath, importer) {
  const relative = filePath
    .replace('../../app/[locale]', '')
    .replace(/\/page\.jsx$/, '')
    .replace(/\([^/]+\)\//g, '/');

  const segments = relative.split('/').filter(Boolean);
  const paramMap = {};
  const routeSegments = segments.map((segment) => {
    const match = segment.match(/^\[(.+)\]$/);
    if (!match) return segment;
    const original = match[1];
    const sanitized = sanitizeParamName(original);
    paramMap[sanitized] = original;
    return `:${sanitized}`;
  });

  const suffix = routeSegments.length ? `/${routeSegments.join('/')}` : '';
  return {
    path: `/:locale${suffix}`,
    element: <PageRenderer importer={importer} paramMap={paramMap} />,
  };
}

const generatedRoutes = Object.entries(pageModules)
  .map(([filePath, importer]) => buildRouteEntry(filePath, importer))
  .sort((a, b) => a.path.localeCompare(b.path));

export const routeObjects = [
  { path: '/', element: <Navigate to={`/${routing.defaultLocale}`} replace /> },
  ...generatedRoutes,
  { path: '*', element: <NotFoundPage /> },
];
