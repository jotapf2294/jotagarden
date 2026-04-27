const Receitas = {
  atual: null,
  ingCounter: 0,
  passoCounter: 0,

  render() {
    return `
    <div class="tab active">
      <div class="card">
        <h3>📖 Nova Receita</h3>
        <input id="r-nome" placeholder="Nome: Bolo Chocolate">
        <input id="r-foto" type="file" accept="image/*" capture="camera">
        <div class="grid2">
          <select id="r-cat">
            <option>Bolos</option><option>Tartes</option><option>Biscoitos</option>
            <option>Cremes</option><option>Massas</option><option>Sobremesas</option>
            <option>Salgados</option><option>Pães</option>
          </select>
          <input id="r-rend" type="number" placeholder="Rendimento: 12 un">
        </div>
        <div class="grid2">
          <input id="r-tempo" type="number" placeholder="⏱️ Tempo total min">
          <input id="r-validade" type="number" placeholder="Validade: 5 dias">
        </div>
        <input id="r-alergenios" placeholder="Alergénios: glúten, ovo, lactose">
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3>🥚 Ingredientes</h3>
          <button class="btn btn-small btn-rosa" onclick="Receitas.addIng()">+ Ingrediente</button>
        </div>
        <div id="lista-ing"></div>
        <div style="background:#FFF5F8;padding:10px;border-radius:12px;margin-top:10px;font-size:14px">
          <b>Total:</b> <span id="total-peso">0g</span> |
          <b>Custo:</b> <span id="total-custo">0.00€</span> |
          <b>Hidratação:</b> <span id="total-hidrat">0%</span>
        </div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3>📝 Modo Preparação</h3>
          <button class="btn btn-small btn-rosa" onclick="Receitas.addPasso()">+ Passo</button>
        </div>
        <div id="lista-passos"></div>
      </div>

      <button class="btn btn-rosa" id="btn-guardar-receita">💾 Guardar Receita</button>

      <div class="card">
        <input id="busca-receita" placeholder="🔍 Buscar receita..." oninput="Receitas.buscar(this.value)">
      </div>
      <div id="lista-receitas"></div>
      <div id="print-frame" style="position:absolute;left:-9999px;"></div>
    </div>`;
  },

  bind() {
    document.getElementById('btn-guardar-receita').onclick = () => this.save();
    this.addIng(); // começa com 1 ingrediente
    this.addPasso(); // começa com 1 passo
    this.loadLista();
  },

  addIng(data = {}) {
    const id = this.ingCounter++;
    const html = `
      <div class="card" id="ing-${id}" style="padding:12px;margin:8px 0;background:#FFFBFE">
        <div style="display:flex;gap:8px;align-items:center">
          <input type="number" id="ing-qtd-${id}" placeholder="500" style="flex:2" value="${data.qtd||''}" oninput="Receitas.calcTotais()">
          <select id="ing-un-${id}" style="flex:1" onchange="Receitas.calcTotais()">
            <option ${data.unidade==='g'?'selected':''}>g</option>
            <option ${data.unidade==='kg'?'selected':''}>kg</option>
            <option ${data.unidade==='ml'?'selected':''}>ml</option>
            <option ${data.unidade==='L'?'selected':''}>L</option>
            <option ${data.unidade==='un'?'selected':''}>un</option>
            <option ${data.unidade==='colher'?'selected':''}>colher</option>
          </select>
          <input id="ing-nome-${id}" placeholder="farinha T65" style="flex:4" value="${data.produto||''}">
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
          <input type="number" id="ing-preco-${id}" placeholder="2.50€/kg" step="0.01" style="flex:2" value="${data.precoKg||''}" oninput="Receitas.calcTotais()">
          <span id="ing-custo-${id}" style="flex:2;font-size:14px;color:#666">0.00€</span>
          <button class="btn btn-small" style="flex:1;background:#E57373" onclick="document.getElementById('ing-${id}').remove();Receitas.calcTotais()">🗑️</button>
        </div>
      </div>`;
    document.getElementById('lista-ing').insertAdjacentHTML('beforeend', html);
  },

  addPasso(data = {}) {
    const id = this.passoCounter++;
    const html = `
      <div class="card" id="passo-${id}" style="padding:12px;margin:8px 0;background:#FFFBFE">
        <div style="display:flex;gap:8px;align-items:start">
          <span style="font-weight:700;color:#FF6B9D;font-size:18px">${id+1}.</span>
          <textarea id="passo-txt-${id}" rows="2" placeholder="Bater ovos com açúcar..." style="flex:1">${data.texto||''}</textarea>
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:14px">
            <input type="checkbox" id="passo-timer-${id}" ${data.timer?'checked':''}> ⏰ Timer
          </label>
          <input type="number" id="passo-min-${id}" placeholder="min" style="width:80px;display:${data.timer?'block':'none'}" value="${data.min||''}">
          <button class="btn btn-small" style="background:#E57373;margin-left:auto" onclick="document.getElementById('passo-${id}').remove()">🗑️</button>
        </div>
      </div>`;
    document.getElementById('lista-passos').insertAdjacentHTML('beforeend', html);
    document.getElementById(`passo-timer-${id}`).onchange = (e) => {
      document.getElementById(`passo-min-${id}`).style.display = e.target.checked? 'block' : 'none';
    };
  },

  calcTotais() {
    let pesoTotal = 0, custoTotal = 0, pesoFarinha = 0, pesoAgua = 0;
    document.querySelectorAll('[id^=ing-qtd-]').forEach(el => {
      const id = el.id.split('-')[2];
      const qtd = +el.value || 0;
      const un = document.getElementById(`ing-un-${id}`).value;
      const nome = document.getElementById(`ing-nome-${id}`).value.toLowerCase();
      const preco = +document.getElementById(`ing-preco-${id}`).value || 0;

      let pesoG = qtd;
      if (un === 'kg') pesoG = qtd * 1000;
      if (un === 'L') pesoG = qtd * 1000;
      if (un === 'un') pesoG = qtd * 50; // ovo médio
      if (un === 'colher') pesoG = qtd * 15;

      pesoTotal += pesoG;
      if (nome.includes('farinha')) pesoFarinha += pesoG;
      if (nome.includes('agua') || nome.includes('água') || nome.includes('leite')) pesoAgua += pesoG;

      const custo = un === 'g'? qtd/1000*preco : un === 'kg'? qtd*preco : un === 'ml'? qtd/1000*preco : un === 'L'? qtd*preco : qtd*preco;
      custoTotal += custo;
      document.getElementById(`ing-custo-${id}`).textContent = custo.toFixed(2) + '€';
    });

    document.getElementById('total-peso').textContent = pesoTotal.toFixed(0) + 'g';
    document.getElementById('total-custo').textContent = custoTotal.toFixed(2) + '€';
    document.getElementById('total-hidrat').textContent = pesoFarinha > 0? (pesoAgua/pesoFarinha*100).toFixed(0) + '%' : '0%';
  },

  getIng() {
    const ings = [];
    document.querySelectorAll('[id^=ing-qtd-]').forEach(el => {
      const id = el.id.split('-')[2];
      const qtd = +el.value || 0;
      if (qtd === 0) return;
      const unidade = document.getElementById(`ing-un-${id}`).value;
      const produto = document.getElementById(`ing-nome-${id}`).value;
      const precoKg = +document.getElementById(`ing-preco-${id}`).value || 0;
      const custo = unidade === 'g'? qtd/1000*precoKg : unidade === 'kg'? qtd*precoKg : unidade === 'ml'? qtd/1000*precoKg : unidade === 'L'? qtd*precoKg : qtd*precoKg;
      ings.push({qtd, unidade, produto, precoKg, custo});
    });
    return ings;
  },

  getPassos() {
    const passos = [];
    document.querySelectorAll('[id^=passo-txt-]').forEach(el => {
      const id = el.id.split('-')[2];
      const texto = el.value.trim();
      if (!texto) return;
      const temTimer = document.getElementById(`passo-timer-${id}`).checked;
      const min = +document.getElementById(`passo-min-${id}`).value || 0;
      passos.push(texto + (temTimer && min > 0? ` [timer:${min}]` : ''));
    });
    return passos.join('\n');
  },

  async save() {
    const nome = document.getElementById('r-nome').value;
    if (!nome) return App.toast('Nome obrigatório');
    const ing = this.getIng();
    if (ing.length === 0) return App.toast('Adiciona ingredientes');

    const receita = {
      id: this.atual?.id,
      nome,
      cat: document.getElementById('r-cat').value,
      rend: +document.getElementById('r-rend').value || 1,
      tempo: +document.getElementById('r-tempo').value || 0,
      validade: +document.getElementById('r-validade').value || 3,
      alergenios: document.getElementById('r-alergenios').value,
      ing,
      passos: this.getPassos(),
      foto: await this.getFoto(),
      custoTotal: ing.reduce((s,i) => s + i.custo, 0),
      pesoTotal: ing.reduce((s,i) => s + (i.unidade==='g'?i.qtd:i.unidade==='kg'?i.qtd*1000:i.unidade==='ml'?i.qtd:i.unidade==='L'?i.qtd*1000:i.qtd*50), 0)
    };

    await DB.save('receitas', receita);
    App.toast('Receita guardada 🧁');
    this.atual = null;
    document.getElementById('lista-ing').innerHTML = '';
    document.getElementById('lista-passos').innerHTML = '';
    this.ingCounter = 0;
    this.passoCounter = 0;
    this.addIng();
    this.addPasso();
    this.loadLista();
    document.querySelectorAll('#r-nome,#r-rend,#r-tempo,#r-validade,#r-alergenios').forEach(e => e.value = '');
  },

  async getFoto() {
    const file = document.getElementById('r-foto').files[0];
    if (!file) return this.atual?.foto || '';
    return new Promise(res => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.readAsDataURL(file);
    });
  },

  async loadLista(filtro = '') {
    const all = await DB.getAll('receitas');
    const filtradas = filtro? all.filter(r =>
      r.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      r.cat.toLowerCase().includes(filtro.toLowerCase())
    ) : all;

    const lista = document.getElementById('lista-receitas');
    lista.innerHTML = filtradas.map(r => `
      <div class="card" data-id="${r.id}">
        ${r.foto? `<img src="${r.foto}" style="width:100%;border-radius:12px;margin-bottom:8px">` : ''}
        <h3>${r.nome} <span class="badge">${r.cat}</span></h3>
        <p>⏱️ ${r.tempo}min | 🍰 ${r.rend} un | 💰 ${r.custoTotal.toFixed(2)}€ | ${(r.custoTotal/r.rend).toFixed(2)}€/un</p>
        <p>⚖️ ${r.pesoTotal}g | 📅 Val: ${r.validade} dias</p>
        <div class="grid4">
          <button class="btn btn-small" data-action="escalar" data-id="${r.id}" data-fator="0.5">x0.5</button>
          <button class="btn btn-small" data-action="escalar" data-id="${r.id}" data-fator="2">x2</button>
          <button class="btn btn-small" data-action="escalar" data-id="${r.id}" data-fator="3">x3</button>
          <button class="btn btn-small" data-action="escalar" data-id="${r.id}" data-fator="5">x5</button>
        </div>
        <div class="grid2">
          <button class="btn btn-small btn-choco" data-action="ficha" data-id="${r.id}">📋 Ficha</button>
          <button class="btn btn-small btn-choco" data-action="rotulo" data-id="${r.id}">🏷️ Rótulo</button>
        </div>
        <div class="grid2">
          <button class="btn btn-small" data-action="copiar" data-id="${r.id}">📋 Copiar</button>
          <button class="btn btn-small" data-action="del" data-id="${r.id}">🗑️ Apagar</button>
        </div>
      </div>
    `).join('') || '<div class="card">Sem receitas ainda</div>';

    lista.querySelectorAll('button[data-action]').forEach(btn => {
      btn.onclick = (e) => {
        const id = +e.target.dataset.id;
        const action = e.target.dataset.action;
        const fator = +e.target.dataset.fator;
        if (action === 'escalar') this.escalar(id, fator);
        if (action === 'ficha') this.fichaTecnica(id);
        if (action === 'rotulo') this.rotulo(id);
        if (action === 'copiar') this.copiar(id);
        if (action === 'del') this.del(id);
      };
    });
  },

  buscar(termo) {
    this.loadLista(termo);
  },

  async copiar(id) {
    const r = (await DB.getAll('receitas')).find(x => x.id === id);
    this.atual = null;
    document.getElementById('r-nome').value = r.nome + ' - Cópia';
    document.getElementById('r-cat').value = r.cat;
    document.getElementById('r-rend').value = r.rend;
    document.getElementById('r-tempo').value = r.tempo;
    document.getElementById('r-validade').value = r.validade;
    document.getElementById('r-alergenios').value = r.alergenios;

    document.getElementById('lista-ing').innerHTML = '';
    this.ingCounter = 0;
    r.ing.forEach(i => this.addIng(i));

    document.getElementById('lista-passos').innerHTML = '';
    this.passoCounter = 0;
    r.passos.split('\n').forEach(p => {
      const timer = p.match(/\[timer:(\d+)\]/);
      const texto = p.replace(/\[timer:\d+\]/, '').trim();
      this.addPasso({texto, timer:!!timer, min: timer? timer[1] : 0});
    });

    App.toast('Receita copiada - edita e guarda');
    window.scrollTo(0, 0);
  },

  async escalar(id, fator) {
    const r = (await DB.getAll('receitas')).find(x => x.id === id);
    const nova = r.ing.map(i => `${(i.qtd*fator).toFixed(1)}${i.unidade} ${i.produto}`).join('\n');
    alert(`Receita x${fator}:\n\n${nova}\n\nCusto: ${(r.custoTotal*fator).toFixed(2)}€\nPeso: ${(r.pesoTotal*fator).toFixed(0)}g`);
  },

  printHTML(html) {
    const frame = document.getElementById('print-frame');
    frame.innerHTML = `<iframe id="pf" style="width:0;height:0;border:0"></iframe>`;
    const pf = document.getElementById('pf');
    const doc = pf.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      pf.contentWindow.focus();
      pf.contentWindow.print();
    }, 300);
  },

  async fichaTecnica(id) {
    const r = (await DB.getAll('receitas')).find(x => x.id === id);
    const ingLista = r.ing.sort((a,b)=>b.qtd-a.qtd).map(i=>`${i.produto} (${(i.qtd/r.pesoTotal*100).toFixed(1)}%)`).join(', ');
    const kcal100g = 350;
    const lipidos = (kcal100g * 0.3 / 9).toFixed(1);
    const hidratos = (kcal100g * 0.5 / 4).toFixed(1);
    const proteinas = (kcal100g * 0.2 / 4).toFixed(1);
    const sal = (r.ing.find(i => i.produto.toLowerCase().includes('sal'))?.qtd / r.pesoTotal * 100 || 0.5).toFixed(2);

    const html = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"><title>FT - ${r.nome}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        * { box-sizing: border-box; }
        body{font-family:'Arial',sans-serif;color:#1a1a1a;font-size:11pt;line-height:1.4;margin:0}
       .header{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #5D4037;padding-bottom:10px;margin-bottom:15px}
       .logo{font-size:28px;font-weight:900;color:#FF6B9D}
       .doc-title{text-align:right;font-size:10pt;color:#666}
       .doc-title h1{margin:0;font-size:18pt;color:#5D4037}
       .grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin:15px 0}
       .box{border:2px solid #5D4037;border-radius:8px;padding:12px}
       .box-title{background:#5D4037;color:#fff;margin:-12px -12px 10px -12px;padding:8px 12px;font-weight:700;font-size:10pt;text-transform:uppercase}
        table{width:100%;border-collapse:collapse;font-size:10pt}
        th{background:#FFF5F8;border:1px solid #5D4037;padding:6px;text-align:left;font-weight:700}
        td{border:1px solid #ccc;padding:6px}
       .ing-list{columns:2;column-gap:20px;font-size:10pt}
       .nut-table td:nth-child(2){text-align:right;font-weight:700}
       .alergenios{background:#FFEBEE;border:2px solid #E57373;padding:10px;margin:10px 0;font-weight:700;text-align:center}
       .footer{position:fixed;bottom:15mm;left:15mm;right:15mm;font-size:9pt;color:#666;border-top:1px solid #ccc;padding-top:8px;display:flex;justify-content:space-between}
       .assinatura{margin-top:30px;border-top:1px solid #000;width:250px;padding-top:5px;font-size:9pt}
      </style></head><body>
      <div class="header">
        <div class="logo">🧁 BABE'S BAKERY</div>
        <div class="doc-title">
          <h1>FICHA TÉCNICA</h1>
          <div>Ref: FT-${r.id.toString().slice(-6)}</div>
          <div>Rev: 01 | ${new Date().toLocaleDateString('pt-PT')}</div>
        </div>
      </div>
      <div class="box">
        <div class="box-title">1. IDENTIFICAÇÃO DO PRODUTO</div>
        <table>
          <tr><th style="width:25%">Denominação</th><td colspan="3"><b>${r.nome}</b></td></tr>
          <tr><th>Categoria</th><td>${r.cat}</td><th>Código Interno</th><td>BB-${r.id.toString().slice(-4)}</td></tr>
          <tr><th>Rendimento</th><td>${r.rend} unidades</td><th>Peso/Unidade</th><td>${(r.pesoTotal/r.rend).toFixed(0)}g</td></tr>
          <tr><th>Peso Total</th><td>${r.pesoTotal}g</td><th>Validade</th><td>${r.validade} dias após produção</td></tr>
        </table>
      </div>
      <div class="grid">
        <div class="box">
          <div class="box-title">2. CUSTO & PRODUÇÃO</div>
          <table>
            <tr><th>Tempo Prep</th><td>${r.tempo} minutos</td></tr>
            <tr><th>Custo Matéria-Prima</th><td>${r.custoTotal.toFixed(2)}€</td></tr>
            <tr><th>Custo/Unidade</th><td>${(r.custoTotal/r.rend).toFixed(2)}€</td></tr>
            <tr><th>PVP Sugerido +300%</th><td><b>${(r.custoTotal/r.rend*4).toFixed(2)}€</b></td></tr>
          </table>
        </div>
        <div class="box">
          <div class="box-title">3. INFORMAÇÃO NUTRICIONAL</div>
          <div style="font-size:9pt;margin-bottom:5px">Valores médios por 100g de produto:</div>
          <table class="nut-table">
            <tr><th>Energia</th><td>${kcal100g.toFixed(0)} kcal</td></tr>
            <tr><th>Lípidos</th><td>${lipidos}g</td></tr>
            <tr><th>dos quais saturados</th><td>${(lipidos*0.4).toFixed(1)}g</td></tr>
            <tr><th>Hidratos Carbono</th><td>${hidratos}g</td></tr>
            <tr><th>dos quais açúcares</th><td>${(hidratos*0.6).toFixed(1)}g</td></tr>
            <tr><th>Proteínas</th><td>${proteinas}g</td></tr>
            <tr><th>Sal</th><td>${sal}g</td></tr>
          </table>
        </div>
      </div>
      <div class="box">
        <div class="box-title">4. LISTA DE INGREDIENTES</div>
        <div style="font-size:9pt;margin-bottom:8px">Por ordem decrescente de peso:</div>
        <div class="ing-list">${ingLista}</div>
      </div>
      ${r.alergenios? `<div class="alergenios">⚠️ CONTÉM ALERGÉNIOS: ${r.alergenios.toUpperCase()}</div>` : ''}
      <div class="box">
        <div class="box-title">5. MODO DE PREPARAÇÃO</div>
        <pre style="white-space:pre-wrap;font-family:Arial;font-size:10pt;margin:0">${r.passos}</pre>
      </div>
      <div class="grid">
        <div class="box">
          <div class="box-title">6. CONSERVAÇÃO</div>
          <p style="margin:0;font-size:10pt">Manter refrigerado entre 0°C e 5°C.<br>
          Consumir até ${r.validade} dias após data de fabrico.<br>
          Após abertura, consumir em 24h.</p>
        </div>
        <div class="box">
          <div class="box-title">7. RESPONSÁVEL</div>
          <p style="margin:0;font-size:10pt">Ana Filipa Babe Meireles<br>
          NIF: xxx xxx xxx<br>
          Contacto: 9xx xxx xxx<br>
          Oeiras, Portugal</p>
        </div>
      </div>
      <div class="assinatura">Assinatura e Carimbo<br><br><br></div>
      <div class="footer">
        <div>Babe's Bakery - Ficha Técnica conforme Reg. UE 1169/2011</div>
        <div>Pág. 1/1</div>
      </div>
      </body></html>`;
    this.printHTML(html);
  },

  async rotulo(id) {
  const r = (await DB.getAll('receitas')).find(x => x.id === id);
  const ingLista = r.ing.sort((a,b)=>b.qtd-a.qtd).map(i=>i.produto).join(', ');
  const dataProd = new Date().toLocaleDateString('pt-PT');
  const dataVal = new Date(Date.now() + r.validade*86400000).toLocaleDateString('pt-PT');
  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{width:58mm;font-family:Arial;font-size:10px;padding:2mm;margin:0}
    center{margin:1px 0}hr{border:none;border-top:1px dashed #000;margin:2px 0}
    </style></head><body>
    <center><b>BABE'S BAKERY</b></center>
    <center style="font-size:14px;margin:2px 0"><b>${r.nome}</b></center><hr>
    <b>Ingredientes:</b> ${ingLista}.<br>
    <b>Alergénios:</b> ${r.alergenios || 'Não contém'}.<br>
    <b>Peso líq:</b> ${(r.pesoTotal/r.rend).toFixed(0)}g<br>
    <b>Fab:</b> ${dataProd} <b>Val:</b> ${dataVal}<br>
    <b>Lote:</b> ${Date.now().toString().slice(-6)}<br><hr>
    <center style="font-size:8px">Conservar 0-5ºC<br>Ana Filipa B. Meireles<br>9xx xxx xxx</center>
    </body></html>`;
  this.printHTML(html);
},

async copiar(id) {
  const r = (await DB.getAll('receitas')).find(x => x.id === id);
  this.atual = null;
  document.getElementById('r-nome').value = r.nome + ' - Cópia';
  document.getElementById('r-cat').value = r.cat;
  document.getElementById('r-rend').value = r.rend;
  document.getElementById('r-tempo').value = r.tempo;
  document.getElementById('r-validade').value = r.validade;
  document.getElementById('r-alergenios').value = r.alergenios;
  document.getElementById('lista-ing').innerHTML = '';
  this.ingCounter = 0;
  r.ing.forEach(i => this.addIng(i));
  document.getElementById('lista-passos').innerHTML = '';
  this.passoCounter = 0;
  r.passos.split('\n').forEach(p => {
    const timer = p.match(/\[timer:(\d+)\]/);
    const texto = p.replace(/\[timer:\d+\]/, '').trim();
    this.addPasso({texto, timer:!!timer, min: timer? timer[1] : 0});
  });
  App.toast('Receita copiada - edita e guarda');
  window.scrollTo(0, 0);
},

async del(id) {
  if (confirm('Apagar receita?')) {
    await DB.delete('receitas', id);
    this.loadLista();
    App.toast('Apagada');
  }
}
  };

window.Receitas = Receitas;
