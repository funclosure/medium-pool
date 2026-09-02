import { getCollection, type CollectionEntry } from 'astro:content';

export type Accent = { light: string; dark: string };
export type Level = 'medium' | 'kind' | 'composition';

/** An instance that runs in the pool: the site mounts its module on the stage. */
export interface PoolInstance { slug: string; name: string; hook: string; module: string; demoKey: string }
/** An instance in the wild: a project or library someone else built. */
export interface WildInstance { name: string; by: 'you' | 'oss'; url?: string; private?: boolean; note: string }

export interface Entry {
  level: Level;
  folder: string; // skill name == folder name
  slug: string;
  name: string;
  hook: string;
  message: string;
  direction: 'in' | 'out' | 'both';
  substrate: string[];
  accent: Accent;
  /** site path, e.g. /text or /visualization/map */
  path: string;
  /** repo path of the SKILL.md */
  skillPath: string;
  pool: PoolInstance[];
  wild: WildInstance[];
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
  const pool: PoolInstance[] = [];
  const wild: WildInstance[] = [];
  for (const i of d.instances as any[]) {
    if (i.module) pool.push({ slug: i.slug ?? i.name.toLowerCase().replace(/\s+/g, '-'), name: i.name, hook: i.hook ?? '', module: i.module, demoKey: `/skills/${e.id}/${i.module}` });
    else wild.push({ name: i.name, by: i.by, url: i.url, private: i.private, note: i.note ?? '' });
  }
  if (!pool.length) throw new Error(`${e.id} has no pool instance (an instance with a module)`);
  return {
    level,
    folder: e.id,
    slug: d.slug,
    name: d.name,
    hook: d.hook,
    message: d.message,
    direction: d.direction,
    substrate: d.substrate ?? [],
    accent: d.accent,
    path,
    skillPath: `skills/${e.id}/SKILL.md`,
    pool,
    wild,
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

  const lanes = laneEntries.filter((e) => !e.data.lane).map((e) => build('medium', e, `/${e.data.slug}`));
  lanes.sort(byOrder);

  for (const e of laneEntries.filter((e) => e.data.lane)) {
    const parent = lanes.find((l) => l.slug === e.data.lane);
    if (!parent) throw new Error(`Kind ${e.id} names medium "${e.data.lane}", which does not exist`);
    parent.kinds.push(build('kind', e, `/${parent.slug}/${e.data.slug}`));
  }

  const compositions = compEntries.map((e) => build('composition', e, `/${e.data.slug}`)).sort(byOrder);
  for (const l of lanes) l.kinds.sort(byOrder);
  const all = [...lanes, ...lanes.flatMap((l) => l.kinds), ...compositions];
  cached = { lanes, compositions, all, bySlug: (slug) => all.find((x) => x.slug === slug) };
  return cached;
}
