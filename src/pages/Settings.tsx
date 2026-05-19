import React, { useEffect, useState, useRef } from 'react';
import db from '../db/indexeddb';
import { exportProfilesCSV, importProfilesFromFile } from '../services/profilesCsv';
import DiagnosticsPanel from '../components/DiagnosticsPanel';
import { setCachedUsdaKey } from '../services/usda';

export default function Settings({ theme, setTheme }: { theme?: 'light'|'dark'|'high-contrast-dark'; setTheme?: (t:'light'|'dark'|'high-contrast-dark') => void }){
  const [usdaKey, setUsdaKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [threshold, setThreshold] = useState<number>(0.3);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(()=>{
    (async ()=>{
      try {
        const k = await db.getSetting('usdaApiKey');
        if(k) { setUsdaKey(k); setCachedUsdaKey(k); } else { setCachedUsdaKey(null); }
        const t = await db.getSetting('fuzzyThreshold');
        if(t !== undefined && t !== null) setThreshold(Number(t));
      } catch(err){
        console.error('load setting', err);
      }
    })();
  },[]);

  async function save(){
    setSaving(true);
    try{
      await db.saveSetting('usdaApiKey', usdaKey);
      await db.saveSetting('fuzzyThreshold', threshold);
      setCachedUsdaKey(usdaKey);
      setStatus('Saved locally');
      setTimeout(()=>setStatus(''), 2000);
    }catch(err){
      console.error('save settings', err);
      setStatus('Save failed');
      setTimeout(()=>setStatus(''), 2000);
    } finally { setSaving(false); }
  }

  async function clearKey(){
    await db.deleteSetting('usdaApiKey');
    setCachedUsdaKey(null);
    setUsdaKey('');
    setStatus('Cleared');
    setTimeout(()=>setStatus(''), 2000);
  }

  async function onExport(){
    try{
      await exportProfilesCSV();
      setStatus('Exported profiles');
      setTimeout(()=>setStatus(''), 2000);
    }catch(err){
      console.error('Export failed', err);
      setStatus('Export failed');
      setTimeout(()=>setStatus(''), 2000);
    }
  }

  function triggerImport(){
    fileInputRef.current?.click();
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0];
    if(!f) return;
    try{
      await importProfilesFromFile(f);
      setStatus('Imported profiles');
      setTimeout(()=>setStatus(''), 2000);
      e.target.value = '';
    }catch(err){
      console.error('Import failed', err);
      setStatus('Import failed');
      setTimeout(()=>setStatus(''), 2000);
    }
  }

  async function setThemeLocal(t:'light'|'dark'|'high-contrast-dark'){
    if(setTheme){
      setTheme(t);
    } else {
      try{ await db.saveSetting('theme', t); setStatus('Theme saved'); setTimeout(()=>setStatus(''),2000); }catch(err){ console.error('save theme',err); }
    }
  }

  return (
    <div>
      <h2>Settings</h2>
      <div className="product-card">
        <label htmlFor="usda-key">USDA FoodData Central API Key (stored locally)</label>
        <div style={{display:'flex',gap:8,alignItems:'center',marginTop:6}}>
          <input id="usda-key" aria-label="USDA API Key" type={showKey ? 'text' : 'password'} value={usdaKey} onChange={e=>setUsdaKey(e.target.value)} placeholder="Paste API key here" style={{flex:1}} />
          <button className="icon-small" type="button" onClick={()=>setShowKey(s=>!s)} aria-label={showKey ? 'Hide API key' : 'Show API key'}>{showKey ? '🙈' : '👁️'}</button>
        </div>
        <div className="settings-actions" style={{marginTop:8}}>
          <button onClick={save}>Save key</button>
          <button onClick={clearKey} className="danger">Clear key</button>
        </div>

        <div style={{marginTop:12}}>
          <strong>Profiles</strong>
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button onClick={onExport}>Export profiles</button>
            <button onClick={triggerImport}>Import profiles</button>
            <input ref={fileInputRef} type="file" accept="text/csv" style={{display:'none'}} onChange={onImportFile} />
          </div>
        </div>

        <div style={{marginTop:12}}>
          <strong>Matching</strong>
          <div style={{marginTop:8}}>
            <label htmlFor="fuzzy">Fuzzy match sensitivity (0.0 - 1.0)</label>
            <input id="fuzzy" type="range" min="0" max="1" step="0.05" value={threshold} onChange={e=>setThreshold(Number(e.target.value))} />
            <span style={{marginLeft:8}}>{threshold}</span>
            <div style={{fontSize:12,color:'#666',marginTop:6}}>
              Lower values = stricter (exact or near-exact only). Higher values = more permissive (accepts approximate matches).
              0.0 = exact matches only; 1.0 = very permissive (more false positives). Recommended: 0.15–0.35.
            </div>
          </div>
          <div style={{marginTop:8}}>
            <button onClick={save} disabled={saving}>Save settings</button>
          </div>

          <div style={{marginTop:12}}>
            <strong>Theme</strong>
            <div style={{display:'flex',gap:8,alignItems:'center',marginTop:8}}>
              <button onClick={()=>setThemeLocal('light')} aria-label="Light theme" style={{padding:8,borderRadius:6}}>☀️</button>
              <button onClick={()=>setThemeLocal('dark')} aria-label="Dark theme" style={{padding:8,borderRadius:6}}>🌙</button>
              <button onClick={()=>setThemeLocal('high-contrast-dark')} aria-label="High contrast dark" style={{padding:8,borderRadius:6}}>⚫</button>
              <div style={{marginLeft:8,fontSize:12,color:'#666'}}>{theme || 'light'}</div>
            </div>
          </div>
        </div>

        <div style={{marginTop:12}}>
          <DiagnosticsPanel />
        </div>

        {status && <div style={{marginTop:8}}>{status}</div>}
      </div>
    </div>
  );
}
