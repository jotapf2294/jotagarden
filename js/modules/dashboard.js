// dashboard.js
import { getAllData } from '../db.js';
import { formatCurrency, formatDate, toNumber } from './receitas/utils.js';

// FIX: parseDateTime sem bug timezone
const parseDateTime = (date, time) => new Date(`${date}T${time}:00`);
const hojeISO = () => new Date().toISOString().split('T')[0];

export const renderDashboard = async () => {
  const c = document.getElementById('tab-dashboard');
  if (!c) return;

  c.innerHTML = `
    <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))">
      <div class="dash-card">
        <div class="dash-label">💰 Faturação Hoje</div>
        <div class="dash-value" id="stat-faturacao">0€</div>
      </div>
      <div class="dash-card">
        <div class="dash-label">📦 Encomendas</div>
        <div class="dash-value" id="stat-encomendas">0</div>
      </div>
      <div class="dash-card">
        <div class="dash-label">📖 Receitas</div>
        <div class="dash-value" id="stat-receitas">0</div>
      </div>
      <div class="dash-card">
        <div class="dash-label">⏱️ Timers Ativos</div>
        <div class="dash-value" id="stat-timers">0</div>
      </div>
    </div>

    <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-top:16px">
      <div class="dash-panel">
        <div class="dash-head">
          <h3>📈 Vendas Últimos 7 Dias</h3>
          <span class="dash-badge" id="badge-total-7d">0€</span>
        </div>
        <div id="chart-vendas" style="height:200px;display:flex;align-items:flex-end;gap:8px;padding:16px 0"></div>
      </div>

      <div class="dash-panel">
        <div class="dash-head">
          <h3>🔥 Top 5 Receitas</h3>
          <span class="dash-badge dash-badge-success">Mais vendidas</span>
        </div>
        <div id="top-receitas" style="display:flex;flex-direction:column;gap:8px"></div>
      </div>
    </div>

    <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-top:16px">
      <div class="dash-panel">
        <div class="dash-head">
          <h3>📅 Próximas Entregas</h3>
          <button class="btn btn-sm btn-ghost" data-go="agenda">Ver todas →</button>
        </div>
        <div id="prox-entregas"></div>
      </div>

      <div class="dash-panel">
        <div class="dash-head">
          <h3>⚡ Ações Rápidas</h3>
        </div>
        <div style="display:grid;gap:8px">
          <button class="btn btn-primary btn-block" id="btn-nova-enc">
            <span>➕</span> Nova Encomenda
          </button>
          <button class="btn btn-block" data-go="receitas">
            <span>📖</span> Nova Ficha Técnica
          </button>
          <button class="btn btn-block" id="btn-timer">
            <span>⏱️</span> Iniciar Timer
          </button>
          <button class="btn btn-block" id="btn-backup">
            <span>💾</span> Backup Completo
          </button>
        </div>
      </div>
    </div>

    <div class="dash-panel" style="margin-top:16px">
      <div class="dash-head">
        <h3>🔔 Alertas HACCP</h3>
        <span class="dash-badge dash-badge-danger" id="badge-alertas" style="display:none">0</span>
      </div>
      <div id="alertas-haccp"></div>
    </div>

    <style>
     .dash-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 20px;
      }
     .dash-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }
     .dash-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--primary);
      }
     .dash-panel {
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 20px;
      }
     .dash-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
     .dash-head h3 {
        margin: 0;
        font-size: 1.125rem;
      }
     .dash-badge {
        background: var(--bg-hover);
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }
     .dash-badge-success { background: var(--success); color: #fff; }
     .dash-badge-danger { background: var(--danger); color: #fff; }
    </style>
  `;

  // FIX: Event delegation pra navegação, sem data-target que não existe
  c.onclick = (e) => {
    const go = e.target.closest('[data-go]');
    if (go) {
      document.querySelector(`[data-tab="${go.dataset.go}"]`)?.click();
    }
  };

  c.querySelector('#btn-nova-enc').onclick = novaEncomendaRapida;
  c.querySelector('#btn-timer').onclick = iniciarTimerRapido;
  c.querySelector('#btn-backup').onclick = exportarBackup;

  // Carrega dados com try/catch individual
  const tasks = [loadStats, loadChart, loadTopReceitas, loadProximasEntregas, loadAlertas];
  for (const task of tasks) {
    try {
      await task();
    } catch (e) {
      console.error('Erro no dashboard:', e);
    }
  }

  startTimersListener();
};

