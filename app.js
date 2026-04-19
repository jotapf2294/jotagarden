const ui = {
    view: 'inicio',
    
    nav: function(v, btn) {
        this.view = v;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${v}`).classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('search-container').style.display = (v === 'config') ? 'none' : 'block';
        document.getElementById('view-title').innerText = v.toUpperCase();
        this.render();
    },

    modal: async function(id, show) {
        const m = document.getElementById(id);
        m.style.display = show ? 'flex' : 'none';
        if(id === 'modal-planta' && show) {
            const zs = await db.zonas.toArray();
            document.getElementById('p-zona').innerHTML = zs.map(z => `<option value="${z.id}">${z.nome}</option>`).join('');
            document.getElementById('p-data').valueAsDate = new Date();
        }
    },
    
    toggleTheme: async function() {
    // 1. Alterna a classe no HTML
    document.body.classList.toggle('dark');
    
    // 2. Verifica se ficou dark ou não
    const isDark = document.body.classList.contains('dark');
    
    // 3. Guarda na base de dados para não perderes a escolha ao fechar
    await db.config.put({ id: 'theme', val: isDark });
    
    console.log("Dark Mode ativo:", isDark);
    },

        render: async function() {
        const page = document.querySelector('.page.active').id;
        const search = document.getElementById('globalSearch').value.toLowerCase();

        if(page === 'page-dash') await this.drawDash();
        if(page === 'page-horta') await this.drawHorta(search);
        if(page === 'page-wiki') await this.drawWiki(search);
        if(page === 'page-book') await this.drawBook(search);
        if(page === 'page-config') await this.drawConfig();
    },

    drawDash: async function() {
    // 1. Puxar todos os dados necessários
    const [ps, ws] = await Promise.all([
        db.plantas.toArray(),
        db.wiki.toArray()
    ]);
    const lua = lunar.getDetails(); 

    // 2. Cabeçalho e Widget Lunar
    let html = `
        <div class="card-lunar">
            <span>${lua.i}</span>
            <div>
                <h4>${lua.f}</h4>
                <p>${lua.d}</p>
            </div>
        </div>

        <div class="card-sauda-mini">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h2 style="margin:0; font-size:1.2rem;">Olá, Jota! 👋</h2>
                    <p style="margin:5px 0 0 0; font-size:0.9rem; opacity:0.9;">Tens <b>${ps.length}</b> cultivos ativos.</p>
                </div>
                <span style="font-size:1.8rem; opacity:0.4;">🌿</span>
            </div>
        </div>
        
        <h3 style="margin: 20px 0 10px 5px; font-size: 1rem; color: var(--p);">🚀 Próximas Colheitas</h3>
    `;

    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    let alertasEncontrados = 0;

    // 3. Lógica de Cruzamento de Dados (Horta + Wiki)
    ps.forEach(p => {
        // Match robusto: remove espaços e ignora maiúsculas
        const especieWiki = ws.find(w => w.especie.trim().toLowerCase() === p.variedade.trim().toLowerCase());

        if (especieWiki) {
            const dataPlantio = new Date(p.data);
            const dataColheita = new Date(dataPlantio);
            dataColheita.setDate(dataColheita.getDate() + parseInt(especieWiki.tempo));

            const diffTempo = dataColheita - hoje;
            const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

            // Mostra alertas de colheita para os próximos 30 dias (ou se já passou)
            if (diffDias <= 30) {
                alertasEncontrados++;
                const jaPassou = diffDias <= 0;
                const cor = jaPassou ? '#e74c3c' : (diffDias <= 7 ? '#f39c12' : 'var(--p)');
                
                html += `
                    <div class="card" style="border-left: 6px solid ${cor}; padding: 15px; margin-bottom: 10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <b style="font-size:1rem;">${p.variedade}</b><br>
                                <small style="opacity:0.7;">Plantado em: ${dataPlantio.toLocaleDateString()}</small>
                            </div>
                            <div style="text-align:right;">
                                <span style="color:${cor}; font-weight:bold; font-size:0.8rem;">
                                    ${jaPassou ? 'PRONTO A COLHER!' : `Faltam ${diffDias} dias`}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    });

    if (alertasEncontrados === 0) {
        html += `<div class="card" style="text-align:center; opacity:0.6; font-size:0.85rem; padding:30px;">
                    Nenhuma colheita prevista com base nos dados da Wiki.
                 </div>`;
    }

    document.getElementById('page-dash').innerHTML = html;
},

    drawHorta: async function(s) {
    const [ps, zs, ws] = await Promise.all([
        db.plantas.toArray(), 
        db.zonas.toArray(), 
        db.wiki.toArray()
    ]);
    
    let html = "";
    
    zs.forEach(z => {
        const fil = ps.filter(p => p.zonaId == z.id && p.variedade.toLowerCase().includes(s));
        
        if(fil.length > 0) {
            html += `<h4 style="color:var(--p); margin:25px 0 12px 5px; font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                        <span>📍</span> ${z.nome}
                     </h4>`;
            
            fil.forEach(p => {
                const wikiInfo = ws.find(w => w.especie.trim().toLowerCase() === p.variedade.trim().toLowerCase());
                const dias = Math.floor((new Date() - new Date(p.data)) / 86400000);
                const tempIdeal = wikiInfo ? wikiInfo.temp : "--";
                
                html += `
                    <div class="card" style="padding: 18px; margin-bottom: 12px;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div style="flex:1;">
                                <b style="font-size:1.1rem; display:block; margin-bottom:6px;">${p.variedade}</b>
                                
                                <div style="display:flex; gap:12px; align-items:center; margin-bottom:10px;">
                                    <small style="opacity:0.8; display:flex; align-items:center; gap:4px;">
                                        ⏳ ${dias} dias
                                    </small>
                                    <small style="color:var(--p); font-weight:600; display:flex; align-items:center; gap:4px;">
                                        🌡️ ${tempIdeal}
                                    </small>
                                </div>

                                ${p.nota ? `
                                    <div style="background: rgba(0,0,0,0.03); padding: 10px; border-radius: 12px; border-left: 3px solid var(--p);">
                                        <p style="margin:0; font-size:0.85rem; font-style: italic; color: var(--txt); opacity: 0.8;">
                                            " ${p.nota} "
                                        </p>
                                    </div>
                                ` : ''}
                            </div>

                            <button onclick="logic.del('plantas', ${p.id})" 
                                    style="border:none; background:rgba(231, 76, 60, 0.1); color:#e74c3c; width:35px; height:35px; border-radius:10px; font-weight:bold; margin-left:10px;">
                                ✕
                            </button>
                        </div>
                    </div>`;
            });
        }
    });
    
    document.getElementById('draw-horta').innerHTML = html || 
        '<div style="text-align:center; padding:40px; opacity:0.5;">Sem plantas registadas nesta zona.</div>';
},

    drawWiki: async function(s) {
        const data = await db.wiki.filter(i => i.especie.toLowerCase().includes(s)).toArray();
        document.getElementById('draw-wiki').innerHTML = data.map(i => `
            <div class="card">
                <div style="display:flex; justify-content:space-between"><b>${i.especie}</b> 
                <button onclick="logic.del('wiki', ${i.id})" style="border:none; background:none; color:red">✕</button></div>
                <small>⏱️ ${i.tempo} dias | 🌡️ ${i.temp}</small><p style="font-size:0.85rem; margin:8px 0 0 0 opacity:0.8;">${i.info}</p>
            </div>`).join('');
    },

    drawBook: async function(s) {
        const data = await db.book.filter(i => i.titulo.toLowerCase().includes(s) || i.categoria.toLowerCase().includes(s)).toArray();
        document.getElementById('draw-book').innerHTML = data.map(i => `
            <div class="card">
                <span class="badge" style="background:var(--bg); color:var(--p)">${i.categoria}</span>
                <div style="display:flex; justify-content:space-between"><b>${i.titulo}</b>
                <button onclick="logic.del('book', ${i.id})" style="border:none; background:none; color:red">✕</button></div>
                <p style="font-size:0.9rem; white-space:pre-wrap; margin-top:8px;">${i.conteudo}</p>
            </div>`).join('');
    },

    drawConfig: async function() {
        const zs = await db.zonas.toArray();
        document.getElementById('draw-zonas').innerHTML = zs.map(z => `
            <div class="card" style="display:flex; justify-content:space-between; padding:10px; margin-bottom:8px;">
                ${z.nome} <button onclick="logic.del('zonas', ${z.id})" style="color:red; border:none; background:none;">✕</button>
            </div>`).join('');
    }
};

