import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './lib/categories';

// Folder layout: {category}/{year}/{slug}.md
// Public id (and URL segment): {category}/{slug}  — year is filesystem-only.
function flattenYear({ entry }: { entry: string }) {
  const noExt = entry.replace(/\.md$/, '');
  const parts = noExt.split('/');
  if (parts.length >= 3) {
    return `${parts[0]}/${parts[parts.length - 1]}`;
  }
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
    category: z.enum(CATEGORIES),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, ideas };
