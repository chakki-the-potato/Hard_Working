import Link from "next/link";

type ListPaginationProps = Readonly<{
  currentPage: number;
  pageHref: (page: number) => string;
  totalPages: number;
}>;

type PageItem = number | "gap";

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, "gap", totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, "gap", totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "gap", currentPage, "gap", totalPages];
}

export function ListPagination({
  currentPage,
  pageHref,
  totalPages,
}: ListPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="페이지네이션" className="qt-pager">
      {currentPage > 1 ? (
        <Link className="qt-pager-arrow" href={pageHref(currentPage - 1)}>
          ← PREV
        </Link>
      ) : (
        <span className="qt-pager-arrow is-disabled">← PREV</span>
      )}
      <div className="qt-pager-pages">
        {getPageItems(currentPage, totalPages).map((item, index) =>
          item === "gap" ? (
            <span className="qt-pager-gap" key={`gap-${index}`}>
              …
            </span>
          ) : (
            <Link
              aria-current={item === currentPage ? "page" : undefined}
              className={`qt-pager-num${item === currentPage ? " is-active" : ""}`}
              href={pageHref(item)}
              key={item}
            >
              {item}
            </Link>
          ),
        )}
      </div>
      {currentPage < totalPages ? (
        <Link
          className="qt-pager-arrow is-next"
          href={pageHref(currentPage + 1)}
        >
          NEXT →
        </Link>
      ) : (
        <span className="qt-pager-arrow is-next is-disabled">NEXT →</span>
      )}
    </nav>
  );
}
