import type { ReactNode } from "react";

export type StoryCarouselItem = {
  title: string;
  description: string;
  author: string;
  href: string;
  badges?: Array<{ label: string; icon?: ReactNode }>;
};

type StoryCarouselProps = {
  items: StoryCarouselItem[];
  ctaLabel: string;
};

export function StoryCarousel({ items, ctaLabel }: StoryCarouselProps) {
  return (
    <div className="group relative">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white via-white/80 to-transparent transition md:w-10 dark:from-zinc-950 dark:via-zinc-950/80"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white via-white/80 to-transparent transition md:w-10 dark:from-zinc-950 dark:via-zinc-950/80"
        aria-hidden
      />
      <ul
        className="flex snap-x snap-mandatory scroll-p-4 gap-4 overflow-x-auto pr-6 pb-6 pl-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {items.map((item) => (
          <li key={item.title} className="snap-start">
            <article className="flex h-full min-w-[18rem] flex-col justify-between rounded-2xl border border-zinc-200 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950/80">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {item.badges?.map(({ label, icon }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200"
                    >
                      {icon}
                      {label}
                    </span>
                  ))}
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{item.description}</p>
              </div>
              <footer className="mt-6 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                <span>{item.author}</span>
                <a
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold tracking-wide text-zinc-700 uppercase transition hover:border-zinc-300 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-zinc-50 dark:focus-visible:ring-emerald-500"
                >
                  {ctaLabel}
                  <span aria-hidden="true">→</span>
                  <span className="sr-only">
                    {ctaLabel}: {item.title}
                  </span>
                </a>
              </footer>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
