import Link from "next/link";
import type { PublicContentItem } from "@/lib/content/public-types";

type PostCardProps = Readonly<{
  item: PublicContentItem;
  number: number;
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

export function PostCard({ item, number }: PostCardProps) {
  return (
    <Link className="qt-feat-row" href={item.path}>
      <aside className="qt-feat-meta">
        <div className="qt-feat-cat">
          [{item.category?.name.toUpperCase() ?? "POST"}]
        </div>
        {item.tags[0] ? (
          <div className="qt-feat-sub">{item.tags[0].name}</div>
        ) : null}
        <time className="qt-feat-date" dateTime={item.publishedAt}>
          {formatDate(item.publishedAt)}
        </time>
      </aside>
      <div className="qt-feat-body">
        <h2 className="qt-feat-title">{item.title}</h2>
        {item.description ? (
          <p className="qt-feat-desc">{item.description}</p>
        ) : null}
        <div className="qt-feat-foot">
          <span>№ {String(number).padStart(3, "0")}</span>
          <span>·</span>
          <span>READ MORE →</span>
        </div>
      </div>
    </Link>
  );
}
