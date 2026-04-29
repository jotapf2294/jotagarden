// js/db.js
const DB_NAME = 'docegestao_v4';
const DB_VERSION = 1;

/**
 * Inicializa e garante a estrutura da base de dados.
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => reject(`Falha no IndexedDB: ${e.target.error}`);
    
    request.onsuccess = (e) => resolve(e.target.result);
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      console.log('🔧 Criando/Atualizando tabelas na BD...');
      
      if (!db.objectStoreNames.contains('receitas')) db.createObjectStore('receitas', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('agenda')) db.createObjectStore('agenda', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('insumos')) db.createObjectStore('insumos', { keyPath: 'id' });
    };
  });
};

/**
 * Função universal para ler todos os dados de uma tabela.
 */
export const getAll = async (storeName) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(`Erro ao ler ${storeName}`);
    });
  } catch (err) {
    console.error(err);
    return []; // Retorna array vazio em vez de crashar a app
  }
};
