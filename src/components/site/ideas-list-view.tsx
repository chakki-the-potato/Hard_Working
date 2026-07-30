import Link from "next/link";
import { PostListRow } from "@/components/site/post-list-row";
import type { PublicContentItem } from "@/lib/content/public-types";

type IdeasListViewProps = Readonly<{
  ideas: readonly PublicContentItem[];
}>;

const CATEGORIES = [
  { slug: "programming", label: "Programming" },
  { slug: "design", label: "Design" },
  { slug: "thinking", label: "Thinking" },
  { slug: "works", label: "Works" },
] as const;

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

export function IdeasListView({ ideas }: IdeasListViewProps) {
  const categoryCounts = new Map<string, number>();
  for (const idea of ideas) {
    if (idea.category) {
      categoryCounts.set(
        idea.category.slug,
        (categoryCounts.get(idea.category.slug) ?? 0) + 1,
      );
    }
  }
  const latestUpdate = ideas[0]?.publishedAt;

  return (
    <main>
      <section className="qt-list-hero">
        <span className="qt-mono qt-list-mono">// IDEAS / SCRATCHPAD</span>
        <h1 className="qt-list-title">
          <span className="qt-list-hash">#</span> Idea
        </h1>
        <span className="qt-mono qt-list-meta">
          {ideas.length} NOTES
          {latestUpdate ? ` · LAST_UPDATE ${formatDate(latestUpdate)}` : ""}
        </span>
      </section>
      <section className="qt-list-chips">
        <div
          aria-label="카테고리 필터"
          className="qt-tag-chips"
          role="navigation"
        >
          <Link aria-current="page" className="qt-chip is-active" href="/ideas">
            전체
          </Link>
          {CATEGORIES.map((category) => (
            <Link
              className="qt-chip"
              href={
                category.slug === "works"
                  ? "/ideas/works"
                  : `/posts/category/${category.slug}`
              }
              key={category.slug}
            >
              {category.label}
            </Link>
          ))}
        </div>
      </section>
      <div className="qt-list-body">
        <section className="qt-list-main" aria-label="Idea 목록">
          <div className="qt-list-thead">
            <span>NO</span>
            <span>TITLE</span>
            <span>CAT/SUB</span>
            <span className="qt-list-thead-right">DATE</span>
          </div>
          <div className="qt-list-rows">
            {ideas.map((idea, index) => (
              <PostListRow
                item={idea}
                key={idea.id}
                number={ideas.length - index}
              />
            ))}
          </div>
        </section>
        <aside className="qt-list-aside">
          <div className="qt-aside-inner">
            <Link
              aria-current="page"
              className="qt-aside-parent is-active"
              href="/ideas"
            >
              // IDEAS
            </Link>
            <div className="qt-aside-list">
              {CATEGORIES.map((category) => (
                <Link
                  className="qt-aside-item"
                  href={
                    category.slug === "works"
                      ? "/ideas/works"
                      : `/posts/category/${category.slug}`
                  }
                  key={category.slug}
                >
                  <span className="qt-aside-name">{category.label}</span>
                  <span className="qt-aside-count">
                    {categoryCounts.get(category.slug) ?? 0}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
