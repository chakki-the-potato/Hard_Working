import type { Metadata } from "next";
import Link from "next/link";
import {
  listPublishedPosts,
  listPublishedProjects,
} from "@/lib/content/public-queries";

export const metadata: Metadata = {
  title: "Projects",
  description: "직접 만든 프로젝트와 연결된 기록.",
};

export default async function ProjectsPage() {
  const [projects, posts] = await Promise.all([
    listPublishedProjects(),
    listPublishedPosts(),
  ]);

  return (
    <main>
      <section className="qt-list-hero">
        <span className="qt-mono qt-list-mono">// PROJECTS</span>
        <h1 className="qt-list-title">
          <span className="qt-list-hash">#</span>Projects
        </h1>
        <p className="qt-list-desc">만든 결과물과 그 과정에서 남긴 기록입니다.</p>
      </section>
      <section className="qt-project-grid">
        {projects.map((project) => {
          const postCount = posts.filter(
            (post) => post.parentItemId === project.id,
          ).length;

          return (
            <Link className="project-card" href={project.path} key={project.id}>
              <span className="mono-label">
                {project.projectStatus?.toUpperCase()} · {postCount} POSTS
              </span>
              <h2>{project.title}</h2>
              <p>{project.summary}</p>
              {project.period ? <small>{project.period}</small> : null}
            </Link>
          );
        })}
      </section>
    </main>
  );
}
