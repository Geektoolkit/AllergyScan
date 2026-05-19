import React, { useEffect, useState } from 'react';
import db from '../db/indexeddb';

type Profile = { id: string; name: string; allergens: string[]; notes?: string };

function AllergensEditor({ allergens, onAdd, onRemove, profileName }:{ allergens:string[]; onAdd:(v:string)=>void; onRemove:(v:string)=>void; profileName?:string }){
  const [input, setInput] = useState('');
  return (
    <div>
      {allergens && allergens.length > 0 ? (
        <ul className="allergen-list" aria-label={`Allergens for ${profileName || 'profile'}`}>
          {allergens.map(a=> (
            <li key={a} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>{a}</span>
              <button onClick={()=>onRemove(a)} aria-label={`Remove ${a}`} title={`Remove ${a}`} style={{marginLeft:8}}>Remove</button>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{color:'#666'}}>No allergens. Add one below.</div>
      )}

      <div style={{marginTop:8,display:'flex',gap:8}}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          placeholder="Add allergen (e.g., milk)"
          aria-label={`Add allergen for ${profileName || 'profile'}`}
          onKeyDown={e=>{ if(e.key === 'Enter'){ const v = input.trim(); if(v){ onAdd(v); setInput(''); } } }}
          style={{flex:1}}
        />
        <button onClick={()=>{ const v = input.trim(); if(!v) return; onAdd(v); setInput(''); }} title="Add allergen">Add</button>
      </div>
    </div>
  );
}

export default function Profiles(){
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(()=>{
    (async()=>{
      const p = await db.listProfiles();
      setProfiles(p || []);
    })();

    function onImported(e:any){
      (async ()=>{ const p = await db.listProfiles(); setProfiles(p || []); })();
    }
    window.addEventListener('profiles-imported', onImported);
    return () => window.removeEventListener('profiles-imported', onImported);
  },[]);

  async function addProfile(){
    const name = newName.trim();
    if(!name) return;
    const profile: Profile = { id: Date.now().toString(), name, allergens: [] };
    await db.saveProfile(profile);
    setProfiles(prev=>[profile, ...prev]);
    setNewName('');
    // open the new profile for editing to encourage adding allergens
    setEditingId(profile.id);
    setEditingName(profile.name);
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
    const prof = profiles.find(p=>p.id===id);
    if(!prof) return;
    if(!confirm(`Delete profile "${prof.name}"? This will remove their allergens.`)) return;
    await db.deleteProfile(id);
    setProfiles(prev=>prev.filter(p=>p.id!==id));
  }

  function startEditName(p:Profile){ setEditingId(p.id); setEditingName(p.name); }
  async function saveEditName(){
    if(!editingId) return;
    const prof = profiles.find(p=>p.id===editingId);
    if(!prof) return;
    const updated = {...prof, name: editingName.trim() || prof.name};
    await db.saveProfile(updated);
    setProfiles(prev=>prev.map(p=>p.id===editingId? updated : p));
    setEditingId(null); setEditingName('');
  }

  return (
    <div>
      <h2>Profiles</h2>

      <div className="product-card" style={{marginBottom:12}}>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input placeholder="Person's name" value={newName} onChange={e=>setNewName(e.target.value)} style={{flex:1}} aria-label="New profile name" />
          <button onClick={addProfile} style={{marginLeft:8}} disabled={!newName.trim()}>Create profile</button>
        </div>
        <div style={{marginTop:8,color:'#666',fontSize:13}}>Create a profile for each person; add allergens on their card after creating.</div>

        <div style={{marginTop:8,color:'#666',fontSize:13}}>Use the export/import icons in the header to save or load profiles.</div>
      </div>

      <div>
        {profiles.length===0 && <div style={{color:'#666'}}>No profiles yet. Create one above to get started.</div>}
        {profiles.map(p=> (
          <div key={p.id} className="product-card" style={{marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  {editingId===p.id ? (
                    <>
                      <input value={editingName} onChange={e=>setEditingName(e.target.value)} aria-label={`Edit name for ${p.name}`} />
                      <button onClick={saveEditName}>Save</button>
                      <button onClick={()=>{ setEditingId(null); setEditingName(''); }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <div style={{fontWeight:700}}>{p.name}</div>
                      <button onClick={()=>startEditName(p)} style={{marginLeft:8}}>Edit name</button>
                    </>
                  )}

                </div>
                <div style={{marginTop:8}}>
                  <AllergensEditor allergens={p.allergens || []} onAdd={(v)=>addAllergenToProfile(p.id,v)} onRemove={(v)=>removeAllergenFromProfile(p.id,v)} profileName={p.name} />
                </div>
              </div>

              <div style={{minWidth:120,display:'flex',flexDirection:'column',gap:8}}>
                <button onClick={()=>removeProfile(p.id)} style={{background:'#c62828',color:'#fff',padding:'8px 10px',borderRadius:6}}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
