import { renderDashboard } from './modules/dashboard.js';
import { renderReceitas } from './modules/receitas.js';
import { renderAgenda } from './modules/agenda.js';
import { renderGestao } from './modules/gestao.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registado', reg.scope))
      .catch(err => console.error('SW erro', err));
  });
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

window.addEventListener('online', () => toast('✅ Online'));
window.addEventListener('offline', () => toast('📴 Modo offline'));

document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.nav-btn');
  const tabs = document.querySelectorAll('.tab-content');

  const switchTab = (targetId) => {
    tabs.forEach(t => t.classList.remove('active'));
    buttons.forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${targetId}`).classList.add('active');
    document.querySelector(`[data-target="${targetId}"]`).classList.add('active');

    if (targetId === 'dashboard') renderDashboard();
    if (targetId === 'receitas') { renderReceitas(); setTimeout(()=>{ document.querySelector('.rec-item')?.click() }, 100); }
    if (targetId === 'agenda') renderAgenda();
    if (targetId === 'gestao') renderGestao();
  };

  buttons.forEach(btn => {
    btn.addEventListener('click', e => switchTab(e.currentTarget.dataset.target));
  });

  renderDashboard();
});
