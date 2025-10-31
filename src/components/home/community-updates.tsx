export type CommunityUpdate = {
  title: string;
  description: string;
  href: string;
  timeFrame: string;
};

type CommunityUpdatesProps = {
  items: CommunityUpdate[];
};

export function CommunityUpdates({ items }: CommunityUpdatesProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <a
          key={item.title}
          href={item.href}
          className="flex flex-col rounded-2xl border border-zinc-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-950/80 dark:hover:border-emerald-500/60 dark:focus-visible:ring-emerald-500"
        >
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold tracking-wide text-zinc-600 uppercase dark:bg-zinc-900 dark:text-zinc-300">
              {item.timeFrame}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{item.description}</p>
        </a>
      ))}
    </div>
  );
}
