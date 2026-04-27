const Hoje = {
  render() {
    return `
    <div class="tab active">
      <div class="card" style="background:linear-gradient(135deg,#FF6B9D,#FF8FB1);color:#fff">
        <h2 style="margin:0 0 8px 0">Olá, Ana! 👋</h2>
        <div id="hoje-data" style="font-size:14px;opacity:0.9"></div>
      </div>

      <div class="grid2">
        <div class="card" style="text-align:center;padding:12px">
          <div style="font-size:32px">📦</div>
          <div style="font-size:24px;font-weight:700" id="hoje-entregas">0</div>
          <div style="font-size:12px;color:#666">Entregas Hoje</div>
        </div>
        <div class="card" style="text-align:center;padding:12px">
          <div style="font-size:32px">💰</div>
          <div style="font-size:24px;font-weight:700" id="hoje-faturar">0€</div>
          <div style="font-size:12px;color:#666">A Receber</div>
        </div>
      </div>

      <div class="card">
        <h3>⏰ Timers Ativos</h3>
        <div id="hoje-timers"></div>
      </div>

      <div class="card">
        <h3>📅 Entregas de Hoje</h3>
        <div id="hoje-encomendas"></div>
      </div>

      <div class="card" id="hoje-alertas" style="display:none">
        <h3>⚠️ Alertas</h3>
        <div id="hoje-alertas-lista"></div>
      </div>

      <div class="card">
        <h3>🚀 Ações Rápidas</h3>
        <div class="grid2">
          <button class="btn btn-small btn-rosa" onclick="App.mudarTab('receitas')">+ Nova Receita</button>
          <button class="btn btn-small btn-choco" onclick="App.mudarTab('agenda')">+ Encomenda</button>
        </div>
      </div>
    </div>`;
  },

  async bind() {
    this.atualizarData();
    await this.carregarDashboard();
    setInterval(() => this.carregarDashboard(), 30000); // atualiza cada 30s
  },

  atualizarData() {
    const hoje = new Date();
    const opcoes = { weekday: 'long', day: 'numeric', month: 'long' };
    document.getElementById('hoje-data').textContent = hoje.toLocaleDateString('pt-PT', opcoes);
  },

  async carregarDashboard() {
    const hoje = new Date().toISOString().split('T')[0];
    const encomendas = await DB.getAll('encomendas');
    const stock = await DB.getAll('stock');

    // Entregas hoje
    const hojeEntregas = encomendas.filter(e => e.data === hoje && e.status === 'pendente');
    document.getElementById('hoje-entregas').textContent = hojeEntregas.length;

    const totalHoje = hojeEntregas.reduce((s,e) => s + e.valor, 0);
    document.getElementById('hoje-faturar').textContent = totalHoje.toFixed(2) + '€';

    // Timers ativos
    const timersDiv = document.getElementById('hoje-timers');
    if (Timers.lista.length > 0) {
      timersDiv.innerHTML = Timers.lista.map(t => {
        const min = Math.floor(t.restante / 60);
        const seg = t.restante % 60;
        return `<div style="background:#FFF5F8;padding:10px;border-radius:12px;margin:6px 0;display:flex;justify-content:space-between">
          <span>${t.nome}</span>
          <b style="color:#FF6B9D">${String(min).padStart(2,'0')}:${String(seg).padStart(2,'0')}</b>
        </div>`;
      }).join('');
    } else {
      timersDiv.innerHTML = '<div style="color:#999;font-size:14px">Sem timers ativos</div>';
    }

    // Encomendas hoje
    const encDiv = document.getElementById('hoje-encomendas');
    const recs = await DB.getAll('receitas');
    if (hojeEntregas.length > 0) {
      encDiv.innerHTML = hojeEntregas.map(e => {
        const rec = recs.find(r => r.id === e.receitaId);
        return `<div style="background:#FFF5F8;padding:12px;border-radius:12px;margin:8px 0;border-left:4px solid #FF6B9D">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <b>${e.cliente}</b>
            <span>${e.hora || '--:--'}</span>
          </div>
          <div style="font-size:14px;color:#666">${rec?.nome || 'Sem receita'} x${e.qtd} | ${e.valor.toFixed(2)}€</div>
          ${e.tel? `<div style="font-size:12px;color:#FF6B9D;margin-top:4px">📱 ${e.tel}</div>` : ''}
        </div>`;
      }).join('');
    } else {
      encDiv.innerHTML = '<div style="color:#999;font-size:14px">Sem entregas hoje 🎉</div>';
    }

    // Alertas stock baixo
    const stockBaixo = stock.filter(s => s.qtd <= s.min);
    const alertasDiv = document.getElementById('hoje-alertas');
    const alertasLista = document.getElementById('hoje-alertas-lista');
    if (stockBaixo.length > 0) {
      alertasDiv.style.display = 'block';
      alertasLista.innerHTML = stockBaixo.map(s =>
        `<div style="background:#FFEBEE;padding:10px;border-radius:12px;margin:6px 0;border-left:4px solid #E57373">
          <b>${s.nome}</b>: ${s.qtd}${s.un} restantes (mín: ${s.min}${s.un})
        </div>`
      ).join('');
    } else {
      alertasDiv.style.display = 'none';
    }
  }
};

window.Hoje = Hoje;
