import { getAllData } from '../db.js';
import { formatCurrency, formatDate } from './receitas/utils.js';

export const renderDashboard = async () => {
  const c = document.getElementById('tab-dashboard');

  c.innerHTML = `
    <div class="grid-4" id="stats-grid">
      <div class="card stat">
        <div class="stat-label">💰 Faturação Hoje</div>
        <div class="stat-value" id="stat-faturacao">0€</div>
      </div>
      <div class="card stat">
        <div class="stat-label">📦 Encomendas</div>
        <div class="stat-value" id="stat-encomendas">0</div>
      </div>
      <div class="card stat">
        <div class="stat-label">📖 Receitas</div>
        <div class="stat-value" id="stat-receitas">0</div>
      </div>
      <div class="card stat">
        <div class="stat-label">⏱️ Timers Ativos</div>
        <div class="stat-value" id="stat-timers">0</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h3>📈 Vendas Últimos 7 Dias</h3>
          <span class="badge" id="badge-total-7d">0€</span>
        </div>
        <div id="chart-vendas" style="height:200px;display:flex;align-items:flex-end;gap:8px;padding:16px 0"></div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>🔥 Top 5 Receitas</h3>
          <span class="badge badge-success">Mais vendidas</span>
        </div>
        <div id="top-receitas" style="display:flex;flex-direction:column;gap:8px"></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h3>📅 Próximas Entregas</h3>
          <button class="btn btn-sm" onclick="document.querySelector('[data-target=agenda]').click()">
            Ver todas →
          </button>
        </div>
        <div id="prox-entregas"></div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>⚡ Ações Rápidas</h3>
        </div>
        <div style="display:grid;gap:8px">
          <button class="btn btn-primary btn-block" onclick="novaEncomendaRapida()">
            <span>➕</span> Nova Encomenda
          </button>
          <button class="btn btn-block" onclick="document.querySelector('[data-target=receitas]').click()">
            <span>📖</span> Nova Ficha Técnica
          </button>
          <button class="btn btn-block" onclick="iniciarTimerRapido()">
            <span>⏱️</span> Iniciar Timer
          </button>
          <button class="btn btn-block" onclick="exportarBackup()">
            <span>💾</span> Backup Completo
          </button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>🔔 Alertas HACCP</h3>
        <span class="badge badge-danger" id="badge-alertas" style="display:none">0</span>
      </div>
      <div id="alertas-haccp"></div>
    </div>
  `;

  await loadStats();
  await loadChart();
  await loadTopReceitas();
  await loadProximasEntregas();
  await loadAlertas();
  startTimersListener();
};

async function loadStats() {
  const [agenda, receitas] = await Promise.all([
    getAllData('agenda'),
    getAllData('receitas')
  ]);

  const hoje = new Date().toISOString().split('T')[0];
  const hojeAgenda = agenda.filter(e => e.data === hoje);

  const faturacaoHoje = hojeAgenda.reduce((sum, e) => {
    const rec = receitas.find(r => r.nome === e.pedido);
    return sum + (rec?.venda || 0);
  }, 0);

  const timers = JSON.parse(localStorage.getItem('dg_timers') || '[]');
  const timersAtivos = timers.filter(t => t.fim > Date.now()).length;

  document.getElementById('stat-faturacao').textContent = formatCurrency(faturacaoHoje);
  document.getElementById('stat-encomendas').textContent = hojeAgenda.length;
  document.getElementById('stat-receitas').textContent = receitas.length;
  document.getElementById('stat-timers').textContent = timersAtivos;
}

async function loadChart() {
  const [agenda, receitas] = await Promise.all([
    getAllData('agenda'),
    getAllData('receitas')
  ]);

  const dias = [];
  const hoje = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - i);
    const dataStr = d.toISOString().split('T')[0];

    const vendasDia = agenda
     .filter(e => e.data === dataStr)
     .reduce((sum, e) => {
        const rec = receitas.find(r => r.nome === e.pedido);
        return sum + (rec?.venda || 0);
      }, 0);

    dias.push({
      label: d.toLocaleDateString('pt-PT', { weekday: 'short' }),
      valor: vendasDia
    });
  }

  const maxValor = Math.max(...dias.map(d => d.valor), 1);
  const total = dias.reduce((a, b) => a + b.valor, 0);

  document.getElementById('badge-total-7d').textContent = formatCurrency(total);

  const chart = document.getElementById('chart-vendas');
  chart.innerHTML = dias.map(d => {
    const altura = (d.valor / maxValor) * 160;
    const cor = d.valor > 0? 'var(--primary)' : 'var(--border)';
    return `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="font-size:.75rem;color:var(--text-secondary);font-weight:600">
          ${d.valor > 0? d.valor.toFixed(0) + '€' : ''}
        </div>
        <div style="
          width:100%;
          height:${altura}px;
          background:${cor};
          border-radius:4px 4px 0 0;
          transition:all.3s;
          cursor:pointer;
        " title="${d.label}: ${formatCurrency(d.valor)}"></div>
        <div style="font-size:.75rem;color:var(--text-secondary);text-transform:uppercase">
          ${d.label}
        </div>
      </div>
    `;
  }).join('');
}

