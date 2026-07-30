import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentRow } from "@/components/site/content-row";
import { MarkdownContent } from "@/components/site/markdown-content";
import {
  getPublishedContentByPath,
  listPublishedPosts,
} from "@/lib/content/public-queries";

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
  const project = await getPublishedContentByPath(`/projects/${slug}`);

  if (!project || project.kind !== "project") {
    notFound();
  }

  const posts = (await listPublishedPosts()).filter(
    (post) => post.parentItemId === project.id,
  );

  return (
    <main>
      <section className="list-hero">
        <span className="mono-label">
          // PROJECT · {project.projectStatus?.toUpperCase()}
        </span>
        <h1>
          <span>#</span> {project.title}
        </h1>
        <p>{project.summary}</p>
        <small>
          {posts.length} POSTS
          {project.period ? ` · ${project.period}` : ""}
        </small>
      </section>

      <section className="project-detail">
        {project.bodyMarkdown ? (
          <MarkdownContent markdown={project.bodyMarkdown} />
        ) : null}
        <div className="content-rows">
          {posts.map((post) => (
            <ContentRow item={post} key={post.id} />
          ))}
        </div>
      </section>
    </main>
  );
}
