import Link from "next/link";
import type { HypothesisListItem } from "@/lib/hypotheses/admin-types";
import { HYPOTHESIS_STATUS_LABELS } from "@/lib/hypotheses/status-labels";
import { getHypothesisWriterPath } from "@/lib/hypotheses/writer-path";

type HypothesisDraftShelfProps = Readonly<{
  drafts: readonly HypothesisListItem[];
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

export function HypothesisDraftShelf({ drafts }: HypothesisDraftShelfProps) {
  if (drafts.length === 0) {
    return null;
  }

  return (
    <section className="qt-hypothesis-shelf" aria-label="비공개 가설">
      <div className="qt-list-thead">
        <span>NO</span>
        <span>STATEMENT (PRIVATE)</span>
        <span>STATUS/CAT</span>
        <span className="qt-list-thead-right">UPDATED</span>
      </div>
      <div className="qt-list-rows">
        {drafts.map((draft, index) => (
          <Link
            className="qt-list-row has-num"
            href={getHypothesisWriterPath(draft.id)}
            key={draft.id}
          >
            <span className="qt-list-num">
              №{String(drafts.length - index).padStart(3, "0")}
            </span>
            <span className="qt-list-title-cell">
              <span className="qt-list-title">{draft.statement}</span>
              <span className="qt-hypothesis-private">PRIVATE</span>
            </span>
            <span className="qt-list-cat">
              <span className="qt-list-cat-key">
                [{HYPOTHESIS_STATUS_LABELS[draft.status]}]
              </span>
              <span className="qt-list-cat-sub"> {draft.category.name}</span>
            </span>
            <time className="qt-list-date" dateTime={draft.updatedAt}>
              {formatDate(draft.updatedAt)}
            </time>
          </Link>
        ))}
      </div>
    </section>
  );
}
