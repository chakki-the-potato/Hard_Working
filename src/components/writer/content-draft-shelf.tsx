import Link from "next/link";
import type { UnpublishedContentDraft } from "@/lib/content/content-editor-queries";
import type { ContentKind } from "@/lib/content/content-editor-types";

type ContentDraftShelfProps = Readonly<{
  drafts: readonly UnpublishedContentDraft[];
}>;

const KIND_LABELS: Readonly<Record<ContentKind, string>> = {
  post: "글",
  idea: "아이디어",
  project: "프로젝트",
};

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

export function ContentDraftShelf({ drafts }: ContentDraftShelfProps) {
  if (drafts.length === 0) {
    return null;
  }

  return (
    <section className="writer-shelf" aria-labelledby="writer-shelf-title">
      <div className="writer-shelf-head">
        <h2 className="writer-shelf-title" id="writer-shelf-title">
          이어서 쓰기
        </h2>
        <span className="writer-shelf-count">발행 전 {drafts.length}건</span>
      </div>
      <div className="writer-shelf-list">
        {drafts.map((draft) => (
          <Link
            className="writer-shelf-item"
            href={`/write/${draft.itemId}`}
            key={draft.itemId}
          >
            <span className="writer-shelf-kind">
              {KIND_LABELS[draft.kind]}
            </span>
            <span className="writer-shelf-body">
              <span className="writer-shelf-name">{draft.title}</span>
              <span className="writer-shelf-path">{draft.path}</span>
            </span>
            <time className="writer-shelf-date" dateTime={draft.updatedAt}>
              {formatDate(draft.updatedAt)}
            </time>
          </Link>
        ))}
      </div>
    </section>
  );
}
