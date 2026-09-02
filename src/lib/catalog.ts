import { getCollection, type CollectionEntry } from 'astro:content';

export type Example = { name: string; url?: string; by: 'you' | 'oss'; private?: boolean; note: string };
export type Accent = { light: string; dark: string };

export type Level = 'lane' | 'kind' | 'composition';

export interface Entry {
  level: Level;
  folder: string; // skill name == folder name
  slug: string;
  name: string;
  hook: string;
  message: string;
  accent: Accent;
  /** import.meta.glob key of the demo module, e.g. /skills/medium-text/reference/StreamingText.ts */
  demoKey: string;
  /** site path, e.g. /text or /visualization/map */
  path: string;
  /** repo path of the SKILL.md */
  skillPath: string;
  examples: Example[];
  whyHtml: string;
  gotchasHtml: string;
  kinds: Entry[];
  order: number;
  laneSlug?: string;
  mediums?: string[];
  binding?: string;
}

export interface Catalog {
  lanes: Entry[];
  compositions: Entry[];
  all: Entry[];
  bySlug: (slug: string) => Entry | undefined;
}

function splitBody(html: string | undefined) {
  const src = html ?? '';
  const at = src.search(/<h2[^>]*id="gotchas"/);
  if (at < 0) return { whyHtml: src, gotchasHtml: '' };
  return { whyHtml: src.slice(0, at), gotchasHtml: src.slice(at).replace(/<h2[^>]*>Gotchas<\/h2>/, '<h3>Where it bites</h3>') };
}

function build(level: Level, e: CollectionEntry<'lanes'> | CollectionEntry<'compositions'>, path: string): Entry {
  const d = e.data as any;
  const { whyHtml, gotchasHtml } = splitBody(e.rendered?.html);
  return {
    level,
    folder: e.id,
    slug: d.slug,
    name: d.name,
    hook: d.hook,
    message: d.message,
    accent: d.accent,
    demoKey: `/skills/${e.id}/${d.demo}`,
    path,
    skillPath: `skills/${e.id}/SKILL.md`,
    examples: d.examples ?? [],
    whyHtml: whyHtml.replace(/<h2[^>]*>Why<\/h2>/, ''),
    gotchasHtml,
    kinds: [],
    order: d.order ?? 99,
    laneSlug: d.lane,
    mediums: d.mediums,
    binding: d.binding,
  };
}

const byOrder = (a: Entry, b: Entry) => a.order - b.order || a.name.localeCompare(b.name);

let cached: Catalog | null = null;

export async function getCatalog(): Promise<Catalog> {
  if (cached) return cached;
  const laneEntries = await getCollection('lanes');
  const compEntries = await getCollection('compositions');

  const lanes = laneEntries.filter((e) => !e.data.lane).map((e) => build('lane', e, `/${e.data.slug}`));
  lanes.sort(byOrder);

  for (const e of laneEntries.filter((e) => e.data.lane)) {
    const parent = lanes.find((l) => l.slug === e.data.lane);
    if (!parent) throw new Error(`Kind ${e.id} names lane "${e.data.lane}", which does not exist`);
    parent.kinds.push(build('kind', e, `/${parent.slug}/${e.data.slug}`));
  }

  const compositions = compEntries.map((e) => build('composition', e, `/${e.data.slug}`)).sort(byOrder);
  for (const l of lanes) l.kinds.sort(byOrder);
  const all = [...lanes, ...lanes.flatMap((l) => l.kinds), ...compositions];
  cached = { lanes, compositions, all, bySlug: (slug) => all.find((x) => x.slug === slug) };
  return cached;
}
