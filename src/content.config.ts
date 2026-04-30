import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './lib/categories';

// Folder layout:
//   blog/other categories: {category}/{year}/{slug}.md  → public id: {category}/{slug}
//   ideas/works:           works/{project}/{slug}.md    → public id: works/{project}/{slug}
//   ideas/other:           {category}/{year}/{slug}.md  → public id: {category}/{slug}
function flattenYear({ entry }: { entry: string }) {
  const noExt = entry.replace(/\.md$/, '');
  const parts = noExt.split('/');
  if (parts.length === 3 && /^\d{4}$/.test(parts[1])) {
    // {category}/{year}/{slug} → strip year
    return `${parts[0]}/${parts[2]}`;
  }
  // works/{project}/{slug} or any non-year nested path → keep as-is
  return noExt;
}

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/blog', generateId: flattenYear }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(CATEGORIES),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    heroImage: z.string().optional(),
    demoUrl: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
    role: z.string().optional(),
    period: z.string().optional(),
    outcome: z.string().optional(),
  }),
});

const ideas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/ideas', generateId: flattenYear }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(CATEGORIES),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    version: z.string().optional(),
  }),
});

export const collections = { blog, ideas };
