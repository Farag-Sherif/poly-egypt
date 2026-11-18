import React from 'react';
import { Navigate, useLocation, useRoutes } from 'react-router-dom';
import AppShell from './AppShell';
import { I18nProvider, hasLocale } from '@/i18n/provider';
import { routeObjects } from './router/routes';
import { routing } from '@/i18n/routing';
import NotFoundPage from '@/app/not-found';

function RedirectMissingLocale() {
  const location = useLocation();
  const path = location.pathname === '/' ? '' : location.pathname;
  return <Navigate to={`/${routing.defaultLocale}${path}${location.search}${location.hash}`} replace />;
}

function LocaleGate() {
  const location = useLocation();
  const locale = location.pathname.split('/').filter(Boolean)[0] || routing.defaultLocale;

  if (!hasLocale(routing.locales, locale)) {
    if (location.pathname === '/') {
      return <RedirectMissingLocale />;
    }
    return <NotFoundPage />;
  }

  const element = useRoutes(routeObjects);
  return <I18nProvider locale={locale}>{element}</I18nProvider>;
}

export default function App() {
  return (
    <AppShell>
      <LocaleGate />
    </AppShell>
  );
}
