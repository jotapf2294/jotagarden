const Stock = {
  render() {
    return `
    <div class="tab active">
      <div class="card">
        <h3>📦 Adicionar Ingrediente</h3>
        <input id="s-nome" placeholder="Farinha T65">
        <div class="grid2">
          <input id="s-qtd" type="number" placeholder="Qtd atual">
          <select id="s-un"><option>kg</option><option>g</option><option>L</option><option>un</option></select>
        </div>
        <div class="grid2">
          <input id="s-min" type="number" placeholder="Stock mín">
          <input id="s-val" type="date">
        </div>
        <input id="s-forn" placeholder="Fornecedor">
        <button class="btn btn-rosa" onclick="Stock.save()">💾 Guardar</button>
      </div>
      <div id="lista-stock"></div>
      <button class="btn btn-choco" onclick="Stock.listaCompras()">🛒 Gerar Lista Compras</button>
    </div>`;
  },

  bind() { this.loadLista(); },

  async save() {
    const s = {
      nome: s_nome.value,
      qtd: +s_qtd.value,
      un: s_un.value,
      min: +s_min.value,
      val: s_val.value,
      forn: s_forn.value
    };
    if (!s.nome) return App.toast('Nome obrigatório');
    await DB.save('stock', s);
    App.toast('Guardado 📦');
    this.loadLista();
    document.querySelectorAll('#stock input').forEach(e => e.value = '');
  },

  async loadLista() {
    const all = await DB.getAll('stock');
    const hoje = new Date();
    const semana = new Date(Date.now() + 7*86400000);
    const html = '<table><tr><th>Ingrediente</th><th>Qtd</th><th>Validade</th><th></th></tr>' +
      all.map(s => {
        const alerta = s.qtd < s.min || new Date(s.val) < semana;
        return `<tr class="${alerta?'alerta':''}">
          <td>${s.nome} ${alerta?'<span class="badge">!</span>':''}</td>
          <td>${s.qtd}${s.un}</td>
          <td>${s.val}</td>
          <td><button class="btn-small" onclick="Stock.del(${s.id})">🗑️</button></td>
        </tr>`;
      }).join('') + '</table>';
    document.getElementById('lista-stock').innerHTML = html;
  },

  async del(id) {
    await DB.delete('stock', id);
    this.loadLista();
  },

  async listaCompras() {
    const all = await DB.getAll('stock');
    const falta = all.filter(s => s.qtd < s.min);
    const txt = falta.map(s => `${s.nome}: comprar ${(s.min-s.qtd).toFixed(1)}${s.un}`).join('\n');
    alert(`Lista de Compras:\n\n${txt || 'Stock OK!'}`);
  }
};
