// Raw SKILL.md text per folder, so the Skill tab shows exactly what an agent will read.
const files = import.meta.glob<string>('/skills/*/SKILL.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export function skillText(repoPath: string): string {
  return files[`/${repoPath}`] ?? `(missing ${repoPath})`;
}
