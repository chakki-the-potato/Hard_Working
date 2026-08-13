import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { buildContentImportSnapshot } from "@/lib/content/content-snapshot";
import { getContentImportControls } from "@/lib/content/import-policy";
import { ContentImportForm } from "../_components/content-import-form";

export const metadata: Metadata = {
  title: "기존 콘텐츠 이전",
};

export const dynamic = "force-dynamic";

export default async function ContentImportPage() {
  await requireAdminSession();
  const { allowApply } = getContentImportControls(process.env.VERCEL_ENV);
  const snapshot = await buildContentImportSnapshot();
  const counts = snapshot.items.reduce(
    (result, item) => ({
      ...result,
      [item.kind]: result[item.kind] + 1,
    }),
    { post: 0, idea: 0, project: 0 },
  );

  return (
    <main className="admin-workspace">
      <header className="admin-header">
        <div className="admin-heading-group">
          <p className="admin-kicker">Content migration</p>
          <h1 className="admin-title">기존 콘텐츠 이전.</h1>
          <p className="admin-description">
            로컬 Markdown 스냅샷을 관리자 권한으로 Supabase에 반영합니다.
          </p>
        </div>
        <Link className="admin-button admin-button-secondary" href="/admin">
          목록으로
        </Link>
      </header>

      <section className="admin-section" aria-labelledby="import-summary-title">
        <h2 className="admin-section-title" id="import-summary-title">
          이전 대상
        </h2>
        <dl className="admin-import-results">
          <div>
            <dt>블로그 글</dt>
            <dd>{counts.post}</dd>
          </div>
          <div>
            <dt>아이디어</dt>
            <dd>{counts.idea}</dd>
          </div>
          <div>
            <dt>프로젝트</dt>
            <dd>{counts.project}</dd>
          </div>
          <div>
            <dt>리디렉션</dt>
            <dd>{snapshot.redirects.length}</dd>
          </div>
        </dl>
        <p className="admin-import-warning">
          {allowApply
            ? "먼저 dry-run으로 전체 트랜잭션과 개수를 검증합니다. 실제 가져오기는 별도 승인 후 실행합니다."
            : "Production에서는 실제 가져오기가 잠겨 있으며 dry-run만 실행할 수 있습니다."}
        </p>
        <ContentImportForm allowApply={allowApply} />
      </section>
    </main>
  );
}
