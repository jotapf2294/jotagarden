// ====================== app.js ======================
// JotaGarden OS - PWA completa em Vanilla JS + Dexie.js
// Engenheiro de Software Sénior Full Stack - Código modular, limpo e 100% offline

const JotaGarden = {
    db: null,
    currentSection: 'home',
    searchTerm: '',
    
    // ====================== LÓGICA DE DADOS (logic) ======================
    logic: {
        async initDB() {
            this.db = new Dexie('JotaGardenDB');
            this.db.version(1).stores({
                zones: '++id, name',
                species: '++id, name, category',
                plantings: '++id, zoneId, speciesId, variety, datePlanted, notes, lastWatered',
                journal: '++id, timestamp, category, notes'
            });
            await this.db.open();
            console.log('%c✅ Dexie IndexedDB inicializado com sucesso', 'color:#00ff9d; font-weight:700');
            return this.db;
        },

        // Semente de dados iniciais (só na primeira execução)
        async seedData() {
            const speciesCount = await this.db.species.count();
            if (speciesCount === 0) {
                await this.db.species.bulkAdd([
                    { name: "Alface", category: "Folhas", notes: "Solo rico em nitrogénio. Colheita aos 30-45 dias. Prefere sombra parcial." },
                    { name: "Tomate Cereja", category: "Frutos", notes: "Sol pleno. Tutorar. Rega regular. Colheita contínua." },
                    { name: "Cenoura", category: "Raízes", notes: "Solo solto e profundo. Rega constante. Colheita aos 70-90 dias." },
                    { name: "Manjericão", category: "Aromáticas", notes: "Sol pleno. Repelente natural de pragas. Colheita das folhas." },
                    { name: "Morango", category: "Frutos", notes: "Solo ácido. Cobertura morta. Colheita de maio a outubro." },
                    { name: "Rúcula", category: "Folhas", notes: "Ciclo rápido. Sombra no verão. Rega abundante." },
                    { name: "Batata Doce", category: "Raízes", notes: "Solo arenoso. Colheita aos 120 dias." },
                    { name: "Alecrim", category: "Aromáticas", notes: "Resistente à seca. Sol pleno. Perene." }
                ]);
            }
            
            const zonesCount = await this.db.zones.count();
            if (zonesCount === 0) {
                await this.db.zones.add({ name: "Estufa Principal" });
                await this.db.zones.add({ name: "Canteiro A" });
            }
        },

        // ====================== CRUD ZONAS ======================
        async getZones() {
            return await this.db.zones.toArray();
        },
        async addZone(name) {
            if (!name || name.trim() === '') return null;
            const id = await this.db.zones.add({ name: name.trim() });
            return { id, name: name.trim() };
        },
        async deleteZone(id) {
            // Verifica se existem plantios antes de apagar
            const count = await this.db.plantings.where({ zoneId: id }).count();
            if (count > 0) {
                if (!confirm('Esta zona tem plantas. Apagar mesmo assim?')) return false;
            }
            await this.db.plantings.where({ zoneId: id }).delete();
            await this.db.zones.delete(id);
            return true;
        },

        // ====================== CRUD ESPÉCIES (Wiki) ======================
        async getSpecies(filter = '') {
            let query = this.db.species.orderBy('name');
            if (filter) {
                query = query.filter(s => 
                    s.name.toLowerCase().includes(filter.toLowerCase()) ||
                    s.notes.toLowerCase().includes(filter.toLowerCase())
                );
            }
            return await query.toArray();
        },
        async addSpecies(data) {
            return await this.db.species.add(data);
        },

        // ====================== PLANTIOS ======================
        async getPlantingsByZone(zoneId) {
            return await this.db.plantings
                .where({ zoneId })
                .toArray();
        },
        async getAllPlantings(filter = '') {
            let list = await this.db.plantings.toArray();
            if (filter) {
                const speciesMap = {};
                const species = await this.db.species.toArray();
                species.forEach(s => speciesMap[s.id] = s);
                
                list = list.filter(p => {
                    const sp = speciesMap[p.speciesId];
                    return (sp && sp.name.toLowerCase().includes(filter.toLowerCase())) ||
                           (p.variety && p.variety.toLowerCase().includes(filter.toLowerCase()));
                });
            }
            return list;
        },
        async addPlanting(data) {
            return await this.db.plantings.add({
                ...data,
                datePlanted: data.datePlanted || new Date().toISOString().split('T')[0],
                lastWatered: null
            });
        },
        async waterPlant(plantingId) {
            await this.db.plantings.update(plantingId, { lastWatered: new Date().toISOString() });
        },
        async deletePlanting(id) {
            await this.db.plantings.delete(id);
        },

        // ====================== DIÁRIO ======================
        async getJournal(filterCategory = '') {
            let query = this.db.journal.orderBy('timestamp').reverse();
            if (filterCategory) {
                query = query.filter(j => j.category === filterCategory);
            }
            return await query.toArray();
        },
        async addJournalEntry(entry) {
            return await this.db.journal.add({
                timestamp: new Date().toISOString(),
                ...entry
            });
        },

        // ====================== ESTATÍSTICAS ======================
        async getStats() {
            const [zones, plantings, journalCount] = await Promise.all([
                this.db.zones.count(),
                this.db.plantings.count(),
                this.db.journal.count()
            ]);
            return { zones, plantings, journalCount };
        },

        // ====================== BACKUP / RESTORE ======================
        async exportData() {
            const data = {
                zones: await this.db.zones.toArray(),
                species: await this.db.species.toArray(),
                plantings: await this.db.plantings.toArray(),
                journal: await this.db.journal.toArray(),
                exportedAt: new Date().toISOString()
            };
            return JSON.stringify(data, null, 2);
        },
        async importData(jsonString) {
            try {
                const data = JSON.parse(jsonString);
                await this.db.transaction('rw', this.db.tables, async () => {
                    await this.db.zones.clear();
                    await this.db.species.clear();
                    await this.db.plantings.clear();
                    await this.db.journal.clear();
                    
                    if (data.zones) await this.db.zones.bulkAdd(data.zones);
                    if (data.species) await this.db.species.bulkAdd(data.species);
                    if (data.plantings) await this.db.plantings.bulkAdd(data.plantings);
                    if (data.journal) await this.db.journal.bulkAdd(data.journal);
                });
                return true;
            } catch (e) {
                console.error(e);
                return false;
            }
        }
    },

    // ====================== UI RENDER (ui) ======================
    ui: {
        // Renderiza a secção atual
        async render(section) {
            const main = document.getElementById('main-content');
            if (!main) return; // Proteção anti-bug
            
            JotaGarden.currentSection = section;
            
            // Atualiza navegação ativa
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.section === section);
            });
            
            let html = '';
            
            switch (section) {
                case 'home':
                    html = await JotaGarden.ui.renderDashboard();
                    break;
                case 'horta':
                    html = await JotaGarden.ui.renderHorta();
                    break;
                case 'wiki':
                    html = await JotaGarden.ui.renderWiki();
                    break;
                case 'diario':
                    html = await JotaGarden.ui.renderDiario();
                    break;
                case 'config':
                    html = JotaGarden.ui.renderConfig();
                    break;
            }
            
            main.innerHTML = html;
            
            // Re-anexa listeners específicos da secção
            JotaGarden.ui.attachSectionListeners(section);
        },
        
        async renderDashboard() {
            const stats = await JotaGarden.logic.getStats();
            const phase = JotaGarden.ui.getMoonPhase(new Date());
            
            return `
                <div class="card" style="text-align:center; padding:32px 20px;">
                    <div style="font-size:5rem; margin-bottom:12px;">${phase.icon}</div>
                    <h2 style="margin-bottom:4px;">${phase.name}</h2>
                    <p style="color:var(--text-muted); font-size:1.1rem;">Fase da Lua • Hoje</p>
                </div>
                
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px,1fr)); gap:12px; margin-top:24px;">
                    <div class="card">
                        <h3 style="color:var(--accent);">🌍 Zonas</h3>
                        <div style="font-size:2.8rem; font-weight:700; margin:8px 0;">${stats.zones}</div>
                        <p>Áreas de cultivo ativas</p>
                    </div>
                    <div class="card">
                        <h3 style="color:var(--accent);">🌱 Plantas</h3>
                        <div style="font-size:2.8rem; font-weight:700; margin:8px 0;">${stats.plantings}</div>
                        <p>Em produção</p>
                    </div>
                    <div class="card">
                        <h3 style="color:var(--accent);">📓 Registos</h3>
                        <div style="font-size:2.8rem; font-weight:700; margin:8px 0;">${stats.journalCount}</div>
                        <p>No diário</p>
                    </div>
                </div>
                
                <div class="card" style="margin-top:24px;">
                    <h3>🌟 Dica do dia</h3>
                    <p>Verifique a última rega das plantas em "Horta". A Lua ${phase.name.toLowerCase()} favorece o crescimento das folhas!</p>
                </div>
            `;
        },
        
        async renderHorta() {
            const zones = await JotaGarden.logic.getZones();
            let html = `<h2 style="margin-bottom:20px; padding-left:4px;">🌿 Minhas Zonas</h2>`;
            
            if (zones.length === 0) {
                html += `<div class="card" style="text-align:center; padding:40px 20px; opacity:0.6;">Nenhuma zona criada.<br><br><button class="btn" onclick="JotaGarden.ui.showAddZoneModal()">+ Criar Primeira Zona</button></div>`;
                return html;
            }
            
            for (const zone of zones) {
                const plantings = await JotaGarden.logic.getPlantingsByZone(zone.id);
                html += `
                    <div class="card">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                            <h3 style="margin:0;">${zone.name}</h3>
                            <button onclick="JotaGarden.logic.deleteZone(${zone.id}).then(() => JotaGarden.ui.render('horta'))" 
                                    class="btn-secondary" style="padding:6px 14px; font-size:0.9rem;">🗑️</button>
                        </div>
                        <button onclick="JotaGarden.ui.showAddPlantingModal(${zone.id})" 
                                class="btn" style="width:100%; margin-bottom:16px;">+ Adicionar Plantio</button>`;
                
                if (plantings.length === 0) {
                    html += `<p style="opacity:0.5; text-align:center; padding:20px;">Ainda sem plantas nesta zona.</p>`;
                } else {
                    html += `<div style="display:flex; flex-direction:column; gap:10px;">`;
                    for (const p of plantings) {
                        const species = await JotaGarden.db.species.get(p.speciesId);
                        const lastWater = p.lastWatered 
                            ? new Date(p.lastWatered).toLocaleDateString('pt-PT') 
                            : 'Nunca regada';
                        html += `
                            <div style="background:rgba(255,255,255,0.05); border-radius:16px; padding:14px; display:flex; flex-direction:column; gap:8px;">
                                <div style="display:flex; justify-content:space-between;">
                                    <strong>${species ? species.name : '??'} \( {p.variety ? `( \){p.variety})` : ''}</strong>
                                    <button onclick="JotaGarden.logic.waterPlant(${p.id}).then(() => JotaGarden.ui.render('horta'))" 
                                            class="btn" style="padding:4px 16px; font-size:0.85rem;">💧 Regar</button>
                                </div>
                                <small>Plantado: ${new Date(p.datePlanted).toLocaleDateString('pt-PT')}</small>
                                <small>Última rega: ${lastWater}</small>
                                \( {p.notes ? `<small style="opacity:0.7;"> \){p.notes}</small>` : ''}
                                <button onclick="JotaGarden.logic.deletePlanting(${p.id}).then(() => JotaGarden.ui.render('horta'))" 
                                        style="align-self:flex-end; font-size:0.75rem; color:#ff5555;">Remover planta</button>
                            </div>`;
                    }
                    html += `</div>`;
                }
                html += `</div>`;
            }
            return html;
        },
        
        async renderWiki() {
            const species = await JotaGarden.logic.getSpecies(JotaGarden.searchTerm);
            let html = `
                <h2 style="margin-bottom:16px;">📖 Wiki de Espécies</h2>
                <button onclick="JotaGarden.ui.showAddSpeciesModal()" class="btn" style="margin-bottom:20px;">+ Nova Espécie</button>
            `;
            
            const grouped = {};
            species.forEach(s => {
                if (!grouped[s.category]) grouped[s.category] = [];
                grouped[s.category].push(s);
            });
            
            for (const [cat, list] of Object.entries(grouped)) {
                html += `<h3 style="margin:24px 0 12px; padding-left:8px;">${cat}</h3>`;
                html += `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px,1fr)); gap:12px;">`;
                list.forEach(sp => {
                    html += `
                        <div class="card">
                            <div class="badge badge-\( {cat.toLowerCase()}"> \){cat}</div>
                            <h4 style="margin:12px 0 6px;">${sp.name}</h4>
                            <p style="font-size:0.9rem; line-height:1.4; opacity:0.85;">${sp.notes}</p>
                        </div>`;
                });
                html += `</div>`;
            }
            
            if (species.length === 0) html += `<p style="text-align:center; padding:40px; opacity:0.6;">Nenhuma espécie encontrada.</p>`;
            return html;
        },
        
        async renderDiario() {
            const entries = await JotaGarden.logic.getJournal();
            let html = `
                <h2 style="margin-bottom:20px;">📓 Diário de Cultivo</h2>
                <div class="card">
                    <select id="diario-category" style="width:100%; padding:12px; background:rgba(255,255,255,0.1); border:none; border-radius:12px; margin-bottom:12px;">
                        <option value="">Geral</option>
                        <option value="Adubação">Adubação</option>
                        <option value="Colheita">Colheita</option>
                    </select>
                    <textarea id="diario-notes" rows="3" placeholder="O que aconteceu hoje na horta?" style="width:100%; background:rgba(255,255,255,0.1); border:none; border-radius:12px; padding:14px; resize:none;"></textarea>
                    <button onclick="JotaGarden.ui.saveJournalEntry()" class="btn" style="margin-top:12px; width:100%;">Guardar Registo</button>
                </div>`;
            
            if (entries.length === 0) {
                html += `<p style="text-align:center; opacity:0.6; padding:30px;">Ainda não há registos no diário.</p>`;
            } else {
                html += `<h3 style="margin:28px 0 12px;">Histórico</h3>`;
                entries.forEach(e => {
                    const date = new Date(e.timestamp).toLocaleDateString('pt-PT', { weekday:'short', day:'numeric', month:'short' });
                    html += `
                        <div class="card">
                            <div style="display:flex; justify-content:space-between; font-size:0.85rem; opacity:0.7;">
                                <span>${date}</span>
                                <span class="badge">${e.category || 'Geral'}</span>
                            </div>
                            <p style="margin-top:8px;">${e.notes}</p>
                        </div>`;
                });
            }
            return html;
        },
        
        renderConfig() {
            return `
                <h2 style="margin-bottom:24px;">⚙️ Configurações</h2>
                
                <div class="card">
                    <h3>Tema</h3>
                    <div style="display:flex; gap:16px; margin-top:16px;">
                        <button onclick="JotaGarden.ui.toggleTheme()" class="btn">🌑 Modo Dark (OLED)</button>
                        <button onclick="JotaGarden.ui.toggleTheme()" class="btn-secondary">☀️ Modo Light</button>
                    </div>
                </div>
                
                <div class="card" style="margin-top:20px;">
                    <h3>Backup &amp; Restore</h3>
                    <button onclick="JotaGarden.ui.exportBackup()" class="btn" style="width:100%; margin:12px 0;">⬇️ Exportar Tudo (JSON)</button>
                    <label class="btn" style="width:100%; text-align:center; cursor:pointer;">
                        ⬆️ Restaurar Backup
                        <input type="file" id="restore-file" accept=".json" style="display:none;" onchange="JotaGarden.ui.importBackup(this)">
                    </label>
                </div>
                
                <div style="margin-top:40px; text-align:center; opacity:0.5; font-size:0.8rem;">
                    JotaGarden OS v1.0 • PWA 100% Offline<br>
                    Glassmorphism Dark + Dexie.js
                </div>
            `;
        },
        
        // ====================== MODAIS ======================
        showModal(title, contentHTML) {
            const modal = document.getElementById('modal');
            const inner = document.getElementById('modal-inner');
            if (!modal || !inner) return;
            
            inner.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:20px 24px 0;">
                    <h2 style="margin:0;">${title}</h2>
                    <button onclick="JotaGarden.ui.closeModal()" style="background:none; border:none; font-size:1.8rem; color:#aaa; cursor:pointer;">✕</button>
                </div>
                <div style="padding:0 24px 24px;">
                    ${contentHTML}
                </div>
            `;
            modal.classList.add('show');
        },
        
        closeModal() {
            const modal = document.getElementById('modal');
            if (modal) modal.classList.remove('show');
        },
        
        showAddZoneModal() {
            JotaGarden.ui.showModal('Nova Zona de Cultivo', `
                <input id="zone-name" type="text" placeholder="Nome da zona (ex: Canteiro B)" style="width:100%; padding:16px; border-radius:16px; background:rgba(255,255,255,0.1); border:none; margin:20px 0;">
                <button onclick="JotaGarden.ui.saveNewZone()" class="btn" style="width:100%;">Criar Zona</button>
            `);
        },
        
        async saveNewZone() {
            const nameInput = document.getElementById('zone-name');
            if (!nameInput) return;
            const name = nameInput.value.trim();
            if (name) {
                await JotaGarden.logic.addZone(name);
                JotaGarden.ui.closeModal();
                JotaGarden.ui.render('horta');
            }
        },
        
        showAddSpeciesModal() {
            JotaGarden.ui.showModal('Nova Espécie na Wiki', `
                <input id="species-name" placeholder="Nome da planta" style="width:100%; padding:14px; margin-bottom:12px; border-radius:16px; background:rgba(255,255,255,0.1); border:none;">
                <select id="species-category" style="width:100%; padding:14px; margin-bottom:12px; border-radius:16px; background:rgba(255,255,255,0.1); border:none;">
                    <option value="Folhas">Folhas</option>
                    <option value="Frutos">Frutos</option>
                    <option value="Raízes">Raízes</option>
                    <option value="Aromáticas">Aromáticas</option>
                </select>
                <textarea id="species-notes" placeholder="Notas de cultivo..." rows="4" style="width:100%; padding:14px; border-radius:16px; background:rgba(255,255,255,0.1); border:none;"></textarea>
                <button onclick="JotaGarden.ui.saveNewSpecies()" class="btn" style="width:100%; margin-top:12px;">Adicionar à Wiki</button>
            `);
        },
        
        async saveNewSpecies() {
            const name = document.getElementById('species-name').value.trim();
            const category = document.getElementById('species-category').value;
            const notes = document.getElementById('species-notes').value.trim();
            if (name) {
                await JotaGarden.logic.addSpecies({ name, category, notes });
                JotaGarden.ui.closeModal();
                JotaGarden.ui.render('wiki');
            }
        },
        
        showAddPlantingModal(zoneId) {
            // Carrega espécies para dropdown
            JotaGarden.logic.getSpecies().then(species => {
                let options = species.map(s => `<option value="\( {s.id}"> \){s.name}</option>`).join('');
                JotaGarden.ui.showModal('Novo Plantio', `
                    <select id="planting-species" style="width:100%; padding:14px; margin-bottom:12px; border-radius:16px; background:rgba(255,255,255,0.1); border:none;">${options}</select>
                    <input id="planting-variety" placeholder="Variedade (ex: Cherry)" style="width:100%; padding:14px; margin-bottom:12px; border-radius:16px; background:rgba(255,255,255,0.1); border:none;">
                    <input id="planting-date" type="date" value="${new Date().toISOString().split('T')[0]}" style="width:100%; padding:14px; margin-bottom:12px; border-radius:16px; background:rgba(255,255,255,0.1); border:none;">
                    <textarea id="planting-notes" placeholder="Notas do plantio" rows="3" style="width:100%; padding:14px; border-radius:16px; background:rgba(255,255,255,0.1); border:none;"></textarea>
                    <button onclick="JotaGarden.ui.saveNewPlanting(${zoneId})" class="btn" style="width:100%; margin-top:12px;">Plantar Agora</button>
                `);
            });
        },
        
        async saveNewPlanting(zoneId) {
            const speciesId = parseInt(document.getElementById('planting-species').value);
            const variety = document.getElementById('planting-variety').value.trim();
            const datePlanted = document.getElementById('planting-date').value;
            const notes = document.getElementById('planting-notes').value.trim();
            
            if (speciesId) {
                await JotaGarden.logic.addPlanting({
                    zoneId,
                    speciesId,
                    variety,
                    datePlanted,
                    notes
                });
                JotaGarden.ui.closeModal();
                JotaGarden.ui.render('horta');
            }
        },
        
        saveJournalEntry() {
            const category = document.getElementById('diario-category').value || 'Geral';
            const notes = document.getElementById('diario-notes').value.trim();
            if (notes) {
                JotaGarden.logic.addJournalEntry({ category, notes }).then(() => {
                    JotaGarden.ui.render('diario');
                });
            }
        },
        
        // ====================== MOON PHASE ======================
        getMoonPhase(date) {
            const year = date.getUTCFullYear();
            const month = date.getUTCMonth() + 1;
            const day = date.getUTCDate();
            
            // Fórmula aproximada de fase lunar (válida 2000-2100)
            let c = Math.floor(365.25 * (year - 2000)) + Math.floor(30.6 * (month - 1)) + day - 730.5;
            let age = (c % 29.530588853);
            
            if (age < 1.84566) return { name: "Lua Nova", icon: "🌑" };
            if (age < 5.53699) return { name: "Crescente", icon: "🌒" };
            if (age < 9.22831) return { name: "Quarto Crescente", icon: "🌓" };
            if (age < 12.91963) return { name: "Gibosa Crescente", icon: "🌔" };
            if (age < 16.61096) return { name: "Lua Cheia", icon: "🌕" };
            if (age < 20.30228) return { name: "Gibosa Minguante", icon: "🌖" };
            if (age < 23.99361) return { name: "Quarto Minguante", icon: "🌗" };
            return { name: "Minguante", icon: "🌘" };
        },
        
        // ====================== BACKUP ======================
        async exportBackup() {
            const json = await JotaGarden.logic.exportData();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `jotagarden-backup-${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        },
        
        async importBackup(input) {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (e) => {
                const success = await JotaGarden.logic.importData(e.target.result);
                if (success) {
                    alert('✅ Backup restaurado com sucesso!');
                    JotaGarden.ui.render('home');
                } else {
                    alert('❌ Erro ao restaurar backup');
                }
            };
            reader.readAsText(file);
        },
        
        toggleTheme() {
            document.body.classList.toggle('light');
        },
        
        // ====================== LISTENERS ======================
        attachSectionListeners(section) {
            // Pesquisa global já está no header (ver init)
            if (section === 'horta' || section === 'wiki') {
                // Pesquisa já filtra automaticamente via searchTerm
            }
        }
    },
    
    // ====================== INICIALIZAÇÃO ======================
    async init() {
        // Proteção anti-null
        if (!document.getElementById('main-content')) return;
        
        await this.logic.initDB();
        await this.logic.seedData();
        
        // Pesquisa global
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                // Se estiver em Horta ou Wiki, re-renderiza com filtro
                if (['horta', 'wiki'].includes(this.currentSection)) {
                    this.ui.render(this.currentSection);
                }
            });
        }
        
        // Navegação bottom dock
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                if (section) this.ui.render(section);
            });
        });
        
        // Primeira renderização
        this.ui.render('home');
        
        console.log('%c🚀 JotaGarden OS iniciado com sucesso! PWA + Glassmorphism Dark + Dexie.js', 'color:#00ff9d; font-size:1.1rem; font-weight:700');
        
        // Registo PWA Service Worker (opcional - crie sw.js simples)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        }
    }
};

// Inicia a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => JotaGarden.init());