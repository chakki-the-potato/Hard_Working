import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentList } from "@/components/site/content-list";
import {
  paginate,
  parsePathPage,
} from "@/lib/content/pagination";
import { listPublishedPosts } from "@/lib/content/public-queries";
import { POSTS_PER_PAGE } from "@/lib/site";

const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  programming: "Programming",
  design: "Design",
  thinking: "Thinking",
  works: "Works",
};

type CategoryPageProps = Readonly<{
  params: Promise<{ category: string; page?: string[] }>;
}>;

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const label = CATEGORY_LABELS[category];

  return label
    ? {
        title: `${label} 글`,
        description: `Hard_Working의 ${label} 카테고리 글.`,
      }
    : {};
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category, page } = await params;
  const label = CATEGORY_LABELS[category];
  const pageNumber = parsePathPage(page);

  if (!label || pageNumber === null) {
    notFound();
  }

  const posts = (await listPublishedPosts()).filter(
    (post) => post.category?.slug === category,
  );
  const result = paginate(posts, pageNumber, POSTS_PER_PAGE);

  if (!result) {
    notFound();
  }

  return (
    <ContentList
      currentPage={result.currentPage}
      description={`${label} 카테고리에 쌓인 기록입니다.`}
      items={result.items}
      kicker={`// CATEGORY / ${category.toUpperCase()}`}
      pageHref={(targetPage) =>
        targetPage === 1
          ? `/posts/category/${category}`
          : `/posts/category/${category}/${targetPage}`
      }
      title={label}
      totalCount={posts.length}
      totalPages={result.totalPages}
    />
  );
}
