import { addData, getAllData, deleteData } from '../db.js';
import { formatCurrency, formatDate, debounce } from './receitas/utils.js';

const bc = new BroadcastChannel('docegestao');
let agendaCache = [];
let receitasCache = [];
let viewMode = 'semana'; // semana | mes | lista

export const renderAgenda = async () => {
  console.log('🎯 renderAgenda chamado');
  const c = document.getElementById('tab-agenda');

  if (!c) {
    console.error('❌ #tab-agenda não encontrado');
    return;
  }

  c.innerHTML = `
    <div class="grid-2" style="margin-bottom:16px">
      <div class="card stat">
        <div class="stat-label">📦 Entregas Hoje</div>
        <div class="stat-value" id="stat-entregas-hoje">0</div>
      </div>
      <div class="card stat">
        <div class="stat-label">💰 Faturação Semana</div>
        <div class="stat-value" id="stat-faturacao-semana">0€</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>📅 Agenda de Entregas</h3>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <div style="display:flex;border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden">
            <button class="btn-view ${viewMode === 'semana'? 'active' : ''}" data-view="semana" style="border:none;border-radius:0">Semana</button>
            <button class="btn-view ${viewMode === 'mes'? 'active' : ''}" data-view="mes" style="border:none;border-radius:0;border-left:1px solid var(--border)">Mês</button>
            <button class="btn-view ${viewMode === 'lista'? 'active' : ''}" data-view="lista" style="border:none;border-radius:0;border-left:1px solid var(--border)">Lista</button>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-nova-encomenda">
            <span>➕</span> <span class="hide-mobile">Nova</span>
          </button>
        </div>
      </div>

      <div id="agenda-container" style="min-height:400px">
        <div class="empty-state">
          <div class="emoji">📅</div>
          <p>A carregar agenda...</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>⏱️ Timers de Produção</h3>
        <button class="btn btn-primary btn-sm" id="btn-novo-timer">
          <span>⏱️</span> <span class="hide-mobile">Novo Timer</span>
        </button>
      </div>
      <div id="timers-container"></div>
    </div>
  `;

  // Estilo botões view
  const style = document.createElement('style');
  style.textContent = `
   .btn-view {
      padding: 6px 12px;
      background: var(--bg-overlay);
      color: var(--text-secondary);
      font-size:.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all.15s;
    }
   .btn-view:hover {
      background: var(--bg-hover);
      color: var(--text);
    }
   .btn-view.active {
      background: var(--primary);
      color: white;
    }
   .agenda-dia {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px;
      margin-bottom: 12px;
      background: var(--bg-overlay);
    }
   .agenda-dia.hoje {
      border-color: var(--primary);
      border-width: 2px;
    }
   .agenda-dia-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }
   .agenda-evento {
      display: flex;
      gap: 12px;
      padding: 10px;
      border-radius: var(--radius-sm);
      margin-bottom: 8px;
      background: var(--bg-hover);
      border-left: 3px solid var(--primary);
      transition: all.15s;
      cursor: pointer;
    }
   .agenda-evento:hover {
      background: var(--bg);
      transform: translateX(4px);
    }
   .agenda-evento.pago {
      border-left-color: var(--success);
      opacity: 0.7;
    }
   .agenda-evento.urgente {
      border-left-color: var(--danger);
    }
   .evento-hora {
      font-weight: 600;
      font-size:.875rem;
      min-width: 50px;
      color: var(--text);
    }
   .evento-info {
      flex: 1;
      min-width: 0;
    }
   .evento-cliente {
      font-weight: 500;
      font-size:.875rem;
      margin-bottom: 2px;
    }
   .evento-pedido {
      font-size:.8125rem;
      color: var(--text-secondary);
    }
   .evento-acoes {
      display: flex;
      gap: 4px;
      align-items: start;
    }
   .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 8px;
    }
   .calendar-day {
      aspect-ratio: 1;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 8px;
      cursor: pointer;
      transition: all.15s;
      position: relative;
      background: var(--bg-overlay);
      min-height: 80px;
    }
   .calendar-day:hover {
      background: var(--bg-hover);
      border-color: var(--primary);
    }
   .calendar-day.hoje {
      background: rgba(9, 105, 218, 0.1);
      border-color: var(--primary);
      border-width: 2px;
    }
   .calendar-day.outro-mes {
      opacity: 0.3;
    }
   .calendar-day-num {
      font-weight: 600;
      font-size:.875rem;
      margin-bottom: 4px;
    }
   .calendar-evento-dot {
      width: 6px;
      height: 6px;
      background: var(--primary);
      border-radius: 50%;
      display: inline-block;
      margin: 1px;
    }
   .timer-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      margin-bottom: 8px;
      background: var(--bg-overlay);
    }
   .timer-card.terminado {
      border-color: var(--success);
      background: rgba(26, 127, 55, 0.05);
    }
   .timer-emoji {
      font-size: 2rem;
    }
   .timer-info {
      flex: 1;
    }
   .timer-label {
      font-weight: 600;
      font-size:.875rem;
      margin-bottom: 2px;
    }
   .timer-tempo {
      font-size: 1.25rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--primary);
    }
   .timer-tempo.terminado {
      color: var(--success);
    }
    @media (max-width: 767px) {
     .calendar-grid {
        gap: 4px;
      }
     .calendar-day {
        min-height: 60px;
        padding: 4px;
      }
     .calendar-day-num {
        font-size:.75rem;
      }
     .agenda-evento {
        flex-direction: column;
      }
     .evento-acoes {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `;
  if (!document.getElementById('css-agenda-v3')) {
    style.id = 'css-agenda-v3';
    document.head.appendChild(style);
  }

  try {
    await loadData();
    setupEvents();
    renderView();
    startTimerUpdater();
    console.log('✅ Agenda renderizada');
  } catch (err) {
    console.error('❌ Erro renderAgenda:', err);
    c.innerHTML = `<div class="empty-state"><div class="emoji">⚠️</div><p>Erro: ${err.message}</p></div>`;
  }
};

