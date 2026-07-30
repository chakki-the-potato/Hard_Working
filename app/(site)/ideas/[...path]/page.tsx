import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/site/article-view";
import {
  getPublishedContentByPath,
  listPublishedIdeas,
} from "@/lib/content/public-queries";

type IdeaPageProps = Readonly<{
  params: Promise<{ path: string[] }>;
}>;

export async function generateMetadata({
  params,
}: IdeaPageProps): Promise<Metadata> {
  const { path } = await params;
  const idea = await getPublishedContentByPath(`/ideas/${path.join("/")}`);

  return idea
    ? {
        title: idea.title,
        description: idea.summary ?? idea.title,
        alternates: { canonical: idea.path },
      }
    : {};
}

export default async function IdeaPage({ params }: IdeaPageProps) {
  const { path } = await params;
  const idea = await getPublishedContentByPath(`/ideas/${path.join("/")}`);

  if (!idea || idea.kind !== "idea") {
    notFound();
  }

  const related = (await listPublishedIdeas())
    .filter(
      (item) =>
        item.id !== idea.id &&
        item.category?.slug === idea.category?.slug,
    )
    .slice(0, 3);

  return <ArticleView item={idea} related={related} />;
}
