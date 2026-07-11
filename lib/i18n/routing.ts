import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te', 'ml', 'kn', 'pa', 'or', 'as', 'ur'],

  // Used when no locale matches
  defaultLocale: 'en',

  // The prefix for the locale in the pathname
  localePrefix: 'as-needed',
});