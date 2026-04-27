const Stock = {
  render() {
    return `
    <div class="tab active">
      <div class="card">
        <h3>📦 Adicionar ao Stock</h3>
        <input id="s-nome" placeholder="Produto: Farinha T65">
        <div class="grid2">
          <input id="s-qtd" type="number" placeholder="Qtd: 25">
          <select id="s-un">
            <option>kg</option><option>g</option><option>L</option>
            <option>ml</option><option>un</option><option>cx</option>
          </select>
        </div>
        <div class="grid2">
          <input id="s-preco" type="number" step="0.01" placeholder="Preço total: 15.50€">
          <input id="s-min" type="number" placeholder="Stock mínimo: 5">
        </div>
        <button class="btn btn-rosa" onclick="Stock.add()">💾 Guardar</button>
      </div>
      <div id="lista-stock"></div>
    </div>`;
  },

  bind() {
    this.loadLista();
  },

  async add() {
    const nome = document.getElementById('s-nome').value;
    if (!nome) return App.toast('Nome obrigatório');
    const item = {
      nome,
      qtd: +document.getElementById('s-qtd').value || 0,
      un: document.getElementById('s-un').value,
      preco: +document.getElementById('s-preco').value || 0,
      min: +document.getElementById('s-min').value || 0,
      precoUn: 0
    };
    item.precoUn = item.qtd > 0 ? item.preco / item.qtd : 0;
    await DB.save('stock', item);
    App.toast('Stock atualizado 📦');
    this.loadLista();
    document.querySelectorAll('#s-nome,#s-qtd,#s-preco,#s-min').forEach(e => e.value = '');
  },

  async loadLista() {
    const all = await DB.getAll('stock');
    const lista = document.getElementById('lista-stock');
    lista.innerHTML = all.map(s => {
      const baixo = s.qtd <= s.min;
      return `
        <div class="card" style="${baixo ? 'border:2px solid var(--vermelho)' : ''}">
          <h3>${s.nome} ${baixo ? '<span class="badge">BAIXO</span>' : ''}</h3>
          <p><b>${s.qtd}${s.un}</b> | ${s.precoUn.toFixed(2)}€/${s.un} | Total: ${s.preco.toFixed(2)}€</p>
          <p style="font-size:14px;color:#666">Mínimo: ${s.min}${s.un}</p>
          <div class="grid2">
            <button class="btn btn-small btn-choco" onclick="Stock.usar(${s.id})">📉 Usar</button>
            <button class="btn btn-small" onclick="Stock.del(${s.id})">🗑️ Apagar</button>
          </div>
        </div>
      `;
    }).join('') || '<div class="card">Stock vazio</div>';
  },

  async usar(id) {
    const qtd = +prompt('Quantidade usada:');
    if (!qtd) return;
    const all = await DB.getAll('stock');
    const item = all.find(x => x.id === id);
    item.qtd = Math.max(0, item.qtd - qtd);
    item.preco = item.qtd * item.precoUn;
    await DB.save('stock', item);
    this.loadLista();
    if (item.qtd <= item.min) App.notify('⚠️ Stock Baixo', `${item.nome}: ${item.qtd}${item.un} restantes`);
  },

  async del(id) {
    if (confirm('Apagar item?')) {
      await DB.delete('stock', id);
      this.loadLista();
      App.toast('Apagado');
    }
  }
};

window.Stock = Stock;
