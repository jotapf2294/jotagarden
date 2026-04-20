/**
 * JotaGarden OS - PWA Logic
 * Arquitetura Modular: Inicialização de DB -> Módulo Logic -> Módulo UI
 */

// ==========================================
// 1. Configuração Base de Dados (Dexie.js)
// ==========================================
const db = new Dexie('JotaGardenDB');
db.version(1).stores({
    zones: '++id, name',
    species: '++id, name, category', // category: Folhas, Frutos, Raízes, Aromáticas
    plants: '++id, zoneId, speciesId, variety, date, lastWatered',
    diary: '++id, category, date' // category: Geral, Adubação, Colheita
});

// ==========================================
// 2. Módulo de Lógica (Dados e Regras)
// ==========================================
const logic = {
    // ---- Zonas ----
    async getZones() { return await db.zones.toArray(); },
    async addZone(name) { return await db.zones.add({ name }); },
    async deleteZone(id) {
        await db.plants.where('zoneId').equals(id).delete(); // Cascade delete
        return await db.zones.delete(id); 
    },

    // ---- Espécies ----
    async getSpecies() { return await db.species.toArray(); },
    async addSpecies(name, category, notes) { return await db.species.add({ name, category, notes }); },

    // ---- Plantas ----
    async getPlantsByZone(zoneId) { return await db.plants.where('zoneId').equals(zoneId).toArray(); },
    async addPlant(zoneId, speciesId, variety, date, notes) {
        return await db.plants.add({ zoneId, speciesId, variety, date, notes, lastWatered: null });
    },
    async waterPlant(plantId) {
        const now = new Date().toISOString();
        return await db.plants.update(plantId, { lastWatered: now });
    },
    async deletePlant(plantId) { return await db.plants.delete(plantId); },

    // ---- Diário ----
    async getDiaryEntries() { return await db.diary.orderBy('date').reverse().toArray(); },
    async addDiaryEntry(category, title, text, date) { 
        return await db.diary.add({ category, title, text, date }); 
    },
    async updateDiaryEntry(id, category, title, text, date) {
        return await db.diary.update(id, { category, title, text, date });
    },

    // ---- Dashboard e Utilitários ----
    async getStats() {
        const zonesCount = await db.zones.count();
        const speciesCount = await db.species.count();
        const plantsCount = await db.plants.count();
        return { zonesCount, speciesCount, plantsCount };
    },
    
    getMoonPhase() {
        // Algoritmo simplificado de fase da lua baseado na idade da lua (ciclo 29.53 dias)
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        let c = e = jd = b = 0;
        if (month < 3) { year--; month += 12; }
        ++month;
        c = 365.25 * year;
        e = 30.6 * month;
        jd = c + e + day - 694039.09;
        jd /= 29.5305882;
        b = parseInt(jd);
        jd -= b;
        b = Math.round(jd * 8);
        if (b >= 8) b = 0;
        const phases = [
            { icon: '🌑', text: 'Nova' }, { icon: '🌒', text: 'Crescente Côncava' },
            { icon: '🌓', text: 'Quarto Crescente' }, { icon: '🌔', text: 'Crescente Convexa' },
            { icon: '🌕', text: 'Cheia' }, { icon: '🌖', text: 'Minguante Convexa' },
            { icon: '🌗', text: 'Quarto Minguante' }, { icon: '🌘', text: 'Minguante Côncava' }
        ];
        return phases[b];
    },

    async exportData() {
        const data = {
            zones: await db.zones.toArray(),
            species: await db.species.toArray(),
            plants: await db.plants.toArray(),
            diary: await db.diary.toArray()
        };
        const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `JotaGarden_Backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    async importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            await db.transaction('rw', db.zones, db.species, db.plants, db.diary, async () => {
                await db.zones.clear(); await db.species.clear();
                await db.plants.clear(); await db.diary.clear();
                if(data.zones) await db.zones.bulkAdd(data.zones);
                if(data.species) await db.species.bulkAdd(data.species);
                if(data.plants) await db.plants.bulkAdd(data.plants);
                if(data.diary) await db.diary.bulkAdd(data.diary);
            });
            return true;
        } catch (e) {
            console.error("Erro no Restore:", e);
            return false;
        }
    }
};

// ==========================================
// 3. Módulo de Interface (UI & DOM)
// ==========================================
const ui = {
    currentView: 'view-dashboard',
    
    // Utilitário Anti-Bug para Event Listeners
    bindEvent(id, event, callback) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, callback);
    },

    init() {
        this.setupNavigation();
        this.setupModals();
        this.setupSearch();
        this.setupTheme();
        this.bindGlobalActions();
        
        // Render Inicial
        this.renderView(this.currentView);
    },

    setupNavigation() {
        document.querySelectorAll('.dock-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.dock-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                const targetId = item.getAttribute('data-target');
                document.querySelectorAll('.view').forEach(v => {
                    v.classList.remove('active', 'fade-in');
                });
                
                const targetView = document.getElementById(targetId);
                if (targetView) {
                    targetView.classList.add('active', 'fade-in');
                    this.currentView = targetId;
                    this.renderView(targetId); // Re-render ao trocar
                }
            });
        });
    },

    setupSearch() {
        this.bindEvent('global-search', 'input', (e) => {
            const term = e.target.value.toLowerCase();
            if (this.currentView === 'view-garden') this.renderGarden(term);
            if (this.currentView === 'view-wiki') this.renderWiki(term);
        });
    },

    setupTheme() {
        const isLight = localStorage.getItem('jg_theme') === 'light';
        if (isLight) document.body.classList.add('light-mode');
        
        this.bindEvent('btn-toggle-theme', 'click', () => {
            document.body.classList.toggle('light-mode');
            localStorage.setItem('jg_theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
        });
    },

    bindGlobalActions() {
        // Backup / Restore
        this.bindEvent('btn-backup', 'click', () => logic.exportData());
        this.bindEvent('file-restore', 'change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (e) => {
                const success = await logic.importData(e.target.result);
                if(success) {
                    alert("Dados restaurados com sucesso!");
                    this.renderView(this.currentView);
                } else {
                    alert("Erro ao ler ficheiro JSON.");
                }
            };
            reader.readAsText(file);
        });
    },

    // --- Sistema de Modais ---
    showModal(htmlContent) {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        if(!overlay || !content) return;
        content.innerHTML = htmlContent + `<button class="btn-danger mt-10 w-100" onclick="ui.closeModal()" style="width: 100%">Cancelar</button>`;
        overlay.classList.add('active');
    },

    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if(overlay) overlay.classList.remove('active');
    },

    setupModals() {
        // Nova Zona
        this.bindEvent('btn-add-zone', 'click', () => {
            this.showModal(`
                <h3>Nova Zona de Cultivo</h3>
                <input type="text" id="input-zone-name" placeholder="Ex: Estufa Sul">
                <button class="btn-primary mt-10" id="save-zone" style="width:100%">Guardar</button>
            `);
            this.bindEvent('save-zone', 'click', async () => {
                const name = document.getElementById('input-zone-name').value;
                if(name) {
                    await logic.addZone(name);
                    this.closeModal();
                    this.renderGarden();
                }
            });
        });

        // Nova Espécie (Wiki)
        this.bindEvent('btn-add-species', 'click', () => {
            this.showModal(`
                <h3>Nova Espécie</h3>
                <input type="text" id="sp-name" placeholder="Nome (Ex: Tomateiro)">
                <select id="sp-cat">
                    <option value="Folhas">Folhas</option>
                    <option value="Frutos">Frutos</option>
                    <option value="Raízes">Raízes</option>
                    <option value="Aromáticas">Aromáticas</option>
                </select>
                <textarea id="sp-notes" placeholder="Notas de cultivo..."></textarea>
                <button class="btn-primary mt-10" id="save-species" style="width:100%">Guardar</button>
            `);
            this.bindEvent('save-species', 'click', async () => {
                const name = document.getElementById('sp-name').value;
                const cat = document.getElementById('sp-cat').value;
                const notes = document.getElementById('sp-notes').value;
                if(name) {
                    await logic.addSpecies(name, cat, notes);
                    this.closeModal();
                    this.renderWiki();
                }
            });
        });

        // Novo Registo Diário
        this.bindEvent('btn-add-diary', 'click', () => {
            this.showModal(`
                <h3>Novo Registo</h3>
                <select id="diary-cat">
                    <option value="Geral">Geral</option>
                    <option value="Adubação">Adubação</option>
                    <option value="Colheita">Colheita</option>
                </select>
                <input type="date" id="diary-date" value="${new Date().toISOString().split('T')[0]}">
                <textarea id="diary-text" placeholder="O que aconteceu hoje?"></textarea>
                <button class="btn-primary mt-10" id="save-diary" style="width:100%">Guardar</button>
            `);
            this.bindEvent('save-diary', 'click', async () => {
                const cat = document.getElementById('diary-cat').value;
                const date = document.getElementById('diary-date').value;
                const text = document.getElementById('diary-text').value;
                if(text) {
                    await logic.addDiaryEntry(cat, text, date);
                    this.closeModal();
                    this.renderDiary();
                }
            });
        });
    },

    // Modais Dinâmicos (Plantio)
    async openPlantModal(zoneId) {
        const species = await logic.getSpecies();
        if(species.length === 0) {
            alert("Adiciona primeiro espécies na Wiki!");
            return;
        }
        let options = species.map(s => `<option value="${s.id}">${s.name} (${s.category})</option>`).join('');
        
        this.showModal(`
            <h3>Plantar nesta Zona</h3>
            <select id="plant-species">${options}</select>
            <input type="text" id="plant-variety" placeholder="Variedade (Ex: Coração de Boi)">
            <input type="date" id="plant-date" value="${new Date().toISOString().split('T')[0]}">
            <textarea id="plant-notes" placeholder="Notas..."></textarea>
            <button class="btn-primary mt-10" id="save-plant" style="width:100%">Plantar</button>
        `);

        this.bindEvent('save-plant', 'click', async () => {
            const spId = parseInt(document.getElementById('plant-species').value);
            const variety = document.getElementById('plant-variety').value;
            const date = document.getElementById('plant-date').value;
            const notes = document.getElementById('plant-notes').value;
            
            await logic.addPlant(zoneId, spId, variety, date, notes);
            this.closeModal();
            this.renderGarden();
        });
    },

       async editDiaryEntry(entryId = null) {
        let entry = entryId ? await logic.getDiaryEntryById(entryId) : null;
        
        this.showModal(`
            <h3>${entry ? 'Editar' : 'Novo'} Registo</h3>
            <input type="text" id="diary-title" placeholder="Título do Registo" value="${entry?.title || ''}">
            <select id="diary-cat">
                <option value="Geral" ${entry?.category === 'Geral' ? 'selected' : ''}>Geral</option>
                <option value="Adubação" ${entry?.category === 'Adubação' ? 'selected' : ''}>Adubação</option>
                <option value="Colheita" ${entry?.category === 'Colheita' ? 'selected' : ''}>Colheita</option>
            </select>
            <input type="date" id="diary-date" value="${entry?.date || new Date().toISOString().split('T')[0]}">
            <textarea id="diary-text" placeholder="Escreve aqui as tuas notas...">${entry?.text || ''}</textarea>
            <button class="btn-primary mt-10" id="save-diary" style="width:100%">Guardar</button>
        `);

        this.bindEvent('save-diary', 'click', async () => {
            const data = {
                title: document.getElementById('diary-title').value,
                cat: document.getElementById('diary-cat').value,
                date: document.getElementById('diary-date').value,
                text: document.getElementById('diary-text').value
            };

            if (data.title && data.text) {
                if (entry) {
                    await logic.updateDiaryEntry(entry.id, data.cat, data.title, data.text, data.date);
                } else {
                    await logic.addDiaryEntry(data.cat, data.title, data.text, data.date);
                }
                this.closeModal();
                this.renderDiary();
            } else {
                alert("Preenche o título e a nota!");
            }
        });
    },

    // --- Renderização de Views ---
    renderView(viewId) {
        document.getElementById('global-search').value = ''; // Limpa search ao trocar tab
        if (viewId === 'view-dashboard') this.renderDashboard();
        else if (viewId === 'view-garden') this.renderGarden();
        else if (viewId === 'view-wiki') this.renderWiki();
        else if (viewId === 'view-diary') this.renderDiary();
    },

    async renderDashboard() {
        const phase = logic.getMoonPhase();
        const elIcon = document.getElementById('moon-phase-display');
        const elText = document.getElementById('moon-phase-text');
        if(elIcon) elIcon.innerText = phase.icon;
        if(elText) elText.innerText = phase.text;

        const stats = await logic.getStats();
        const list = document.getElementById('stats-list');
        if(list) {
            list.innerHTML = `
                <li><strong>Zonas:</strong> ${stats.zonesCount}</li>
                <li><strong>Espécies Catalogadas:</strong> ${stats.speciesCount}</li>
                <li><strong>Plantas Ativas:</strong> ${stats.plantsCount}</li>
            `;
        }
    },

    async renderGarden(filter = '') {
        const container = document.getElementById('zones-container');
        if(!container) return;
        
        const zones = await logic.getZones();
        const speciesList = await logic.getSpecies();
        container.innerHTML = '';

        for (const zone of zones) {
            let plants = await logic.getPlantsByZone(zone.id);
            
            // Filtro Global
            if(filter) {
                const zoneMatch = zone.name.toLowerCase().includes(filter);
                plants = plants.filter(p => {
                    const sp = speciesList.find(s => s.id === p.speciesId);
                    const spName = sp ? sp.name.toLowerCase() : '';
                    return zoneMatch || spName.includes(filter) || (p.variety && p.variety.toLowerCase().includes(filter));
                });
                if(!zoneMatch && plants.length === 0) continue; // Salta zona se não houver match
            }

            let plantsHTML = plants.map(p => {
                const sp = speciesList.find(s => s.id === p.speciesId);
                const spName = sp ? sp.name : 'Desconhecida';
                const lastW = p.lastWatered ? new Date(p.lastWatered).toLocaleString('pt-PT').slice(0, 16) : 'Nunca';
                
                return `
                <div class="glass-card plant-card">
                    <div class="flex-between">
                        <h4>${spName} <small>(${p.variety || 'Comum'})</small></h4>
                        <button class="btn-danger btn-sm" onclick="ui.deletePlant(${p.id})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    <p class="text-muted"><i class="fa-solid fa-calendar"></i> Plantado: ${p.date}</p>
                    <p class="text-muted"><i class="fa-solid fa-droplet" style="color: #4da6ff;"></i> Última Rega: ${lastW}</p>
                    <button class="btn-primary mt-10" onclick="ui.waterPlant(${p.id})"><i class="fa-solid fa-faucet-drip"></i> Regar Agora</button>
                </div>`;
            }).join('');

            container.innerHTML += `
                <div class="glass-card zone-card fade-in">
                    <div class="flex-between">
                        <h3><i class="fa-solid fa-layer-group"></i> ${zone.name}</h3>
                        <button class="btn-danger" onclick="ui.deleteZone(${zone.id})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    <div class="mt-10">
                        ${plantsHTML || '<p class="text-muted">Sem plantas nesta zona.</p>'}
                    </div>
                    <button class="btn-secondary mt-10" onclick="ui.openPlantModal(${zone.id})">+ Adicionar Planta</button>
                </div>
            `;
        }
    },

    async renderWiki(filter = '') {
        const container = document.getElementById('species-container');
        if(!container) return;
        
        let species = await logic.getSpecies();
        if(filter) {
            species = species.filter(s => s.name.toLowerCase().includes(filter) || s.category.toLowerCase().includes(filter));
        }

        container.innerHTML = species.map(s => `
            <div class="glass-card fade-in">
                <h3>${s.name}</h3>
                <span style="color: var(--accent-color); font-size: 0.8em; border: 1px solid var(--accent-color); padding: 2px 5px; border-radius: 5px;">${s.category}</span>
                <p class="mt-10 text-muted">${s.notes || 'Sem notas adicionais.'}</p>
            </div>
        `).join('');
    },

        async renderDiary() {
        const container = document.getElementById('diary-container');
        if (!container) return;
        const entries = await logic.getDiaryEntries();

        container.innerHTML = entries.map(e => `
            <div class="glass-card fade-in">
                <div class="diary-header-row">
                    <div class="diary-title-area">
                        <h4>${e.title || 'Sem Título'}</h4>
                        <div class="diary-meta">
                            <span><i class="fa-solid fa-tag"></i> ${e.category}</span>
                            <span><i class="fa-solid fa-calendar"></i> ${e.date}</span>
                        </div>
                    </div>
                    <div class="diary-actions">
                        <button class="btn-action-icon" onclick="ui.editDiaryEntry(${e.id})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-action-icon" onclick="ui.deleteDiaryEntry(${e.id})" style="color:var(--danger-color)"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="diary-note">${e.text}</div>
            </div>
        `).join('');
    },


    // --- Ações delegadas para o HTML ---
    async deleteZone(id) {
        if(confirm('Apagar zona e todas as suas plantas?')) {
            await logic.deleteZone(id);
            this.renderGarden();
        }
    },
    async deletePlant(id) {
        if(confirm('Remover planta?')) {
            await logic.deletePlant(id);
            this.renderGarden();
        }
    },
    async waterPlant(id) {
        await logic.waterPlant(id);
        this.renderGarden();
    }
};

// ==========================================
// 4. Inicialização da App
// ==========================================
document.addEventListener('DOMContentLoaded', () => ui.init());
