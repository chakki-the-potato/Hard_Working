import type { Metadata } from "next";
import Link from "next/link";
import { ContentRow } from "@/components/site/content-row";
import {
  listPublishedIdeas,
  listPublishedPosts,
  listPublishedProjects,
} from "@/lib/content/public-queries";
import {
  FEATURED_POST_COUNT,
  POSTS_PER_PAGE,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
};

export default async function HomePage() {
  const [posts, ideas, projects] = await Promise.all([
    listPublishedPosts(),
    listPublishedIdeas(),
    listPublishedProjects(),
  ]);
  const featured = posts.slice(0, FEATURED_POST_COUNT);
  const archive = posts.slice(
    FEATURED_POST_COUNT,
    FEATURED_POST_COUNT + POSTS_PER_PAGE,
  );
  const tagCount = new Set(posts.flatMap((post) => post.tags.map((tag) => tag.slug)))
    .size;

  return (
    <main>
      <section className="home-hero">
        <span className="mono-label">// LEARNING IN PUBLIC</span>
        <h1>
          배우고, 만들고,
          <br />
          기록합니다.
        </h1>
        <p>{SITE_DESCRIPTION}</p>
        <dl className="home-stats">
          <div>
            <dt>ARTICLES</dt>
            <dd>{posts.length}</dd>
          </div>
          <div>
            <dt>TAGS</dt>
            <dd>{tagCount}</dd>
          </div>
          <div>
            <dt>IDEAS</dt>
            <dd>{ideas.length}</dd>
          </div>
          <div>
            <dt>PROJECTS</dt>
            <dd>{projects.length}</dd>
          </div>
        </dl>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div>
            <span className="mono-label">// FEATURED</span>
            <h2>최근 기록.</h2>
          </div>
          <Link href="/posts/category/programming">전체 글 →</Link>
        </div>
        <div className="featured-grid">
          {featured.map((post, index) => (
            <Link className="featured-card" href={post.path} key={post.id}>
              <span className="mono-label">
                №{String(posts.length - index).padStart(3, "0")} ·{" "}
                {post.category?.name.toUpperCase()}
              </span>
              <h3>{post.title}</h3>
              <p>{post.description}</p>
              <time dateTime={post.publishedAt}>
                {new Intl.DateTimeFormat("ko-KR", {
                  dateStyle: "medium",
                  timeZone: "Asia/Seoul",
                }).format(new Date(post.publishedAt))}
              </time>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div>
            <span className="mono-label">// ARCHIVE</span>
            <h2>모든 기록.</h2>
          </div>
          {posts.length > FEATURED_POST_COUNT + POSTS_PER_PAGE ? (
            <Link href="/page/2">다음 페이지 →</Link>
          ) : null}
        </div>
        <div className="content-rows">
          {archive.map((post, index) => (
            <ContentRow
              item={post}
              key={post.id}
              number={posts.length - FEATURED_POST_COUNT - index}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
