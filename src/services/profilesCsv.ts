import db from '../db/indexeddb';

export async function exportProfilesCSV(){
  const profiles = await db.listProfiles();
  if(!profiles || profiles.length === 0) return;
  const rows = profiles.map(p => ({ id: p.id, name: p.name, allergens: (p.allergens || []).join(';'), notes: p.notes || '' }));
  const header = Object.keys(rows[0]).join(',');
  const body = rows.map(r => `${r.id},"${r.name.replace(/"/g,'""')}","${r.allergens}","${(r.notes||'').replace(/"/g,'""')}"`).join('\n');
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'profiles.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProfilesFromFile(file: File){
  const text = await file.text();
  const lines = text.split('\n').map(l=>l.trim()).filter(Boolean);
  const imported:any[] = [];
  for(let i=1;i<lines.length;i++){
    const cols = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c=>c.replace(/^\"|\"$/g,''));
    const id = cols[0] || Date.now().toString();
    const name = cols[1] || 'Unnamed';
    const allergens = (cols[2]||'').split(';').map((s:string)=>s.trim()).filter(Boolean);
    const notes = cols[3] || '';
    const profile = { id, name, allergens, notes };
    await db.saveProfile(profile);
    imported.push(profile);
  }
  window.dispatchEvent(new CustomEvent('profiles-imported', { detail: { count: imported.length } }));
  return imported.length;
}
