import { redirect } from "next/navigation";

import { getDemoReaderRedirect } from "@/lib/demo/storyReaderDemo";
import { fetchReaderChapter } from "@/lib/storyReader";

export default async function StoryReaderRedirect({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const data = await fetchReaderChapter(params.slug);

  if (!data) {
    const fallbackChapterId = getDemoReaderRedirect(params.slug);

    if (!fallbackChapterId) {
      redirect(`/${params.locale}/stories/${params.slug}`);
    }

    redirect(`/${params.locale}/stories/${params.slug}/read/${fallbackChapterId}`);
  }

  redirect(`/${params.locale}/stories/${params.slug}/read/${data.chapter.id}`);
}
