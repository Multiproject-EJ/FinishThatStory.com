"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next-intl/link";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { SocialAuthButtons, type SupportedProvider } from "@/components/auth/social-auth-buttons";

export default function SignUpPage() {
  const t = useTranslations("Auth.SignUp");
  const shared = useTranslations("Auth.Shared");
  const locale = useLocale();
  const { signUpWithPassword, signInWithOAuth, initializationError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<SupportedProvider | null>(null);

  const searchParams = useSearchParams();
  const requestedRedirect = searchParams?.get("redirect") ?? null;

  const safeRedirect = useMemo(() => {
    if (!requestedRedirect) {
      return null;
    }

    return requestedRedirect.startsWith("/") ? requestedRedirect : null;
  }, [requestedRedirect]);

  const emailRedirect = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const redirectPath = safeRedirect ?? "/";
    const url = new URL(`/${locale}${redirectPath}`, window.location.origin);

    return url.toString();
  }, [locale, safeRedirect]);

  const providerName = (provider: SupportedProvider) => shared(`oauthProvider.${provider}`);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (initializationError) {
      setErrorMessage(initializationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const { error } = await signUpWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: emailRedirect ?? undefined,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setStatusMessage(t("success", { email }));
      setEmail("");
      setPassword("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : shared("unexpectedError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthSignIn = async (provider: SupportedProvider) => {
    if (initializationError) {
      setErrorMessage(initializationError);
      return;
    }

    setOauthProvider(provider);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const { error } = await signInWithOAuth({
        provider,
        options: { redirectTo: emailRedirect ?? undefined },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setStatusMessage(shared("oauthRedirect", { provider: providerName(provider) }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : shared("unexpectedError"));
    } finally {
      setOauthProvider(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/30">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{t("subtitle")}</p>
        <div className="mt-8 flex flex-col gap-6">
          <SocialAuthButtons
            onSelect={handleOAuthSignIn}
            disabled={Boolean(initializationError) || isSubmitting}
            loadingProvider={oauthProvider}
          />
          <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" aria-hidden />
            {shared("oauthDivider")}
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" aria-hidden />
          </div>
        </div>
        <form className="mt-6 flex flex-col gap-6" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {shared("emailLabel")}
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={Boolean(initializationError) || isSubmitting}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base font-normal text-zinc-900 transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-800"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {shared("passwordLabel")}
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={Boolean(initializationError) || isSubmitting}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base font-normal text-zinc-900 transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-800"
            />
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
              {t("passwordHelp")}
            </span>
          </label>
          {errorMessage ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {errorMessage}
            </p>
          ) : null}
          {statusMessage ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
              {statusMessage}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={Boolean(initializationError) || isSubmitting}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-base font-medium text-white transition hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
          >
            {isSubmitting ? shared("loading") : t("submit")}
          </button>
        </form>
        <div className="mt-8 flex flex-col gap-3 text-sm text-zinc-600 dark:text-zinc-300">
          <p>
            {t("haveAccount")}{" "}
            <Link
              href={
                safeRedirect
                  ? `/auth/sign-in?redirect=${encodeURIComponent(safeRedirect)}`
                  : "/auth/sign-in"
              }
              className="font-medium text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-400"
            >
              {t("goToSignIn")}
            </Link>
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 transition hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-zinc-50"
          >
            ← {shared("backToHome")}
          </Link>
        </div>
        {initializationError ? (
          <p className="mt-6 rounded-2xl bg-amber-100/70 px-4 py-3 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
            {shared("supabaseMissing")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
