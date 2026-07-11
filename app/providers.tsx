'use client';

import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { AbstractIntlMessages } from 'next-intl';

interface ProvidersProps {
  children: ReactNode;
  messages: AbstractIntlMessages;
}

export function Providers({ children, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

export async function getMessagesForLocale(locale: string) {
  try {
    return await getMessages({ locale });
  } catch {
    notFound();
  }
}