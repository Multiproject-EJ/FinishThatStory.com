"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { getUserProfile, upsertUserProfile } from "@/lib/profiles";

export default function AccountPage() {
  const t = useTranslations("Account");
  const { user, initializationError } = useAuth();

  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle",
  );
  const [formValues, setFormValues] = useState({
    username: "",
    avatar: "",
    bio: "",
    language: "en",
  });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const metadataEntries = useMemo(
    () => Object.entries(user?.user_metadata ?? {}),
    [user?.user_metadata],
  );

  useEffect(() => {
    if (profileStatus !== "success") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setProfileStatus("idle");
    }, 4000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [profileStatus]);

  useEffect(() => {
    if (!user?.id || initializationError) {
      return;
    }

    let isActive = true;

    async function loadProfile() {
      try {
        const supabase = createSupabaseBrowserClient();
        const nextProfile = await getUserProfile(supabase, user.id);

        if (!isActive) {
          return;
        }

        setProfileStatus("idle");
        setFormValues({
          username: nextProfile?.username ?? user.user_metadata?.full_name ?? "",
          avatar: nextProfile?.avatar ?? "",
          bio: nextProfile?.bio ?? "",
          language: nextProfile?.language ?? "en",
        });
        setLastUpdated(nextProfile?.updated_at ?? null);
        setProfileError(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const message = error instanceof Error ? error.message : t("profileLoadUnknownError");
        setProfileError(message);
      }
    }

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [user?.id, user?.user_metadata?.full_name, initializationError, t]);

  const isProfileDisabled = Boolean(initializationError);

  function updateFormValue(field: "username" | "avatar" | "bio" | "language", value: string) {
    setFormValues((previous) => ({
      ...previous,
      [field]: value,
    }));

    setProfileStatus((current) => (current === "saving" ? current : "idle"));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user?.id || isProfileDisabled) {
      return;
    }

    setProfileStatus("saving");

    try {
      const supabase = createSupabaseBrowserClient();
      const updatedProfile = await upsertUserProfile(supabase, user.id, {
        username: formValues.username.trim() || null,
        avatar: formValues.avatar.trim() || null,
        bio: formValues.bio.trim() || null,
        language: formValues.language || null,
      });

      setLastUpdated(updatedProfile.updated_at);
      setProfileStatus("success");
      setProfileError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("profileSaveUnknownError");
      setProfileError(message);
      setProfileStatus("error");
    }
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <span className="inline-flex w-fit items-center justify-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium tracking-wide text-emerald-700 uppercase dark:bg-emerald-500/10 dark:text-emerald-300">
            {t("badge")}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("subtitle")}</p>
        </header>
        <section className="grid gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid gap-1">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              {t("sessionHeading")}
            </h2>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {user?.email ?? t("sessionFallback")}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("sessionDescription")}</p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">{t("userId")}</dt>
              <dd className="truncate font-mono text-sm text-zinc-800 dark:text-zinc-100">
                {user?.id}
              </dd>
            </div>
            <div className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">{t("createdAt")}</dt>
              <dd className="font-mono text-sm text-zinc-800 dark:text-zinc-100">
                {user?.created_at
                  ? new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(user.created_at))
                  : t("unknownDate")}
              </dd>
            </div>
          </dl>
        </section>
        <section className="grid gap-6 rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-8 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-200">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {t("profileHeading")}
              </h2>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium tracking-wide text-emerald-600 uppercase dark:bg-emerald-400/10 dark:text-emerald-300">
                {t("profileStatusReady")}
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("profileDescription")}</p>
            {lastUpdated ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                {t("profileLastUpdated", {
                  date: new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(lastUpdated)),
                })}
              </p>
            ) : null}
          </div>

          {isProfileDisabled ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
              {t("profileEnvironmentError")}
            </p>
          ) : null}

          {profileError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
              {profileError}
            </p>
          ) : null}

          <form className="grid gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label
                className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
                htmlFor="username"
              >
                {t("profileUsernameLabel")}
              </label>
              <input
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 ring-emerald-500 transition outline-none focus:border-emerald-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                id="username"
                name="username"
                placeholder={t("profileUsernamePlaceholder")}
                value={formValues.username}
                onChange={(event) => updateFormValue("username", event.target.value)}
                disabled={isProfileDisabled || profileStatus === "saving"}
                maxLength={60}
                autoComplete="nickname"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("profileUsernameHelp")}</p>
            </div>

            <div className="grid gap-2">
              <label
                className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
                htmlFor="avatar"
              >
                {t("profileAvatarLabel")}
              </label>
              <input
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 ring-emerald-500 transition outline-none focus:border-emerald-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                id="avatar"
                name="avatar"
                placeholder={t("profileAvatarPlaceholder")}
                value={formValues.avatar}
                onChange={(event) => updateFormValue("avatar", event.target.value)}
                disabled={isProfileDisabled || profileStatus === "saving"}
                autoComplete="url"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("profileAvatarHelp")}</p>
            </div>

            <div className="grid gap-2">
              <label
                className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
                htmlFor="bio"
              >
                {t("profileBioLabel")}
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 ring-emerald-500 transition outline-none focus:border-emerald-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                id="bio"
                name="bio"
                placeholder={t("profileBioPlaceholder")}
                value={formValues.bio}
                onChange={(event) => updateFormValue("bio", event.target.value)}
                disabled={isProfileDisabled || profileStatus === "saving"}
                maxLength={500}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("profileBioHelp")}</p>
            </div>

            <div className="grid gap-2">
              <label
                className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
                htmlFor="language"
              >
                {t("profileLanguageLabel")}
              </label>
              <select
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 ring-emerald-500 transition outline-none focus:border-emerald-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                id="language"
                name="language"
                value={formValues.language}
                onChange={(event) => updateFormValue("language", event.target.value)}
                disabled={isProfileDisabled || profileStatus === "saving"}
              >
                <option value="en">{t("profileLanguageEnglish")}</option>
                <option value="es">{t("profileLanguageSpanish")}</option>
              </select>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("profileLanguageHelp")}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-600/60"
                disabled={isProfileDisabled || profileStatus === "saving"}
              >
                {profileStatus === "saving" ? t("profileSaving") : t("profileSubmit")}
              </button>
              {profileStatus === "success" ? (
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                  {t("profileSuccess")}
                </p>
              ) : null}
              {profileStatus === "error" && !profileError ? (
                <p className="text-xs font-medium text-red-600 dark:text-red-300">
                  {t("profileSaveUnknownError")}
                </p>
              ) : null}
            </div>
          </form>

          <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t("profilePreviewTitle")}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {t("profilePreviewDescription")}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                {formValues.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={t("profileAvatarAlt", {
                      username: formValues.username || t("profilePreviewFallbackName"),
                    })}
                    className="h-full w-full object-cover"
                    src={formValues.avatar}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                    {formValues.username?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {formValues.username || user?.email || t("profilePreviewFallbackName")}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-500">
                  {formValues.language === "es"
                    ? t("profileLanguageSpanish")
                    : t("profileLanguageEnglish")}
                </span>
              </div>
            </div>
            <p className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
              {formValues.bio || t("profilePreviewBioFallback")}
            </p>
          </div>

          {metadataEntries.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-100 text-xs tracking-wide text-zinc-500 uppercase dark:bg-zinc-900/60 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">{t("metadataKey")}</th>
                    <th className="px-4 py-3">{t("metadataValue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {metadataEntries.map(([key, value]) => (
                    <tr
                      key={key}
                      className="border-t border-zinc-100 text-zinc-700 dark:border-zinc-800 dark:text-zinc-200"
                    >
                      <td className="px-4 py-3 font-medium">{key}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </ProtectedRoute>
  );
}
