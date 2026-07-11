import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';
import { AppProvider } from '@/components/AppContext';
import { AuthProvider } from '@/components/AuthProvider';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { Inter } from 'next/font/google';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Monsoon Mitra',
  description: 'Monsoon Preparedness and Citizen Assistance for Mumbai',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eff1f5' },
    { media: '(prefers-color-scheme: dark)', color: '#1e1e2e' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: resolvedLocale } = await params;

  if (!routing.locales.includes(resolvedLocale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale: resolvedLocale });

  return (
    <html lang={resolvedLocale} suppressHydrationWarning className="dark">
      <body className={`${inter.className} selection:bg-primary/30 antialiased`}>
        <ServiceWorkerRegistration />
        <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
          <AuthProvider>
            <AppProvider>
              {children}
            </AppProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
