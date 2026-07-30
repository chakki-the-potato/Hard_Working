import Link from "next/link";
import type { PublicContentItem } from "@/lib/content/public-types";

type PostListRowProps = Readonly<{
  item: PublicContentItem;
  number?: number;
  showVersion?: boolean;
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

export function PostListRow({
  item,
  number,
  showVersion = false,
}: PostListRowProps) {
  const numberLabel =
    number === undefined ? null : String(number).padStart(3, "0");
  const category = item.category?.name ?? "";
  const subcategory = item.tags[0]?.name ?? "";

  return (
    <Link
      className={`qt-list-row${numberLabel ? " has-num" : ""}`}
      href={item.path}
    >
      {numberLabel ? (
        <span className="qt-list-num">№{numberLabel}</span>
      ) : null}
      <span className="qt-list-title-cell">
        <span className="qt-list-title">{item.title}</span>
        {showVersion && item.versionLabel ? (
          <span className="qt-list-version">{item.versionLabel}</span>
        ) : null}
      </span>
      <span className="qt-list-cat">
        {category ? (
          <span className="qt-list-cat-key">[{category.toUpperCase()}]</span>
        ) : null}
        {subcategory ? (
          <span className="qt-list-cat-sub"> {subcategory}</span>
        ) : null}
      </span>
      <time className="qt-list-date" dateTime={item.publishedAt}>
        {formatDate(item.publishedAt)}
      </time>
    </Link>
  );
}
