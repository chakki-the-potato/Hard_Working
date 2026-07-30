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
      <section className="list-hero">
        <span className="mono-label">// IDEAS / WORKS</span>
        <h1>
          <span>#</span> Works
        </h1>
        <small>
          {groups.length} PROJECTS · {totalNotes} NOTES
        </small>
      </section>

      <section className="content-list" aria-label="Works 아이디어 목록">
        {groups.map((group) => (
          <section key={group.slug}>
            <span className="mono-label">// PROJECT</span>
            <h2>{group.label}</h2>
            {group.items.map((item) => (
              <ContentRow item={item} key={item.id} />
            ))}
          </section>
        ))}
      </section>
    </main>
  );
}
