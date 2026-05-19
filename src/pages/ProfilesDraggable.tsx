import React, { useEffect, useState, useRef } from 'react';
import db from '../db/indexeddb';

type Profile = { id: string; name: string; allergens: string[]; notes?: string; order?: number };

function AllergensEditor({ allergens, onAdd, onRemove, profileName }:{ allergens:string[]; onAdd:(v:string)=>void; onRemove:(v:string)=>void; profileName?:string }){
  const [input, setInput] = useState('');
  return (
    <div>
      {allergens && allergens.length > 0 ? (
        <ul className="allergen-list" aria-label={`Allergens for ${profileName || 'profile'}`}>
          {allergens.map(a=> (
            <li key={a} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>{a}</span>
              <button className="icon-small" onClick={()=>onRemove(a)} aria-label={`Remove ${a}`} title={`Remove ${a}`} >➖</button>
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
        <button className="icon-small" onClick={()=>{ const v = input.trim(); if(!v) return; onAdd(v); setInput(''); }} title="Add allergen" aria-label={`Add allergen for ${profileName || 'profile'}`}>➕</button>
      </div>
    </div>
  );
}

export default function ProfilesDraggable(){
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);

  useEffect(()=>{
    (async()=>{
      const p = await db.listProfiles();
      if(p && p.length){
        p.sort((a:any,b:any)=> (a.order||0) - (b.order||0));
      }
      setProfiles(p || []);
    })();
  },[]);

  async function persistOrder(list: Profile[]){
    // ensure order indexes and persist in bulk
    const updated = list.map((it, idx) => ({ ...it, order: idx }));
    await db.saveProfilesBulk(updated);
    setProfiles(updated);
  }

  async function addProfile(){
    const name = newName.trim();
    if(!name) return;
    const order = profiles.length;
    const profile: Profile = { id: Date.now().toString(), name, allergens: [], order };
    await db.saveProfile(profile);
    const next = [...profiles, profile];
    await persistOrder(next);
    setNewName('');
    setEditingId(profile.id);
    setEditingName(profile.name);
  }

  function startEditName(p:Profile){ setEditingId(p.id); setEditingName(p.name); }
  async function saveEditName(){
    if(!editingId) return;
    const prof = profiles.find(p=>p.id===editingId);
    if(!prof) return;
    const updated = {...prof, name: editingName.trim() || prof.name };
    await db.saveProfile(updated);
    setProfiles(prev=>prev.map(p=>p.id===editingId? updated : p));
    setEditingId(null); setEditingName('');
  }

  async function removeProfile(id: string){
    const prof = profiles.find(p=>p.id===id);
    if(!prof) return;
    if(!confirm(`Delete profile "${prof.name}"? This will remove their allergens.`)) return;
    await db.deleteProfile(id);
    setProfiles(prev=>prev.filter(p=>p.id!==id));
    // re-persist order
    const next = profiles.filter(p=>p.id!==id);
    await persistOrder(next);
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

  function onDragStart(e: React.DragEvent, id:string){
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
    try{ e.dataTransfer.setData('text/plain', id); }catch(_){ /* some browsers restrict setData during touch */ }
    (e.currentTarget as HTMLElement).classList.add('dragging');
  }

  function onDragOver(e: React.DragEvent, id:string){
    e.preventDefault();
    if(dragIdRef.current === id) return;
    setDragOverId(id);
  }

  function onDragLeave(e: React.DragEvent){
    setDragOverId(null);
  }

  async function onDrop(e: React.DragEvent, targetId:string){
    e.preventDefault();
    const draggedId = dragIdRef.current || e.dataTransfer.getData('text/plain');
    if(!draggedId) return;
    if(draggedId === targetId){ setDragOverId(null); return; }
    const srcIndex = profiles.findIndex(p=>p.id===draggedId);
    const dstIndex = profiles.findIndex(p=>p.id===targetId);
    if(srcIndex < 0 || dstIndex < 0) return;
    const next = [...profiles];
    const [moved] = next.splice(srcIndex, 1);
    next.splice(dstIndex, 0, moved);
    await persistOrder(next);
    setDragOverId(null);
    dragIdRef.current = null;
  }

  async function onDropToEnd(e: React.DragEvent){
    e.preventDefault();
    const draggedId = dragIdRef.current || e.dataTransfer.getData('text/plain');
    if(!draggedId) return;
    const srcIndex = profiles.findIndex(p=>p.id===draggedId);
    if(srcIndex < 0) return;
    const next = [...profiles];
    const [moved] = next.splice(srcIndex,1);
    next.push(moved);
    await persistOrder(next);
    setDragOverId(null);
    dragIdRef.current = null;
  }

  function onDragEnd(e: React.DragEvent){
    setDragOverId(null);
    dragIdRef.current = null;
    (e.currentTarget as HTMLElement).classList.remove('dragging');
  }

  return (
    <div>
      <h2>Profiles</h2>

      <div className="product-card" style={{marginBottom:12}}>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input placeholder="Person's name" value={newName} onChange={e=>setNewName(e.target.value)} style={{flex:1}} aria-label="New profile name" />
          <button onClick={addProfile} style={{marginLeft:8}} disabled={!newName.trim()}>Create profile</button>
        </div>
        <div style={{marginTop:8,color:'#666',fontSize:13}}>Create people here; click a name to edit or drag to reorder.</div>
      </div>

      <div onDragOver={(e)=>e.preventDefault()} onDrop={onDropToEnd}>
        {profiles.length===0 && <div style={{color:'#666'}}>No profiles yet. Create one above to get started.</div>}
        {profiles.map(p=> (
          <div
            key={p.id}
            className={`product-card profile-card ${dragOverId===p.id ? 'drag-over':''}`}
            draggable
            onDragStart={(e)=>onDragStart(e,p.id)}
            onDragOver={(e)=>onDragOver(e,p.id)}
            onDragLeave={onDragLeave}
            onDrop={(e)=>onDrop(e,p.id)}
            onDragEnd={onDragEnd}
            >
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span className="drag-handle" aria-hidden title="Drag to reorder">☰</span>
                  {editingId===p.id ? (
                    <>
                      <input value={editingName} onChange={e=>setEditingName(e.target.value)} aria-label={`Edit name for ${p.name}`} />
                      <button className="icon-small" onClick={saveEditName} aria-label="Save name">💾</button>
                      <button className="icon-small" onClick={()=>{ setEditingId(null); setEditingName(''); }} aria-label="Cancel edit">✖</button>
                    </>
                  ) : (
                    <>
                      <div style={{fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
                        <span>{p.name}</span>
                        <button className="icon-small" onClick={()=>startEditName(p)} aria-label={`Edit ${p.name}`} title="Edit">✏️</button>
                        <button className="icon-small" onClick={()=>removeProfile(p.id)} aria-label={`Delete ${p.name}`} title="Delete">🗑️</button>
                      </div>
                    </>
                  )}

                </div>
                <div style={{marginTop:8}}>
                  <AllergensEditor allergens={p.allergens || []} onAdd={(v)=>addAllergenToProfile(p.id,v)} onRemove={(v)=>removeAllergenFromProfile(p.id,v)} profileName={p.name} />
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
