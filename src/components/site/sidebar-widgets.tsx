import Link from "next/link";
import type {
  PublicContentItem,
  PublicContentStat,
} from "@/lib/content/public-types";

type SidebarWidgetsProps = Readonly<{
  categoryStats: readonly PublicContentStat[];
  posts: readonly PublicContentItem[];
  projects: readonly PublicContentItem[];
  recentActivity: readonly PublicContentItem[];
  tagStats: readonly PublicContentStat[];
}>;

const CATEGORY_ORDER = ["programming", "design", "thinking", "works"] as const;

function formatShortDate(value: string): string {
  const date = new Date(value);
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function SidebarWidgets({
  categoryStats,
  posts,
  projects,
  recentActivity,
  tagStats,
}: SidebarWidgetsProps) {
  const categoryBySlug = new Map(
    categoryStats.map((category) => [category.slug, category]),
  );
  const orderedCategories = [
    ...CATEGORY_ORDER.map(
      (slug) =>
        categoryBySlug.get(slug) ?? {
          slug,
          label: slug[0].toUpperCase() + slug.slice(1),
          count: 0,
        },
    ),
    ...categoryStats.filter(
      (category) =>
        !CATEGORY_ORDER.includes(
          category.slug as (typeof CATEGORY_ORDER)[number],
        ),
    ),
  ];
  const maxCategoryCount = Math.max(
    1,
    ...orderedCategories.map((category) => category.count),
  );
  const projectStats = projects
    .map((project) => ({
      project,
      count: posts.filter((post) => post.parentItemId === project.id).length,
    }))
    .filter((entry) => entry.count > 0)
    .slice(0, 6);
  const maxProjectCount = Math.max(
    1,
    ...projectStats.map((entry) => entry.count),
  );
  const visibleTags = tagStats.slice(0, 10);
  const maxTagCount = Math.max(1, ...visibleTags.map((tag) => tag.count));

  return (
    <>
      <section className="qt-w-about">
        <span className="qt-w-mono">// ABOUT</span>
        <p className="qt-w-about-bio">
          <strong>Hard_Working</strong> · 개발 공부 기록.
          <br />
          Programming · Thinking · Design 을 매일 한 줄씩.
        </p>
        <ul className="qt-w-about-links">
          <li>
            <Link href="/ideas">
              SCRATCHPAD <span aria-hidden="true">→</span>
            </Link>
          </li>
          <li>
            <Link href="/rss.xml">
              RSS FEED <span aria-hidden="true">→</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className="qt-w-stats">
        <span className="qt-w-mono">// CATEGORY</span>
        <ul className="qt-w-stats-list">
          {orderedCategories.map((category) => (
            <li key={category.slug}>
              <div
                className="qt-w-stats-row"
                data-empty={category.count === 0 ? "true" : undefined}
              >
                <span className="qt-w-stats-name">{category.label}</span>
                <span className="qt-w-stats-count">
                  {String(category.count).padStart(2, "0")}
                </span>
                <span className="qt-w-stats-track" aria-hidden="true">
                  <span
                    className="qt-w-stats-bar"
                    style={{
                      width: `${Math.round((category.count / maxCategoryCount) * 100)}%`,
                    }}
                  />
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {projectStats.length > 0 ? (
        <section className="qt-w-stats">
          <div className="qt-w-head">
            <span className="qt-w-mono">// PROJECT</span>
            <Link className="qt-w-more" href="/projects">
              ALL →
            </Link>
          </div>
          <ul className="qt-w-stats-list">
            {projectStats.map(({ project, count }) => (
              <li key={project.id}>
                <Link className="qt-w-stats-row" href={project.path}>
                  <span className="qt-w-stats-name">{project.title}</span>
                  <span className="qt-w-stats-count">
                    {String(count).padStart(2, "0")}
                  </span>
                  <span className="qt-w-stats-track" aria-hidden="true">
                    <span
                      className="qt-w-stats-bar"
                      style={{
                        width: `${Math.round((count / maxProjectCount) * 100)}%`,
                      }}
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {visibleTags.length > 0 ? (
        <section className="qt-w-tags">
          <span className="qt-w-mono">
            // TAGS · TOP {String(visibleTags.length).padStart(2, "0")}
          </span>
          <div className="qt-w-tags-cloud">
            {visibleTags.map((tag) => {
              const heat = tag.count / maxTagCount;
              const size = heat > 0.66 ? "lg" : heat > 0.33 ? "md" : "sm";

              return (
                <Link
                  className={`qt-w-tag is-${size}`}
                  data-count={tag.count}
                  href={`/tags/${encodeURIComponent(tag.label)}`}
                  key={tag.slug}
                >
                  <span className="qt-w-tag-hash" aria-hidden="true">
                    #
                  </span>
                  {tag.label}
                  <span className="qt-w-tag-count">{tag.count}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {recentActivity.length > 0 ? (
        <section className="qt-w-activity">
          <span className="qt-w-mono">// ACTIVITY</span>
          <ol className="qt-w-activity-list">
            {recentActivity.map((item) => (
              <li className="qt-w-activity-row" key={item.id}>
                <time
                  className="qt-w-activity-date"
                  dateTime={item.publishedAt}
                >
                  {formatShortDate(item.publishedAt)}
                </time>
                <Link className="qt-w-activity-link" href={item.path}>
                  <span
                    className={`qt-w-activity-kind is-${item.kind === "idea" ? "idea" : "blog"}`}
                  >
                    {item.kind === "idea" ? "IDEA" : "BLOG"}
                  </span>
                  <span className="qt-w-activity-title">{item.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </>
  );
}
