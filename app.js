/**
 * JotaGarden OS - Núcleo de Inteligência
 * Versão: 2.0 (Stable Full Stack)
 */

// 1. Configuração da Base de Dados (Dexie)
const db = new Dexie("JotaGardenOS");
db.version(1).stores({
    plantas: '++id, variedade, especie, zonaId, data, ultimaRega',
    wiki: '++id, especie, categoria, tempo, info',
    zones: '++id, nome',
    book: '++id, titulo, categoria, data',
    config: 'id, valor'
});

// 2. Lógica de Negócio
const logic = {
    async init() {
        const dk = await db.config.get('darkmode');
        if (dk) {
            document.getElementById('dark-toggle').checked = dk.valor;
            document.body.classList.toggle('light-mode', !dk.valor);
        }
        ui.render();
    },

    async savePlantio() {
        try {
            const d = {
                especie: document.getElementById('p-especie').value,
                variedade: document.getElementById('p-nome').value.trim() || document.getElementById('p-especie').value,
                zonaId: parseInt(document.getElementById('p-zona').value),
                data: document.getElementById('p-data').value || new Date().toISOString().split('T')[0],
                conteudo: document.getElementById('p-nota').value.trim(),
                ultimaRega: new Date().toISOString()
            };

            if (!d.especie || !d.zonaId) throw new Error("Falta selecionar espécie ou zona.");

            await db.plantas.add(d);
            ui.expanded.horta.add(d.zonaId);
            ui.closeModal('modal-plantar');
            ui.render();
        } catch (e) { alert(e.message); }
    },

    async saveWiki() {
        const w = {
            especie: document.getElementById('w-especie').value.trim(),
            categoria: document.getElementById('w-cat').value,
            tempo: parseInt(document.getElementById('w-tempo').value) || 0,
            info: document.getElementById('w-info').value.trim()
        };
        if (!w.especie) return;
        await db.wiki.add(w);
        ui.expanded.wiki.add(w.categoria);
        ui.closeModal('modal-wiki');
        ui.render();
    },

    async addZone() {
        const nome = document.getElementById('new-zone-name').value.trim();
        if (nome) {
            await db.zones.add({ nome });
            document.getElementById('new-zone-name').value = "";
            ui.render();
        }
    },

    async saveBook() {
        const b = {
            titulo: document.getElementById('b-titulo').value.trim() || "Sem Título",
            categoria: document.getElementById('b-cat').value,
            texto: document.getElementById('b-texto').value,
            data: new Date().toISOString()
        };
        await db.book.add(b);
        ui.expanded.book.add(b.categoria);
        ui.closeModal('modal-book');
        ui.render();
    },

    toggleTheme() {
        const isDark = document.getElementById('dark-toggle').checked;
        document.body.classList.toggle('light-mode', !isDark);
        db.config.put({ id: 'darkmode', valor: isDark });
    },

    getMoonPhase() {
        const day = new Date().getDate() % 30;
        if (day < 7) return { n: "Lua Nova", i: "🌑", t: "Ideal para preparar o solo e adubar." };
        if (day < 15) return { n: "Crescente", i: "🌓", t: "Sementeira de folhas e flores." };
        if (day < 22) return { n: "Lua Cheia", i: "🌕", t: "Plantar frutos e colher." };
        return { n: "Minguante", i: "🌗", t: "Controlar pragas e plantar raízes." };
    }
};

// 3. Interface de Utilizador (UI)
const ui = {
    currentTab: 'inicio',
    expanded: { horta: new Set(), wiki: new Set(), book: new Set() },

    tab(id, el) {
        this.currentTab = id;
        document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
        document.getElementById('page-' + id).classList.add('active');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
        this.render();
    },

    async render() {
        const search = document.getElementById('search').value.toLowerCase();
        
        // Atualizar Lua
        const moon = logic.getMoonPhase();
        document.querySelector('.moon-icon').innerText = moon.i;
        document.querySelector('.moon-phase-name').innerText = moon.n;
        document.querySelector('.moon-advice').innerText = moon.t;

        if (this.currentTab === 'horta') this.drawHorta(search);
        if (this.currentTab === 'wiki') this.drawWiki(search);
        if (this.currentTab === 'book') this.drawBook(search);
        if (this.currentTab === 'config') this.drawConfig();
        
        this.updateSelectors();
    },

    async drawHorta(s) {
        const [ps, zs] = await Promise.all([db.plantas.toArray(), db.zones.toArray()]);
        let html = "";
        zs.forEach(z => {
            const items = ps.filter(p => p.zonaId === z.id && (p.variedade.toLowerCase().includes(s) || p.especie.toLowerCase().includes(s)));
            const isOpen = this.expanded.horta.has(z.id);
            html += `<div class="group-header" onclick="ui.toggle('horta', ${z.id})">
                <b>📍 ${z.nome}</b> <span>${items.length} plantas ${isOpen?'▼':'▶'}</span>
            </div>`;
            if (isOpen) {
                html += items.map(p => {
                    const dias = Math.ceil(Math.abs(new Date() - new Date(p.data)) / (1000 * 60 * 60 * 24)) - 1;
                    return `
                    <div class="card" style="border-left: 4px solid var(--p)">
                        <div style="display:flex; justify-content:space-between">
                            <div><b>${p.variedade}</b><br><small>${p.especie}</small></div>
                            <span class="badge">🌱 ${dias} dias</span>
                        </div>
                        <div style="margin-top:10px; display:flex; justify-content:space-between">
                            <span onclick="logic.regar(${p.id})">💧</span>
                            <span onclick="ui.del('plantas', ${p.id})" style="color:var(--danger)">✕</span>
                        </div>
                    </div>`;
                }).join('');
            }
        });
        document.getElementById('draw-horta').innerHTML = html;
    },

    // Funções de suporte
    toggle(tab, id) {
        this.expanded[tab].has(id) ? this.expanded[tab].delete(id) : this.expanded[tab].add(id);
        this.render();
    },
    openModal(id) { document.getElementById(id).style.display = 'flex'; },
    closeModal(id) { document.getElementById(id).style.display = 'none'; },
    async del(tbl, id) { if(confirm("Apagar registo?")) { await db[tbl].delete(id); this.render(); } },
    
    async updateSelectors() {
        const [zs, ws] = await Promise.all([db.zones.toArray(), db.wiki.toArray()]);
        document.getElementById('p-zona').innerHTML = zs.map(z => `<option value="${z.id}">${z.nome}</option>`).join('');
        document.getElementById('p-especie').innerHTML = ws.map(w => `<option value="${w.especie}">${w.especie}</option>`).join('');
    }
};

// Iniciar App
logic.init();
