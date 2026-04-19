// db.js - Dexie Database Configuration
const db = new Dexie('JotaGarden_v6');

db.version(1).stores({
    zonas: '++id, nome',
    wiki: '++id, especie, tempo, temp',
    plantas: '++id, variedade, zonaId, data, notas',
    book: '++id, titulo, categoria, conteudo',
    config: 'id, value' // Para guardar Dark Mode e outras preferências
});

window.db = db;
