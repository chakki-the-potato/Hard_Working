import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentList } from "@/components/site/content-list";
import {
  paginate,
  parsePathPage,
} from "@/lib/content/pagination";
import {
  listPublishedIdeas,
  listPublishedPosts,
  listPublishedProjects,
} from "@/lib/content/public-queries";
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

  const [allPosts, ideas, projects] = await Promise.all([
    listPublishedPosts(),
    listPublishedIdeas(),
    listPublishedProjects(),
  ]);
  const posts = allPosts.filter((post) =>
    post.tags.some(
      (itemTag) => itemTag.name === tag || itemTag.slug === tag,
    ),
  );
  const result = paginate(posts, pageNumber, POSTS_PER_PAGE);

  if (!result) {
    notFound();
  }

  const activeTag =
    posts.flatMap((post) => post.tags).find(
      (itemTag) => itemTag.name === tag || itemTag.slug === tag,
    )?.name ?? tag;
  const categoryCounts = new Map<string, number>();
  for (const post of posts) {
    if (post.category) {
      categoryCounts.set(
        post.category.slug,
        (categoryCounts.get(post.category.slug) ?? 0) + 1,
      );
    }
  }
  const activeCategory = [...categoryCounts.entries()].sort(
    (left, right) => right[1] - left[1],
  )[0]?.[0];
  const activeCategoryLabel = allPosts.find(
    (post) => post.category?.slug === activeCategory,
  )?.category?.name;

  return (
    <ContentList
      currentPage={result.currentPage}
      filterContext={
        activeCategory && activeCategoryLabel
          ? {
              activeCategory,
              activeCategoryLabel,
              activeTag,
              allPosts,
              ideas,
              projects,
            }
          : undefined
      }
      items={result.items}
      kicker="// TAG / FILTER"
      pageHref={(targetPage) =>
        targetPage === 1
          ? `/tags/${encodeURIComponent(tag)}`
          : `/tags/${encodeURIComponent(tag)}/${targetPage}`
      }
      title={`#${activeTag}`}
      totalCount={posts.length}
      totalPages={result.totalPages}
    />
  );
}
