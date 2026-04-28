import { addData, getAllData, updateData, deleteData } from '../../db.js';

// --- DATE UTILS: Corrige timezone e semana PT ---
const parseDateTime = (date, time) => new Date(`${date}T${time}:00`);
const toISODate = (d) => d.toISOString().split('T')[0];
const getWeekStart = (d = new Date()) => {
  const date = new Date(d);
  const day = date.getDay() || 7; // Dom = 7
  date.setDate(date.getDate() - day + 1); // Segunda
  date.setHours(0, 0, 0, 0);
  return date;
};

const bc = new BroadcastChannel('docegestao');
let agendaCache = [];
let viewMode = localStorage.getItem('agenda_view') || 'week';

export const renderAgenda = async () => {
  const c = document.getElementById('tab-agenda');
  c.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <div style="display:flex;align-items:center;gap:8px">
        <button id="btn-prev" class="btn btn-ghost btn-sm" aria-label="Anterior">←</button>
        <h2 id="agenda-title" style="margin:0;font-size:1.125rem;min-width:200px;text-align:center"></h2>
        <button id="btn-next" class="btn btn-ghost btn-sm" aria-label="Próximo">→</button>
      </div>
      <div style="display:flex;gap:8px">
        <div class="btn-group" style="display:flex;border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden">
          <button id="view-day" class="btn btn-ghost btn-sm ${viewMode === 'day'? 'on' : ''}">Dia</button>
          <button id="view-week" class="btn btn-ghost btn-sm ${viewMode === 'week'? 'on' : ''}">Semana</button>
        </div>
        <button id="btn-novo-evento" class="btn btn-primary btn-sm">+ Novo</button>
      </div>
    </div>
    <div id="agenda-container"></div>
    <dialog id="dlg-evento"></dialog>
  `;

  setupViewControls();
  await loadData();
  renderView();
  setupBroadcast();
  startTimers();
};

function setupViewControls() {
  document.getElementById('view-day').onclick = () => setView('day');
  document.getElementById('view-week').onclick = () => setView('week');
  document.getElementById('btn-novo-evento').onclick = () => openEventoModal();
  document.getElementById('btn-prev').onclick = () => navigateDate(-1);
  document.getElementById('btn-next').onclick = () => navigateDate(1);
}

function setView(mode) {
  viewMode = mode;
  localStorage.setItem('agenda_view', mode);
  document.querySelectorAll('.btn-group.btn').forEach(b => b.classList.remove('on'));
  document.getElementById('view-' + mode).classList.add('on');
  renderView();
}

function navigateDate(dir) {
  const current = new Date(document.getElementById('agenda-container').dataset.date || new Date());
  if (viewMode === 'day') current.setDate(current.getDate() + dir);
  else current.setDate(current.getDate() + dir * 7);
  document.getElementById('agenda-container').dataset.date = toISODate(current);
  renderView();
}

async function loadData() {
  agendaCache = await getAllData('agenda') || [];
}

function setupBroadcast() {
  bc.onmessage = (e) => {
    if (e.data === 'update-agenda') {
      loadData().then(renderView);
    }
  };
}

function renderView() {
  const container = document.getElementById('agenda-container');
  const date = new Date(container.dataset.date || new Date());
  container.dataset.date = toISODate(date);

  if (viewMode === 'day') renderDayView(date, container);
  else renderWeekView(date, container);
}

function renderDayView(date, container) {
  const title = document.getElementById('agenda-title');
  title.textContent = date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

  const eventos = agendaCache.filter(e => e.data === toISODate(date))
   .sort((a, b) => a.hora.localeCompare(b.hora));

  container.innerHTML = `
    <div class="day-view">
      ${eventos.length? eventos.map(renderEventoCard).join('') :
        '<div class="empty-state"><div class="emoji">📅</div><p>Sem eventos hoje</p></div>'}
    </div>
  `;
  setupEventoActions();
}

function renderWeekView(date, container) {
  const inicioSemana = getWeekStart(date);
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(fimSemana.getDate() + 6);

  const title = document.getElementById('agenda-title');
  title.textContent = `${inicioSemana.getDate()} - ${fimSemana.getDate()} ${fimSemana.toLocaleDateString('pt-PT', { month: 'long' })}`;

  const dias = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(inicioSemana);
    d.setDate(d.getDate() + i);
    dias.push(d);
  }

  container.innerHTML = `
    <div class="week-view" style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px">
      ${dias.map(d => {
        const eventos = agendaCache.filter(e => e.data === toISODate(d));
        const isHoje = toISODate(d) === toISODate(new Date());
        return `
          <div class="day-col" style="border:1px solid var(--border);border-radius:8px;min-height:120px;${isHoje? 'background:#fff5f8' : ''}">
            <div style="padding:8px;border-bottom:1px solid var(--border);font-weight:600;text-align:center;font-size:.875rem">
              ${d.toLocaleDateString('pt-PT', { weekday: 'short' })} ${d.getDate()}
            </div>
            <div style="padding:4px">
              ${eventos.map(e => `
                <div class="evento-mini" data-id="${e.id}" style="padding:4px 6px;margin:2px 0;background:${e.pago? 'var(--success)' : 'var(--primary)'};color:#fff;border-radius:4px;font-size:.75rem;cursor:pointer">
                  ${e.hora} ${e.titulo}
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  setupEventoActions();
}

function renderEventoCard(e) {
  const agora = new Date();
  const eventoDate = parseDateTime(e.data, e.hora);
  const diff = (eventoDate - agora) / 1000 / 60; // minutos
  const urgente = diff > 0 && diff < 60;

  return `
    <div class="evento-card" data-id="${e.id}" style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;${urgente? 'border-color:var(--danger);background:#ffebee' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:start">
        <div>
          <h4 style="margin:0 0 4px">${sanitizeHTML(e.titulo)}</h4>
          <div style="font-size:.875rem;color:var(--text-secondary)">
            🕐 ${e.hora} • ${e.tipo || 'Produção'} ${e.pago? '• ✅ Pago' : ''}
          </div>
          ${e.obs? `<div style="font-size:.875rem;margin-top:4px">${sanitizeHTML(e.obs)}</div>` : ''}
        </div>
        <div style="display:flex;gap:4px">
          ${!e.pago? '<button class="btn-pago btn btn-success btn-sm">Pago</button>' : ''}
          <button class="btn-edit btn btn-ghost btn-sm">✏️</button>
          <button class="btn-del btn btn-ghost btn-sm">🗑️</button>
        </div>
      </div>
    </div>
  `;
}

// EVENT DELEGATION: 1 listener em vez de N
function setupEventoActions() {
  const container = document.getElementById('agenda-container');
  container.onclick = async (ev) => {
    const card = ev.target.closest('[data-id]');
    if (!card) return;
    const id = card.dataset.id;
    const evento = agendaCache.find(e => e.id === id);
    if (!evento) return;

    if (ev.target.matches('.btn-pago')) {
      ev.target.disabled = true; // FIX: evita duplo clique
      try {
        evento.pago = true;
        evento.pagoEm = new Date().toISOString();
        await updateData('agenda', evento);
        window.toast('✅ Marcado como pago');
        bc.postMessage('update-agenda');
        await loadData();
        renderView();
      } catch (err) {
        window.toast('❌ Erro ao salvar');
        ev.target.disabled = false;
      }
    }
    if (ev.target.matches('.btn-edit')) openEventoModal(evento);
    if (ev.target.matches('.btn-del')) {
      if (confirm('Eliminar evento?')) {
        await deleteData('agenda', id);
        window.toast('✅ Eliminado');
        bc.postMessage('update-agenda');
        await loadData();
        renderView();
      }
    }
    if (ev.target.matches('.evento-mini')) openEventoModal(evento);
  };
}

function openEventoModal(evento = null) {
  const dlg = document.getElementById('dlg-evento');
  const hoje = toISODate(new Date());

  dlg.innerHTML = `
    <div style="background:#fff;border-radius:12px;width:100%;max-width:500px;padding:0">
      <header style="padding:16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between">
        <h3 style="margin:0">${evento? 'Editar' : 'Novo'} Evento</h3>
        <button onclick="this.closest('dialog').close()" style="background:none;border:none;font-size:24px;cursor:pointer">&times;</button>
      </header>
      <form id="f-evento" style="padding:16px">
        <div style="display:grid;gap:12px">
          <label>Título *<input name="titulo" required value="${evento?.titulo || ''}" style="width:100%"></label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <label>Data *<input type="date" name="data" required value="${evento?.data || hoje}"></label>
            <label>Hora *<input type="time" name="hora" required value="${evento?.hora || '08:00'}"></label>
          </div>
          <label>Tipo<select name="tipo" style="width:100%">
            <option ${evento?.tipo==='Produção'? 'selected' : ''}>Produção</option>
            <option ${evento?.tipo==='Entrega'? 'selected' : ''}>Entrega</option>
            <option ${evento?.tipo==='Encomenda'? 'selected' : ''}>Encomenda</option>
          </select></label>
          <label>Observações<textarea name="obs" rows="3" style="width:100%">${evento?.obs || ''}</textarea></label>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
          <button type="button" onclick="this.closest('dialog').close()" class="btn btn-ghost">Cancelar</button>
          <button type="submit" class="btn btn-primary">Guardar</button>
        </div>
      </form>
    </div>
  `;

  dlg.querySelector('#f-evento').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);

    if (evento) {
      evento.titulo = data.titulo;
      evento.data = data.data;
      evento.hora = data.hora;
      evento.tipo = data.tipo;
      evento.obs = data.obs;
      await updateData('agenda', evento);
      window.toast('✅ Atualizado');
    } else {
      const novo = {
        id: crypto.randomUUID(), // FIX: sem colisão
       ...data,
        pago: false,
        createdAt: new Date().toISOString()
      };
      await addData('agenda', novo);
      window.toast('✅ Criado');
    }

    dlg.close();
    bc.postMessage('update-agenda');
    await loadData();
    renderView();
  };

  dlg.showModal();
}

// TIMERS: pausa quando tab dorme
let timerInterval;
function startTimers() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (document.visibilityState!== 'visible') return;

    const agora = new Date();
    agendaCache.forEach(e => {
      if (e.pago || e.notificado) return;
      const eventoDate = parseDateTime(e.data, e.hora);
      const diff = (eventoDate - agora) / 1000 / 60;

      if (diff > 0 && diff <= 15) {
        new Notification(`⏰ ${e.titulo}`, { body: `Às ${e.hora}` });
        e.notificado = true;
        updateData('agenda', e);
      }
    });
  }, 60000); // Checa a cada 1min, não 1s
}

// Pede permissão notificação
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}