async function loadData() {
  try {
    [agendaCache, receitasCache] = await Promise.all([
      getAllData('agenda'),
      getAllData('receitas')
    ]);
    console.log('✅ Agenda:', agendaCache.length, 'Receitas:', receitasCache.length);
  } catch (err) {
    console.warn('⚠️ Erro loadData:', err);
    agendaCache = [];
    receitasCache = [];
  }

  // Stats
  const hoje = new Date().toISOString().split('T')[0];
  const hojeEntregas = agendaCache.filter(e => e.data === hoje);

  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);

  const semanaEntregas = agendaCache.filter(e => {
    const d = new Date(e.data);
    return d >= inicioSemana && d <= fimSemana;
  });

  const faturacaoSemana = semanaEntregas.reduce((sum, e) => {
    const rec = receitasCache.find(r => r.nome === e.pedido);
    return sum + (rec?.venda || 0);
  }, 0);

  document.getElementById('stat-entregas-hoje').textContent = hojeEntregas.length;
  document.getElementById('stat-faturacao-semana').textContent = formatCurrency(faturacaoSemana);
}

function setupEvents() {
  document.getElementById('btn-nova-encomenda').onclick = novaEncomenda;
  document.getElementById('btn-novo-timer').onclick = novoTimer;

  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.onclick = () => {
      viewMode = btn.dataset.view;
      document.querySelectorAll('.btn-view').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderView();
    };
  });

  bc.onmessage = (e) => {
    if (e.data === 'update-agenda') {
      loadData().then(renderView);
    }
  };
}

function renderView() {
  const container = document.getElementById('agenda-container');
  if (!container) return;

  if (viewMode === 'semana') {
    renderSemana(container);
  } else if (viewMode === 'mes') {
    renderMes(container);
  } else {
    renderLista(container);
  }
}

function renderSemana(container) {
  const hoje = new Date();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay());

  let html = '';

  for (let i = 0; i < 7; i++) {
    const dia = new Date(inicioSemana);
    dia.setDate(inicioSemana.getDate() + i);
    const dataStr = dia.toISOString().split('T')[0];
    const isHoje = dataStr === hoje.toISOString().split('T')[0];

    const eventos = agendaCache
    .filter(e => e.data === dataStr)
    .sort((a, b) => a.hora.localeCompare(b.hora));

    const nomeDia = dia.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' });

    html += `
      <div class="agenda-dia ${isHoje? 'hoje' : ''}">
        <div class="agenda-dia-header">
          <div style="font-weight:600;text-transform:capitalize">${nomeDia}</div>
          ${isHoje? '<span class="badge badge-danger">Hoje</span>' : ''}
        </div>
        ${eventos.length? eventos.map(e => renderEvento(e)).join('') : '<p style="color:var(--text-secondary);font-size:.875rem;text-align:center;padding:16px 0">Sem entregas</p>'}
      </div>
    `;
  }

  container.innerHTML = html;
  setupEventoActions();
}

