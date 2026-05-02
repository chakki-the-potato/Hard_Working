import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;
export type ProjectMeta = CollectionEntry<'projects'>;

export interface ProjectSummary {
  slug: string;
  label: string;
  count: number;
  latest?: Date;
  meta?: ProjectMeta;
}

export function projectLabel(slug: string): string {
  if (!slug) return '';
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function extractProjectSlug(post: BlogPost): string | null {
  if (post.data.project) return post.data.project;
  const segments = post.id.split('/');
  // id forms after flattenYear:
  //   {category}/{slug}              → no project
  //   {category}/{project}/{slug}    → project = segments[1]
  if (segments.length === 3) return segments[1];
  return null;
}

function assertConsistency(post: BlogPost): void {
  const segments = post.id.split('/');
  if (segments.length !== 3) return;
  const pathProject = segments[1];
  const fmProject = post.data.project;
  if (fmProject && fmProject !== pathProject) {
    console.warn(
      `[projects] frontmatter project "${fmProject}" does not match path segment "${pathProject}" in ${post.id}`,
    );
  }
}

export async function getPostsByProject(): Promise<Map<string, BlogPost[]>> {
  const all = await getCollection('blog', ({ data }) => !data.draft);
  const map = new Map<string, BlogPost[]>();
  for (const post of all) {
    assertConsistency(post);
    const slug = extractProjectSlug(post);
    if (!slug) continue;
    const list = map.get(slug) ?? [];
    list.push(post);
    map.set(slug, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  }
  return map;
}

export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  const [postsByProject, projectMetas] = await Promise.all([
    getPostsByProject(),
    getCollection('projects'),
  ]);

  const metaBySlug = new Map<string, ProjectMeta>();
  for (const meta of projectMetas) {
    metaBySlug.set(meta.id, meta);
  }

  const slugs = new Set<string>([...metaBySlug.keys(), ...postsByProject.keys()]);
  const summaries: ProjectSummary[] = [];
  for (const slug of slugs) {
    const posts = postsByProject.get(slug) ?? [];
    const meta = metaBySlug.get(slug);
    summaries.push({
      slug,
      label: meta?.data.title ?? projectLabel(slug),
      count: posts.length,
      latest: posts[0]?.data.pubDate,
      meta,
    });
  }

  return summaries.sort((a, b) => {
    const aOrder = a.meta?.data.order ?? Number.POSITIVE_INFINITY;
    const bOrder = b.meta?.data.order ?? Number.POSITIVE_INFINITY;
    if (aOrder !== bOrder) return aOrder - bOrder;
    if (a.count !== b.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });
}
