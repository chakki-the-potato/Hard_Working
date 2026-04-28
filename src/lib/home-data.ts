import { getCollection } from 'astro:content';
import { CATEGORIES, type Category } from './categories';
import type { ActivityEntry } from '../components/widgets/SidebarActivity.astro';
import type { IdeaCard } from '../components/widgets/IdeasStrip.astro';

export interface HomeData {
  totalArticles: number;
  totalTags: number;
  lastUpdate?: Date;
  categoryCounts: Record<Category, number>;
  topTags: Array<{ tag: string; count: number }>;
  recentActivity: ActivityEntry[];
  recentIdeas: IdeaCard[];
}

export async function loadHomeData(): Promise<HomeData> {
  const base = import.meta.env.BASE_URL;

  const allPosts = await getCollection('blog', ({ data }) => !data.draft);
  const sortedPosts = allPosts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const allIdeas = await getCollection('ideas', ({ data }) => !data.draft);
  const sortedIdeas = [...allIdeas].sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const tagSet = new Set<string>();
  const tagCount = new Map<string, number>();
  const categoryCounts = Object.fromEntries(
    CATEGORIES.map((c) => [c, 0])
  ) as Record<Category, number>;

  for (const p of sortedPosts) {
    categoryCounts[p.data.category] += 1;
    for (const t of p.data.tags) {
      tagSet.add(t);
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    }
  }

  const topTags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  const recentActivity: ActivityEntry[] = [
    ...sortedPosts.map<ActivityEntry>((p) => ({
      kind: 'blog',
      title: p.data.title,
      href: `${base}posts/${p.id}/`,
      date: p.data.pubDate,
      category: p.data.category,
    })),
    ...sortedIdeas.map<ActivityEntry>((i) => ({
      kind: 'idea',
      title: i.data.title,
      href: `${base}ideas/${i.id}/`,
      date: i.data.pubDate,
      category: i.data.category,
    })),
  ]
    .sort((a, b) => b.date.valueOf() - a.date.valueOf())
    .slice(0, 6);

  const recentIdeas: IdeaCard[] = sortedIdeas.slice(0, 3).map((i) => ({
    id: i.id,
    title: i.data.title,
    pubDate: i.data.pubDate,
    category: i.data.category,
  }));

  return {
    totalArticles: sortedPosts.length,
    totalTags: tagSet.size,
    lastUpdate: sortedPosts[0]?.data.pubDate,
    categoryCounts,
    topTags,
    recentActivity,
    recentIdeas,
  };
}
