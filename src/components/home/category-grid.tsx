export type CategoryCard = {
  title: string;
  description: string;
  href: string;
  icon?: string;
};

type CategoryGridProps = {
  categories: CategoryCard[];
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => (
        <a
          key={category.title}
          href={category.href}
          className="group flex flex-col rounded-2xl border border-zinc-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:border-emerald-500/60 dark:focus-visible:ring-emerald-500"
        >
          <span
            aria-hidden="true"
            className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600 transition group-hover:scale-110 dark:bg-emerald-500/10 dark:text-emerald-200"
          >
            {category.icon ?? ""}
          </span>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {category.title}
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{category.description}</p>
        </a>
      ))}
    </div>
  );
}
