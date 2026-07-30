import Link from "next/link";
import type { PublicContentItem } from "@/lib/content/public-types";

type ProjectsListViewProps = Readonly<{
  posts: readonly PublicContentItem[];
  projects: readonly PublicContentItem[];
}>;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  })
    .format(new Date(value))
    .replace(/\.\s*/g, ".")
    .replace(/\.$/, "");
}

export function ProjectsListView({
  posts,
  projects,
}: ProjectsListViewProps) {
  const projectStats = projects.map((project) => ({
    project,
    posts: posts.filter((post) => post.parentItemId === project.id),
  }));
  const totalPosts = projectStats.reduce(
    (total, entry) => total + entry.posts.length,
    0,
  );
  const latestUpdate = projectStats
    .flatMap((entry) => entry.posts)
    .sort(
      (left, right) =>
        new Date(right.publishedAt).valueOf() -
        new Date(left.publishedAt).valueOf(),
    )[0]?.publishedAt;

  return (
    <main>
      <section className="qt-list-hero">
        <Link className="qt-back-link" href="/ideas">
          ← Ideas
        </Link>
        <span className="qt-mono qt-list-mono">// PROJECTS</span>
        <h1 className="qt-list-title">
          <span className="qt-list-hash">#</span> Projects
        </h1>
        <span className="qt-mono qt-list-meta">
          {projects.length} PROJECTS · {totalPosts} POSTS
          {latestUpdate ? ` · LAST_UPDATE ${formatDate(latestUpdate)}` : ""}
        </span>
      </section>
      <div className="qt-list-body qt-projects-body">
        <section className="qt-list-main" aria-label="프로젝트 목록">
          <div className="qt-project-grid">
            {projectStats.map(({ project, posts: projectPosts }) => (
              <Link
                className="qt-project-card"
                href={project.path}
                key={project.id}
              >
                <div className="qt-project-card-head">
                  <span
                    className="qt-mono qt-project-status"
                    data-status={project.projectStatus ?? "active"}
                  >
                    {(project.projectStatus ?? "active").toUpperCase()}
                  </span>
                  <span className="qt-mono qt-project-count">
                    {String(projectPosts.length).padStart(2, "0")} POST
                    {projectPosts.length === 1 ? "" : "S"}
                  </span>
                </div>
                <h2 className="qt-project-card-title">{project.title}</h2>
                {project.summary ? (
                  <p className="qt-project-card-summary">{project.summary}</p>
                ) : null}
                <div className="qt-project-card-meta">
                  {project.period ? (
                    <span className="qt-mono">{project.period}</span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
        <aside className="qt-list-aside">
          <div className="qt-aside-inner">
            <Link
              aria-current="page"
              className="qt-aside-parent is-active"
              href="/projects"
            >
              // PROJECTS
            </Link>
            <div className="qt-aside-list">
              {projectStats.map(({ project, posts: projectPosts }) => (
                <Link
                  className="qt-aside-item"
                  href={project.path}
                  key={project.id}
                >
                  <span className="qt-aside-name">{project.title}</span>
                  <span className="qt-aside-count">{projectPosts.length}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
