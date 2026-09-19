/**
 * Priority-based search ranking utility.
 *
 * Ranking order (lowest score = highest priority):
 *   0 — exact match (field === query)
 *   1 — starts-with match
 *   2 — contains match
 *   3 — no match
 *
 * All comparisons are case-insensitive.
 */

export function fieldRank(field: string, query: string): number {
  const f = field.toLowerCase();
  const q = query.toLowerCase();
  if (f === q) return 0;
  if (f.startsWith(q)) return 1;
  if (f.includes(q)) return 2;
  return 3;
}

/** Return the best (lowest) rank across multiple fields. */
export function bestRank(query: string, ...fields: string[]): number {
  let best = 3;
  for (const f of fields) {
    if (!f) continue;
    const r = fieldRank(f, query);
    if (r < best) best = r;
    if (best === 0) break;
  }
  return best;
}

/**
 * Filter items by search query across the given field accessors,
 * then sort by rank (exact > starts-with > contains).
 * Items that don't match any field are excluded.
 */
export function rankedSearch<T>(
  items: T[],
  query: string,
  fieldGetters: Array<(item: any) => string> = []
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items
    .map((item) => {
      const fields = fieldGetters.map((g) => (g(item) || '').toLowerCase());
      let rank = 3;
      for (const f of fields) {
        if (f === q) { rank = 0; break; }
        if (rank > 1 && f.startsWith(q)) rank = 1;
        if (rank > 2 && f.includes(q)) rank = 2;
      }
      return { item, rank };
    })
    .filter((r) => r.rank < 3)
    .sort((a, b) => a.rank - b.rank)
    .map((r) => r.item);
}
