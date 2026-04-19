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

    render: async function() {
        const search = document.getElementById('globalSearch').value.toLowerCase();
        
        if(this.view === 'inicio') this.drawDash();
        if(this.view === 'horta') this.drawHorta(search);
        if(this.view === 'wiki') this.drawWiki(search);
        if(this.view === 'book') this.drawBook(search);
        if(this.view === 'config') this.drawConfig();
    },

    drawDash: async function() {
        const ps = await db.plantas.toArray();
        const ws = await db.wiki.toArray();
        const bk = await db.book.toArray();
        const lua = lunar.getDetails();
        let html = `
            <div class="card" style="background: linear-gradient(135deg, #2c3e50, #000); color: #fff; border:none;">
                <div style="display:flex; align-items:center; gap:15px;">
                    <span style="font-size:2.5rem">${lua.i}</span>
                    <div>
                        <h4 style="margin:0; color:#ffeb3b;">${lua.f}</h4>
                        <p style="margin:0; font-size:0.85rem; opacity:0.9;">${lua.d}</p>
                    </div>
                </div>
            </div>

            <div class="card" style="background: linear-gradient(135deg, #2c3e50, #000); color: #fff; border:none;">
                <div style="display:flex; align-items:center; gap:15px;">
                <h2>Olá, Jota! 👋</h2>
                <p>Tens ${ps.length} cultivos em curso.</p>
            </div>`;
        
        // Alertas de Colheita
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        ps.forEach(p => {
            const w = ws.find(x => x.especie.toLowerCase() === p.variedade.toLowerCase());
            if(w) {
                const col = new Date(p.data); col.setDate(col.getDate() + w.tempo);
                const diff = Math.ceil((col - hoje) / (86400000));
                if(diff <= 7 && diff >= 0) {
                    html += `<div class="card" style="border-left:5px solid var(--a)">
                        <b>🍎 Colheita Próxima:</b> ${p.variedade}<br><small>Faltam ${diff} dias</small></div>`;
                }
            }
        });
        document.getElementById('page-dash').innerHTML = html;
    },

    drawHorta: async function(s) {
        const [ps, zs, ws] = await Promise.all([db.plantas.toArray(), db.zonas.toArray(), db.wiki.toArray()]);
        let html = "";
        zs.forEach(z => {
            const fil = ps.filter(p => p.zonaId == z.id && p.variedade.toLowerCase().includes(s));
            if(fil.length > 0 || (s==='' && zs.length > 0)) {
                html += `<h4 style="color:var(--p); margin:20px 0 10px 5px;">📍 ${z.nome}</h4>`;
                fil.forEach(p => {
                    const dias = Math.floor((new Date() - new Date(p.data)) / 86400000);
                    html += `<div class="card" style="display:flex; justify-content:space-between; align-items:center;">
                        <div><b>${p.variedade}</b><br><small>⏳ ${dias} dias de vida</small></div>
                        <button onclick="logic.del('plantas', ${p.id})" style="border:none; background:none; color:red; padding:10px;">✕</button>
                    </div>`;
                });
            }
        });
        document.getElementById('draw-horta').innerHTML = html || '<p style="text-align:center; opacity:0.5;">Nada encontrado.</p>';
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
        savePlanta: async function() {
        const v = document.getElementById('p-nome').value;
        const z = document.getElementById('p-zona').value;
        const d = document.getElementById('p-data').value;
        
        if(!v) return alert("Escreve o nome da planta!");
        if(!z) return alert("Cria primeiro uma Zona nas Definições!");

        try {
            await db.plantas.add({ 
                variedade: v, 
                zonaId: parseInt(z), 
                data: d, 
                nota: document.getElementById('p-nota').value 
            });
            
            // Limpar campos
            document.getElementById('p-nome').value = "";
            document.getElementById('p-nota').value = "";
            
            ui.modal('modal-planta', false); 
            ui.render();
        } catch (err) {
            console.error("Erro ao salvar:", err);
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
