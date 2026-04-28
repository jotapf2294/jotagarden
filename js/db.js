import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

const DB_NAME = 'DoceGestaoDB';
const DB_VERSION = 1;

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('receitas')) {
        const s = db.createObjectStore('receitas', { keyPath: 'id' });
        s.createIndex('categoria', 'categoria');
        s.createIndex('nome', 'nome');
      }
      if (!db.objectStoreNames.contains('agenda')) {
        const s = db.createObjectStore('agenda', { keyPath: 'id' });
        s.createIndex('data', 'data');
      }
    }
  });
}

export async function addData(store, data) {
  const db = await initDB();
  return db.put(store, data);
}

export async function getAllData(store) {
  const db = await initDB();
  return db.getAll(store);
}

export async function deleteData(store, id) {
  const db = await initDB();
  return db.delete(store, id);
}

export async function getById(store, id) {
  const db = await initDB();
  return db.get(store, id);
}
