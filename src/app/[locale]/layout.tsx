import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LocalePreferenceSync } from "@/components/locale-preference-sync";
import { SiteHeader } from "@/components/site-header";
import { UnderConstructionOverlay } from "@/components/under-construction-overlay";
import { ThemeProvider } from "@/components/theme-provider";
import { locales, type Locale } from "@/i18n/routing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FinishThatStory.com",
    template: "%s · FinishThatStory.com",
  },
  description:
    "FinishThatStory.com is a collaborative storytelling platform for sharing text, audio, video, and interactive narratives.",
};

const isSupportedLocale = (value: string): value is Locale => locales.includes(value as Locale);

const localeDirections: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  es: "ltr",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  const direction = localeDirections[locale];

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
            <AuthProvider>
              <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-50 via-white to-slate-100 text-zinc-900 transition-colors dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:text-zinc-100">
                <LocalePreferenceSync />
                <UnderConstructionOverlay />
                <SiteHeader />
                <main className="flex-1">{children}</main>
              </div>
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
