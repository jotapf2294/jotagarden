const DB_NAME = 'docegestao-db';
const DB_VERSION = 1;

export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      console.error("Erro IndexedDB");
      reject("Não foi possível abrir a base de dados");
    };
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('receitas')) db.createObjectStore('receitas', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('agenda')) db.createObjectStore('agenda', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('insumos')) db.createObjectStore('insumos', { keyPath: 'id' });
    };
  });
}

export async function getAllData(store) {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}
