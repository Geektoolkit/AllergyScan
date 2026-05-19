import React, { useEffect, useState } from 'react';
import db from '../db/indexeddb';

type Profile = { id: string; name: string; allergens: string[]; notes?: string };

function AllergensEditor({ profile, onAdd, onRemove }: { profile: Profile; onAdd: (v:string)=>void; onRemove: (v:string)=>void }){
  const [input, setInput] = useState('');
  return (
    <div>
      {profile.allergens && profile.allergens.length > 0 ? (
        <ul className="allergen-list" aria-label={`Allergens for ${profile.name}`}>
          {profile.allergens.map(a=> (
            <li key={a} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>{a}</span>
              <button onClick={()=>onRemove(a)} aria-label={`Remove ${a}`} title="Remove" style={{marginLeft:8}}>➖</button>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{color:'#666'}}>No allergens</div>
      )}
      <div style={{marginTop:8,display:'flex',gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Add allergen" />
        <button onClick={()=>{ if(!input.trim()) return; onAdd(input.trim()); setInput(''); }} title="Add">➕</button>
      </div>
    </div>
  );
}

export default function ProfilesNew(){
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newName, setNewName] = useState('');
  const [newAllergen, setNewAllergen] = useState('');
  const [newAllergens, setNewAllergens] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(()=>{
    (async()=>{
      const p = await db.listProfiles();
      setProfiles(p || []);
    })();
  },[]);

  async function addProfile(){
    if(!newName.trim()) return;
    const profile: Profile = { id: Date.now().toString(), name: newName.trim(), allergens: newAllergens };
    await db.saveProfile(profile);
    setProfiles(prev=>[...prev, profile]);
    setNewName(''); setNewAllergen(''); setNewAllergens([]);
  }

  function addNewAllergen(){
    if(!newAllergen.trim()) return;
    setNewAllergens(prev=>[...prev, newAllergen.trim()]);
    setNewAllergen('');
  }

  async function addAllergenToProfile(id:string, allergen:string){
    const prof = profiles.find(p=>p.id===id);
    if(!prof) return;
    if(prof.allergens.includes(allergen)) return;
    const updated = {...prof, allergens:[...prof.allergens, allergen]};
    await db.saveProfile(updated);
    setProfiles(prev=>prev.map(p=>p.id===id? updated : p));
  }

  async function removeAllergenFromProfile(id:string, allergen:string){
    const prof = profiles.find(p=>p.id===id);
    if(!prof) return;
    const updated = {...prof, allergens: prof.allergens.filter(a=>a!==allergen)};
    await db.saveProfile(updated);
    setProfiles(prev=>prev.map(p=>p.id===id? updated : p));
  }

  async function removeProfile(id: string){
    await db.deleteProfile(id);
    setProfiles(prev=>prev.filter(p=>p.id!==id));
  }

  function startEditName(p:Profile){ setEditingId(p.id); setEditingName(p.name); }
  async function saveEditName(){
    if(!editingId) return;
    const prof = profiles.find(p=>p.id===editingId);
    if(!prof) return;
    const updated = {...prof, name: editingName};
    await db.saveProfile(updated);
    setProfiles(prev=>prev.map(p=>p.id===editingId? updated : p));
    setEditingId(null); setEditingName('');
  }

  return (
    <div>
      <h2>Profiles</h2>

      <div className="product-card" style={{marginBottom:12}}>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input placeholder="Name" value={newName} onChange={e=>setNewName(e.target.value)} style={{flex:1}} aria-label="New profile name" />
          <button onClick={addProfile} style={{marginLeft:8}}>Create profile</button>
        </div>
        {newAllergens.length>0 && (
          <div style={{marginTop:8}}>
            <strong>Allergens to add:</strong>
            <ul className="allergen-list">
              {newAllergens.map(a=> <li key={a} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>{a} <button onClick={()=>setNewAllergens(prev=>prev.filter(x=>x!==a))} aria-label={`Remove ${a}`} title="Remove">➖</button></li>)}
            </ul>
          </div>
        )}

        <div style={{marginTop:8,color:'#666',fontSize:13}}>Export/import available via header icons.</div>
      </div>

      <div>
        {profiles.length===0 && <div style={{color:'#666'}}>No profiles yet.</div>}
        {profiles.map(p=> (
          <div key={p.id} className="product-card" style={{marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  {editingId===p.id ? (
                    <>
                      <input value={editingName} onChange={e=>setEditingName(e.target.value)} />
                      <button onClick={saveEditName}>Save</button>
                      <button onClick={()=>setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <div style={{fontWeight:700}}>{p.name}</div>
                      <button onClick={()=>startEditName(p)} style={{marginLeft:8}}>Edit name</button>
                    </>
                  )}

                </div>
                <div style={{marginTop:8}}>
                  <AllergensEditor profile={p} onAdd={(v)=>addAllergenToProfile(p.id,v)} onRemove={(v)=>removeAllergenFromProfile(p.id,v)} />
                </div>
              </div>

              <div style={{minWidth:120,display:'flex',flexDirection:'column',gap:8}}>
                <button onClick={()=>removeProfile(p.id)} style={{background:'#c62828',color:'#fff',padding:'8px 10px',borderRadius:6}}>Delete profile</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
