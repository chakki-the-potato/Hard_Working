import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentList } from "@/components/site/content-list";
import { paginate } from "@/lib/content/pagination";
import { listPublishedPosts } from "@/lib/content/public-queries";
import { FEATURED_POST_COUNT, POSTS_PER_PAGE } from "@/lib/site";

type ArchivePageProps = Readonly<{
  params: Promise<{ page: string }>;
}>;

export const metadata: Metadata = {
  title: "글 아카이브",
  description: "Hard_Working의 모든 기록.",
};

export default async function ArchivePage({ params }: ArchivePageProps) {
  const { page } = await params;
  const pageNumber = Number(page);
  const posts = (await listPublishedPosts()).slice(FEATURED_POST_COUNT);
  const result = paginate(posts, pageNumber, POSTS_PER_PAGE);

  if (!result || pageNumber === 1) {
    notFound();
  }

  return (
    <ContentList
      currentPage={result.currentPage}
      items={result.items}
      kicker="// ARCHIVE"
      pageHref={(targetPage) => (targetPage === 1 ? "/" : `/page/${targetPage}`)}
      title="모든 기록"
      totalPages={result.totalPages}
    />
  );
}
