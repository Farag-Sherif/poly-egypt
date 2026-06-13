import React from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { routing } from './routing';

export function stripLocalePrefix(pathname = '/') {
  const [first, ...rest] = pathname.split('/').filter(Boolean);
  if (routing.locales.includes(first)) {
    return `/${rest.join('/')}` || '/';
  }
  return pathname || '/';
}

export function getLocalizedHref(href = '/', locale = routing.defaultLocale) {
  if (!href) return `/${locale}`;
  if (/^(https?:|mailto:|tel:|#)/.test(href)) return href;
  if (href.startsWith(`/${locale}`)) return href;
  const normalized = href.startsWith('/') ? href : `/${href}`;
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
}

export function Link({ href = '/', locale, to, ...props }) {
  const currentLocation = useLocation();
  const currentLocale = currentLocation.pathname.split('/').filter(Boolean)[0] || routing.defaultLocale;
  return <RouterLink to={getLocalizedHref(to || href, locale || currentLocale)} {...props} />;
}

export function usePathname() {
  return stripLocalePrefix(useLocation().pathname);
}

export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentLocale = location.pathname.split('/').filter(Boolean)[0] || routing.defaultLocale;
  return {
    push: (href, options = {}) => navigate(getLocalizedHref(href, options.locale || currentLocale)),
    replace: (href, options = {}) => navigate(getLocalizedHref(href, options.locale || currentLocale), { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
  };
}

export function getPathname(href, locale = routing.defaultLocale) {
  return getLocalizedHref(href, locale);
}

export function redirect(href, locale = routing.defaultLocale) {
  return { __redirect: getLocalizedHref(href, locale) };
}

export function notFound() {
  return { __redirect: getLocalizedHref('/404') };
}

export default Link;
