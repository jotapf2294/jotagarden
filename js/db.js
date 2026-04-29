// js/db.js
const DB_NAME = 'docegestao-db';
const DB_VERSION = 1;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => reject(`Erro DB: ${e.target.error}`);
    
    request.onsuccess = (e) => resolve(e.target.result);
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('receitas')) {
        db.createObjectStore('receitas', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('agenda')) {
        db.createObjectStore('agenda', { keyPath: 'id' });
      }
    };
  });
};
