import type { ReactNode } from "react";

type HomeSectionProps = {
  title: string;
  description: string;
  eyebrow?: string;
  cta?: { label: string; href: string };
  children: ReactNode;
};

export function HomeSection({ title, description, eyebrow, cta, children }: HomeSectionProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl space-y-4">
          {eyebrow ? (
            <span className="inline-flex items-center rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-600 uppercase shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              {eyebrow}
            </span>
          ) : null}
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
              {title}
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-300">{description}</p>
          </div>
        </div>
        {cta ? (
          <a
            href={cta.href}
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-zinc-50 dark:focus-visible:ring-emerald-500"
          >
            {cta.label}
          </a>
        ) : null}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}
