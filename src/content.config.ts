import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// The manifest contract. Every folder under skills/ (lanes, kinds, compose-* compositions) carries one of these
// as frontmatter. Adding a folder adds a page; nothing in src/ needs to change.

const example = z.object({
  name: z.string(),
  url: z.string().url().optional(),
  by: z.enum(['you', 'oss']),
  private: z.boolean().optional(),
  note: z.string(),
});

const accent = z.object({ light: z.string(), dark: z.string() });

const base = {
  slug: z.string(),
  name: z.string(),
  hook: z.string(),
  message: z.string(),
  accent,
  demo: z.string(),
  /** sort key on the rails; lower first, then by name */
  order: z.number().optional(),
  examples: z.array(example).default([]),
};

const folderId = ({ entry }: { entry: string }) => entry.split('/')[0];

const lanes = defineCollection({
  loader: glob({ pattern: '*/lane.md', base: './skills', generateId: folderId }),
  schema: z.object({
    ...base,
    // kinds only: the slug of the parent lane
    lane: z.string().optional(),
  }),
});

const compositions = defineCollection({
  loader: glob({ pattern: '*/composition.md', base: './skills', generateId: folderId }),
  schema: z.object({
    ...base,
    mediums: z.array(z.string()).min(2),
    binding: z.string(),
    example: z.string().optional(),
  }),
});

export const collections = { lanes, compositions };