function renderMes(container) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const diasNoMes = ultimoDia.getDate();
  const diaSemanaInicio = primeiroDia.getDay();

  const nomeMes = hoje.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

  let html = `
    <div style="margin-bottom:16px">
      <h3 style="text-transform:capitalize;font-size:1.125rem">${nomeMes}</h3>
    </div>
    <div class="calendar-grid">
      ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => `
        <div style="text-align:center;font-size:.75rem;font-weight:600;color:var(--text-secondary);padding:8px 0">${d}</div>
      `).join('')}
  `;

  // Dias vazios antes do mês
  for (let i = 0; i < diaSemanaInicio; i++) {
    html += '<div class="calendar-day outro-mes"></div>';
  }

  // Dias do mês
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const isHoje = dataStr === hoje.toISOString().split('T')[0];
    const eventos = agendaCache.filter(e => e.data === dataStr);

    html += `
      <div class="calendar-day ${isHoje? 'hoje' : ''}" data-data="${dataStr}">
        <div class="calendar-day-num">${dia}</div>
        <div>
          ${eventos.slice(0, 3).map(() => '<span class="calendar-evento-dot"></span>').join('')}
          ${eventos.length > 3? `<span style="font-size:.7rem;color:var(--text-secondary)">+${eventos.length - 3}</span>` : ''}
        </div>
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;

  // Click nos dias
  container.querySelectorAll('.calendar-day[data-data]').forEach(dia => {
    dia.onclick = () => {
      const eventos = agendaCache.filter(e => e.data === dia.dataset.data);
      if (eventos.length) {
        mostrarEventosDia(dia.dataset.data, eventos);
      }
    };
  });
}

function renderLista(container) {
  const hoje = new Date();
  const proximos30 = agendaCache
  .filter(e => {
      const d = new Date(e.data);
      const diff = (d - hoje) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    })
  .sort((a, b) => new Date(a.data + 'T' + a.hora) - new Date(b.data + 'T' + b.hora));

  if (!proximos30.length) {
    container.innerHTML = '<div class="empty-state"><div class="emoji">📅</div><p>Sem entregas nos próximos 30 dias</p></div>';
    return;
  }

  container.innerHTML = proximos30.map(e => renderEvento(e, true)).join('');
  setupEventoActions();
}

function renderEvento(e, comData = false) {
  const data = new Date(e.data + 'T' + e.hora);
  const hoje = new Date().toISOString().split('T')[0];
  const isHoje = e.data === hoje;
  const horasAte = (new Date(e.data + 'T' + e.hora) - new Date()) / (1000 * 60 * 60);
  const isUrgente = horasAte > 0 && horasAte < 2;

  const rec = receitasCache.find(r => r.nome === e.pedido);
  const valor = rec?.venda || 0;

  return `
    <div class="agenda-evento ${e.pago? 'pago' : ''} ${isUrgente? 'urgente' : ''}" data-id="${e.id}">
      <div class="evento-hora">
        ${comData? formatDate(e.data) + '<br>' : ''}
        ${e.hora}
      </div>
      <div class="evento-info">
        <div class="evento-cliente">${e.cliente}</div>
        <div class="evento-pedido">${e.pedido} • ${formatCurrency(valor)}</div>
        ${e.obs? `<div style="font-size:.75rem;color:var(--text-secondary);margin-top:2px">📝 ${e.obs}</div>` : ''}
      </div>
      <div class="evento-acoes">
        ${!e.pago? `<button class="btn btn-sm btn-success btn-pago" data-id="${e.id}" title="Marcar como pago">💰</button>` : '<span class="badge badge-success">Pago</span>'}
        <button class="btn btn-sm btn-danger btn-del" data-id="${e.id}" title="Eliminar">🗑️</button>
      </div>
    </div>
  `;
}

function setupEventoActions() {
  document.querySelectorAll('.btn-pago').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const evento = agendaCache.find(ev => ev.id === id);
      if (evento) {
        evento.pago = true;
        await addData('agenda', evento);
        window.toast('✅ Marcado como pago');
        bc.postMessage('update-agenda');
        await loadData();
        renderView();
      }
    };
  });

  document.querySelectorAll('.btn-del').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm('Eliminar esta encomenda?')) return;
      await deleteData('agenda', btn.dataset.id);
      window.toast('✅ Encomenda eliminada');
      bc.postMessage('update-agenda');
      await loadData();
      renderView();
    };
  });

  document.querySelectorAll('.agenda-evento').forEach(ev => {
    ev.onclick = () => {
      const id = ev.dataset.id;
      const evento = agendaCache.find(e => e.id === id);
      if (evento) editarEncomenda(evento);
    };
  });
}

function mostrarEventosDia(data, eventos) {
  const dialog = document.createElement('dialog');
  dialog.innerHTML = `
    <form method="dialog">
      <h3>📅 ${formatDate(data)}</h3>
      <div style="max-height:400px;overflow-y:auto">
        ${eventos.map(e => renderEvento(e)).join('')}
      </div>
      <menu>
        <button class="btn">Fechar</button>
      </menu>
    </form>`;
  document.body.appendChild(dialog);
  dialog.showModal();
  setupEventoActions();
  dialog.addEventListener('close', () => dialog.remove());
}

// FIX: Removida função duplicada
function novaEncomenda() {
  const dialog = document.createElement('dialog');
  dialog.innerHTML = `
    <form method="dialog">
      <h3>➕ Nova Encomenda</h3>
      <label>Cliente *<input name="cliente" required placeholder="Nome do cliente"></label>
      <label>Pedido *<select name="pedido" required><option value="">Escolher receita</option>${receitasCache.map(r => `<option>${r.nome}</option>`).join('')}</select></label>
      <div class="grid-2">
        <label>Data *<input type="date" name="data" required value="${new Date().toISOString().split('T')[0]}"></label>
        <label>Hora *<input type="time" name="hora" required value="10:00"></label>
      </div>
      <label>Observações<textarea name="obs" rows="2" placeholder="Sem lactose, decoração especial..."></textarea></label>
      <label style="display:flex;align-items:center;gap:8px;margin-top:12px">
        <input type="checkbox" name="pago" style="width:auto">
        <span>Já está pago</span>
      </label>
      <menu>
        <button type="button" class="btn btn-cancel">Cancelar</button>
        <button value="default" class="btn btn-primary">Guardar</button>
      </menu>
    </form>`;
  document.body.appendChild(dialog);
  dialog.showModal();

  dialog.querySelector('.btn-cancel').onclick = () => dialog.close();

  dialog.addEventListener('close', async () => {
    if (dialog.returnValue === 'default') {
      const data = Object.fromEntries(new FormData(dialog.querySelector('form')));
      await addData('agenda', {
        id: Date.now().toString(),
       ...data,
        pago: data.pago === 'on',
        createdAt: new Date().toISOString()
      });
      window.toast('✅ Encomenda criada!');
      bc.postMessage('update-agenda');
      await loadData();
      renderView();
    }
    dialog.remove();
  });
}

function editarEncomenda(e) {
  const dialog = document.createElement('dialog');
  dialog.innerHTML = `
    <form method="dialog">
      <h3>✏️ Editar Encomenda</h3>
      <label>Cliente *<input name="cliente" required value="${e.cliente}"></label>
      <label>Pedido *<select name="pedido" required>${receitasCache.map(r => `<option ${r.nome === e.pedido? 'selected' : ''}>${r.nome}</option>`).join('')}</select></label>
      <div class="grid-2">
        <label>Data *<input type="date" name="data" required value="${e.data}"></label>
        <label>Hora *<input type="time" name="hora" required value="${e.hora}"></label>
      </div>
      <label>Observações<textarea name="obs" rows="2">${e.obs || ''}</textarea></label>
      <label style="display:flex;align-items:center;gap:8px;margin-top:12px">
        <input type="checkbox" name="pago" ${e.pago? 'checked' : ''} style="width:auto">
        <span>Já está pago</span>
      </label>
      <menu>
        <button type="button" class="btn btn-cancel">Cancelar</button>
        <button value="default" class="btn btn-primary">Guardar</button>
      </menu>
    </form>`;
  document.body.appendChild(dialog);
  dialog.showModal();

  dialog.querySelector('.btn-cancel').onclick = () => dialog.close();

  dialog.addEventListener('close', async () => {
    if (dialog.returnValue === 'default') {
      const data = Object.fromEntries(new FormData(dialog.querySelector('form')));
      await addData('agenda', {
       ...e,
       ...data,
        pago: data.pago === 'on'
      });
      window.toast('✅ Encomenda atualizada!');
      bc.postMessage('update-agenda');
      await loadData();
      renderView();
    }
    dialog.remove();
  });
}

// FIX: Removida função duplicada
function novoTimer() {
  const dialog = document.createElement('dialog');
  dialog.innerHTML = `
    <form method="dialog">
      <h3>⏱️ Novo Timer</h3>
      <label>Descrição *<input name="label" required placeholder="Cozedura bolo chocolate"></label>
      <label>Minutos *<input type="number" name="minutos" required min="1" value="30"></label>
      <label>Receita (opcional)<select name="receita"><option value="">Nenhuma</option>${receitasCache.map(r => `<option>${r.nome}</option>`).join('')}</select></label>
      <menu>
        <button type="button" class="btn btn-cancel">Cancelar</button>
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
        id: Date.now(),
        label: data.label,
        receita: data.receita,
        fim: Date.now() + parseInt(data.minutos) * 60000,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('dg_timers', JSON.stringify(timers));
      window.toast(`⏱️ Timer "${data.label}" iniciado!`);
      renderTimers();
    }
    dialog.remove();
  });
}

