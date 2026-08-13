import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticleView } from "@/components/site/article-view";
import {
  getPublishedContentByPath,
  getContentNeighbors,
  listPublishedIdeas,
  listPublicRedirects,
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
  const requestPath = `/ideas/${path.join("/")}`;
  const idea = await getPublishedContentByPath(requestPath);

  if (!idea || idea.kind !== "idea") {
    const redirect = (await listPublicRedirects()).find(
      (item) => item.sourcePath === requestPath,
    );

    if (redirect) {
      permanentRedirect(redirect.targetPath);
    }

    notFound();
  }

  const related = (await listPublishedIdeas())
    .filter(
      (item) =>
        item.id !== idea.id &&
        item.category?.slug === idea.category?.slug,
    )
    .slice(0, 3);
  const neighbors = await getContentNeighbors(idea);

  return <ArticleView item={idea} neighbors={neighbors} related={related} />;
}
