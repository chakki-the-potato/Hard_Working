import Link from "next/link";
import type {
  PublicContentItem,
  PublicContentNeighbors,
} from "@/lib/content/public-types";

type ArticleNavigationProps = Readonly<{
  neighbors: PublicContentNeighbors;
}>;

type NavigationCardProps = Readonly<{
  direction: "previous" | "next";
  item: PublicContentItem | null;
}>;

function NavigationCard({ direction, item }: NavigationCardProps) {
  const isPrevious = direction === "previous";
  const label = isPrevious ? "← 이전글" : "다음글 →";
  const emptyLabel = isPrevious ? "처음 글입니다" : "최신 글입니다";
  const className = `qt-post-nav-card qt-post-nav-${isPrevious ? "prev" : "next"}`;

  if (!item) {
    return (
      <div aria-hidden="true" className={`${className} is-disabled`}>
        <span className="qt-post-nav-label">{label}</span>
        <span className="qt-post-nav-empty">{emptyLabel}</span>
      </div>
    );
  }

  return (
    <Link className={className} href={item.path}>
      <span className="qt-post-nav-label">{label}</span>
      <span className="qt-post-nav-title">{item.title}</span>
    </Link>
  );
}

export function ArticleNavigation({ neighbors }: ArticleNavigationProps) {
  return (
    <nav className="qt-post-nav" aria-label="이전·다음 글">
      <NavigationCard direction="previous" item={neighbors.previous} />
      <NavigationCard direction="next" item={neighbors.next} />
    </nav>
  );
}
