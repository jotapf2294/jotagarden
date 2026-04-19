const lunar = {
    getDetails: function() {
        const lp = 2551443; 
        const now = new Date();
        const newMoon = new Date('1970-01-07T20:35:00Z');
        const phase = ((now.getTime() - newMoon.getTime()) / 1000) % lp;
        const p = Math.floor(phase / (24 * 3600)) + 1;
        if (p < 2) return { f: "Lua Nova", i: "🌑", d: "Repouso e planeamento." };
        if (p < 8) return { f: "Lua Crescente", i: "🌒", d: "Ideal para semear e plantar frutos." };
        if (p < 15) return { f: "Lua Cheia", i: "🌕", d: "Seiva no topo! Bom para colheitas." };
        if (p < 22) return { f: "Lua Minguante", i: "🌘", d: "Podas e controlo de pragas." };
        return { f: "Lua Nova", i: "🌑", d: "Fase de limpeza." };
    }
};

const ui = {
    view: 'dash',
    expandedZones: new Set(),
    expandedBookCats: new Set(),
    expandedWikiCats: new Set(),
    nav: function(v, btn) {
    this.view = v;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${v}`).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
        document.getElementById('search-box').style.display = (v === 'config') ? 'none' : 'block';
        document.getElementById('scroll-area').scrollTop = 0;
        this.render();
    },

    modal: async function(id, show) {
        const m = document.getElementById(id);
        m.style.display = show ? 'flex' : 'none';
        if(id === 'modal-planta' && show) {
            const [zs, ws] = await Promise.all([db.zonas.toArray(), db.wiki.toArray()]);
            document.getElementById('p-zona').innerHTML = zs.map(z => `<option value="${z.id}">${z.nome}</option>`).join('') || '<option>Crie zonas primeiro nas Config!</option>';
            document.getElementById('p-nome').innerHTML = ws.map(w => `<option value="${w.especie}">${w.especie}</option>`).join('') || '<option>Adicione espécies na Wiki primeiro!</option>';
            document.getElementById('p-data').valueAsDate = new Date();
        }
    },

    render: async function() {
        const s = document.getElementById('globalSearch').value.toLowerCase();
        if(this.view === 'dash') this.drawDash();
        if(this.view === 'horta') this.drawHorta(s);
        if(this.view === 'wiki') this.drawWiki(s);
        if(this.view === 'book') this.drawBook(s);
        if(this.view === 'config') this.drawConfig();
    },

    drawDash: async function() {
        const [ps, ws] = await Promise.all([db.plantas.toArray(), db.wiki.toArray()]);
        const lua = lunar.getDetails();
        let html = `
            <div class="card-lunar"><span style="font-size:2.5rem">${lua.i}</span><div><h4 style="color:#ffeb3b;margin:0">${lua.f}</h4><p style="margin:2px 0 0;font-size:0.8rem;opacity:0.9">${lua.d}</p></div></div>
            <div class="card-sauda"><div><h2 style="margin:0;font-size:1.2rem">Olá, Jota! 👋</h2><p style="margin:5px 0 0;font-size:0.9rem;opacity:0.9">Tens <b>${ps.length}</b> cultivos ativos na horta.</p></div><span style="font-size:2rem;opacity:0.3">🌿</span></div>
            <h3 style="margin:25px 5px 15px; font-size:1rem; color:var(--p)">🚀 Alertas de Colheita</h3>
        `;
        let count = 0;
        ps.forEach(p => {
            const w = ws.find(x => x.especie.toLowerCase() === p.variedade.toLowerCase());
            if(w) {
                const col = new Date(p.data); col.setDate(col.getDate() + parseInt(w.tempo));
                const diff = Math.ceil((col - new Date().setHours(0,0,0,0)) / 86400000);
                if(diff <= 15) {
                    count++;
                    const cor = diff <= 0 ? '#e74c3c' : (diff <= 5 ? '#f39c12' : 'var(--p)');
                    html += `<div class="card" style="border-left:6px solid ${cor}; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                        <div><b>${p.variedade}</b><br><small style="opacity:0.6">${p.data}</small></div>
                        <b style="color:${cor}; font-size:0.8rem">${diff <= 0 ? 'COLHER!' : 'Em '+diff+' dias'}</b></div>`;
                }
            }
        });
        document.getElementById('page-dash').innerHTML = html + (count === 0 ? '<p style="text-align:center;opacity:0.5;margin-top:20px">Sem colheitas para breve.</p>' : '');
    },

    drawHorta: async function(s) {
    const [ps, zs, ws] = await Promise.all([db.plantas.toArray(), db.zonas.toArray(), db.wiki.toArray()]);
    let html = "";
    
    zs.forEach(z => {
        const fil = ps.filter(p => p.zonaId == z.id && p.variedade.toLowerCase().includes(s));
        
        if(fil.length > 0) {
            const isOpen = ui.expandedZones.has(z.id);
            
            // Título da Zona Clicável
            html += `
                <div onclick="logic.toggleZone(${z.id})" style="display:flex; justify-content:space-between; align-items:center; margin:25px 5px 10px; cursor:pointer;">
                    <h4 style="margin:0; color:var(--p); display:flex; align-items:center; gap:8px;">
                        <span>📍</span> ${z.nome} 
                        <small style="font-weight:normal; opacity:0.5; font-size:0.8rem;">(${fil.length})</small>
                    </h4>
                    <span style="transition:0.3s; transform: rotate(${isOpen ? '90deg' : '0deg'}); opacity:0.5;">▶</span>
                </div>
            `;
            
            // Conteúdo da Zona (Só renderiza se estiver aberto)
            if (isOpen) {
                fil.forEach(p => {
                    const w = ws.find(x => x.especie.toLowerCase() === p.variedade.toLowerCase());
                    const dias = Math.floor((new Date() - new Date(p.data)) / 86400000);
                    html += `
                        <div class="card" style="animation: fadeIn 0.2s ease-out;">
                            <div style="display:flex;justify-content:space-between">
                                <b>${p.variedade}</b>
                                <button onclick="event.stopPropagation(); logic.del('plantas', ${p.id})" style="border:none;background:none;color:red;font-weight:bold;padding:5px">✕</button>
                            </div>
                            <div style="display:flex; gap:15px; margin-top:5px;">
                                <small>⏳ ${dias} dias</small>
                                <small style="color:var(--p)">🌡️ ${w ? w.temp : '--'}</small>
                            </div>
                            ${p.nota ? `<p style="margin:10px 0 0; font-size:0.85rem; padding:10px; background:rgba(0,0,0,0.03); border-radius:10px; font-style:italic">"${p.nota}"</p>` : ''}
                        </div>`;
                });
            }
        }
    });
    
    document.getElementById('draw-horta').innerHTML = html || '<p style="text-align:center;padding:40px;opacity:0.5">Horta vazia ou sem resultados.</p>';
},

    drawWiki: async function(s) {
    const data = await db.wiki.toArray();
    const filtered = data.filter(i => i.especie.toLowerCase().includes(s));
    const categorias = [...new Set(filtered.map(i => i.categoria || "Outros"))];
    
    let html = "";
    categorias.forEach(cat => {
        const plantasDaCat = filtered.filter(i => (i.categoria || "Outros") === cat);
        const isOpen = ui.expandedWikiCats.has(cat);

        // Cabeçalho da categoria (mantém-se igual)
        html += `
            <div onclick="logic.toggleWikiCat('${cat}')" style="display:flex; justify-content:space-between; align-items:center; margin:20px 5px 10px; cursor:pointer; border-bottom: 2px solid var(--p); padding-bottom: 5px;">
                <h4 style="margin:0; color:var(--txt); font-size:1rem;">${cat} <small style="opacity:0.5">(${plantasDaCat.length})</small></h4>
                <span style="transition:0.3s; transform: rotate(${isOpen ? '90deg' : '0deg'});">▶</span>
            </div>
        `;

        if (isOpen) {
            plantasDaCat.forEach(i => {
                // --- NOVA ESTRUTURA PROFISSIONAL ---
                html += `
                    <div class="card">
                        <div class="card-info">
                            <span class="card-title">${i.especie}</span>
                            <div class="card-details">
                                <span>⏱️ ${i.tempo} dias</span>
                                <span>🌡️ ${i.temp}</span>
                            </div>
                            ${i.info ? `<p style="font-size:0.8rem; margin:10px 0 0; opacity:0.8; line-height:1.4;">${i.info}</p>` : ''}
                        </div>

                        <div class="card-actions">
                            <button onclick="event.stopPropagation(); logic.editWiki(${i.id})" class="btn-action edit" title="Editar">✏️</button>
                            <button onclick="event.stopPropagation(); logic.del('wiki', ${i.id})" class="btn-action del" title="Apagar">✕</button>
                        </div>
                    </div>`;
            });
        }
    });

    document.getElementById('draw-wiki').innerHTML = html || '<p style="text-align:center; padding:40px; opacity:0.5;">A tua Wiki está vazia.</p>';
},


    drawBook: async function(s) {
    const data = await db.book.toArray();
    // Filtrar primeiro pela pesquisa
    const filtered = data.filter(i => 
        i.titulo.toLowerCase().includes(s) || 
        i.conteudo.toLowerCase().includes(s) ||
        i.categoria.toLowerCase().includes(s)
    );

    // Obter categorias únicas presentes nos dados filtrados
    const categorias = [...new Set(filtered.map(i => i.categoria))];
    
    let html = "";
    categorias.forEach(cat => {
        const notasDaCat = filtered.filter(i => i.categoria === cat);
        const isOpen = ui.expandedBookCats.has(cat);

        // Cabeçalho da categoria (mantém-se)
        html += `
            <div onclick="logic.toggleBookCat('${cat}')" style="display:flex; justify-content:space-between; align-items:center; margin:20px 5px 10px; cursor:pointer; background:rgba(0,0,0,0.02); padding:10px; border-radius:12px;">
                <h4 style="margin:0; color:var(--p); display:flex; align-items:center; gap:8px; font-size:1rem;">📂 ${cat} <small style="font-weight:normal; opacity:0.5; font-size:0.8rem;">(${notasDaCat.length})</small></h4>
                <span style="transition:0.3s; transform: rotate(${isOpen ? '90deg' : '0deg'}); opacity:0.5;">▶</span>
            </div>
        `;

        if (isOpen) {
            notasDaCat.forEach(i => {
                // --- NOVA ESTRUTURA PROFISSIONAL ---
                html += `
                    <div class="card" style="border-left: 4px solid var(--p);">
                        <div class="card-info">
                            <span class="card-title">${i.titulo}</span>
                            <p style="font-size:0.9rem; margin:0; opacity:0.8; line-height:1.4;">${i.conteudo}</p>
                        </div>

                        <div class="card-actions">
                            <button onclick="event.stopPropagation(); logic.editBook(${i.id})" class="btn-action edit" title="Editar">✏️</button>
                            <button onclick="event.stopPropagation(); logic.del('book', ${i.id})" class="btn-action del" title="Apagar">✕</button>
                        </div>
                    </div>`;
            });
        }
    });

    document.getElementById('draw-book').innerHTML = html || '<p style="text-align:center; padding:40px; opacity:0.5;">Nenhuma nota encontrada.</p>';
},

    drawConfig: async function() {
        const zs = await db.zonas.toArray();
        document.getElementById('draw-zonas').innerHTML = zs.map(z => `<div class="card" style="display:flex;justify-content:space-between;padding:15px"><span>${z.nome}</span><button onclick="logic.del('zonas', ${z.id})" style="border:none;background:none;color:red">✕</button></div>`).join('');
    }
};

const logic = {
    savePlanta: async function() {
        const p = { variedade: document.getElementById('p-nome').value, data: document.getElementById('p-data').value, zonaId: parseInt(document.getElementById('p-zona').value), nota: document.getElementById('p-nota').value };
        if(!p.variedade || !p.zonaId) return alert("Erro: Verifica se tens Zonas e Wiki criadas!");
        await db.plantas.add(p); ui.modal('modal-planta', false); ui.render();
    },
    saveWiki: async function() {
    const id = document.getElementById('w-edit-id').value;
    const w = { 
        especie: document.getElementById('w-nome').value, 
        categoria: document.getElementById('w-cat').value,
        tempo: parseInt(document.getElementById('w-dias').value), 
        temp: document.getElementById('w-temp').value, 
        info: document.getElementById('w-info').value 
    };

    if(id) {
        await db.wiki.update(parseInt(id), w);
        document.getElementById('w-edit-id').value = ""; // Limpar após editar
    } else {
        await db.wiki.add(w);
    }
    
    ui.modal('modal-wiki', false);
    document.querySelector('#modal-wiki .btn-main').innerText = "Guardar na Wiki"; // Reset botão
    ui.render();
},

saveBook: async function() {
    const id = document.getElementById('b-edit-id').value;
    const b = { 
        titulo: document.getElementById('b-tit').value, 
        categoria: document.getElementById('b-cat').value, 
        conteudo: document.getElementById('b-txt').value 
    };

    if(id) {
        await db.book.update(parseInt(id), b);
        document.getElementById('b-edit-id').value = "";
    } else {
        await db.book.add(b);
    }

    ui.modal('modal-book', false);
    document.querySelector('#modal-book .btn-main').innerText = "Guardar";
    ui.render();
    },
    toggleBookCat: function(cat) {
        if (ui.expandedBookCats.has(cat)) {
            ui.expandedBookCats.delete(cat);
        } else {
            ui.expandedBookCats.add(cat);
        }
        ui.render();
    },
    editWiki: async function(id) {
        const item = await db.wiki.get(id);
        document.getElementById('w-edit-id').value = id;
        document.getElementById('w-nome').value = item.especie;
        document.getElementById('w-cat').value = item.categoria || "☀️ Hortícolas de Verão";
        document.getElementById('w-dias').value = item.tempo;
        document.getElementById('w-temp').value = item.temp;
        document.getElementById('w-info').value = item.info;
        
        ui.modal('modal-wiki', true);
        // Mudar o texto do botão para indicar edição
        document.querySelector('#modal-wiki .btn-main').innerText = "Atualizar Espécie";
    },

    editBook: async function(id) {
        const item = await db.book.get(id);
        document.getElementById('b-edit-id').value = id;
        document.getElementById('b-tit').value = item.titulo;
        document.getElementById('b-cat').value = item.categoria;
        document.getElementById('b-txt').value = item.conteudo;
        
        ui.modal('modal-book', true);
        document.querySelector('#modal-book .btn-main').innerText = "Atualizar Nota";
    },
    addZona: async function() {
        const n = document.getElementById('z-input').value;
        if(n) { await db.zonas.add({ nome: n }); document.getElementById('z-input').value = ""; ui.render(); }
    },
    del: async function(t, id) {
        if(confirm("Apagar permanentemente?")) { await db[t].delete(id); ui.render(); }
    },
    toggleWikiCat: function(cat) {
        ui.expandedWikiCats.has(cat) ? ui.expandedWikiCats.delete(cat) : ui.expandedWikiCats.add(cat);
        ui.render();
    },

    toggleZone: function(id) {
        if (ui.expandedZones.has(id)) {
            ui.expandedZones.delete(id);
        } else {
            ui.expandedZones.add(id);
        }
        ui.render(); // Redesenha a aba Horta com a zona aberta/fechada
    },

    toggleTheme: async function() {
        document.body.classList.toggle('dark');
        await db.config.put({ id: 'theme', val: document.body.classList.contains('dark') });
    },
    export: async function() {
        const data = {};
        for(const t of ['zonas','wiki','plantas','book']) data[t] = await db[t].toArray();
        const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `jotagarden_backup.json`; a.click();
    },
    import: function(e) {
        const fr = new FileReader();
        fr.onload = async (ev) => {
            const data = JSON.parse(ev.target.result);
            for(const t in data) { await db[t].clear(); await db[t].bulkAdd(data[t]); }
            location.reload();
        };
        fr.readAsText(e.target.files[0]);
    }
};

window.onload = async () => {
    const cfg = await db.config.get('theme');
    if(cfg?.val) document.body.classList.add('dark');
    ui.render();
};
