import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVersionHistoryPage } from "@/lib/content/public-queries";

type VersionHistoryPageProps = Readonly<{
  params: Promise<{ path: string[] }>;
}>;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export async function generateMetadata({
  params,
}: VersionHistoryPageProps): Promise<Metadata> {
  const { path } = await params;
  const history = await getVersionHistoryPage(`/posts/${path.join("/")}`);

  return history
    ? {
        title: `${history.current.title} — 버전 히스토리`,
        description: history.current.description ?? history.current.title,
      }
    : {};
}

export default async function VersionHistoryPage({
  params,
}: VersionHistoryPageProps) {
  const { path } = await params;
  const history = await getVersionHistoryPage(`/posts/${path.join("/")}`);

  if (!history) {
    notFound();
  }

  return (
    <main className="article-wrap">
      <section className="article">
        <Link className="article-back" href={history.current.path}>
          ← 글로 돌아가기
        </Link>
        <span className="mono-label">// VERSIONS</span>
        <h1>{history.current.title}</h1>
        {history.current.description ? (
          <p>{history.current.description}</p>
        ) : null}

        <ul aria-label="버전 목록">
          {history.versions.map((version) => (
            <li key={version.id}>
              <strong>
                {version.versionLabel ?? `r${version.revisionNumber}`}
              </strong>{" "}
              <time dateTime={version.publishedAt}>
                {formatDate(version.publishedAt)}
              </time>{" "}
              <span>
                {version.state === "published" ? "현재 버전" : "archived"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
