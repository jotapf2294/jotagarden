import { getAllData } from '../db.js';

export const renderDashboard = async () => {
  const container = document.getElementById('tab-dashboard');
  const hoje = new Date().toISOString().split('T')[0];
  const encomendas = await getAllData('agenda');
  const encomendasHoje = encomendas.filter(e => e.data === hoje);

  container.innerHTML = `
    <div class="card" style="background:var(--secondary);border-left-color:var(--primary)">
      <h2>Bom dia, Chef! 👩‍🍳</h2>
      <p>Hoje é ${new Date().toLocaleDateString('pt-PT', {weekday:'long', day:'numeric', month:'long'})}</p>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="card"><small>Entregas Hoje</small><h3>${encomendasHoje.length}</h3></div>
      <div class="card"><small>Estado</small><h3>${encomendasHoje.length ? '🔔' : '✅'}</h3></div>
    </div>

    <section class="card">
      <h3>⏱️ Timers de Produção</h3>
      <div id="timer-list"></div>
      <button id="add-timer" class="btn-action" style="margin-top:10px;background:#6c757d">+ Iniciar Temporizador</button>
    </section>

    <section>
      <h3>🚚 Entregas para Hoje</h3>
      <div id="entregas-hoje"></div>
    </section>
  `;

  document.getElementById('entregas-hoje').innerHTML = encomendasHoje.length
    ? encomendasHoje.map(e => `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center">
        <div><strong>${e.cliente}</strong><br><small>📦 ${e.pedido}</small></div>
        <span style="color:var(--primary);font-weight:bold">${e.hora}</span>
      </div>`).join('')
    : `<p class="card">Sem encomendas hoje. Cria novas receitas! ✨</p>`;

  document.getElementById('add-timer').onclick = () => {
    const min = prompt('Minutos?', '15');
    if (!min) return;
    const id = Date.now();
    const fim = Date.now() + parseInt(min) * 60000;
    const timers = JSON.parse(localStorage.getItem('dg_timers') || '[]');
    timers.push({ id, fim, label: 'Forno' });
    localStorage.setItem('dg_timers', JSON.stringify(timers));
    renderTimers();
  };

  renderTimers();
  setInterval(renderTimers, 1000);
};

function renderTimers() {
  const list = document.getElementById('timer-list');
  if (!list) return;
  let timers = JSON.parse(localStorage.getItem('dg_timers') || '[]');
  const agora = Date.now();
  timers = timers.filter(t => t.fim > agora - 60000); // mantém 1min após acabar
  localStorage.setItem('dg_timers', JSON.stringify(timers));

  if (!timers.length) {
    list.innerHTML = '<p style="color:#888;font-size:.9rem">Nenhum timer ativo.</p>';
    return;
  }

  list.innerHTML = timers.map(t => {
    const restante = Math.max(0, Math.floor((t.fim - agora) / 1000));
    const m = Math.floor(restante / 60);
    const s = restante % 60;
    const pronto = restante === 0;
    return `<div style="display:flex;justify-content:space-between;background:${pronto ? '#ffb6c1' : '#fff5f7'};padding:8px;margin:5px 0;border-radius:8px">
      <span>${pronto ? '🔔' : '⏳'} ${t.label}</span>
      <strong>${pronto ? 'PRONTO!' : `${m}:${s.toString().padStart(2,'0')}`}</strong>
    </div>`;
  }).join('');
}
