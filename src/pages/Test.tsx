import React, { useState } from 'react';
import ProductResult from '../components/ProductResult';
import db from '../db/indexeddb';

export default function Test(){
  const [ingredients, setIngredients] = useState('Peanuts, Sugar, Salt, Soy lecithin');
  const [product, setProduct] = useState<any|null>(null);

  async function seedProfiles(){
    const profiles = [
      { id: 'p-alice', name: 'Alice', allergens: ['peanut'] },
      { id: 'p-bob', name: 'Bob', allergens: ['milk'] }
    ];
    await db.saveProfilesBulk(profiles);
    alert('Seeded sample profiles');
  }

  async function clearProfiles(){
    const p = await db.listProfiles();
    for(const prof of p){
      await db.deleteProfile(prof.id);
    }
    alert('Cleared profiles');
  }

  function check(){
    const sampleProd = {
      product: {
        product_name: 'Test Sample Bar',
        brands: 'TestBrand',
        image_small_url: '',
        ingredients_text: ingredients
      },
      code: 'test-0001'
    };
    setProduct(sampleProd);
  }

  return (
    <div>
      <h2>Test Page</h2>
      <div style={{marginBottom:12}}>
        <button onClick={seedProfiles}>Seed sample profiles</button>
        <button onClick={clearProfiles} style={{marginLeft:8}}>Clear profiles</button>
      </div>

      <div style={{marginBottom:12}}>
        <textarea value={ingredients} onChange={(e)=>setIngredients(e.target.value)} rows={3} style={{width:'100%'}} />
      </div>

      <div>
        <button onClick={check}>Check sample product</button>
      </div>

      <div style={{marginTop:12}}>
        {product && <ProductResult product={product} />}
      </div>
    </div>
  );
}
