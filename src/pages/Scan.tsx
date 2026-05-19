import React, { useState } from 'react';
import ProductResult from '../components/ProductResult';
import { fetchProductByBarcode } from '../services/openFoodFacts';
import { searchFoods, fetchFoodByFdcId } from '../services/usda';
import CameraScanner from '../components/CameraScanner';

export default function Scan(){
  const [source, setSource] = useState<'upc'|'usda'>('upc');
  const [input, setInput] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [usdaResults, setUsdaResults] = useState<any[]>([]);

  async function doSearch(optionalInput?: string){
    const q = (optionalInput ?? input).trim();
    if(!q) return;
    if(source === 'upc'){
      setLoading(true);
      try{
        const p = await fetchProductByBarcode(q);
        setProduct(p);
        setUsdaResults([]);
      }catch(err){
        console.error('UPC lookup failed', err);
        setProduct(null);
      }
      setLoading(false);
    }else{
      setSearching(true);
      setProduct(null);
      try{
        const res = await searchFoods(q, 10);
        setUsdaResults(res.foods || []);
      }catch(err){
        console.error('USDA search failed', err);
        setUsdaResults([]);
      }
      setSearching(false);
    }
  }

  async function selectUsda(item:any){
    const id = item.fdcId;
    try{
      const detail = await fetchFoodByFdcId(id);
      const ingredientsText = detail?.ingredients || detail?.ingredientsText || detail?.ingredientsDescription || '';
      setProduct({ product: {
        product_name: detail?.description || `FDC ${id}`,
        brands: detail?.brandOwner || '',
        ingredients_text: ingredientsText
      }, id: String(id)});
      setUsdaResults([]);
      setSource('usda');
    }catch(err){
      console.error('fetch detail failed', err);
    }
  }

  function handleScannerDetected(code:string){
    setSource('upc');
    setInput(code);
    doSearch(code);
  }

  return (
    <div className="page-scan">
      <div className="product-card" style={{marginBottom:12}}>
        <div className="search-row" style={{display:'flex',gap:8,alignItems:'center'}}>
          <div className="search-source" role="radiogroup" aria-label="Search source">
            <label>
              <input type="radio" name="source" value="upc" checked={source==='upc'} onChange={()=>setSource('upc')} />
              <span>UPC</span>
            </label>
            <label>
              <input type="radio" name="source" value="usda" checked={source==='usda'} onChange={()=>setSource('usda')} />
              <span>USDA</span>
            </label>
          </div>

          <input aria-label={source==='upc' ? 'UPC or EAN' : 'Product name for USDA search'} placeholder={source==='upc' ? 'Enter UPC/EAN or scan barcode' : 'Search product name (e.g., Cheerios)'} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') doSearch(); }} style={{flex:1}} />

          <button onClick={()=>doSearch()}>{(source==='upc' && loading) || (source==='usda' && searching) ? 'Searching...' : 'Search'}</button>
        </div>

        <div style={{marginTop:12}}>
          <label className="visually-hidden" htmlFor="camera-scanner">Camera scanner</label>
          <CameraScanner onDetected={handleScannerDetected} />
        </div>
      </div>

      {source==='usda' && usdaResults.length>0 && (
        <div className="product-card">
          <ul aria-label="USDA search results" style={{margin:0,padding:0,listStyle:'none'}}>
            {usdaResults.map((r:any)=> (
              <li key={r.fdcId} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderTop:'1px solid #eee'}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700}}>{r.description}</div>
                  <div style={{color:'#666'}}>{r.brandOwner}</div>
                </div>
                <div style={{minWidth:120}}>
                  <button onClick={()=>selectUsda(r)}>View</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{marginTop:12}}>
        {product ? <ProductResult product={product}/> : <div style={{marginTop:20,color:'#555'}}>No product loaded</div>}
      </div>
    </div>
  )
}
