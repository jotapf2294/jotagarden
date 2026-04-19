const lunar = {
    getDetails: function() {
        const lp = 2551443; 
        const now = new Date();
        const newMoon = new Date('1970-01-07T20:35:00Z');
        const phase = ((now.getTime() - newMoon.getTime()) / 1000) % lp;
        const p = Math.floor(phase / (24 * 3600)) + 1;
        if (p < 2) return { f: "Lua Nova", i: "🌑", d: "Repouso: Planeie a sua semana." };
        if (p < 8) return { f: "Crescente", i: "🌒", d: "Ideal para Folhas e Frutos." };
        if (p < 15) return { f: "Lua Cheia", i: "🌕", d: "Força total na seiva! Semear." };
        if (p < 22) return { f: "Minguante", i: "🌘", d: "Ideal para Raízes e Podas." };
        return { f: "Lua Nova", i: "🌑", d: "Fase de limpeza." };
    }
};

const ui = {
    view: 'dash',
    nav: function(v, btn) {
        this.view = v;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${v}`).classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('search-box').style.display = (v==='config') ? 'none' : 'block';
        this.render();
    },

    modal: async function(id, show) {
        const m = document.getElementById(id);
        m.style.display = show ? 'flex' : 'none';
        if(id === 'modal-planta' && show) {
            const [zs, ws] = await Promise.all([db.zonas.toArray(), db.wiki.toArray()]);
            document.getElementById('p-zona').innerHTML = zs.map(z => `<option value="${z.id}">${z.nome}</option>`).join('');
            document.getElementById('p-nome').innerHTML = `<option value="">Selecionar da Wiki...</option>` + 
                ws.map(w => `<option value="${w.especie}">${w.especie}</option>`).join('');
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
            <div class="card-lunar"><span>${lua.i}</span><div><h4>${lua.f}</h4><p>${lua.d}</p></div></div>
            <div class="card-sauda"><div><h2>Olá, Jota! 👋</h2><p>Tens <b>${ps.length}</b> cultivos ativos.</p></div></div>
            <h3 style="margin:20px 5px 10px;">🚀 Próximas Colheitas</h3>
        `;
        let alertas = 0;
        ps.forEach(p => {
            const w = ws.find(x => x.especie.toLowerCase() === p.variedade.toLowerCase());
            if(w) {
                const col = new Date(p.data); col.setDate(col.getDate() + parseInt(w.tempo));
                const diff = Math.ceil((col - new Date().setHours(0,0,0,0)) / 86400000);
                if(diff <= 15) {
                    alertas++;
                    const cor = diff <= 0 ? '#e74c3c' : (diff <= 5 ? '#f39c12' : 'var(--p)');
                    html += `<div class="card" style="border-left:6px solid ${cor}; padding:15px;">
                        <b>${p.variedade}</b><br><small>${diff <= 0 ? 'COLHER AGORA!' : 'Faltam '+diff+' dias'}</small></div>`;
                }
            }
        });
        document.getElementById('page-dash').innerHTML = html + (alertas===0 ? '<p style="opacity:0.5;text-align:center">Sem alertas.</p>':'');
    },

    drawHorta: async function(s) {
        const [ps, zs, ws] = await Promise.all([db.plantas.toArray(), db.zonas.toArray(), db.wiki.toArray()]);
        let html = "";
        zs.forEach(z => {
            const fil = ps.filter(p => p.zonaId == z.id && p.variedade.toLowerCase().includes(s));
            if(fil.length > 0) {
                html += `<h4 style="color:var(--p); margin:20px 5px 10px;">📍 ${z.nome}</h4>`;
                fil.forEach(p => {
                    const w = ws.find(x => x.especie.toLowerCase() === p.variedade.toLowerCase());
                    const dias = Math.floor((new Date() - new Date(p.data)) / 86400000);
                    html += `<div class="card" style="padding:18px;">
                        <div style="display:flex; justify-content:space-between">
                            <b>${p.variedade}</b>
                            <button onclick="logic.del('plantas', ${p.id})" style="border:none; color:red; background:none">✕</button>
                        </div>
                        <small>⏳ ${dias} dias | 🌡️ ${w ? w.temp : '--'}</small>
                        ${p.nota ? `<p style="font-size:0.8rem; font-style:italic; margin-top:8px; opacity:0.7">"${p.nota}"</p>` : ''}
                    </div>`;
                });
            }
        });
        document.getElementById('draw-horta').innerHTML = html || '<p style="text-align:center">Sem plantas.</p>';
    },

    drawWiki: async function(s) {
        const data = await db.wiki.filter(i => i.especie.toLowerCase().includes(s)).toArray();
        document.getElementById('draw-wiki').innerHTML = data.map(i => `
            <div class="card"><div style="display:flex; justify-content:space-between"><b>${i.especie}</b>
            <button onclick="logic.del('wiki', ${i.id})" style="border:none; color:red; background:none">✕</button></div>
            <small>⏱️ ${i.tempo} dias | 🌡️ ${i.temp}</small></div>`).join('');
    },

    drawBook: async function(s) {
        const data = await db.book.filter(i => i.titulo.toLowerCase().includes(s)).toArray();
        document.getElementById('draw-book').innerHTML = data.map(i => `
            <div class="card"><small style="color:var(--p)">${i.categoria}</small>
            <div style="display:flex; justify-content:space-between"><b>${i.titulo}</b>
            <button onclick="logic.del('book', ${i.id})" style="border:none; color:red; background:none">✕</button></div>
            <p style="font-size:0.9rem; margin-top:8px">${i.conteudo}</p></div>`).join('');
    },

    drawConfig: async function() {
        const zs = await db.zonas.toArray();
        document.getElementById('draw-zonas').innerHTML = zs.map(z => `
            <div class="card" style="display:flex; justify-content:space-between; padding:12px">${z.nome}
            <button onclick="logic.del('zonas', ${z.id})" style="border:none; color:red; background:none">✕</button></div>`).join('');
    }
};

const logic = {
    savePlanta: async function() {
        const p = { variedade: document.getElementById('p-nome').value, data: document.getElementById('p-data').value, zonaId: parseInt(document.getElementById('p-zona').value), nota: document.getElementById('p-nota').value };
        if(!p.variedade || !p.zonaId) return alert("Preencha os dados e crie Zonas!");
        await db.plantas.add(p); ui.modal('modal-planta', false); ui.render();
    },
    saveWiki: async function() {
        const w = { especie: document.getElementById('w-nome').value, tempo: parseInt(document.getElementById('w-dias').value), temp: document.getElementById('w-temp').value, info: document.getElementById('w-info').value };
        if(!w.especie || !w.tempo) return;
        await db.wiki.add(w); ui.modal('modal-wiki', false); ui.render();
    },
    saveBook: async function() {
        const b = { titulo: document.getElementById('b-tit').value, categoria: document.getElementById('b-cat').value, conteudo: document.getElementById('b-txt').value };
        await db.book.add(b); ui.modal('modal-book', false); ui.render();
    },
    addZona: async function() {
        const n = document.getElementById('z-input').value;
        if(n) await db.zonas.add({ nome: n });
        document.getElementById('z-input').value = ""; ui.render();
    },
    del: async function(t, id) {
        if(confirm("Apagar?")) { await db[t].delete(id); ui.render(); }
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
