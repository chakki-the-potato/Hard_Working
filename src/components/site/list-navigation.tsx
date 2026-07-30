import Link from "next/link";
import type { PublicContentItem } from "@/lib/content/public-types";

type ListNavigationProps = Readonly<{
  activeCategory?: string;
  activeTag?: string;
  posts: readonly PublicContentItem[];
  projects: readonly PublicContentItem[];
}>;

const ALWAYS_VISIBLE_TAGS: Readonly<Record<string, readonly string[]>> = {
  programming: ["Tools"],
  thinking: ["Career", "Mindset"],
  design: ["UI", "Typography"],
  works: [],
};

export function ListNavigation({
  activeCategory,
  activeTag,
  posts,
  projects,
}: ListNavigationProps) {
  const scopedPosts = activeCategory
    ? posts.filter((post) => post.category?.slug === activeCategory)
    : posts;
  const projectCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const projectById = new Map(projects.map((project) => [project.id, project]));

  for (const post of scopedPosts) {
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

  for (const tag of ALWAYS_VISIBLE_TAGS[activeCategory ?? ""] ?? []) {
    if (!tagCounts.has(tag)) {
      tagCounts.set(tag, 0);
    }
  }

  const projectChips = [...projectCounts.entries()]
    .map(([projectId, count]) => ({
      project: projectById.get(projectId),
      count,
    }))
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

  return (
    <div aria-label="태그 필터" className="qt-tag-chips" role="navigation">
      <Link className="qt-chip" href="/">
        전체
      </Link>
      {projectChips.map(({ project, count }) => (
        <Link
          className="qt-chip qt-chip-project"
          href={project.path}
          key={project.id}
        >
          <span className="qt-chip-arrow" aria-hidden="true">
            ▸
          </span>{" "}
          {project.title}
          <span className="qt-chip-count">{count}</span>
        </Link>
      ))}
      {tags.map(([tag]) => (
        <Link
          aria-current={activeTag === tag ? "page" : undefined}
          className={`qt-chip${activeTag === tag ? " is-active" : ""}`}
          href={`/tags/${encodeURIComponent(tag)}`}
          key={tag}
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}
