import Link from "next/link";
import type { PublicContentItem } from "@/lib/content/public-types";

type ContentRowProps = Readonly<{
  item: PublicContentItem;
  number?: number;
}>;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export function ContentRow({ item, number }: ContentRowProps) {
  return (
    <Link className="content-row" href={item.path}>
      {number ? (
        <span className="content-row-number">
          №{String(number).padStart(3, "0")}
        </span>
      ) : null}
      <span className="content-row-main">
        <strong>{item.title}</strong>
        {item.description ? <small>{item.description}</small> : null}
      </span>
      <span className="content-row-category">
        [{item.category?.name.toUpperCase() ?? item.kind.toUpperCase()}]
      </span>
      <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
    </Link>
  );
}
