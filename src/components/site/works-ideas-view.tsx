import Link from "next/link";
import { PostListRow } from "@/components/site/post-list-row";
import type {
  PublicContentItem,
  WorksIdeaGroup,
} from "@/lib/content/public-types";

type WorksIdeasViewProps = Readonly<{
  groups: readonly WorksIdeaGroup[];
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

export function WorksIdeasView({ groups, ideas }: WorksIdeasViewProps) {
  const totalNotes = groups.reduce(
    (total, group) => total + group.items.length,
    0,
  );
  const latestUpdate = groups[0]?.latestPublishedAt;
  const categoryCounts = new Map<string, number>();
  for (const idea of ideas) {
    if (idea.category) {
      categoryCounts.set(
        idea.category.slug,
        (categoryCounts.get(idea.category.slug) ?? 0) + 1,
      );
    }
  }

  return (
    <main>
      <section className="qt-list-hero">
        <span className="qt-mono qt-list-mono">// IDEAS / WORKS</span>
        <h1 className="qt-list-title">
          <span className="qt-list-hash">#</span> Works
        </h1>
        <span className="qt-mono qt-list-meta">
          {groups.length} PROJECTS · {totalNotes} NOTES
          {latestUpdate ? ` · LAST_UPDATE ${formatDate(latestUpdate)}` : ""}
        </span>
      </section>
      <section className="qt-list-chips">
        <div
          aria-label="Ideas 네비게이션"
          className="qt-tag-chips"
          role="navigation"
        >
          <Link className="qt-chip" href="/ideas">
            전체 Ideas
          </Link>
          <Link
            aria-current="page"
            className="qt-chip is-active"
            href="/ideas/works"
          >
            Works
          </Link>
          <Link className="qt-chip" href="/posts/category/works">
            Works (Blog)
          </Link>
        </div>
      </section>
      <div className="qt-list-body">
        <section className="qt-list-main" aria-label="Works 아이디어 목록">
          {groups.map((group) => (
            <section className="qt-project-group" key={group.slug}>
              <header className="qt-project-head">
                <span className="qt-mono qt-project-mono">// PROJECT</span>
                <h2 className="qt-project-title">{group.label}</h2>
                <span className="qt-mono qt-project-meta">
                  {group.items.length} NOTE
                  {group.items.length === 1 ? "" : "S"}
                </span>
              </header>
              <div className="qt-list-thead qt-list-thead-no-number">
                <span>TITLE</span>
                <span>CAT/SUB</span>
                <span className="qt-list-thead-right">DATE</span>
              </div>
              <div className="qt-list-rows">
                {group.items.map((item) => (
                  <PostListRow item={item} key={item.id} />
                ))}
              </div>
            </section>
          ))}
        </section>
        <aside className="qt-list-aside">
          <div className="qt-aside-inner">
            <Link className="qt-aside-parent" href="/ideas">
              // IDEAS
            </Link>
            <div className="qt-aside-list">
              {CATEGORIES.map((category) => (
                <Link
                  aria-current={
                    category.slug === "works" ? "page" : undefined
                  }
                  className={`qt-aside-item${category.slug === "works" ? " is-active" : ""}`}
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