function renderTimers() {
  const timers = JSON.parse(localStorage.getItem('dg_timers') || '[]');
  const container = document.getElementById('timers-container');
  if (!container) return;

  if (!timers.length) {
    container.innerHTML = '<div class="empty-state"><div class="emoji">⏱️</div><p>Sem timers ativos</p></div>';
    return;
  }

  container.innerHTML = timers.map(t => {
    const restante = Math.max(0, t.fim - Date.now());
    const min = Math.floor(restante / 60000);
    const seg = Math.floor((restante % 60000) / 1000);
    const terminado = restante === 0;

    return `
      <div class="timer-card ${terminado? 'terminado' : ''}">
        <div class="timer-emoji">${terminado? '✅' : '⏱️'}</div>
        <div class="timer-info">
          <div class="timer-label">${t.label}</div>
          ${t.receita? `<div style="font-size:.75rem;color:var(--text-secondary)">${t.receita}</div>` : ''}
          <div class="timer-tempo ${terminado? 'terminado' : ''}" data-fim="${t.fim}">
            ${terminado? 'Terminado!' : `${min}:${String(seg).padStart(2, '0')}`}
          </div>
        <button class="btn btn-sm btn-danger" onclick="removerTimer(${t.id})">🗑️</button>
      </div>
    `;
  }).join('');
}