const logic = {
    // ... outras funções ...

    savePlanta: async function() {
        const p = {
            variedade: document.getElementById('p-nome').value,
            data: document.getElementById('p-data').value,
            zonaId: parseInt(document.getElementById('p-zona').value),
            nota: document.getElementById('p-nota').value
        };

        if(!p.variedade || !p.data) return alert("Preenche os campos!");

        await db.plantas.add(p); // Adiciona à base de dados
        ui.modal('modal-planta', false); // Fecha o modal
        
        // --- O SEGREDO ESTÁ AQUI ---
        await ui.render(); // Força o Dashboard e a Horta a atualizarem-se agora!
    },

    del: async function(tabela, id) {
        if(!confirm("Apagar este registo?")) return;
        
        await db[tabela].delete(id); // Apaga da base de dados
        
        // --- E AQUI TAMBÉM ---
        await ui.render(); // Remove o card do ecrã imediatamente
    }
    },

    saveWiki: async function() {
        const e = document.getElementById('w-nome').value;
        const t = document.getElementById('w-dias').value;
        if(!e || !t) return;
        await db.wiki.add({ especie: e, tempo: parseInt(t), temp: document.getElementById('w-temp').value, info: document.getElementById('w-info').value });
        ui.modal('modal-wiki', false); ui.render();
    },
        saveBook: async function() {
        const t = document.getElementById('b-tit').value;
        const c = document.getElementById('b-cat').value;
        const txt = document.getElementById('b-txt').value;

        if(!t || !txt) return alert("Preenche o título e o conteúdo!");

        await db.book.add({ 
            titulo: t, 
            categoria: c, 
            conteudo: txt 
        });

        // Limpar
        document.getElementById('b-tit').value = "";
        document.getElementById('b-txt').value = "";

        ui.modal('modal-book', false); 
        ui.render();
    },

    addZona: async function() {
        const v = document.getElementById('z-input').value;
        if(v) await db.zonas.add({ nome: v });
        document.getElementById('z-input').value = ""; ui.render();
    },
    del: async function(t, id) {
        if(confirm("Apagar registo?")) { await db[t].delete(id); ui.render(); }
    },
    toggleTheme: async function() {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        await db.config.put({ id: 'theme', val: isDark });
    },
    export: async function() {
        const data = {};
        for(const t of ['zonas','wiki','plantas','book']) data[t] = await db[t].toArray();
        const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `backup_horta_${new Date().toISOString().split('T')[0]}.json`; a.click();
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

const lunar = {
    // Calcula a fase da lua (0 a 29.5)
    getPhase: function() {
        const date = new Date();
        const lp = 2551443; // Período lunar em segundos
        const newMoon = new Date('1970-01-07T20:35:00Z'); // Uma lua nova de referência
        const phase = ((date.getTime() - newMoon.getTime()) / 1000) % lp;
        return Math.floor(phase / (24 * 3600)) + 1;
    },

    getDetails: function() {
        const p = this.getPhase();
        if (p < 2)   return { f: "Lua Nova", i: "🌑", d: "Repouso. Evitar semear." };
        if (p < 8)   return { f: "Quarto Crescente", i: "🌒", d: "Ideal para Folhas e Frutos (Salsa, Tomate)." };
        if (p < 15)  return { f: "Lua Cheia", i: "🌕", d: "Semear Flores e Frutos. Muita seiva!" };
        if (p < 22)  return { f: "Quarto Minguante", i: "🌘", d: "Ideal para Raízes (Cenoura, Batata) e Podas." };
        return { f: "Lua Nova", i: "🌑", d: "Fase de limpeza e planeamento." };
    }
};

window.onload = async () => {
    const cfg = await db.config.get('theme');
    if(cfg?.val) document.body.classList.add('dark');
    ui.render();
};
