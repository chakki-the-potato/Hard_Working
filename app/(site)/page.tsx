import type { Metadata } from "next";
import { HomeView } from "@/components/site/home-view";
import {
  getHomeViewData,
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
  const { posts, ideas, projects, categoryStats, tagStats } =
    await getHomeViewData();

  return (
    <HomeView
      archiveCount={POSTS_PER_PAGE}
      categoryStats={categoryStats}
      featuredCount={FEATURED_POST_COUNT}
      ideas={ideas}
      posts={posts}
      projects={projects}
      tagStats={tagStats}
    />
  );
}
