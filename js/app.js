import { initDB } from '/db.js';
import { renderDashboard } from '/modules/dashboard.js';
import { renderAgenda } from '/modules/agenda.js';
import { renderGestao } from '/modules/gestao.js';
import { renderReceitas } from '/modules/receitas.js';

console.log('🚀 Doce Gestão v3.5 iniciando...');

const theme = {
  init() {
    const saved = localStorage.getItem('docegestao-theme');
    const current = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.set(current);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.onclick = () => this.toggle();
  },
  set(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('docegestao-theme', mode);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = mode === 'dark' ? '☀️' : '🌙';
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    this.set(current === 'dark' ? 'light' : 'dark');
  }
};

// Navegação e Renderização
async function switchTab(targetId) {
  const tabs = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.nav-btn, .nav-item');
  
  tabs.forEach(t => t.classList.remove('active'));
  buttons.forEach(b => b.classList.remove('active'));

  const targetTab = document.getElementById(`tab-${targetId}`);
  if (targetTab) {
    targetTab.classList.add('active');
    document.querySelectorAll(`[data-target="${targetId}"]`).forEach(b => b.classList.add('active'));
    
    try {
      if (targetId === 'dashboard') await renderDashboard();
      if (targetId === 'receitas') await renderReceitas();
      if (targetId === 'agenda') await renderAgenda();
      if (targetId === 'gestao') await renderGestao();
    } catch (err) {
      console.error('Erro ao renderizar aba:', err);
      targetTab.innerHTML = `<p style="padding:20px; color:red">Erro: ${err.message}</p>`;
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  theme.init();
  
  // Inicializa DB antes de tudo
  try {
    await initDB();
    console.log('✅ Base de Dados pronta');
  } catch (err) {
    alert('Erro fatal ao abrir DB: ' + err.message);
  }

  // Configura cliques
  document.querySelectorAll('[data-target]').forEach(btn => {
    btn.onclick = (e) => {
      const target = e.currentTarget.dataset.target;
      switchTab(target);
    };
  });

  // Carrega Dashboard inicial
  switchTab('dashboard');
});

// Toast Notifications
window.toast = (msg) => {
  const el = document.getElementById('toast');
  if (el) {
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
  }
};

// SW Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(console.error);
}
