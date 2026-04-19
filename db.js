const db = new Dexie('JotaGardenDB');
db.version(1).stores({
    zonas: '++id, nome',
    wiki: '++id, especie, categoria, tempo, temp, info',
    plantas: '++id, variedade, zonaId, data, nota',
    book: '++id, titulo, categoria, conteudo',
    config: 'id, val'
});
