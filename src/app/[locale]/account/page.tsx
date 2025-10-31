"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";

export default function AccountPage() {
  const t = useTranslations("Account");
  const { user } = useAuth();

  const metadataEntries = useMemo(
    () => Object.entries(user?.user_metadata ?? {}),
    [user?.user_metadata],
  );

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
        <section className="grid gap-4 rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-8 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-200">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t("profileHeading")}
            </h2>
            <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium tracking-wide text-zinc-600 uppercase dark:bg-zinc-800 dark:text-zinc-300">
              {t("comingSoon")}
            </span>
          </div>
          {metadataEntries.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-100 text-xs tracking-wide text-zinc-500 uppercase dark:bg-zinc-900/60 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">{t("profileKey")}</th>
                    <th className="px-4 py-3">{t("profileValue")}</th>
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
          ) : (
            <p className="rounded-2xl bg-zinc-100 px-4 py-5 text-sm text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-300">
              {t("profilePlaceholder")}
            </p>
          )}
        </section>
      </div>
    </ProtectedRoute>
  );
}
