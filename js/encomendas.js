const Encomendas = {
  render() {
    return `
    <div class="tab active">
      <div class="card">
        <h3>📅 Nova Encomenda</h3>
        <input id="e-cliente" placeholder="Cliente: Maria Silva">
        <input id="e-tel" type="tel" placeholder="WhatsApp: 9xx xxx xxx">
        <input id="e-data" type="date">
        <input id="e-hora" type="time">
        <select id="e-receita">
          <option value="">Selecionar receita...</option>
        </select>
        <div class="grid2">
          <input id="e-qtd" type="number" placeholder="Quantidade: 2">
          <input id="e-valor" type="number" step="0.01" placeholder="Valor total: 25€">
        </div>
        <textarea id="e-obs" rows="2" placeholder="Obs: Sem lactose, entregar às 15h"></textarea>
        <button class="btn btn-rosa" onclick="Encomendas.add()">💾 Guardar Encomenda</button>
      </div>
      <div id="lista-encomendas"></div>
    </div>`;
  },

  async bind() {
    await this.loadReceitas();
    this.loadLista();
  },

  async loadReceitas() {
    const recs = await DB.getAll('receitas');
    const sel = document.getElementById('e-receita');
    sel.innerHTML = '<option value="">Selecionar receita...</option>' + 
      recs.map(r => `<option value="${r.id}">${r.nome}</option>`).join('');
  },

  async add() {
    const cliente = document.getElementById('e-cliente').value;
    if (!cliente) return App.toast('Cliente obrigatório');
    const enc = {
      cliente,
      tel: document.getElementById('e-tel').value,
      data: document.getElementById('e-data').value,
      hora: document.getElementById('e-hora').value,
      receitaId: +document.getElementById('e-receita').value || null,
      qtd: +document.getElementById('e-qtd').value || 1,
      valor: +document.getElementById('e-valor').value || 0,
      obs: document.getElementById('e-obs').value,
      status: 'pendente'
    };
    await DB.save('encomendas', enc);
    App.toast('Encomenda guardada 📅');
    this.loadLista();
    document.querySelectorAll('#e-cliente,#e-tel,#e-data,#e-hora,#e-qtd,#e-valor,#e-obs').forEach(e => e.value = '');
  },

  async loadLista() {
    const all = await DB.getAll('encomendas');
    const recs = await DB.getAll('receitas');
    all.sort((a,b) => new Date(a.data) - new Date(b.data));
    
    const lista = document.getElementById('lista-encomendas');
    lista.innerHTML = all.map(e => {
      const rec = recs.find(r => r.id === e.receitaId);
      const dataStr = e.data ? new Date(e.data).toLocaleDateString('pt-PT') : 'Sem data';
      const cor = e.status === 'entregue' ? 'var(--verde)' : e.status === 'cancelado' ? 'var(--vermelho)' : 'var(--rosa)';
      return `
        <div class="card" style="border-left:4px solid ${cor}">
          <h3>${e.cliente} <span class="badge" style="background:${cor}">${e.status}</span></h3>
          <p>📅 ${dataStr} ${e.hora || ''}</p>
          <p>📱 ${e.tel || 'Sem telefone'}</p>
          <p>🧁 ${rec?.nome || 'Sem receita'} x${e.qtd} | 💰 ${e.valor.toFixed(2)}€</p>
          ${e.obs ? `<p style="font-size:14px;color:#666">📝 ${e.obs}</p>` : ''}
          <div class="grid2">
            <button class="btn btn-small btn-choco" onclick="Encomendas.status(${e.id}, 'entregue')">✅ Entregue</button>
            <button class="btn btn-small" onclick="Encomendas.del(${e.id})">🗑️ Apagar</button>
          </div>
        </div>
      `;
    }).join('') || '<div class="card">Sem encomendas</div>';
  },

  async status(id, novo) {
    const all = await DB.getAll('encomendas');
    const enc = all.find(x => x.id === id);
    enc.status = novo;
    await DB.save('encomendas', enc);
    this.loadLista();
    App.toast('Status atualizado');
  },

  async del(id) {
    if (confirm('Apagar encomenda?')) {
      await DB.delete('encomendas', id);
      this.loadLista();
      App.toast('Apagada');
    }
  }
};

window.Encomendas = Encomendas;
