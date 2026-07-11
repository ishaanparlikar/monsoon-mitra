export const locales = ['en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'or', 'as', 'pa'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  bn: 'বাংলা',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  or: 'ଓଡ଼ିଆ',
  as: 'অসমীয়া',
  pa: 'ਪੰਜਾਬੀ',
};

export function isLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getLocaleFromPath(pathname: string): Locale | null {
  const segments = pathname.split('/').filter(Boolean);
  const potentialLocale = segments[0];
  return isLocale(potentialLocale) ? potentialLocale : null;
}

export function removeLocaleFromPath(pathname: string): string {
  const locale = getLocaleFromPath(pathname);
  if (!locale) return pathname;
  return pathname.slice(locale.length + 1) || '/';
}

export function addLocaleToPath(pathname: string, locale: Locale): string {
  if (locale === defaultLocale) return pathname;
  return `/${locale}${pathname}`;
}