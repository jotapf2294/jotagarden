import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

const DB_NAME = 'DoceGestaoDB';
const DB_VERSION = 2; // subi para 2 por causa do index 'data'

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // v1
      if (!db.objectStoreNames.contains('receitas')) {
        const store = db.createObjectStore('receitas', { keyPath: 'id' });
        store.createIndex('categoria', 'categoria');
        store.createIndex('nome', 'nome');
      }
      if (!db.objectStoreNames.contains('agenda')) {
        const store = db.createObjectStore('agenda', { keyPath: 'id' });
        store.createIndex('data', 'data'); // para ordenar por data
        store.createIndex('pago', 'pago');
      }
      
      // v2 - migração se precisares no futuro
      if (oldVersion < 2) {
        // nada a fazer, só exemplo
      }
    },
  });
}

export async function addData(store, data) {
  const db = await initDB();
  return db.put(store, data); // put faz insert/update
}

export async function getAllData(store) {
  const db = await initDB();
  return db.getAll(store);
}

export async function getById(store, id) {
  const db = await initDB();
  return db.get(store, id);
}

export async function deleteData(store, id) {
  const db = await initDB();
  return db.delete(store, id);
}

export async function getByIndex(store, indexName, value) {
  const db = await initDB();
  return db.getAllFromIndex(store, indexName, value);
}
