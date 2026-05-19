import React from 'react';
import Scan from './pages/Scan';
import Profiles from './pages/ProfilesDraggable';
import Settings from './pages/Settings';
import db from './db/indexeddb';

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
          </nav>
        </div>
        <div className="header-right">
          <button className="settings-gear" onClick={()=>setRoute('settings')} title="Settings" aria-label="Open settings">⚙️</button>
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

