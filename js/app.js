import { renderDashboard } from './modules/dashboard.js';
import { renderReceitas } from './modules/receitas.js';
import { renderAgenda } from './modules/agenda.js';
import { renderGestao } from './modules/gestao.js';

// SW com update flow
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateToast(() => {
              newSW.postMessage('SKIP_WAITING');
              window.location.reload();
            });
          }
        });
      });
    }).catch(err => console.error('SW erro', err));
  });
}

function showUpdateToast(onClick) {
  const el = document.getElementById('toast');
  el.textContent = '✨ Nova versão disponível. Toca para atualizar';
  el.classList.add('show');
  el.onclick = () => {
    onClick();
    el.classList.remove('show');
  };
}

function toast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.onclick = null;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

window.addEventListener('online', () => toast('✅ Online'));
window.addEventListener('offline', () => toast('📴 Modo offline'));
window.toast = toast;

document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.nav-btn');
  const tabs = document.querySelectorAll('.tab-content');

  const switchTab = (targetId) => {
    tabs.forEach(t => t.classList.remove('active'));
    buttons.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    
    document.getElementById(`tab-${targetId}`).classList.add('active');
    const btn = document.querySelector(`[data-target="${targetId}"]`);
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    if (targetId === 'dashboard') renderDashboard();
    if (targetId === 'receitas') renderReceitas();
    if (targetId === 'agenda') renderAgenda();
    if (targetId === 'gestao') renderGestao();
  };

  buttons.forEach(btn => {
    btn.addEventListener('click', e => switchTab(e.currentTarget.dataset.target));
  });

  renderDashboard();
});