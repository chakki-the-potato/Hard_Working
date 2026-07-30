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

  const [allPosts, ideas, projects] = await Promise.all([
    listPublishedPosts(),
    listPublishedIdeas(),
    listPublishedProjects(),
  ]);
  const posts = allPosts.filter(
    (post) => post.category?.slug === category,
  );
  const result = paginate(posts, pageNumber, POSTS_PER_PAGE);

  if (!result) {
    notFound();
  }

  return (
    <ContentList
      currentPage={result.currentPage}
      filterContext={{
        activeCategory: category,
        activeCategoryLabel: label,
        allPosts,
        ideas,
        projects,
      }}
      items={result.items}
      kicker="// CATEGORY"
      pageHref={(targetPage) =>
        targetPage === 1
          ? `/posts/category/${category}`
          : `/posts/category/${category}/${targetPage}`
      }
      title={`#${label}`}
      totalCount={posts.length}
      totalPages={result.totalPages}
    />
  );
}
