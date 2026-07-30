import Link from "next/link";
import type {
  PublicContentItem,
  PublicContentStat,
} from "@/lib/content/public-types";

type SidebarWidgetsProps = Readonly<{
  categoryStats: readonly PublicContentStat[];
  projects: readonly PublicContentItem[];
  tagStats: readonly PublicContentStat[];
}>;

export function SidebarWidgets({
  categoryStats,
  projects,
  tagStats,
}: SidebarWidgetsProps) {
  return (
    <>
      <section className="qt-widget qt-widget-about">
        <h2 className="qt-widget-head">// ABOUT</h2>
        <p>배우고 만들며 발견한 것을 기록합니다.</p>
        <Link className="qt-widget-link" href="/about">
          MORE ABOUT ME →
        </Link>
      </section>
      <section className="qt-widget">
        <h2 className="qt-widget-head">// CATEGORIES</h2>
        <div className="qt-widget-list">
          {categoryStats.map((category) => (
            <Link href={`/posts/category/${category.slug}`} key={category.slug}>
              <span>{category.label}</span>
              <span>{category.count}</span>
            </Link>
          ))}
        </div>
      </section>
      {projects.length > 0 ? (
        <section className="qt-widget">
          <h2 className="qt-widget-head">// PROJECTS</h2>
          <div className="qt-widget-list">
            {projects.slice(0, 6).map((project) => (
              <Link href={project.path} key={project.id}>
                <span>{project.title}</span>
                <span>▸</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {tagStats.length > 0 ? (
        <section className="qt-widget">
          <h2 className="qt-widget-head">// TAG CLOUD</h2>
          <div className="qt-tag-cloud">
            {tagStats.slice(0, 12).map((tag) => (
              <Link
                href={`/tags/${encodeURIComponent(tag.label)}`}
                key={tag.slug}
              >
                #{tag.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
