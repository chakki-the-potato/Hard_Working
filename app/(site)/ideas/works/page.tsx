import type { Metadata } from "next";
import { ContentRow } from "@/components/site/content-row";
import { listWorksIdeaGroups } from "@/lib/content/public-queries";

export const metadata: Metadata = {
  title: "Works — Ideas",
  description: "프로젝트별 작업 아이디어.",
};

export default async function WorksIdeasPage() {
  const groups = await listWorksIdeaGroups();
  const totalNotes = groups.reduce(
    (total, group) => total + group.items.length,
    0,
  );

  return (
    <main>
      <section className="qt-list-hero">
        <span className="qt-mono qt-list-mono">// IDEAS / WORKS</span>
        <h1 className="qt-list-title">
          <span className="qt-list-hash">#</span>Works
        </h1>
        <small className="qt-mono qt-list-meta">
          {groups.length} PROJECTS · {totalNotes} NOTES
        </small>
      </section>

      <section className="qt-project-groups" aria-label="Works 아이디어 목록">
        {groups.map((group) => (
          <section className="qt-project-group" key={group.slug}>
            <header className="qt-project-group-head">
              <span className="qt-mono">// PROJECT</span>
              <h2>{group.label}</h2>
            </header>
            <div className="qt-list-rows">
              {group.items.map((item) => (
                <ContentRow item={item} key={item.id} />
              ))}
            </div>
          </section>
        ))}
      </section>
    </main>
  );
}
