// Ingredient normalization and matching utilities (improved)
import Fuse from 'fuse.js';

export function normalizeIngredients(text?:string){
  if(!text) return [];
  return text
    .toLowerCase()
    .replace(/[()\.,]/g,' ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

const SYNONYMS: Record<string,string[]> = {
  'milk': ['milk','lactose','whey','casein','buttermilk','milk powder'],
  'peanut': ['peanut','peanuts','arachis','groundnut'],
  'soy': ['soy','soya','soybean','soy lecithin'],
  'egg': ['egg','albumen','egg white','egg yolk'],
  'tree nut': ['almond','walnut','pecan','cashew','hazelnut','pistachio']
};

const TERM_TO_CANON: Record<string,string> = {};
for(const [canon, vals] of Object.entries(SYNONYMS)){
  TERM_TO_CANON[canon] = canon;
  for(const v of vals){
    TERM_TO_CANON[v] = canon;
  }
}

export function canonicalFor(term: string){
  if(!term) return null;
  const lc = term.toLowerCase();
  return TERM_TO_CANON[lc] || null;
}


function expandAvoidList(avoidList:string[]){
  const expanded = new Set<string>();
  for(const a of avoidList){
    const key = a.toLowerCase();
    expanded.add(key);
    for(const [canon, vals] of Object.entries(SYNONYMS)){
      if(canon===key || vals.includes(key)){
        for(const v of vals) expanded.add(v);
      }
    }
  }
  return Array.from(expanded);
}

export function matchIngredientsDetailed(ingredientsText: string, avoidList: string[] = [], options?: { threshold?: number }) {
  const tokens = normalizeIngredients(ingredientsText);
  const expanded = expandAvoidList(avoidList);

  const tokenSet = new Set(tokens);
  const matches: Array<{
    term: string;
    canonical: string | null;
    method: 'exact' | 'fuzzy';
    matchedToken: string;
  }> = [];

  const seen = new Set<string>();

  // Exact matches
  for (const e of expanded) {
    if (tokenSet.has(e) && !seen.has(e)) {
      matches.push({ term: e, canonical: canonicalFor(e) || e, method: 'exact', matchedToken: e });
      seen.add(e);
    }
  }

  // Fuzzy matching for the remaining terms
  const remaining = expanded.filter(e => !seen.has(e));
  if (remaining.length > 0) {
    const fuzzyTargets = remaining.map(e => ({ term: e }));
    const fuse = new Fuse(fuzzyTargets, { keys: ['term'], threshold: (options?.threshold ?? 0.3) });
    // Avoid fuzzy-matching single-letter tokens like vitamin codes ('a', 'b', 'c')
    for (const t of tokens) {
      if (typeof t !== 'string' || t.length < 2) continue;
      const res = fuse.search(t);
      if (res && res.length) {
        const term = res[0].item.term;
        if (!seen.has(term)) {
          matches.push({ term, canonical: canonicalFor(term) || term, method: 'fuzzy', matchedToken: t });
          seen.add(term);
        }
      }
    }
  }

  return matches;
}

export function matchIngredients(ingredientsText: string, avoidList: string[] = []) {
  const detailed = matchIngredientsDetailed(ingredientsText, avoidList);
  return Array.from(new Set(detailed.map(d => d.term)));
}