async function loadTopReceitas() {
  const [agenda, receitas] = await Promise.all([
    getAllData('agenda'),
    getAllData('receitas')
  ]);

  const contagem = {};
  agenda.forEach(e => {
    contagem[e.pedido] = (contagem[e.pedido] || 0) + 1;
  });

  const top = Object.entries(contagem)
   .sort((a, b) => b[1] - a[1])
   .slice(0, 5)
   .map(([nome, qtd]) => {
      const rec = receitas.find(r => r.nome === nome);
      return { nome, qtd, venda: rec?.venda || 0 };
    });

  const container = document.getElementById('top-receitas');

  if (!top.length) {
    container.innerHTML = '<div class="empty-state" style="padding:24px"><div class="emoji">📊</div><p>Sem dados ainda</p></div>';
    return;
  }

  container.innerHTML = top.map((t, i) => `
    <div style="display:flex;align-items:center;gap:12px;padding:8px;border-radius:var(--radius-sm);transition:background.15s"
         onmouseover="this.style.background='var(--bg-hover)'"
         onmouseout="this.style.background='transparent'">
      <div style="
        width:24px;height:24px;
        background:var(--primary);
        color:white;
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:.75rem;font-weight:600;
      ">${i + 1}</div>
      <div style="flex:1">
        <div style="font-weight:500;font-size:.875rem">${t.nome}</div>
        <div style="font-size:.75rem;color:var(--text-secondary)">${t.qtd}x vendido</div>
      </div>
      <div style="font-weight:600;font-size:.875rem">${formatCurrency(t.venda * t.qtd)}</div>
    </div>
  `).join('');
}

async function loadProximasEntregas() {
  const agenda = await getAllData('agenda');
  const hoje = new Date();
  const proximos7 = new Date(hoje);
  proximos7.setDate(hoje.getDate() + 7);

  const proximas = agenda
   .filter(e => {
      const dataE = new Date(e.data);
      return dataE >= hoje && dataE <= proximos7;
    })
   .sort((a, b) => new Date(a.data + 'T' + a.hora) - new Date(b.data + 'T' + b.hora))
   .slice(0, 5);

  const container = document.getElementById('prox-entregas');

  if (!proximas.length) {
    container.innerHTML = '<div class="empty-state" style="padding:24px"><div class="emoji">📅</div><p>Sem entregas próximas</p></div>';
    return;
  }

  container.innerHTML = proximas.map(e => {
    const data = new Date(e.data + 'T' + e.hora);
    const isHoje = e.data === hoje.toISOString().split('T')[0];
    const badgeClass = isHoje? 'badge-danger' : 'badge';

    return `
      <div style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:var(--radius-sm);margin-bottom:8px;background:var(--bg-hover)">
        <div style="text-align:center;min-width:48px">
          <div style="font-size:1.5rem;font-weight:600;line-height:1">${data.getDate()}</div>
          <div style="font-size:.75rem;color:var(--text-secondary);text-transform:uppercase">
            ${data.toLocaleDateString('pt-PT', { month: 'short' })}
          </div>
        </div>
        <div style="flex:1">
          <div style="font-weight:500;font-size:.875rem">${e.cliente}</div>
          <div style="font-size:.8125rem;color:var(--text-secondary)">${e.pedido}</div>
          <div style="font-size:.75rem;color:var(--text-secondary);margin-top:2px">
            🕐 ${e.hora}
          </div>
        </div>
        ${isHoje? '<span class="badge badge-danger">Hoje</span>' : ''}
      </div>
    `;
  }).join('');
}

