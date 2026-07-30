import Link from "next/link";
import type { PublicContentItem } from "@/lib/content/public-types";

type ListSidebarProps = Readonly<{
  activeCategory: string;
  activeCategoryLabel: string;
  activeTag?: string;
  ideas: readonly PublicContentItem[];
  posts: readonly PublicContentItem[];
  projects: readonly PublicContentItem[];
}>;

function formatShortDate(value: string): string {
  const date = new Date(value);
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ListSidebar({
  activeCategory,
  activeCategoryLabel,
  activeTag,
  ideas,
  posts,
  projects,
}: ListSidebarProps) {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const projectCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();

  for (const post of posts.filter(
    (item) => item.category?.slug === activeCategory,
  )) {
    if (post.parentItemId && projectById.has(post.parentItemId)) {
      projectCounts.set(
        post.parentItemId,
        (projectCounts.get(post.parentItemId) ?? 0) + 1,
      );
      continue;
    }
    for (const tag of post.tags) {
      tagCounts.set(tag.name, (tagCounts.get(tag.name) ?? 0) + 1);
    }
  }

  const projectItems = [...projectCounts.entries()]
    .map(([id, count]) => ({ project: projectById.get(id), count }))
    .filter(
      (
        entry,
      ): entry is Readonly<{ project: PublicContentItem; count: number }> =>
        entry.project !== undefined,
    )
    .sort(
      (left, right) =>
        right.count - left.count ||
        left.project.title.localeCompare(right.project.title),
    );
  const tags = [...tagCounts.entries()].sort(
    (left, right) => right[1] - left[1],
  );
  const recentIdeas = ideas
    .filter((idea) => idea.category?.slug === activeCategory)
    .slice(0, 3);

  if (projectItems.length === 0 && tags.length === 0) {
    return null;
  }

  return (
    <aside className="qt-list-aside">
      <div className="qt-aside-inner">
        <Link
          className={`qt-aside-parent${activeTag ? "" : " is-active"}`}
          href={`/posts/category/${activeCategory}`}
        >
          // {activeCategoryLabel.toUpperCase()}
        </Link>
        {projectItems.length > 0 ? (
          <div className="qt-aside-section">
            <Link
              className="qt-aside-section-head qt-aside-section-link"
              href="/projects"
            >
              // PROJECTS
            </Link>
            <div className="qt-aside-list">
              {projectItems.map(({ project, count }) => (
                <Link
                  className="qt-aside-item qt-aside-item-project"
                  href={project.path}
                  key={project.id}
                >
                  <span className="qt-aside-name">
                    <span className="qt-aside-arrow" aria-hidden="true">
                      ▸
                    </span>{" "}
                    {project.title}
                  </span>
                  <span className="qt-aside-count">{count}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        {tags.length > 0 ? (
          <div className="qt-aside-section">
            <span className="qt-aside-section-head">// TAGS</span>
            <div className="qt-aside-list">
              {tags.map(([tag, count]) => (
                <Link
                  className={`qt-aside-item${activeTag === tag ? " is-active" : ""}`}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  key={tag}
                >
                  <span className="qt-aside-name">{tag}</span>
                  <span className="qt-aside-count">{count}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        {recentIdeas.length > 0 ? (
          <div className="qt-aside-section">
            <span className="qt-w-mono">// FROM IDEAS</span>
            <ol className="qt-w-activity-list">
              {recentIdeas.map((idea) => (
                <li className="qt-w-activity-row" key={idea.id}>
                  <time
                    className="qt-w-activity-date"
                    dateTime={idea.publishedAt}
                  >
                    {formatShortDate(idea.publishedAt)}
                  </time>
                  <Link className="qt-w-activity-link" href={idea.path}>
                    <span className="qt-w-activity-kind is-idea">IDEA</span>
                    <span className="qt-w-activity-title">{idea.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
