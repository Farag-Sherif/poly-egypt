import { getMessagesForLocale } from './provider';
import { routing } from './routing';

let currentLocale = routing.defaultLocale;

function getValueByPath(object, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), object);
}

export function setCurrentLocale(locale) {
  currentLocale = locale || routing.defaultLocale;
}

export async function getLocale() {
  return currentLocale;
}

export async function getTranslations(arg) {
  let locale = currentLocale;
  let namespace = undefined;

  if (typeof arg === 'string') {
    namespace = arg;
  } else if (arg && typeof arg === 'object') {
    locale = arg.locale || currentLocale;
    namespace = arg.namespace;
  }

  const messages = getMessagesForLocale(locale);
  return (key) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return getValueByPath(messages, fullKey) ?? key;
  };
}

export function setRequestLocale(locale) {
  currentLocale = locale || routing.defaultLocale;
}
