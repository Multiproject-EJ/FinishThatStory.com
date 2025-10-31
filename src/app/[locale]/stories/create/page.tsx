import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { StoryComposer } from "@/components/story/story-composer";

type PageParams = {
  params: {
    locale: string;
  };
};

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "StoryComposer" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default function CreateStoryPage({ params }: PageParams) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      <StoryComposer locale={params.locale} />
    </div>
  );
}
