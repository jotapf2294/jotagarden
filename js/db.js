const DB_NAME = 'docegestao-db'; // FIX: minúsculas pra bater com padrão
const DB_VERSION = 1;
let dbInstance = null;

async function openDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ Erro DB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('✅ DB aberto');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      console.log('🔧 Criando stores...');
      const db = event.target.result;

      if (!db.objectStoreNames.contains('receitas')) {
        const s = db.createObjectStore('receitas', { keyPath: 'id' });
        s.createIndex('categoria', 'categoria');
        s.createIndex('nome', 'nome');
        console.log('✅ Store receitas');
      }

      if (!db.objectStoreNames.contains('agenda')) {
        const s = db.createObjectStore('agenda', { keyPath: 'id' });
        s.createIndex('data', 'data');
        console.log('✅ Store agenda');
      }

      if (!db.objectStoreNames.contains('insumos')) {
        const s = db.createObjectStore('insumos', { keyPath: 'id' });
        s.createIndex('nome', 'nome');
        console.log('✅ Store insumos');
      }
    };
  });
}

export async function addData(store, data) {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    await os.put(data);
    await tx.done;
    console.log(`✅ addData(${store}):`, data.id);
  } catch (err) {
    console.error(`❌ addData(${store}):`, err);
    throw err;
  }
}

export async function addMultiple(store, items) {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    for (const item of items) {
      await os.put(item);
    }
    await tx.done;
    console.log(`✅ addMultiple(${store}):`, items.length, 'itens');
  } catch (err) {
    console.error(`❌ addMultiple(${store}):`, err);
    throw err;
  }
}

export async function getAllData(store) {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readonly');
    const os = tx.objectStore(store);
    const result = await os.getAll();
    console.log(`✅ getAllData(${store}):`, result.length, 'registos');
    return result || [];
  } catch (err) {
    console.warn(`⚠️ getAllData(${store}) erro, retorna vazio:`, err.message);
    return []; // FIX: Nunca rebenta, retorna vazio
  }
}

export async function deleteData(store, id) {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    await os.delete(id);
    await tx.done;
    console.log(`✅ deleteData(${store}):`, id);
  } catch (err) {
    console.error(`❌ deleteData(${store}):`, err);
    throw err;
  }
}

export async function getById(store, id) {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readonly');
    const os = tx.objectStore(store);
    return await os.get(id);
  } catch (err) {
    console.error(`❌ getById(${store}):`, err);
    return null;
  }
}

// Mantém compatibilidade com código antigo
export const initDB = openDB;
export const getDataById = getById;
export const updateData = addData;