async function loadAlertas() {
  const receitas = await getAllData('receitas');
  const alertas = [];

  // Validade curta
  receitas.forEach(r => {
    if (r.validade && r.validade <= 2) {
      alertas.push({
        tipo: 'warning',
        icon: '⚠️',
        msg: `${r.nome}: Validade curta (${r.validade} dias)`
      });
    }
  });

  // Sem PCCs definidos
  receitas.forEach(r => {
    if (!r.pccs || r.pccs.length === 0) {
      alertas.push({
        tipo: 'danger',
        icon: '🚨',
        msg: `${r.nome}: Sem PCCs definidos (HACCP incompleto)`
      });
    }
  });

  // Custo alto / margem baixa
  receitas.forEach(r => {
    const custoUnit = (r.custoTotal || 0) / (r.rendimento || 1);
    const margem = r.margem || 200;
    if (margem < 100) {
      alertas.push({
        tipo: 'warning',
        icon: '💸',
        msg: `${r.nome}: Margem baixa (${margem}%)`
      });
    }
  });

  const container = document.getElementById('alertas-haccp');
  const badge = document.getElementById('badge-alertas');

  if (!alertas.length) {
    container.innerHTML = '<div class="empty-state" style="padding:24px"><div class="emoji">✅</div><p>Tudo em conformidade!</p></div>';
    badge.style.display = 'none';
    return;
  }

  badge.textContent = alertas.length;
  badge.style.display = 'inline-block';

  container.innerHTML = alertas.slice(0, 5).map(a => `
    <div style="
      display:flex;
      align-items:start;
      gap:12px;
      padding:12px;
      border-radius:var(--radius-sm);
      background:var(--bg-hover);
      margin-bottom:8px;
      border-left:3px solid ${a.tipo === 'danger'? 'var(--danger)' : 'var(--warning)'};
    ">
      <div style="font-size:1.25rem">${a.icon}</div>
      <div style="flex:1;font-size:.875rem">${a.msg}</div>
    </div>
  `).join('');
}

function startTimersListener() {
  setInterval(() => {
    const timers = JSON.parse(localStorage.getItem('dg_timers') || '[]');
    const ativos = timers.filter(t => t.fim > Date.now()).length;
    document.getElementById('stat-timers').textContent = ativos;
  }, 1000);
}

// === AÇÕES RÁPIDAS ===
window.novaEncomendaRapida = () => {
  const dialog = document.createElement('dialog');
  dialog.innerHTML = `
    <form method="dialog">
      <h3>➕ Nova Encomenda</h3>
      <label>Cliente *<input name="cliente" required placeholder="Nome do cliente"></label>
      <label>Pedido *<input name="pedido" required placeholder="Bolo de aniversário"></label>
      <label>Data *<input type="date" name="data" required value="${new Date().toISOString().split('T')[0]}"></label>
      <label>Hora *<input type="time" name="hora" required value="10:00"></label>
      <label>Observações<textarea name="obs" rows="2" placeholder="Sem lactose, etc"></textarea></label>
      <menu>
        <button type="button" value="cancel" class="btn">Cancelar</button>
        <button value="default" class="btn btn-primary">Guardar</button>
      </menu>
    </form>`;
  document.body.appendChild(dialog);
  dialog.showModal();
  dialog.addEventListener('close', async () => {
    if (dialog.returnValue === 'default') {
      const data = Object.fromEntries(new FormData(dialog.querySelector('form')));
      const { addData } = await import('../db.js');
      await addData('agenda', {
        id: Date.now().toString(),
       ...data,
        pago: false,
        createdAt: new Date().toISOString()
      });
      window.toast('✅ Encomenda criada!');
      renderDashboard();
    }
    dialog.remove();
  });
};

window.iniciarTimerRapido = () => {
  const dialog = document.createElement('dialog');
  dialog.innerHTML = `
    <form method="dialog">
      <h3>⏱️ Novo Timer</h3>
      <label>Descrição *<input name="label" required placeholder="Cozedura bolo"></label>
      <label>Minutos *<input type="number" name="minutos" required min="1" value="30"></label>
      <menu>
        <button type="button" value="cancel" class="btn">Cancelar</button>
        <button value="default" class="btn btn-primary">Iniciar</button>
      </menu>
    </form>`;
  document.body.appendChild(dialog);
  dialog.showModal();
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'default') {
      const data = Object.fromEntries(new FormData(dialog.querySelector('form')));
      const timers = JSON.parse(localStorage.getItem('dg_timers') || '[]');
      timers.push({
        id: Date.now(),
        label: data.label,
        fim: Date.now() + parseInt(data.minutos) * 60000
      });
      localStorage.setItem('dg_timers', JSON.stringify(timers));
      window.toast(`⏱️ Timer "${data.label}" iniciado!`);
      renderDashboard();
    }
    dialog.remove();
  });
};

window.exportarBackup = async () => {
  const { getAllData } = await import('../db.js');
  const [receitas, agenda] = await Promise.all([
    getAllData('receitas'),
    getAllData('agenda')
  ]);

  const backup = {
    version: '3.0',
    date: new Date().toISOString(),
    receitas,
    agenda,
    timers: JSON.parse(localStorage.getItem('dg_timers') || '[]')
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `docegestao-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  window.toast('💾 Backup exportado!');
};
