import Link from "next/link";
import { HeroDriftBackground } from "@/components/site/hero-drift-background";
import { HomeScrollEffects } from "@/components/site/home-scroll-effects";
import { PostCard } from "@/components/site/post-card";
import { PostListRow } from "@/components/site/post-list-row";
import { SidebarWidgets } from "@/components/site/sidebar-widgets";
import type { PublicContentItem } from "@/lib/content/public-types";
import type { PublicContentStat } from "@/lib/content/public-types";
import type { PublicHypothesis } from "@/lib/hypotheses/public-types";

type HomeViewProps = Readonly<{
  posts: readonly PublicContentItem[];
  ideas: readonly PublicContentItem[];
  projects: readonly PublicContentItem[];
  categoryStats: readonly PublicContentStat[];
  tagStats: readonly PublicContentStat[];
  recentActivity: readonly PublicContentItem[];
  featuredCount: number;
  archiveCount: number;
  hypotheses: readonly PublicHypothesis[];
}>;

function formatStripDate(value: string): string {
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

export function HomeView({
  posts,
  ideas,
  projects,
  categoryStats,
  tagStats,
  recentActivity,
  featuredCount,
  archiveCount,
  hypotheses,
}: HomeViewProps) {
  const featured = posts.slice(0, featuredCount);
  const archive = posts.slice(featuredCount, featuredCount + archiveCount);
  const recentIdeas = ideas.slice(0, 3);
  const recentHypotheses = hypotheses.slice(0, 3);
  const archivePageCount = Math.max(
    1,
    Math.ceil(Math.max(0, posts.length - featuredCount) / archiveCount),
  );
  const totalTags = new Set(
    posts.flatMap((post) => post.tags.map((tag) => tag.slug)),
  ).size;
  const latestUpdate = posts[0]?.updatedAt ?? new Date().toISOString();

  return (
    <main>
      <HomeScrollEffects />
      <section className="qt-hero" id="qt-hero">
        <div className="qt-hero-bg-wrap" id="qt-hero-bg-wrap">
          <HeroDriftBackground />
        </div>
        <div className="qt-hero-inner">
          <aside className="qt-hero-mark" aria-hidden="true">
            <span className="qt-hero-mark-num">/STUDY</span>
            <span className="qt-hero-mark-year">JOURNAL</span>
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
              <h2 className="qt-strip-mono">// IDEAS · SCRATCHPAD</h2>
              <Link className="qt-strip-more" href="/ideas">
                ALL →
              </Link>
            </div>
            <div className="qt-strip-rail">
              {recentIdeas.map((idea, index) => (
                <Link className="qt-strip-card" href={idea.path} key={idea.id}>
                  <span className="qt-strip-num">
                    № {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="qt-strip-cat">
                    [{idea.category?.name.toUpperCase() ?? "IDEA"}]
                  </span>
                  <h3 className="qt-strip-title">{idea.title}</h3>
                  <time
                    className="qt-strip-date"
                    dateTime={idea.publishedAt}
                  >
                    {formatStripDate(idea.publishedAt)}
                  </time>
                </Link>
              ))}
            </div>
          </section>

          {recentHypotheses.length > 0 ? (
            <section className="qt-strip">
              <div className="qt-strip-head">
                <h2 className="qt-strip-mono">// HYPOTHESES · VALIDATION</h2>
                <Link className="qt-strip-more" href="/hypotheses">
                  ALL →
                </Link>
              </div>
              <div className="qt-strip-rail">
                {recentHypotheses.map((hypothesis, index) => (
                  <Link
                    className="qt-strip-card"
                    href={`/hypotheses/${hypothesis.slug}`}
                    key={hypothesis.id}
                  >
                    <span className="qt-strip-num">
                      № {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="qt-strip-cat">
                      [{hypothesis.status.toUpperCase()}]
                    </span>
                    <h3 className="qt-strip-title">{hypothesis.statement}</h3>
                    <time
                      className="qt-strip-date"
                      dateTime={hypothesis.publishedAt}
                    >
                      {formatStripDate(hypothesis.publishedAt)}
                    </time>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="qt-archive-wrap">
            <div className="qt-section-head qt-section-archive">
              <h2 className="qt-section-mono">// ARCHIVE</h2>
              <span className="qt-section-count">
                PAGE 01 OF {String(archivePageCount).padStart(2, "0")}
              </span>
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
            <nav aria-label="페이지 이동" className="qt-archive-pager">
              <span className="qt-pager-arrow is-disabled">← PREV</span>
              <span className="qt-pager-mono">
                01 / {String(archivePageCount).padStart(2, "0")}
              </span>
              {archivePageCount > 1 ? (
                <Link className="qt-pager-arrow is-next" href="/page/2">
                  NEXT →
                </Link>
              ) : (
                <span className="qt-pager-arrow is-next is-disabled">
                  NEXT →
                </span>
              )}
            </nav>
          </section>
        </div>
        <aside className="qt-home-aside" aria-label="사이드바">
          <SidebarWidgets
            categoryStats={categoryStats}
            posts={posts}
            projects={projects}
            recentActivity={recentActivity}
            tagStats={tagStats}
          />
        </aside>
      </div>
    </main>
  );
}
