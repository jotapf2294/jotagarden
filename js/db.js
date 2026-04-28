// db.js: Abstração do IndexedDB usando Promises
const DB_NAME = 'DoceGestaoDB';
const DB_VERSION = 1;

export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Criação das tabelas (Object Stores)
            if (!db.objectStoreNames.contains('receitas')) {
                db.createObjectStore('receitas', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('agenda')) {
                db.createObjectStore('agenda', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('configs')) {
                db.createObjectStore('configs', { keyPath: 'key' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Funções CRUD Genéricas
export const addData = async (storeName, data) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(data); // insert or update
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const getAllData = async (storeName) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    })
      ;
};
