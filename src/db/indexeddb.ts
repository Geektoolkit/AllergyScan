import { openDB } from 'idb';

const DB_NAME = 'allergy-scanner-db';
const DB_VERSION = 2;

async function getDb(){
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db){
      if(!db.objectStoreNames.contains('profiles')){
        db.createObjectStore('profiles', { keyPath: 'id' });
      }
      if(!db.objectStoreNames.contains('products')){
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if(!db.objectStoreNames.contains('settings')){
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    }
  });
}

export async function saveProfile(profile:any){
  const db = await getDb();
  await db.put('profiles', profile);
}

export async function deleteProfile(id:string){
  const db = await getDb();
  await db.delete('profiles', id);
}

export async function listProfiles(){
  const db = await getDb();
  return db.getAll('profiles');
}

export async function saveProfilesBulk(profiles:any[]){
  const db = await getDb();
  const tx = db.transaction('profiles','readwrite');
  for(const p of profiles){
    tx.store.put(p);
  }
  await tx.done;
}

export async function getProduct(id:string){
  const db = await getDb();
  return db.get('products', id);
}

export async function saveProduct(product:any){
  const db = await getDb();
  await db.put('products', product);
}

export async function saveSetting(key:string, value:any){
  const db = await getDb();
  await db.put('settings', { key, value });
}

export async function getSetting(key:string){
  const db = await getDb();
  const res = await db.get('settings', key);
  return res?.value;
}

export async function deleteSetting(key:string){
  const db = await getDb();
  await db.delete('settings', key);
}

export default { getDb, saveProfile, deleteProfile, listProfiles, saveProfilesBulk, getProduct, saveProduct, saveSetting, getSetting, deleteSetting };
