import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  defaultLocale: "en",
  localePrefix: "always",
  locales: ["en", "es"],
});

export const { defaultLocale, locales } = routing;
export type Locale = (typeof locales)[number];
