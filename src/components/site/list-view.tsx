import Link from "next/link";
import { PostListRow } from "@/components/site/post-list-row";
import type { PublicContentItem } from "@/lib/content/public-types";

export type ListViewProps = Readonly<{
  kicker: string;
  title: string;
  description?: string;
  items: readonly PublicContentItem[];
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  pageHref?: (page: number) => string;
}>;

export function ListView({
  kicker,
  title,
  description,
  items,
  currentPage = 1,
  totalPages = 1,
  totalCount = items.length,
  pageHref,
}: ListViewProps) {
  const latestUpdate = items[0]?.updatedAt;

  return (
    <main>
      <section className="qt-list-hero">
        <span className="qt-mono qt-list-mono">{kicker}</span>
        <h1 className="qt-list-title">
          {title.startsWith("#") ? (
            <>
              <span className="qt-list-hash">#</span>
              {title.slice(1)}
            </>
          ) : (
            title
          )}
        </h1>
        <span className="qt-mono qt-list-meta">
          {totalCount} ARTICLES
          {latestUpdate
            ? ` · LAST_UPDATE ${new Intl.DateTimeFormat("ko-KR", {
                dateStyle: "short",
                timeZone: "Asia/Seoul",
              }).format(new Date(latestUpdate))}`
            : ""}
        </span>
        {description ? <p className="qt-list-desc">{description}</p> : null}
      </section>
      <section className="qt-list-chips" aria-hidden="true" />
      <div className="qt-list-body">
        <section className="qt-list-main" aria-label={`${title} 목록`}>
          {items.length > 0 ? (
            <div className="qt-list-thead">
              <span>NO</span>
              <span>TITLE</span>
              <span>CAT/SUB</span>
              <span className="qt-list-thead-right">DATE</span>
            </div>
          ) : null}
          <div className="qt-list-rows">
            {items.map((item, index) => (
              <PostListRow
                item={item}
                key={item.id}
                number={totalCount - (currentPage - 1) * 12 - index}
              />
            ))}
          </div>
          {items.length === 0 ? (
            <div className="qt-list-empty">
              <span className="qt-mono qt-list-empty-mark">// EMPTY</span>
              <p>해당하는 글이 아직 없어요.</p>
            </div>
          ) : null}
          {pageHref && totalPages > 1 ? (
            <nav aria-label="페이지 이동" className="qt-pagination">
              {currentPage > 1 ? (
                <Link href={pageHref(currentPage - 1)}>← PREV</Link>
              ) : (
                <span />
              )}
              <span>
                {String(currentPage).padStart(2, "0")} /{" "}
                {String(totalPages).padStart(2, "0")}
              </span>
              {currentPage < totalPages ? (
                <Link href={pageHref(currentPage + 1)}>NEXT →</Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  );
}
