import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticleView } from "@/components/site/article-view";
import { ProjectHypothesesSection } from "@/components/hypotheses/project-hypotheses-section";
import {
  getContentNeighbors,
  getPublishedContentByPath,
  listPublishedPosts,
  listPublicRedirects,
} from "@/lib/content/public-queries";
import { listPublicHypothesesByProject } from "@/lib/hypotheses/public-queries";

type ProjectPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedContentByPath(`/projects/${slug}`);

  return project
    ? {
        title: project.title,
        description: project.summary ?? project.title,
        alternates: { canonical: project.path },
      }
    : {};
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const requestPath = `/projects/${slug}`;
  const project = await getPublishedContentByPath(requestPath);

  if (!project || project.kind !== "project") {
    const redirect = (await listPublicRedirects()).find(
      (item) => item.sourcePath === requestPath,
    );

    if (redirect) {
      permanentRedirect(redirect.targetPath);
    }

    notFound();
  }

  const [posts, neighbors, hypotheses] = await Promise.all([
    listPublishedPosts(),
    getContentNeighbors(project),
    listPublicHypothesesByProject(project.id),
  ]);
  const related = posts.filter(
    (post) => post.parentItemId === project.id,
  );

  return (
    <ArticleView
      beforeRelated={<ProjectHypothesesSection hypotheses={hypotheses} />}
      item={project}
      neighbors={neighbors}
      related={related}
    />
  );
}
