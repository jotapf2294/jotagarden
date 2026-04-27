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
        <input id="r-tempo" type="number" placeholder="⏱️ Tempo total min">
        <textarea id="r-ing" rows="5" placeholder="Ingredientes:&#10;500g farinha T65 | 2.50€/kg&#10;6 ovos | 0.20€/un&#10;200g açúcar | 1.00€/kg"></textarea>
        <textarea id="r-passos" rows="5" placeholder="Passos:&#10;1. Bater ovos com açúcar 5min&#10;2. Forno 180º 30min [timer:30]"></textarea>
        <button class="btn btn-rosa" onclick="Receitas.save()">💾 Guardar Receita</button>
      </div>
      <div id="lista-receitas"></div>
    </div>`;
  },

  bind() { this.loadLista(); },

  async save() {
    const ing = this.parseIng(r_ing.value);
    const receita = {
      id: this.atual?.id,
      nome: r_nome.value,
      cat: r_cat.value,
      rend: +r_rend.value,
      tempo: +r_tempo.value,
      ing: ing,
      passos: r_passos.value,
      foto: await this.getFoto(),
      custoTotal: ing.reduce((s,i) => s + i.custo, 0)
    };
    if (!receita.nome) return App.toast('Nome obrigatório');
    await DB.save('receitas', receita);
    App.toast('Receita guardada 🧁');
    this.atual = null;
    this.loadLista();
    document.querySelectorAll('#receitas input, #receitas textarea').forEach(e => e.value = '');
  },

  parseIng(txt) {
    return txt.split('\n').filter(l => l).map(l => {
      const [nome, resto] = l.split('|');
      const qtd = parseFloat(nome);
      const unidade = nome.replace(qtd, '').trim().split(' ')[0];
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
        <p>⏱️ ${r.tempo}min | 🍰 ${r.rend} un | 💰 ${r.custoTotal.toFixed(2)}€ total | ${(r.custoTotal/r.rend).toFixed(2)}€/un</p>
        <div class="grid4">
          <button class="btn btn-small" onclick="Receitas.escalar(${r.id},0.5)">x0.5</button>
          <button class="btn btn-small" onclick="Receitas.escalar(${r.id},2)">x2</button>
          <button class="btn btn-small" onclick="Receitas.escalar(${r.id},3)">x3</button>
          <button class="btn btn-small" onclick="Receitas.escalar(${r.id},5)">x5</button>
        </div>
        <div class="grid2">
          <button class="btn btn-small btn-choco" onclick="Receitas.ver(${r.id})">👁️ Ver</button>
          <button class="btn btn-small" onclick="Receitas.del(${r.id})">🗑️ Apagar</button>
        </div>
      </div>
    `).join('');
    document.getElementById('lista-receitas').innerHTML = html || '<div class="card">Sem receitas ainda</div>';
  },

  async escalar(id, fator) {
    const r = (await DB.getAll('receitas')).find(x => x.id === id);
    const nova = r.ing.map(i => `${i.qtd*fator}${i.unidade} ${i.produto} | ${i.precoKg}€/kg`).join('\n');
    alert(`Receita x${fator}:\n\n${nova}\n\nCusto: ${(r.custoTotal*fator).toFixed(2)}€`);
  },

  async ver(id) {
    const r = (await DB.getAll('receitas')).find(x => x.id === id);
    alert(`${r.nome}\n\nIngredientes:\n${r.ing.map(i=>`${i.qtd}${i.unidade} ${i.produto}`).join('\n')}\n\nPassos:\n${r.passos}`);
    // Extrair timers [timer:30]
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
