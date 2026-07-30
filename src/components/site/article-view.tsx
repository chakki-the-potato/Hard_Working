import Link from "next/link";
import { ContentRow } from "@/components/site/content-row";
import { MarkdownContent } from "@/components/site/markdown-content";
import type { PublicContentItem } from "@/lib/content/public-types";

type ArticleViewProps = Readonly<{
  item: PublicContentItem;
  related: readonly PublicContentItem[];
}>;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export function ArticleView({ item, related }: ArticleViewProps) {
  const parentPath =
    item.kind === "idea"
      ? "/ideas"
      : item.parentItemId
        ? `/projects/${item.path.split("/")[3] ?? ""}`
        : `/posts/category/${item.category?.slug ?? ""}`;

  return (
    <main className="article-wrap">
      <article className="article">
        <Link className="article-back" href={parentPath}>
          ← 목록으로
        </Link>
        <span className="mono-label">
          // {item.kind.toUpperCase()} ·{" "}
          {item.category?.name.toUpperCase() ?? "NOTE"}
        </span>
        <h1>{item.title}</h1>
        <div className="article-meta">
          {item.versionLabel ? <span>{item.versionLabel}</span> : null}
          <time dateTime={item.publishedAt}>
            {formatDate(item.publishedAt)}
          </time>
          {item.tags.map((tag) => (
            <Link href={`/tags/${encodeURIComponent(tag.name)}`} key={tag.slug}>
              #{tag.name}
            </Link>
          ))}
        </div>

        {item.kind === "post" &&
        (item.role ||
          item.period ||
          item.outcome ||
          item.demoUrl ||
          item.repositoryUrl) ? (
          <dl className="article-work-meta">
            {item.role ? (
              <div>
                <dt>ROLE</dt>
                <dd>{item.role}</dd>
              </div>
            ) : null}
            {item.period ? (
              <div>
                <dt>PERIOD</dt>
                <dd>{item.period}</dd>
              </div>
            ) : null}
            {item.outcome ? (
              <div>
                <dt>OUTCOME</dt>
                <dd>{item.outcome}</dd>
              </div>
            ) : null}
            {item.demoUrl ? (
              <div>
                <dt>DEMO</dt>
                <dd>
                  <a
                    href={item.demoUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {item.demoUrl}
                  </a>
                </dd>
              </div>
            ) : null}
            {item.repositoryUrl ? (
              <div>
                <dt>REPO</dt>
                <dd>
                  <a
                    href={item.repositoryUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {item.repositoryUrl}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        <MarkdownContent markdown={item.bodyMarkdown} />

        <section className="related-content">
          <span className="mono-label">// RELATED</span>
          {related.map((relatedItem) => (
            <ContentRow item={relatedItem} key={relatedItem.id} />
          ))}
        </section>
      </article>
    </main>
  );
}
