const db = new Dexie('JotaGardenDB');
db.version(1).stores({
    zonas: '++id, nome',
    wiki: '++id, especie, tempo, temp',
    plantas: '++id, variedade, zonaId, data',
    book: '++id, titulo, categoria',
    config: 'id'
});

window.db = db;
