import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentList } from "@/components/site/content-list";
import {
  paginate,
  parsePathPage,
} from "@/lib/content/pagination";
import { listPublishedPosts } from "@/lib/content/public-queries";
import { POSTS_PER_PAGE } from "@/lib/site";

type TagPageProps = Readonly<{
  params: Promise<{ tag: string; page?: string[] }>;
}>;

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag } = await params;

  return {
    title: `#${tag}`,
    description: `${tag} 태그가 붙은 Hard_Working 글.`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag, page } = await params;
  const pageNumber = parsePathPage(page);

  if (pageNumber === null) {
    notFound();
  }

  const posts = (await listPublishedPosts()).filter((post) =>
    post.tags.some((itemTag) => itemTag.name === tag),
  );
  const result = paginate(posts, pageNumber, POSTS_PER_PAGE);

  if (!result) {
    notFound();
  }

  return (
    <ContentList
      currentPage={result.currentPage}
      items={result.items}
      kicker="// TAG"
      pageHref={(targetPage) =>
        targetPage === 1
          ? `/tags/${encodeURIComponent(tag)}`
          : `/tags/${encodeURIComponent(tag)}/${targetPage}`
      }
      title={`#${tag}`}
      totalCount={posts.length}
      totalPages={result.totalPages}
    />
  );
}
