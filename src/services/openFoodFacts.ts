import db from '../db/indexeddb';

const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function fetchProductByBarcode(barcode:string){
  if(!barcode) return null;
  const cached = await db.getProduct(barcode);
  const now = Date.now();
  if(cached && (now - (cached._fetchedAt || 0)) < CACHE_TTL){
    return cached.data;
  }

  try{
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    if(!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    await db.saveProduct({ id: barcode, data, _fetchedAt: Date.now() });
    return data;
  }catch(err){
    console.error('fetchProductByBarcode',err);
    // return cached data if available even if stale
    if(cached) return cached.data;
    return null;
  }
}
