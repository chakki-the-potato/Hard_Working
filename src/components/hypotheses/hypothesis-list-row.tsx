import Link from "next/link";
import type { PublicHypothesis } from "@/lib/hypotheses/public-types";
import { HYPOTHESIS_STATUS_LABELS } from "@/lib/hypotheses/status-labels";

type HypothesisListRowProps = Readonly<{
  hypothesis: PublicHypothesis;
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

export function HypothesisListRow({
  hypothesis,
  number,
}: HypothesisListRowProps) {
  return (
    <Link
      className="qt-list-row has-num"
      href={`/hypotheses/${hypothesis.slug}`}
    >
      <span className="qt-list-num">№{String(number).padStart(3, "0")}</span>
      <span className="qt-list-title-cell">
        <span className="qt-list-title">{hypothesis.statement}</span>
      </span>
      <span className="qt-list-cat">
        <span className="qt-list-cat-key">
          [{HYPOTHESIS_STATUS_LABELS[hypothesis.status]}]
        </span>
        <span className="qt-list-cat-sub"> {hypothesis.category.name}</span>
      </span>
      <time className="qt-list-date" dateTime={hypothesis.publishedAt}>
        {formatDate(hypothesis.publishedAt)}
      </time>
    </Link>
  );
}
