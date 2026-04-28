export const CATEGORIES = ['programming', 'design', 'thinking', 'works'] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  programming: 'Programming',
  design: 'Design',
  thinking: 'Thinking',
  works: 'Works',
};

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function categoryLabel(category: Category): string {
  return CATEGORY_LABEL[category];
}

// Sub-tags that should always appear as chips even before any post uses them.
// Keyed by the parent category they belong under.
export const ALWAYS_VISIBLE_TAGS_PER_CATEGORY: Partial<Record<Category, readonly string[]>> = {
  programming: ['Tools'],
  thinking: ['Career', 'Mindset'],
  design: ['UI', 'Typography'],
  works: [],
};

export const ALWAYS_VISIBLE_TAGS: readonly string[] = Object.values(
  ALWAYS_VISIBLE_TAGS_PER_CATEGORY,
).flat();
