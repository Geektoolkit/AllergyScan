import React from 'react';
import Scan from './pages/Scan';
import Profiles from './pages/ProfilesDraggable';
import Settings from './pages/Settings';
import db from './db/indexeddb';
import { exportProfilesCSV, importProfilesFromFile } from './services/profilesCsv';

export default function App(){
  const [route,setRoute] = React.useState<'scan'|'profiles'|'settings'>('scan');
  const [theme,setTheme] = React.useState<'light'|'dark'|'high-contrast-dark'>('light');React.useEffect(()=>{
    (async ()=>{
      try{
        const t = await db.getSetting('theme');
        if(t === 'dark' || t === 'high-contrast-dark') setTheme(t as any);
        else setTheme('light');
      }catch(err){
        console.error('load theme', err);
      }
    })();
  },[]);const setThemeAndSave = async (t:'light'|'dark'|'high-contrast-dark') => {
    setTheme(t);
    try{ await db.saveSetting('theme', t); }catch(e){ console.error('save theme', e); }
  };

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0];
    if(!f) return;
    try{ await importProfilesFromFile(f); }catch(err){ console.error('Import failed', err); }
    if(e.target) e.target.value = '';
  }

  return (
    <div className={`app ${theme==='dark' ? 'theme-dark' : theme==='high-contrast-dark' ? 'theme-high-contrast' : ''}`}>
      <header className="app-header">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div>
            <h1 style={{margin:0}}>Allergy Scanner</h1>
          </div>
          <nav className="tabs" role="tablist" aria-label="Main navigation">
            <button className={`tab-button ${route==='scan'?'tab-button--active':''}`} role="tab" aria-selected={route==='scan'} onClick={()=>setRoute('scan')}>Scan</button>
            <button className={`tab-button ${route==='profiles'?'tab-button--active':''}`} role="tab" aria-selected={route==='profiles'} onClick={()=>setRoute('profiles')}>Profiles</button>
            <button className={`tab-button ${route==='settings'?'tab-button--active':''}`} role="tab" aria-selected={route==='settings'} onClick={()=>setRoute('settings')}>Settings</button>
          </nav>
        </div>
        <div className="header-actions">
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{display:'none'}} onChange={onImportFile} />
          <button className="icon-button" onClick={()=>exportProfilesCSV()} title="Export profiles" aria-label="Export profiles">⬇️</button>
          <button className="icon-button" onClick={()=>fileInputRef.current?.click()} title="Import profiles" aria-label="Import profiles">⬆️</button>
        </div>
      </header>
      <main>
          {route==='scan' && <Scan/>}
          {route==='profiles' && <Profiles/>}
          {route==='settings' && <Settings theme={theme} setTheme={setThemeAndSave} />}
      </main>
    </div>
  )
}

