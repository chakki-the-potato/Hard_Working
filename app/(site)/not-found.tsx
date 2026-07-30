import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <span className="mono-label">// 404</span>
      <h1>페이지를 찾을 수 없습니다.</h1>
      <p>주소가 변경됐거나 공개되지 않은 콘텐츠입니다.</p>
      <Link href="/">홈으로 돌아가기 →</Link>
    </main>
  );
}
