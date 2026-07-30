import Link from "next/link";
import { ContentRow } from "@/components/site/content-row";
import type { PublicContentItem } from "@/lib/content/public-types";

type ContentListProps = Readonly<{
  kicker: string;
  title: string;
  description?: string;
  items: readonly PublicContentItem[];
  currentPage?: number;
  totalPages?: number;
  pageHref?: (page: number) => string;
}>;

export function ContentList({
  kicker,
  title,
  description,
  items,
  currentPage = 1,
  totalPages = 1,
  pageHref,
}: ContentListProps) {
  return (
    <main>
      <section className="list-hero">
        <span className="mono-label">{kicker}</span>
        <h1>
          <span>#</span> {title}
        </h1>
        {description ? <p>{description}</p> : null}
        <small>
          {items.length} ITEMS · PAGE {currentPage}/{totalPages}
        </small>
      </section>

      <section className="content-list" aria-label={`${title} 목록`}>
        {items.length > 0 ? (
          items.map((item, index) => (
            <ContentRow
              item={item}
              key={item.id}
              number={(currentPage - 1) * 12 + index + 1}
            />
          ))
        ) : (
          <div className="empty-state">
            <span className="mono-label">// EMPTY</span>
            <p>아직 표시할 콘텐츠가 없습니다.</p>
          </div>
        )}

        {pageHref && totalPages > 1 ? (
          <nav aria-label="페이지 이동" className="pagination">
            {currentPage > 1 ? (
              <Link href={pageHref(currentPage - 1)}>← 이전</Link>
            ) : (
              <span />
            )}
            <span>
              {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link href={pageHref(currentPage + 1)}>다음 →</Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </section>
    </main>
  );
}
