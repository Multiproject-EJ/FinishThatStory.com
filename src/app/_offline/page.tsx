import Link from "next-intl/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { defaultLocale, locales, type Locale } from "@/i18n/routing";

const isSupportedLocale = (value: string | undefined): value is Locale =>
  typeof value === "string" && (locales as readonly string[]).includes(value);

function resolveLocaleFromCookies(): Locale {
  const cookieLocale = cookies().get("NEXT_LOCALE")?.value;

  if (isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  return defaultLocale;
}

export default async function OfflineFallbackPage() {
  const locale = resolveLocaleFromCookies();
  const t = await getTranslations({ locale, namespace: "Offline" });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 via-white to-zinc-100 px-6 py-16 text-center dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900">
      <div className="w-full max-w-xl space-y-8 rounded-3xl border border-zinc-200 bg-white/90 p-10 shadow-xl shadow-emerald-600/10 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-emerald-500/10">
        <span className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
          {t("badge")}
        </span>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-300">{t("description")}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("hint")}</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={`/${locale}`}
            className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold tracking-wide text-white uppercase transition hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400 dark:focus-visible:ring-emerald-300"
          >
            {t("actions.home")}
          </Link>
          <Link
            href={`/${locale}/stories`}
            className="inline-flex w-full items-center justify-center rounded-full border border-emerald-300 px-6 py-3 text-sm font-semibold tracking-wide text-emerald-700 uppercase transition hover:border-emerald-400 hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-emerald-500/40 dark:text-emerald-200 dark:hover:border-emerald-400 dark:hover:text-emerald-50 dark:focus-visible:ring-emerald-500"
          >
            {t("actions.library")}
          </Link>
        </div>
      </div>
    </main>
  );
}
