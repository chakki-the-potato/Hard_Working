import Link from "next/link";
import { PostCard } from "@/components/site/post-card";
import { PostListRow } from "@/components/site/post-list-row";
import { SidebarWidgets } from "@/components/site/sidebar-widgets";
import type { PublicContentItem } from "@/lib/content/public-types";
import type { PublicContentStat } from "@/lib/content/public-types";

type HomeViewProps = Readonly<{
  posts: readonly PublicContentItem[];
  ideas: readonly PublicContentItem[];
  projects: readonly PublicContentItem[];
  categoryStats: readonly PublicContentStat[];
  tagStats: readonly PublicContentStat[];
  featuredCount: number;
  archiveCount: number;
}>;

export function HomeView({
  posts,
  ideas,
  projects,
  categoryStats,
  tagStats,
  featuredCount,
  archiveCount,
}: HomeViewProps) {
  const featured = posts.slice(0, featuredCount);
  const archive = posts.slice(featuredCount, featuredCount + archiveCount);
  const recentIdeas = ideas.slice(0, 4);
  const totalTags = new Set(
    posts.flatMap((post) => post.tags.map((tag) => tag.slug)),
  ).size;
  const latestUpdate = posts[0]?.updatedAt ?? new Date().toISOString();

  return (
    <main>
      <section className="qt-hero" id="qt-hero">
        <div className="qt-hero-bg-wrap" id="qt-hero-bg-wrap" />
        <div className="qt-hero-inner">
          <aside className="qt-hero-mark" aria-hidden="true">
            <span>/STUDY</span>
            <span>JOURNAL</span>
          </aside>
          <div className="qt-hero-syslog">
            SYS_LOG
            <br />
            <time id="qt-syslog-time" dateTime={latestUpdate}>
              {new Intl.DateTimeFormat("ko-KR", {
                dateStyle: "short",
                timeZone: "Asia/Seoul",
              }).format(new Date(latestUpdate))}
            </time>
            <br />
            <span className="qt-hero-online">● ONLINE</span>
          </div>
          <span className="qt-hero-mono">╱╱ HARD_WORKING / V.02</span>
          <h1 className="qt-hero-title">
            세상은 넓고도 넓고
            <br />내 <span className="qt-hero-accent">자리</span>는 있다.
          </h1>
          <p className="qt-hero-desc">
            Programming · Thinking · Design — 매일의 학습 기록.
          </p>
          <div className="qt-hero-stats">
            <span>
              <strong>{posts.length}</strong> articles
            </span>
            <span>
              <strong>{totalTags}</strong> tags
            </span>
            <span>
              updated <strong>daily</strong>
            </span>
          </div>
        </div>
      </section>

      <div className="qt-home-shell">
        <div className="qt-home-content">
          <section className="qt-featured-wrap">
            <div className="qt-section-head">
              <h2 className="qt-section-mono">// FEATURED</h2>
              <span className="qt-section-count">
                {String(featured.length).padStart(2, "0")} OF{" "}
                {String(posts.length).padStart(2, "0")}
              </span>
            </div>
            <div className="qt-feat-list">
              {featured.map((post, index) => (
                <PostCard
                  item={post}
                  key={post.id}
                  number={posts.length - index}
                />
              ))}
            </div>
          </section>

          <section className="qt-strip">
            <div className="qt-strip-head">
              <h2>// IDEAS / SCRATCHPAD</h2>
              <Link href="/ideas">VIEW ALL →</Link>
            </div>
            <div className="qt-strip-list">
              {recentIdeas.map((idea) => (
                <Link href={idea.path} key={idea.id}>
                  <span>{idea.title}</span>
                  <span>↗</span>
                </Link>
              ))}
              {recentIdeas.length === 0 ? <span>아직 등록된 아이디어가 없습니다.</span> : null}
            </div>
          </section>

          <section className="qt-archive-wrap">
            <div className="qt-section-head qt-section-archive">
              <h2 className="qt-section-mono">// ARCHIVE</h2>
              <span className="qt-section-count">PAGE 01</span>
            </div>
            <div className="qt-archive-list">
              {archive.map((post, index) => (
                <PostListRow
                  item={post}
                  key={post.id}
                  number={posts.length - featuredCount - index}
                />
              ))}
            </div>
          </section>
        </div>
        <aside className="qt-home-aside" aria-label="사이드바">
          <SidebarWidgets
            categoryStats={categoryStats}
            projects={projects}
            tagStats={tagStats}
          />
        </aside>
      </div>
    </main>
  );
}
