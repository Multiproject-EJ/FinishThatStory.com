"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next-intl/client";

import { useAuth } from "@/components/auth/auth-provider";
import { locales, type Locale } from "@/i18n/routing";
import { getUserProfile } from "@/lib/profiles";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

const isSupportedLocale = (value?: string | null): value is Locale =>
  typeof value === "string" && locales.includes(value as Locale);

export function LocalePreferenceSync() {
  const { user, initializationError } = useAuth();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const hasSyncedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || initializationError) {
      hasSyncedRef.current = false;
      lastUserIdRef.current = null;
      return;
    }

    if (hasSyncedRef.current && lastUserIdRef.current === user.id) {
      return;
    }

    lastUserIdRef.current = user.id;

    let isActive = true;

    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const profile = await getUserProfile(supabase, user.id);

        if (!isActive) {
          return;
        }

        const preferred = profile?.language;

        if (isSupportedLocale(preferred) && preferred !== locale) {
          const search = typeof window !== "undefined" ? window.location.search : "";
          router.replace(`${pathname}${search}`, { locale: preferred });
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Failed to sync locale preference", error);
        }
      } finally {
        if (isActive) {
          hasSyncedRef.current = true;
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [user?.id, initializationError, locale, router, pathname]);

  return null;
}
