import { getCollection } from 'astro:content';
import { categoryLabel } from '../../lib/categories';

export async function GET() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const searchData = posts
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((post) => ({
      id: post.id,
      title: post.data.title,
      description: post.data.description,
      category: post.data.category,
      categoryLabel: categoryLabel(post.data.category),
      tags: post.data.tags,
      pubDate: post.data.pubDate.toISOString(),
    }));

  return new Response(JSON.stringify(searchData), {
    headers: { 'Content-Type': 'application/json' },
  });
}
