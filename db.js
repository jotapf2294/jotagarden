const db = new Dexie("JotaGardenDB");
db.version(1).stores({
    plantas: '++id, variedade, especie, zonaId, data, ultimaRega, conteudo',
    wiki: '++id, especie, categoria, tempo, temp, info',
    zones: '++id, nome',
    book: '++id, texto, data',
    config: 'id, valor'
});
