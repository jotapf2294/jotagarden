// js/db.js
const DB_NAME = 'docegestao_v4';
const DB_VERSION = 1;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (e) => reject(`Erro DB: ${e.target.error}`);
    request.onsuccess = (e) => resolve(e.target.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('receitas')) db.createObjectStore('receitas', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('agenda')) db.createObjectStore('agenda', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('insumos')) db.createObjectStore('insumos', { keyPath: 'id' });
    };
  });
};

// Ler todos
export const getAll = async (storeName) => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
};

// Guardar ou Atualizar
export const save = async (storeName, data) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(data);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

// Apagar
export const remove = async (storeName, id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};
