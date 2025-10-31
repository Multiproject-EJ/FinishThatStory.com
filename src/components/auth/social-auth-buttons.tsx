"use client";

import type { Provider } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

const SUPPORTED_PROVIDERS = ["google", "github"] as const;

type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

type SocialAuthButtonsProps = {
  onSelect: (provider: SupportedProvider) => void | Promise<void>;
  disabled?: boolean;
  loadingProvider?: Provider | null;
};

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" role="img" focusable="false">
      <path
        fill="#EA4335"
        d="M12 11.001v3.922h5.453c-.237 1.237-1.348 3.627-5.453 3.627-3.286 0-5.968-2.715-5.968-6.05 0-3.337 2.682-6.052 5.968-6.052 1.868 0 3.125.795 3.842 1.482l2.617-2.523C17.079 3.791 14.779 2.8 12 2.8 6.832 2.8 2.656 6.918 2.656 12s4.176 9.2 9.344 9.2c5.401 0 8.977-3.789 8.977-9.118 0-.613-.066-1.082-.146-1.581H12Z"
      />
      <path
        fill="#34A853"
        d="M3.964 7.383 7.08 9.67c.84-2.534 3.106-4.365 5.92-4.365 1.868 0 3.125.795 3.842 1.482l2.617-2.523C17.079 3.791 14.779 2.8 12 2.8c-3.9 0-7.213 2.229-8.036 5.347"
      />
      <path
        fill="#4A90E2"
        d="M12 21.2c3.1 0 5.7-1.02 7.599-2.771l-3.49-2.858c-.944.662-2.148 1.115-4.109 1.115-3.295 0-6.07-2.715-6.07-6.05 0-.947.212-1.845.588-2.643l-3.554-2.61C2.626 7.239 2 9.521 2 12c0 5.082 4.176 9.2 9.344 9.2Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 16.617c.783 3.118 4.097 5.347 8.036 5.347 2.779 0 5.079-.99 6.699-2.618l-3.49-2.858c-.944.662-2.148 1.115-4.109 1.115-3.099 0-5.679-2.1-6.135-4.883"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" role="img" focusable="false">
      <path
        fill="currentColor"
        d="M12 .5C5.648.5.5 5.648.5 12c0 5.087 3.292 9.395 7.864 10.916.575.105.785-.25.785-.556 0-.274-.01-1.002-.015-1.968-3.2.695-3.875-1.543-3.875-1.543-.523-1.33-1.278-1.684-1.278-1.684-1.044-.714.079-.7.079-.7 1.154.081 1.762 1.186 1.762 1.186 1.027 1.762 2.695 1.253 3.352.957.105-.744.402-1.253.731-1.541-2.553-.291-5.236-1.277-5.236-5.686 0-1.256.45-2.283 1.186-3.087-.119-.29-.514-1.46.112-3.043 0 0 .966-.309 3.168 1.179a10.96 10.96 0 0 1 2.883-.388c.977.005 1.963.132 2.883.388 2.202-1.488 3.168-1.179 3.168-1.179.626 1.583.231 2.753.113 3.043.739.804 1.185 1.831 1.185 3.087 0 4.42-2.688 5.39-5.255 5.676.413.356.781 1.062.781 2.144 0 1.548-.014 2.795-.014 3.176 0 .308.208.667.79.554C20.212 21.39 23.5 17.083 23.5 12 23.5 5.648 18.352.5 12 .5Z"
      />
    </svg>
  );
}

export function SocialAuthButtons({
  onSelect,
  disabled = false,
  loadingProvider = null,
}: SocialAuthButtonsProps) {
  const t = useTranslations("Auth.Social");

  const providerConfigs = useMemo(
    () =>
      SUPPORTED_PROVIDERS.map((provider) => ({
        provider,
        label: t(`buttons.${provider}`),
        icon: provider === "google" ? <GoogleIcon /> : <GithubIcon />,
        isLoading: loadingProvider === provider,
      })),
    [t, loadingProvider],
  );

  return (
    <div className="flex flex-col gap-3">
      {providerConfigs.map(({ provider, label, icon, isLoading }) => (
        <button
          key={provider}
          type="button"
          onClick={() => onSelect(provider)}
          disabled={disabled || isLoading}
          aria-busy={isLoading}
          className="inline-flex items-center justify-center gap-3 rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:focus-visible:ring-emerald-400"
        >
          <span className="flex items-center justify-center rounded-full bg-white p-1 text-base text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
            {icon}
          </span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

export type { SupportedProvider };
