/**
 * JotaGarden Engine v6.0 - Senior Implementation
 */

const ui = {
    atualPage: 'dash',

    nav: function(page, btn) {
        this.atualPage = page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`).classList.add('active');
        
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        if(btn) btn.classList.add('active');

        // Esconder pesquisa apenas na Config
        document.getElementById('search-box').style.display = (page === 'config') ? 'none' : 'block';
        
        const titulos = { dash: "JotaGarden", horta: "A Minha Horta", wiki: "Enciclopédia", book: "Livro de Notas", config: "Definições" };
        document.getElementById('main-header').innerText = titulos[page];

        this.execRender(page);
    },

    execRender: function(page) {
        switch(page) {
            case 'dash': this.renderDash(); break;
            case 'horta': this.renderHorta(); break;
            case 'wiki': this.renderWiki(); break;
            case 'book': this.renderBook(); break;
            case 'config': logic.renderConfig(); break;
        }
    },

    filtrar: function() {
        this.execRender(this.atualPage);
    },

    abrirModal: function(id) {
        document.getElementById(id).style.display = 'flex';
        if(id === 'modal-planta') {
            logic.popularZonas();
            document.getElementById('p-data').valueAsDate = new Date();
        }
    },

    fecharModais: function() {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    },

    // --- RENDERIZADORES ---

    renderDash: async function() {
        const pCount = await db.plantas.count();
        const bCount = await db.book.count();
        document.getElementById('st-p').innerText = pCount;
        document.getElementById('st-b').innerText = bCount;
        
        const ultimas = await db.plantas.reverse().limit(3).toArray();
        document.getElementById('dash-summary').innerHTML = '<h4>Últimas Plantações:</h4>' + 
            ultimas.map(u => `<div class="card">${u.variedade}</div>`).join('');
    },

    renderHorta: async function() {
        const term = document.getElementById('globalSearch').value.toLowerCase();
        const [plantas, zonas, wikis] = await Promise.all([
            db.plantas.toArray(),
            db.zonas.toArray(),
            db.wiki.toArray()
        ]);

        const container = document.getElementById('grid-horta');
        container.innerHTML = "";

        zonas.forEach(z => {
            const plantasDaZona = plantas.filter(p => p.zonaId == z.id && p.variedade.toLowerCase().includes(term));
            if(plantasDaZona.length > 0 || term === "") {
                const zonaHtml = document.createElement('div');
                zonaHtml.innerHTML = `<div class="zona-title">📍 ${z.nome}</div>`;
                
                plantasDaZona.forEach(p => {
                    const dias = Math.floor((new Date() - new Date(p.data)) / (1000*60*60*24));
                    const wikiRef = wikis.find(w => w.especie.toLowerCase() === p.variedade.toLowerCase());
                    let colheitaInfo = "";
                    if(wikiRef) {
                        const dColheita = new Date(p.data);
                        dColheita.setDate(dColheita.getDate() + wikiRef.tempo);
                        colheitaInfo = `<br><small style="color:var(--p)">🎯 Colheita: ${dColheita.toLocaleDateString()}</small>`;
                    }

                    zonaHtml.innerHTML += `
                        <div class="card">
                            <div style="display:flex; justify-content:space-between">
                                <strong>${p.variedade}</strong>
                                <button onclick="logic.apagar('plantas', ${p.id}, 'horta')" style="border:none; background:none; color:red">✕</button>
                            </div>
                            <small>⏳ ${dias} dias de vida</small>${colheitaInfo}
                            <p style="font-size:0.8rem; color:#666; margin-top:5px;">${p.notas || ''}</p>
                        </div>`;
                });
                container.appendChild(zonaHtml);
            }
        });
    },

    renderWiki: async function() {
        const term = document.getElementById('globalSearch').value.toLowerCase();
        const itens = await db.wiki.filter(i => i.especie.toLowerCase().includes(term)).toArray();
        document.getElementById('grid-wiki').innerHTML = itens.map(i => `
            <div class="card" style="border-left: 5px solid #8e44ad">
                <div style="display:flex; justify-content:space-between">
                    <strong style="color:#8e44ad">${i.especie}</strong>
                    <button onclick="logic.apagar('wiki', ${i.id}, 'wiki')" style="border:none; background:none; color:red">✕</button>
                </div>
                <small>⏱️ ${i.tempo} dias | 🌡️ ${i.temp}</small>
                <p style="font-size:0.85rem">${i.info}</p>
            </div>
        `).join('');
    },

    renderBook: async function() {
        const term = document.getElementById('globalSearch').value.toLowerCase();
        const itens = await db.book.filter(i => i.titulo.toLowerCase().includes(term) || i.categoria.toLowerCase().includes(term)).toArray();
        document.getElementById('grid-book').innerHTML = itens.map(i => `
            <div class="card">
                <span class="badge" style="background:var(--s); color:var(--p)">${i.categoria}</span>
                <div style="display:flex; justify-content:space-between">
                    <strong>${i.titulo}</strong>
                    <button onclick="logic.apagar('book', ${i.id}, 'book')" style="border:none; background:none; color:red">✕</button>
                </div>
                <p style="font-size:0.9rem; white-space: pre-wrap;">${i.conteudo}</p>
            </div>
        `).join('');
    }
};

const logic = {
    // --- GESTÃO GERAL ---
    apagar: async function(tabela, id, ref) {
        if(confirm("Deseja apagar?")) {
            await db[tabela].delete(id);
            ui.execRender(ref);
        }
    },

    // --- ZONAS ---
    addZona: async function() {
        const n = document.getElementById('z-nome').value.trim();
        if(!n) return;
        await db.zonas.add({ nome: n });
        document.getElementById('z-nome').value = '';
        this.renderConfig();
    },

    renderConfig: async function() {
        const zonas = await db.zonas.toArray();
        document.getElementById('lista-zonas').innerHTML = zonas.map(z => `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px">
                <span>${z.nome}</span>
                <button onclick="logic.apagar('zonas', ${z.id}, 'config')" style="color:red; border:none; background:none">Remover</button>
            </div>
        `).join('');
    },

    // --- SALVAMENTO ---
    salvarPlanta: async function() {
        const v = document.getElementById('p-variedade').value;
        const z = document.getElementById('p-zona').value;
        if(!v || !z) return alert("Variedade e Zona são obrigatórios!");
        await db.plantas.add({ variedade: v, zonaId: parseInt(z), data: document.getElementById('p-data').value, notas: document.getElementById('p-notas').value });
        ui.fecharModais(); ui.renderHorta();
    },

    salvarWiki: async function() {
        const e = document.getElementById('w-especie').value;
        const t = document.getElementById('w-tempo').value;
        if(!e || !t) return alert("Nome e tempo são obrigatórios!");
        await db.wiki.add({ especie: e, tempo: parseInt(t), temp: document.getElementById('w-temp').value, info: document.getElementById('w-info').value });
        ui.fecharModais(); ui.renderWiki();
    },

    salvarBook: async function() {
        const t = document.getElementById('b-titulo').value;
        if(!t) return alert("Título obrigatório!");
        await db.book.add({ titulo: t, categoria: document.getElementById('b-cat').value, conteudo: document.getElementById('b-conteudo').value });
        ui.fecharModais(); ui.renderBook();
    },

    popularZonas: async function() {
        const z = await db.zonas.toArray();
        document.getElementById('p-zona').innerHTML = z.map(i => `<option value="${i.id}">${i.nome}</option>`).join('');
    },

    // --- UTILITÁRIOS ---
    toggleDarkMode: async function() {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        await db.config.put({ id: 'darkmode', value: isDark });
    },

    exportarDados: async function() {
        const tabelas = ['zonas', 'wiki', 'plantas', 'book'];
        const backup = {};
        for (const t of tabelas) backup[t] = await db[t].toArray();
        
        const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jotagarden_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
    },

    importarDados: function(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = JSON.parse(e.target.result);
            if(confirm("Isto irá substituir os dados atuais. Continuar?")) {
                for(const t in data) {
                    await db[t].clear();
                    await db[t].bulkAdd(data[t]);
                }
                location.reload();
            }
        };
        reader.readAsText(file);
    }
};

// --- INITIALIZE ---
window.onload = async () => {
    const dm = await db.config.get('darkmode');
    if(dm?.value) document.body.classList.add('dark');
    ui.nav('dash', document.querySelector('.nav-btn'));
};
