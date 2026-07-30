import Link from "next/link";
import { PostListRow } from "@/components/site/post-list-row";
import { listPublishedPosts } from "@/lib/content/public-queries";

export default async function NotFoundPage() {
  const posts = await listPublishedPosts();
  const suggestions = posts.slice(0, 3);

  return (
    <main className="qt-404">
      <span className="qt-404-mono">
        // ERROR_404 ─ STATUS: NOT_FOUND
      </span>
      <h1 className="qt-404-num">
        4<span className="qt-404-zero">0</span>4
      </h1>
      <p className="qt-404-title">이 페이지는 아직 쓰이지 않았습니다.</p>
      <p className="qt-404-desc">
        URL이 바뀌었거나, 글이 삭제되었을 수 있어요. 홈으로 돌아가거나 검색을
        시도해 주세요.
      </p>
      <div className="qt-404-actions">
        <Link className="qt-404-btn-primary" href="/">
          홈으로
        </Link>
        <button
          className="qt-404-btn-ghost"
          data-cmdk-trigger
          type="button"
        >
          검색
          <span className="qt-404-key">⌘K</span>
        </button>
      </div>
      {suggestions.length > 0 ? (
        <section className="qt-404-related">
          <span className="qt-404-related-mono">// MAYBE YOU MEANT</span>
          {suggestions.map((post, index) => (
            <PostListRow
              item={post}
              key={post.id}
              number={posts.length - index}
            />
          ))}
        </section>
      ) : null}
    </main>
  );
}
