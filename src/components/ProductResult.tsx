import React, { useEffect, useState } from 'react';
import db from '../db/indexeddb';
import { matchIngredientsDetailed } from '../matching/engine';

export default function ProductResult({ product }: { product: any }) {
  const ingredients = product?.product?.ingredients_text || product?.ingredients_text || '';
  const [profiles, setProfiles] = useState<any[]>([]);
  const [cacheInfo, setCacheInfo] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(0.3);

  useEffect(() => {
    (async () => {
      const p = await db.listProfiles();
      setProfiles(p || []);
      const cached = await db.getProduct(product?.code || product?.id || '');
      if (cached) {
        const age = Date.now() - (cached._fetchedAt || 0);
        const days = Math.floor(age / (1000 * 60 * 60 * 24));
        setCacheInfo(`${days} day(s) ago`);
      }
      const t = await db.getSetting('fuzzyThreshold');
      setThreshold(t !== undefined && t !== null ? Number(t) : 0.3);
    })();
  }, [product]);
  const results = profiles.map((p: any) => ({ profile: p, matches: matchIngredientsDetailed(ingredients, p.allergens || [], { threshold }) }));
  const image = product?.product?.image_small_url || product?.product?.image_front_small_url || product?.image_url || null;
  const brand = product?.product?.brands || product?.brand || '';
  const matchCount = results.filter(r => r.matches.length > 0).length;

  return (
    <div className="product-card" aria-labelledby="product-title" role="region">
      <div className="visually-hidden" aria-live="polite">{matchCount > 0 ? `${matchCount} profiles with matches` : 'No matches found for any profile'}</div>
      <div style={{ display: 'flex', gap: 12 }}>
        {image && <img src={image} alt={product?.product?.product_name || 'product image'} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }} />}
        <div style={{ flex: 1 }}>
          <h3 id="product-title" style={{ margin: 0 }}>{product?.product?.product_name || product?.product_name || 'Unknown product'}</h3>
          <div style={{ color: '#666' }}>{brand}</div>
          {cacheInfo && <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>Cached: {cacheInfo}</div>}
        </div>
      </div>

      <div className="ingredients" style={{ marginTop: 12 }}>{ingredients || 'Ingredients not available'}</div>
      <div style={{ marginTop: 12 }} role="list" aria-label="Profiles results">
        {results.map(r => (
          <div className="person-row" key={r.profile.id} role="listitem" aria-label={`${r.profile.name}: ${r.matches.length > 0 ? 'contains ' + r.matches.map((m:any)=>m.term).join(', ') : 'no matches'}`}>
            <div>
              <div style={{ fontWeight: 700 }}>{r.profile.name}</div>
              {r.matches.length > 0 ? (
                <ul className="match-list" aria-label={`Matches for ${r.profile.name}`}>
                  {r.matches.map((m: any) => (
                    <li key={`${m.term}-${m.matchedToken}`} style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{m.term}</span>
                      {m.canonical && m.canonical !== m.term ? <span style={{ marginLeft: 6, color: '#666', fontSize: 12 }}>({m.canonical})</span> : null}
                      {m.method === 'fuzzy' ? <div style={{ fontSize: 11, color: '#999' }}>fuzzy match to "{m.matchedToken}"</div> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-matches" aria-live="polite">No matches</div>
              )}
            </div>
            <div style={{ fontSize: 20 }} aria-hidden>{r.matches.length > 0 ? '❌' : '✅'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
