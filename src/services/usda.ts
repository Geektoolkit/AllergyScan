import db from '../db/indexeddb';

// In-memory cache for the USDA API key to avoid repeated IndexedDB reads
let cachedApiKey: string | null = null;

export function setCachedUsdaKey(key: string | null) {
  cachedApiKey = key ? String(key) : null;
}

export function clearCachedUsdaKey(){ cachedApiKey = null; }

async function getApiKey(): Promise<string | null> {
  if (cachedApiKey) return cachedApiKey;
  const key = await db.getSetting('usdaApiKey');
  if (key) cachedApiKey = String(key);
  return cachedApiKey;
}
export async function searchFoods(query: string, pageSize = 10){
  const apiKey = await getApiKey();
  if(!apiKey) throw new Error('No USDA API key configured. Set it in Settings.');
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}`;
  const body: any = {
    query,
    dataType: ['Branded'],
    pageSize
  };

  // If the query contains multiple words, require all words to improve multi-word matching
  if (/\s+/.test((query||'').trim())) {
    body.requireAllWords = true;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if(!res.ok) {
    const txt = await res.text();
    throw new Error(`USDA API error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  return data;
}

export async function fetchFoodByFdcId(fdcId: number){
  const apiKey = await getApiKey();
  if(!apiKey) throw new Error('No USDA API key configured. Set it in Settings.');
  const url = `https://api.nal.usda.gov/fdc/v1/food/${encodeURIComponent(String(fdcId))}?api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if(!res.ok){
    const txt = await res.text();
    throw new Error(`USDA API error ${res.status}: ${txt}`);
  }
  return res.json();
}
