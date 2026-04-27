const DB = {
  db: null,
  
  async init() {
    return new Promise((res, rej) => {
      const req = indexedDB.open('BabeBakery', 1);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('receitas')) db.createObjectStore('receitas', {keyPath: 'id'});
        if (!db.objectStoreNames.contains('stock')) db.createObjectStore('stock', {keyPath: 'id'});
        if (!db.objectStoreNames.contains('encomendas')) db.createObjectStore('encomendas', {keyPath: 'id'});
      };
      req.onsuccess = e => { this.db = e.target.result; res(); };
      req.onerror = rej;
    });
  },

  async getAll(store) {
    const tx = this.db.transaction(store, 'readonly');
    return new Promise(res => {
      tx.objectStore(store).getAll().onsuccess = e => res(e.target.result);
    });
  },

  async save(store, data) {
    const tx = this.db.transaction(store, 'readwrite');
    if (!data.id) data.id = Date.now();
    tx.objectStore(store).put(data);
    return data.id;
  },

  async delete(store, id) {
    const tx = this.db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(id);
  }
};

DB.init();
