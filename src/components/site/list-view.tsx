import { ListNavigation } from "@/components/site/list-navigation";
import { ListPagination } from "@/components/site/list-pagination";
import { ListSidebar } from "@/components/site/list-sidebar";
import { PostListRow } from "@/components/site/post-list-row";
import type { PublicContentItem } from "@/lib/content/public-types";

export type ListFilterContext = Readonly<{
  activeCategory: string;
  activeCategoryLabel: string;
  activeTag?: string;
  allPosts: readonly PublicContentItem[];
  ideas: readonly PublicContentItem[];
  projects: readonly PublicContentItem[];
}>;

export type ListViewProps = Readonly<{
  kicker: string;
  title: string;
  description?: string;
  items: readonly PublicContentItem[];
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  pageHref?: (page: number) => string;
  filterContext?: ListFilterContext;
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

export function ListView({
  kicker,
  title,
  description,
  items,
  currentPage = 1,
  totalPages = 1,
  totalCount = items.length,
  pageHref,
  filterContext,
}: ListViewProps) {
  const latestUpdate = filterContext?.allPosts[0]?.publishedAt ?? items[0]?.publishedAt;
  const globalNumberById = new Map(
    filterContext?.allPosts.map((item, index, allItems) => [
      item.id,
      allItems.length - index,
    ]) ?? [],
  );

  return (
    <main>
      <section className="qt-list-hero">
        <span className="qt-mono qt-list-mono">{kicker}</span>
        <h1 className="qt-list-title">
          {title.startsWith("#") ? (
            <>
              <span className="qt-list-hash">#</span>
              {" "}
              {title.slice(1)}
            </>
          ) : (
            title
          )}
        </h1>
        <span className="qt-mono qt-list-meta">
          {totalCount} ARTICLES
          {latestUpdate
            ? ` · LAST_UPDATE ${formatDate(latestUpdate)}`
            : ""}
        </span>
        {description ? <p className="qt-list-desc">{description}</p> : null}
      </section>
      <section className="qt-list-chips">
        {filterContext ? (
          <ListNavigation
            activeCategory={filterContext.activeCategory}
            activeTag={filterContext.activeTag}
            posts={filterContext.allPosts}
            projects={filterContext.projects}
          />
        ) : null}
      </section>
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
                number={
                  globalNumberById.get(item.id) ??
                  totalCount - (currentPage - 1) * 12 - index
                }
                showVersion={item.kind !== "post"}
              />
            ))}
          </div>
          {items.length === 0 ? (
            <div className="qt-list-empty">
              <span className="qt-mono qt-list-empty-mark">// EMPTY</span>
              <p>해당하는 글이 아직 없어요.</p>
            </div>
          ) : null}
          {pageHref ? (
            <ListPagination
              currentPage={currentPage}
              pageHref={pageHref}
              totalPages={totalPages}
            />
          ) : null}
        </section>
        {filterContext ? (
          <ListSidebar
            activeCategory={filterContext.activeCategory}
            activeCategoryLabel={filterContext.activeCategoryLabel}
            activeTag={filterContext.activeTag}
            ideas={filterContext.ideas}
            posts={filterContext.allPosts}
            projects={filterContext.projects}
          />
        ) : null}
      </div>
    </main>
  );
}
