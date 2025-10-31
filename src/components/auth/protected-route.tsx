"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next-intl/client";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";

type ProtectedRouteProps = {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
};

export function ProtectedRoute({
  children,
  fallback = null,
  redirectTo = "/auth/sign-in",
}: ProtectedRouteProps) {
  const { user, isLoading, initializationError } = useAuth();
  const t = useTranslations("Auth.Shared");
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectInitiatedRef = useRef(false);

  const currentPath = useMemo(() => {
    const query = searchParams?.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  const sanitizedRedirectTarget = useMemo(() => {
    if (!redirectTo.startsWith("/")) {
      return "/auth/sign-in";
    }

    return redirectTo;
  }, [redirectTo]);

  useEffect(() => {
    if (isLoading || initializationError || user || redirectInitiatedRef.current) {
      return;
    }

    redirectInitiatedRef.current = true;

    const separator = sanitizedRedirectTarget.includes("?") ? "&" : "?";
    const destination = `${sanitizedRedirectTarget}${separator}redirect=${encodeURIComponent(currentPath)}`;

    router.replace(destination, { locale });
  }, [currentPath, initializationError, isLoading, locale, router, sanitizedRedirectTarget, user]);

  if (initializationError) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-3 rounded-3xl border border-amber-300/70 bg-amber-50 px-6 py-5 text-amber-900 dark:border-amber-500/40 dark:bg-amber-400/10 dark:text-amber-200">
        <p className="text-sm font-medium">{t("supabaseMissing")}</p>
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-20 text-center text-sm text-zinc-600 dark:text-zinc-300">
      <span
        className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent"
        aria-hidden
      />
      <p>{t("redirectingToSignIn")}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("signInRequired")}</p>
    </div>
  );
}
