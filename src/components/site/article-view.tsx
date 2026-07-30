import Link from "next/link";
import { ArticleNavigation } from "@/components/site/article-navigation";
import { MarkdownContent } from "@/components/site/markdown-content";
import { PostListRow } from "@/components/site/post-list-row";
import { ReadingProgress } from "@/components/site/reading-progress";
import type {
  PublicContentItem,
  PublicContentNeighbors,
} from "@/lib/content/public-types";

type ArticleViewProps = Readonly<{
  item: PublicContentItem;
  neighbors: PublicContentNeighbors;
  related: readonly PublicContentItem[];
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

function displayUrl(value: string): string {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function ArticleView({
  item,
  neighbors,
  related,
}: ArticleViewProps) {
  const parentPath =
    item.kind === "idea"
      ? "/ideas"
      : item.kind === "project"
        ? "/projects"
        : item.parentItemId
          ? `/projects/${item.path.split("/")[2] ?? ""}`
          : `/posts/category/${item.category?.slug ?? ""}`;
  const parentLabel =
    item.kind === "idea"
      ? "Ideas"
      : item.kind === "project"
        ? "Projects"
        : item.category?.name ?? "Posts";
  const category = item.category?.name ?? item.kind;
  const subcategory = item.tags[0]?.name;
  const numberLabel =
    neighbors.currentNumber > 0
      ? String(neighbors.currentNumber).padStart(3, "0")
      : "—";
  const readingMinutes = Math.max(
    1,
    Math.ceil(item.bodyMarkdown.replace(/\s+/g, "").length / 500),
  );
  const hasWorkMetadata = Boolean(
    item.role ||
      item.period ||
      item.outcome ||
      item.demoUrl ||
      item.repositoryUrl,
  );

  return (
    <main>
      <ReadingProgress />
      <div className="qt-post-wrap">
        <section className="qt-post-crumb">
          <span>
            HOME / {category.toUpperCase()} / №{numberLabel}
          </span>
          <span>
            {formatDate(item.publishedAt)}
            {item.updatedAt !== item.publishedAt
              ? ` / UPD ${formatDate(item.updatedAt)}`
              : ""}
          </span>
        </section>
        <article className="qt-post">
          <Link className="qt-post-back-top" href={parentPath}>
            ← {parentLabel}
          </Link>
          <header className="qt-post-head">
            <span className="qt-post-mono">
              // {numberLabel} · {category.toUpperCase()}
              {subcategory ? ` / ${subcategory.toUpperCase()}` : ""}
            </span>
            <h1 className="qt-post-title">{item.title}</h1>
            <div className="qt-post-meta">
              {item.versionLabel ? (
                <span className="qt-post-version">{item.versionLabel}</span>
              ) : null}
              <span className="qt-post-filename">{item.slug}.md</span>
              <span className="qt-post-meta-date">
                {formatDate(item.publishedAt)} ─ {readingMinutes} MIN READ
              </span>
              {item.kind === "post" ? (
                <Link
                  className="qt-post-history-link"
                  href={`/posts/versions/${item.path.replace(/^\/posts\//, "")}`}
                >
                  버전 히스토리 →
                </Link>
              ) : null}
            </div>
          </header>
          {hasWorkMetadata ? (
            <dl className="qt-post-works-meta" aria-label="Works metadata">
              {item.role ? (
                <div className="qt-works-row">
                  <dt>ROLE</dt>
                  <dd>{item.role}</dd>
                </div>
              ) : null}
              {item.period ? (
                <div className="qt-works-row">
                  <dt>PERIOD</dt>
                  <dd>{item.period}</dd>
                </div>
              ) : null}
              {item.outcome ? (
                <div className="qt-works-row">
                  <dt>OUTCOME</dt>
                  <dd>{item.outcome}</dd>
                </div>
              ) : null}
              {item.demoUrl ? (
                <div className="qt-works-row">
                  <dt>DEMO</dt>
                  <dd>
                    <a
                      href={item.demoUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {displayUrl(item.demoUrl)}
                    </a>
                  </dd>
                </div>
              ) : null}
              {item.repositoryUrl ? (
                <div className="qt-works-row">
                  <dt>REPO</dt>
                  <dd>
                    <a
                      href={item.repositoryUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {displayUrl(item.repositoryUrl)}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          <MarkdownContent markdown={item.bodyMarkdown} />
          <section className="qt-post-related">
            <span className="qt-post-related-mono">// RELATED</span>
            {related.length > 0 ? (
              related.map((relatedItem) => (
                <PostListRow item={relatedItem} key={relatedItem.id} />
              ))
            ) : (
              <p className="qt-post-related-empty">
                같은 분류의 다른 기록이 아직 없어요.
              </p>
            )}
          </section>
          <ArticleNavigation neighbors={neighbors} />
          <Link className="qt-post-back" href={parentPath}>
            ← {parentLabel} 목록으로
          </Link>
        </article>
      </div>
    </main>
  );
}
