"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next-intl/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next-intl/client";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";

import { locales, type Locale } from "@/i18n/routing";

export function SiteHeader() {
  const t = useTranslations("Navigation");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { label: t("home"), href: "/" },
      {
        label: t("roadmap"),
        href: "https://github.com/FinishThatStory/FinishThatStory.com#finishthatstorycom-development-plan",
        external: true,
      },
      {
        label: t("guides"),
        href: "https://github.com/FinishThatStory/FinishThatStory.com/blob/main/README.md",
        external: true,
      },
    ],
    [t],
  );

  const handleLocaleChange = (nextLocale: Locale) => {
    if (nextLocale === locale) {
      return;
    }

    const query = searchParams.toString();

    startTransition(() => {
      router.replace(`${pathname}${query ? `?${query}` : ""}`, {
        locale: nextLocale,
      });
    });
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/80 backdrop-blur dark:border-zinc-800/60 dark:bg-black/60">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center gap-2 text-left text-base font-semibold tracking-tight text-zinc-900 transition hover:text-zinc-600 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none dark:text-zinc-100 dark:hover:text-zinc-300 dark:focus-visible:ring-zinc-600"
          >
            <span className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-1 text-white">
              FTS
            </span>
            <span className="hidden sm:inline">FinishThatStory.com</span>
          </Link>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-700 md:flex dark:text-zinc-300">
          {navItems.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-600"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMenu}
                className="transition hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-600"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher
            currentLocale={locale}
            onLocaleChange={handleLocaleChange}
            isPending={isPending}
          />
          <ThemeToggle />
          <AuthButtons />
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-600"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
          >
            <HamburgerIcon isOpen={isMenuOpen} />
          </button>
        </div>
      </div>
      <div
        className={`${
          isMenuOpen ? "grid" : "hidden"
        } border-t border-zinc-200 bg-white px-4 py-4 text-sm text-zinc-700 md:hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200`}
      >
        <nav className="flex flex-col gap-3">
          {navItems.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg px-3 py-2 transition hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-600"
                onClick={closeMenu}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg px-3 py-2 transition hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-600"
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <div className="mt-4 flex flex-col gap-4">
          <LanguageSwitcher
            currentLocale={locale}
            onLocaleChange={(value) => {
              handleLocaleChange(value);
              closeMenu();
            }}
            isPending={isPending}
            compact
          />
          <AuthButtons mobile onNavigate={closeMenu} />
        </div>
      </div>
    </header>
  );
}

function LanguageSwitcher({
  currentLocale,
  onLocaleChange,
  isPending,
  compact = false,
}: {
  currentLocale: string;
  onLocaleChange: (locale: Locale) => void;
  isPending: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("Navigation");

  return (
    <label className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
      <span className="text-zinc-500 dark:text-zinc-400">{t("language")}</span>
      <span className="relative">
        <select
          className="appearance-none rounded-full border border-zinc-200 bg-white px-3 py-2 pr-8 text-sm font-medium text-zinc-700 transition focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-zinc-600"
          value={currentLocale}
          onChange={(event) => onLocaleChange(event.target.value as Locale)}
          disabled={isPending}
          suppressHydrationWarning
        >
          {locales.map((value) => (
            <option key={value} value={value}>
              {t(`locale.${value}`)}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-zinc-500 dark:text-zinc-400">
          ▼
        </span>
      </span>
    </label>
  );
}

function AuthButtons({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations("Navigation");
  const classNames = mobile ? "flex flex-col gap-2" : "flex items-center gap-2";

  return (
    <div className={classNames}>
      <Link
        href="/auth/sign-in"
        onClick={onNavigate}
        className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-600"
      >
        {t("signIn")}
      </Link>
      <Link
        href="/auth/sign-up"
        onClick={onNavigate}
        className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-600"
      >
        {t("getStarted")}
      </Link>
    </div>
  );
}

function ThemeToggle() {
  const t = useTranslations("Navigation");
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isClient = typeof window !== "undefined";
  const currentTheme = isClient ? (resolvedTheme ?? theme) : undefined;
  const isDark = currentTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-600"
      aria-label={t("toggleTheme")}
    >
      {isClient ? (
        isDark ? (
          <SunIcon className="h-5 w-5" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )
      ) : (
        <span className="h-5 w-5 rounded-full border border-zinc-300 dark:border-zinc-600" />
      )}
    </button>
  );
}

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <span className="relative h-5 w-5">
      <span
        className={`absolute top-1/2 left-1/2 block h-[2px] w-5 -translate-x-1/2 -translate-y-1/2 transform bg-current transition ${
          isOpen ? "rotate-45" : "-translate-y-2"
        }`}
      />
      <span
        className={`absolute top-1/2 left-1/2 block h-[2px] w-5 -translate-x-1/2 -translate-y-1/2 bg-current transition ${
          isOpen ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute top-1/2 left-1/2 block h-[2px] w-5 -translate-x-1/2 -translate-y-1/2 transform bg-current transition ${
          isOpen ? "-rotate-45" : "translate-y-2"
        }`}
      />
    </span>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m16.95 7.95-1.41-1.41M6.46 6.46 5.05 5.05m12.72 0-1.41 1.41M6.46 17.54l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" />
    </svg>
  );
}
