import type { Metadata } from "next";
import { HomeView } from "@/components/site/home-view";
import {
  getHomeViewData,
} from "@/lib/content/public-queries";
import { listPublicHypotheses } from "@/lib/hypotheses/public-queries";
import {
  FEATURED_POST_COUNT,
  POSTS_PER_PAGE,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
};

export default async function HomePage() {
  const [
    { posts, ideas, projects, categoryStats, tagStats, recentActivity },
    hypotheses,
  ] = await Promise.all([getHomeViewData(), listPublicHypotheses()]);

  return (
    <HomeView
      archiveCount={POSTS_PER_PAGE}
      categoryStats={categoryStats}
      featuredCount={FEATURED_POST_COUNT}
      hypotheses={hypotheses}
      ideas={ideas}
      posts={posts}
      projects={projects}
      recentActivity={recentActivity}
      tagStats={tagStats}
    />
  );
}
