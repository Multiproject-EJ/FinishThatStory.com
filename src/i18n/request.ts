import { getRequestConfig } from "next-intl/server";

import { defaultLocale, locales, type Locale } from "@/i18n/routing";

const loadMessages = async (locale: Locale) => {
  switch (locale) {
    case "es":
      return (await import("@/messages/es.json")).default;
    case "en":
    default:
      return (await import("@/messages/en.json")).default;
  }
};

const isSupportedLocale = (value?: string): value is Locale =>
  value ? locales.includes(value as Locale) : false;

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  const resolvedLocale = isSupportedLocale(locale) ? locale : defaultLocale;

  return {
    locale: resolvedLocale,
    messages: await loadMessages(resolvedLocale),
  };
});
