const Receitas = {
  atual: null,

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
          </select>
          <input id="r-rend" type="number" placeholder="Rendimento: 12 fatias">
        </div>
        <div class="grid2">
          <input id="r-tempo" type="number" placeholder="⏱️ Tempo min">
          <input id="r-validade" type="number" placeholder="Validade dias: 5">
        </div>
        <input id="r-alergenios" placeholder="Alergénios: glúten, ovo, lactose">
        <textarea id="r-ing" rows="5" placeholder="Ingredientes:&#10;500g farinha T65 | 2.50€/kg&#10;6 ovos | 0.20€/un&#10;200g açúcar | 1.00€/kg"></textarea>
        <textarea id="r-passos" rows="5" placeholder="Passos:&#10;1. Bater ovos com açúcar 5min&#10;2. Forno 180º 30min [timer:30]"></textarea>
        <button class="btn btn-rosa" id="btn-guardar-receita">💾 Guardar Receita</button>
      </div>
      <div id="lista-receitas"></div>
    </div>`;
  },

  bind() {
    document.getElementById('btn-guardar-receita').onclick = () => this.save();
    this.loadLista();
  },

  async save() {
    const nome = document.getElementById('r-nome').value;
    const cat = document.getElementById('r-cat').value;
    const rend = +document.getElementById('r-rend').value;
    const tempo = +document.getElementById('r-tempo').value;
    const validade = +document.getElementById('r-validade').value || 3;
    const alergenios = document.getElementById('r-alergenios').value;
    const ingTxt = document.getElementById('r-ing').value;
    const passos = document.getElementById('r-passos').value;

    if (!nome) return App.toast('Nome obrigatório');

    const ing = this.parseIng(ingTxt);
    const receita = {
      id: this.atual?.id,
      nome, cat, rend, tempo, validade, alergenios, ing, passos,
      foto: await this.getFoto(),
      custoTotal: ing.reduce((s,i) => s + i.custo, 0),
      pesoTotal: ing.reduce((s,i) => s + (i.unidade==='g'?i.qtd:i.unidade==='kg'?i.qtd*1000:0), 0)
    };

    await DB.save('receitas', receita);
    App.toast('Receita guardada 🧁');
    this.atual = null;
    this.loadLista();
    document.querySelectorAll('#r-nome,#r-rend,#r-tempo,#r-validade,#r-alergenios,#r-ing,#r-passos').forEach(e => e.value = '');
  },

  parseIng(txt) {
    return txt.split('\n').filter(l => l.trim()).map(l => {
      const [nome, resto] = l.split('|');
      const qtd = parseFloat(nome) || 0;
      const unidade = nome.replace(qtd, '').trim().split(' ')[0] || 'g';
      const produto = nome.replace(qtd + unidade, '').trim();
      const precoKg = resto? parseFloat(resto) : 0;
      const custo = unidade === 'g'? qtd/1000*precoKg : unidade === 'kg'? qtd*precoKg : qtd*precoKg;
      return {qtd, unidade, produto, precoKg, custo};
    });
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

  async loadLista() {
    const all = await DB.getAll('receitas');
    const html = all.map(r => `
      <div class="card">
        ${r.foto? `<img src="${r.foto}" style="width:100%;border-radius:12px;margin-bottom:8px">` : ''}
        <h3>${r.nome} <span class="badge">${r.cat}</span></h3>
        <p>⏱️ ${r.tempo}min | 🍰 ${r.rend} un | 💰 ${r.custoTotal.toFixed(2)}€ | ${(r.custoTotal/r.rend).toFixed(2)}€/un</p>
        <p>⚖️ Peso: ${r.pesoTotal}g | 📅 Val: ${r.validade} dias</p>
        <div class="grid4">
          <button class="btn btn-small" onclick="Receitas.escalar(${r.id},0.5)">x0.5</button>
          <button class="btn btn-small" onclick="Receitas.escalar(${r.id},2)">x2</button>
          <button class="btn btn-small" onclick="Receitas.escalar(${r.id},3)">x3</button>
          <button class="btn btn-small" onclick="Receitas.escalar(${r.id},5)">x5</button>
        </div>
        <div class="grid2">
          <button class="btn btn-small btn-choco" onclick="Receitas.fichaTecnica(${r.id})">📋 Ficha</button>
          <button class="btn btn-small btn-choco" onclick="Receitas.rotulo(${r.id})">🏷️ Rótulo</button>
        </div>
        <div class="grid2">
          <button class="btn btn-small" onclick="Receitas.ver(${r.id})">👁️ Ver</button>
          <button class="btn btn-small" onclick="Receitas.del(${r.id})">🗑️ Apagar</button>
        </div>
      </div>
    `).join('');
    document.getElementById('lista-receitas').innerHTML = html || '<div class="card">Sem receitas ainda</div>';
  },

  async escalar(id, fator) {
    const r = (await DB.getAll('receitas')).find(x => x.id === id);
    const nova = r.ing.map(i => `${(i.qtd*fator).toFixed(1)}${i.unidade} ${i.produto}`).join('\n');
    alert(`Receita x${fator}:\n\n${nova}\n\nCusto: ${(r.custoTotal*fator).toFixed(2)}€\nPeso: ${(r.pesoTotal*fator).toFixed(0)}g`);
  },

  async fichaTecnica(id) {
    const r = (await DB.getAll('receitas')).find(x => x.id === id);
    const ingLista = r.ing.sort((a,b)=>b.qtd-a.qtd).map(i=>`${i.produto} (${(i.qtd/r.pesoTotal*100).toFixed(1)}%)`).join(', ');

    const w = window.open('', '', 'width=800,height=600');
    w.document.write(`
      <html><head><title>Ficha Técnica - ${r.nome}</title>
      <style>
        body{font-family:Arial;padding:20px;color:#333}
        h1{color:#FF6B9D;border-bottom:3px solid #FF6B9D}
        table{width:100%;border-collapse:collapse;margin:10px 0}
        td,th{border:1px solid #ddd;padding:8px;text-align:left}
        th{background:#FFF5F8}
      .logo{font-size:24px}
        @media print{button{display:none}}
      </style></head><body>
      <div class="logo">🧁 Babe's Bakery</div>
      <h1>FICHA TÉCNICA</h1>
      <h2>${r.nome}</h2>
      <table>
        <tr><th>Categoria</th><td>${r.cat}</td><th>Rendimento</th><td>${r.rend} unidades</td></tr>
        <tr><th>Tempo Prep</th><td>${r.tempo} min</td><th>Validade</th><td>${r.validade} dias após produção</td></tr>
        <tr><th>Peso Total</th><td>${r.pesoTotal}g</td><th>Peso/Un</th><td>${(r.pesoTotal/r.rend).toFixed(0)}g</td></tr>
        <tr><th>Custo Total</th><td>${r.custoTotal.toFixed(2)}€</td><th>Custo/Un</th><td>${(r.custoTotal/r.rend).toFixed(2)}€</td></tr>
      </table>
      <h3>Ingredientes por ordem decrescente:</h3>
      <p>${ingLista}</p>
      <h3>Alergénios:</h3>
      <p><b>${r.alergenios || 'Não declarado'}</b></p>
      <h3>Modo de Preparação:</h3>
      <pre>${r.passos}</pre>
      <h3>Conservação:</h3>
      <p>Manter refrigerado entre 0-5ºC. Consumir até ${r.validade} dias após fabrico.</p>
      <hr>
      <p style="font-size:12px">Emitido por Babe's Bakery em ${new Date().toLocaleDateString('pt-PT')} | Ana Filipa Babe Meireles</p>
      <button onclick="window.print()">🖨️ Imprimir Ficha</button>
      </body></html>
    `);
  },

  async rotulo(id) {
    const r = (await DB.getAll('receitas')).find(x => x.id === id);
    const ingLista = r.ing.sort((a,b)=>b.qtd-a.qtd).map(i=>i.produto).join(', ');
    const dataProd = new Date().toLocaleDateString('pt-PT');
    const dataVal = new Date(Date.now() + r.validade*86400000).toLocaleDateString('pt-PT');

    const w = window.open('', '', 'width=300');
    w.document.write(`
      <div class="print-area" style="width:58mm;font-family:Arial;font-size:10px;padding:2mm">
        <center><b>BABE'S BAKERY</b></center>
        <center style="font-size:14px;margin:2px 0"><b>${r.nome}</b></center>
        <hr style="border:1px dashed #000;margin:2px 0">
        <b>Ingredientes:</b> ${ingLista}.<br>
        <b>Alergénios:</b> ${r.alergenios || 'Não contém'}.<br>
        <b>Peso líq:</b> ${(r.pesoTotal/r.rend).toFixed(0)}g<br>
        <b>Fab:</b> ${dataProd} <b>Val:</b> ${dataVal}<br>
        <b>Lote:</b> ${Date.now().toString().slice(-6)}<br>
        <hr style="border:1px dashed #000;margin:2px 0">
        <center style="font-size:8px">Conservar 0-5ºC<br>
        Ana Filipa B. Meireles<br>
        Contacto: 9xx xxx xxx</center>
      </div>
      <script>window.print()</script>
    `);
  },

  async ver(id) {
    const r = (await DB.getAll('receitas')).find(x => x.id === id);
    alert(`${r.nome}\n\nIngredientes:\n${r.ing.map(i=>`${i.qtd}${i.unidade} ${i.produto}`).join('\n')}\n\nPassos:\n${r.passos}`);
    const timers = r.passos.match(/\[timer:(\d+)\]/g);
    if (timers) timers.forEach(t => {
      const min = t.match(/\d+/)[0];
      Timers.add(`Passo ${r.nome}`, min);
    });
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
