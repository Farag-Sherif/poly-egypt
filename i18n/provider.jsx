import React, { createContext, useContext, useMemo } from 'react';
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';
import { routing } from './routing';

const I18nContext = createContext({ locale: routing.defaultLocale, messages: enMessages });
const allMessages = { en: enMessages, ar: arMessages };

function getValueByPath(object, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), object);
}

export function hasLocale(locales, locale) {
  return locales.includes(locale);
}

export function I18nProvider({ locale, children }) {
  const value = useMemo(() => ({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    messages: allMessages[locale] || allMessages[routing.defaultLocale],
  }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale() {
  return useContext(I18nContext).locale;
}

export function useTranslations(namespace) {
  const { messages } = useContext(I18nContext);
  return (key) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return getValueByPath(messages, fullKey) ?? key;
  };
}

export function getMessagesForLocale(locale) {
  return allMessages[locale] || allMessages[routing.defaultLocale];
}

export default I18nProvider;
