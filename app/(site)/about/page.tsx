import type { Metadata } from "next";
import Link from "next/link";
import {
  listPublishedIdeas,
  listPublishedPosts,
  listPublishedProjects,
} from "@/lib/content/public-queries";

export const metadata: Metadata = {
  title: "소개",
  description: "Hard_Working과 운영자 이찬희를 소개합니다.",
};

export default async function AboutPage() {
  const [posts, ideas, projects] = await Promise.all([
    listPublishedPosts(),
    listPublishedIdeas(),
    listPublishedProjects(),
  ]);

  return (
    <main className="about-page">
      <span className="mono-label">// ABOUT</span>
      <h1>배운 것을 기록하고, 만든 것으로 증명합니다.</h1>
      <p>
        Hard_Working은 개발 학습 노트, 사이드 프로젝트, 아이디어와 생각을
        한곳에 쌓는 개인 포트폴리오입니다.
      </p>
      <dl className="home-stats">
        <div>
          <dt>POSTS</dt>
          <dd>{posts.length}</dd>
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
      <section>
        <h2>연락처.</h2>
        <div className="about-links">
          <a href="mailto:chanhee2468@gmail.com">Email</a>
          <a
            href="https://github.com/chakki-the-potato"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/%EC%B0%AC%ED%9D%AC-%EC%9D%B4-49013a1a4/"
            rel="noopener noreferrer"
            target="_blank"
          >
            LinkedIn
          </a>
          <Link href="/rss.xml">RSS</Link>
        </div>
      </section>
    </main>
  );
}
