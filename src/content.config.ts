import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// The manifest contract. Every folder under skills/ (mediums, kinds, compose-* compositions) carries
// one of these as frontmatter. Adding a folder adds a page; nothing in src/ needs to change.
//
// The model: a medium, kind, or composition is a class. Its instances are concrete ways to build it:
// pool instances have a `module` the site runs, wild instances have a maker (`by`) and a URL.

const instance = z
  .object({
    slug: z.string().optional(),
    name: z.string(),
    hook: z.string().optional(),
    module: z.string().optional(),
    by: z.enum(['you', 'oss']).optional(),
    url: z.string().url().optional(),
    private: z.boolean().optional(),
    note: z.string().optional(),
  })
  .refine((i) => i.module || i.by, { message: 'an instance needs a module (pool) or a maker (wild)' });

const accent = z.object({ light: z.string(), dark: z.string() });

const base = {
  slug: z.string(),
  /** sort key on the rails; lower first, then by name */
  order: z.number().optional(),
  name: z.string(),
  /** class hook: what the medium is, not what the demo does */
  hook: z.string(),
  /** the McLuhan line: what this class does to a person before any content */
  message: z.string(),
  direction: z.enum(['in', 'out', 'both']),
  substrate: z.array(z.string()).default([]),
  accent,
  instances: z.array(instance).min(1),
};

const folderId = ({ entry }: { entry: string }) => entry.split('/')[0];

const lanes = defineCollection({
  loader: glob({ pattern: '*/lane.md', base: './skills', generateId: folderId }),
  schema: z.object({
    ...base,
    // kinds only: the slug of the parent medium
    lane: z.string().optional(),
  }),
});

const compositions = defineCollection({
  loader: glob({ pattern: '*/composition.md', base: './skills', generateId: folderId }),
  schema: z.object({
    ...base,
    mediums: z.array(z.string()).min(2),
    binding: z.string(),
  }),
});

export const collections = { lanes, compositions };