async function loadStats() {
  const [agenda, receitas] = await Promise.all([
    getAllData('agenda').catch(() => []),
    getAllData('receitas').catch(() => [])
  ]);

  const hoje = hojeISO();
  const hojeAgenda = agenda.filter(e => e.data === hoje);

  // FIX: usa toNumber pra evitar NaN
  const faturacaoHoje = hojeAgenda.reduce((sum, e) => {
    const rec = receitas.find(r => r.nome === e.pedido);
    return sum + toNumber(rec?.venda);
  }, 0);

  const timers = JSON.parse(localStorage.getItem('dg_timers') || '[]');
  const timersAtivos = timers.filter(t => t.fim > Date.now()).length;

  setText('stat-faturacao', formatCurrency(faturacaoHoje));
  setText('stat-encomendas', hojeAgenda.length);
  setText('stat-receitas', receitas.length);
  setText('stat-timers', timersAtivos);
}

async function loadChart() {
  const [agenda, receitas] = await Promise.all([
    getAllData('agenda').catch(() => []),
    getAllData('receitas').catch(() => [])
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
        return sum + toNumber(rec?.venda);
      }, 0);

    dias.push({
      label: d.toLocaleDateString('pt-PT', { weekday: 'short' }),
      valor: vendasDia
    });
  }

  const maxValor = Math.max(...dias.map(d => d.valor), 1);
  const total = dias.reduce((a, b) => a + b.valor, 0);

  setText('badge-total-7d', formatCurrency(total));

  const chart = document.getElementById('chart-vendas');
  if (!chart) return;

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
    getAllData('agenda').catch(() => []),
    getAllData('receitas').catch(() => [])
  ]);

  const contagem = {};
  agenda.forEach(e => {
    if (e.pedido) contagem[e.pedido] = (contagem[e.pedido] || 0) + 1;
  });

  const top = Object.entries(contagem)
   .sort((a, b) => b[1] - a[1])
   .slice(0, 5)
   .map(([nome, qtd]) => {
      const rec = receitas.find(r => r.nome === nome);
      return { nome, qtd, venda: toNumber(rec?.venda) };
    });

  const container = document.getElementById('top-receitas');
  if (!container) return;

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
        <div style="font-weight:500;font-size:.875rem">${sanitizeHTML(t.nome)}</div>
        <div style="font-size:.75rem;color:var(--text-secondary)">${t.qtd}x vendido</div>
      </div>
      <div style="font-weight:600;font-size:.875rem">${formatCurrency(t.venda * t.qtd)}</div>
    </div>
  `).join('');
}

async function loadProximasEntregas() {
  const agenda = await getAllData('agenda').catch(() => []);

  const hoje = new Date();
  const proximos7 = new Date(hoje);
  proximos7.setDate(hoje.getDate() + 7);

  // FIX: parseDateTime evita bug timezone
  const proximas = agenda
   .filter(e => {
      const dataE = parseDateTime(e.data, e.hora || '00:00');
      return dataE >= hoje && dataE <= proximos7;
    })
   .sort((a, b) => parseDateTime(a.data, a.hora) - parseDateTime(b.data, b.hora))
   .slice(0, 5);

  const container = document.getElementById('prox-entregas');
  if (!container) return;

  if (!proximas.length) {
    container.innerHTML = '<div class="empty-state" style="padding:24px"><div class="emoji">📅</div><p>Sem entregas próximas</p></div>';
    return;
  }

  container.innerHTML = proximas.map(e => {
    const data = parseDateTime(e.data, e.hora);
    const isHoje = e.data === hojeISO();

    return `
      <div style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:var(--radius-sm);margin-bottom:8px;background:var(--bg-hover)">
        <div style="text-align:center;min-width:48px">
          <div style="font-size:1.5rem;font-weight:600;line-height:1">${data.getDate()}</div>
          <div style="font-size:.75rem;color:var(--text-secondary);text-transform:uppercase">
            ${data.toLocaleDateString('pt-PT', { month: 'short' })}
          </div>
        </div>
        <div style="flex:1">
          <div style="font-weight:500;font-size:.875rem">${sanitizeHTML(e.cliente || '—')}</div>
          <div style="font-size:.8125rem;color:var(--text-secondary)">${sanitizeHTML(e.pedido || '—')}</div>
          <div style="font-size:.75rem;color:var(--text-secondary);margin-top:2px">
            🕐 ${e.hora || '—'}
            ${isHoje? '<span class="dash-badge dash-badge-danger" style="margin-left:8px">Hoje</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadAlertas() {
  const receitas = await getAllData('receitas').catch(() => []);
  const alertas = [];

  receitas.forEach(r => {
    const val = toNumber(r.validade);
    if (val > 0 && val <= 2) {
      alertas.push({
        tipo: 'warning',
        icon: '⚠️',
        msg: `${r.nome}: Validade curta (${val} dias)`
      });
    }
    if (!r.pccs || r.pccs.length === 0) {
      alertas.push({
        tipo: 'danger',
        icon: '🚨',
        msg: `${r.nome}: Sem PCCs definidos`
      });
    }
    const margem = toNumber(r.margem);
    if (margem > 0 && margem < 100) {
      alertas.push({
        tipo: 'warning',
        icon: '💸',
        msg: `${r.nome}: Margem baixa (${margem}%)`
      });
    }
  });

  const container = document.getElementById('alertas-haccp');
  const badge = document.getElementById('badge-alertas');
  if (!container ||!badge) return;

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
      <div style="flex:1;font-size:.875rem">${sanitizeHTML(a.msg)}</div>
    </div>
  `).join('');
}

function startTimersListener() {
  const updateTimers = () => {
    const timers = JSON.parse(localStorage.getItem('dg_timers') || '[]');
    const ativos = timers.filter(t => t.fim > Date.now()).length;
    setText('stat-timers', ativos);
  };
  updateTimers();
  setInterval(updateTimers, 1000);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str || '';
  return temp.innerHTML;
}

// === AÇÕES RÁPIDAS ===
async function novaEncomendaRapida() {
  const dialog = document.createElement('dialog');
  dialog.innerHTML = `
    <form method="dialog" style="padding:20px;min-width:320px">
      <h3 style="margin:0 0 16px">➕ Nova Encomenda</h3>
      <label>Cliente *<input name="cliente" required placeholder="Nome do cliente"></label>
      <label>Pedido *<input name="pedido" required placeholder="Bolo de aniversário"></label>
      <label>Data *<input type="date" name="data" required value="${hojeISO()}"></label>
      <label>Hora *<input type="time" name="hora" required value="10:00"></label>
      <label>Observações<textarea name="obs" rows="2" placeholder="Sem lactose, etc"></textarea></label>
      <menu style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;padding:0">
        <button type="button" class="btn btn-ghost btn-cancel">Cancelar</button>
        <button value="default" class="btn btn-primary">Guardar</button>
      </menu>
    </form>`;
  document.body.appendChild(dialog);
  dialog.showModal();
  dialog.querySelector('.btn-cancel').onclick = () => dialog.close();
  dialog.addEventListener('close', async () => {
    if (dialog.returnValue === 'default') {
      const data = Object.fromEntries(new FormData(dialog.querySelector('form')));
      const { addData } = await import('../db.js');
      await addData('agenda', {
        id: crypto.randomUUID(), // FIX: sem colisão
       ...data,
        pago: false,
        createdAt: new Date().toISOString()
      });
      window.toast('✅ Encomenda criada!');
      renderDashboard();
    }
    dialog.remove();
  });
}

function iniciarTimerRapido() {
  const dialog = document.createElement('dialog');
  dialog.innerHTML = `
    <form method="dialog" style="padding:20px;min-width:300px">
      <h3 style="margin:0 0 16px">⏱️ Novo Timer</h3>
      <label>Descrição *<input name="label" required placeholder="Cozedura bolo"></label>
      <label>Minutos *<input type="number" name="minutos" required min="1" value="30"></label>
      <menu style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;padding:0">
        <button type="button" class="btn btn-ghost btn-cancel">Cancelar</button>
        <button value="default" class="btn btn-primary">Iniciar</button>
      </menu>
    </form>`;
  document.body.appendChild(dialog);
  dialog.showModal();
  dialog.querySelector('.btn-cancel').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'default') {
      const data = Object.fromEntries(new FormData(dialog.querySelector('form')));
      const timers = JSON.parse(localStorage.getItem('dg_timers') || '[]');
      timers.push({
        id: crypto.randomUUID(),
        label: data.label,
        fim: Date.now() + toNumber(data.minutos) * 60000
      });
      localStorage.setItem('dg_timers', JSON.stringify(timers));
      window.toast(`⏱️ Timer "${data.label}" iniciado!`);
      renderDashboard();
    }
    dialog.remove();
  });
}

async function exportarBackup() {
  const { getAllData } = await import('../db.js');
  const [receitas, agenda] = await Promise.all([
    getAllData('receitas').catch(() => []),
    getAllData('agenda').catch(() => [])
  ]);

  const backup = {
    version: '3.5',
    date: new Date().toISOString(),
    receitas,
    agenda,
    timers: JSON.parse(localStorage.getItem('dg_timers') || '[]')
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `docegestao-backup-${hojeISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  window.toast('💾 Backup exportado!');
}