window.removerTimer = (id) => {
  const timers = JSON.parse(localStorage.getItem('dg_timers') || '[]');
  const filtrados = timers.filter(t => t.id!== id);
  localStorage.setItem('dg_timers', JSON.stringify(filtrados));
  renderTimers();
  window.toast('✅ Timer removido');
};

function startTimerUpdater() {
  setInterval(() => {
    const timers = JSON.parse(localStorage.getItem('dg_timers') || '[]');
    let mudou = false;

    timers.forEach(t => {
      const el = document.querySelector(`[data-fim="${t.fim}"]`);
      if (el) {
        const restante = Math.max(0, t.fim - Date.now());
        const min = Math.floor(restante / 60000);
        const seg = Math.floor((restante % 60000) / 1000);

        if (restante === 0 &&!el.classList.contains('terminado')) {
          el.textContent = 'Terminado!';
          el.classList.add('terminado');
          el.closest('.timer-card').classList.add('terminado');
          el.closest('.timer-card').querySelector('.timer-emoji').textContent = '✅';

          // Notificação
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏱️ Timer terminado!', {
              body: t.label,
              icon: '/icons/icon-192.png'
            });
          }
          window.toast(`⏱️ ${t.label} terminou!`);
          mudou = true;
        } else if (restante > 0) {
          el.textContent = `${min}:${String(seg).padStart(2, '0')}`;
        }
      }
    });

    // Pedir permissão notificação
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, 1000);

  renderTimers();
}

// Expõe funções globais
window.novaEncomendaRapida = novaEncomenda;
window.iniciarTimerRapido = novoTimer;