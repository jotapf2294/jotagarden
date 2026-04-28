import { renderDashboard } from './modules/dashboard.js';
import { renderReceitas } from './modules/receitas/index.js';
import { renderAgenda } from './modules/agenda.js';
import { renderGestao } from './modules/gestao.js';

console.log('🚀 Doce Gestão v3.5 iniciando...');

const theme = {
  init() {
    const saved = localStorage.getItem('docegestao-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const current = saved || (prefersDark ? 'dark' : 'light');
    this.set(current);
    const toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.onclick = () => this.toggle();
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

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').then(reg => {
      console.log('SW registrado');
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
    }).catch(err => console.error('SW erro:', err));
  });
}

function showUpdateToast(onClick) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = '✨ Nova versão disponível. Toca para atualizar';
  el.classList.add('show');
  el.onclick = () => {
    onClick();
    el.classList.remove('show');
  };
}

function toast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.onclick = null;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

window.addEventListener('online', () => toast('✅ Online'));
window.addEventListener('offline', () => toast('📴 Modo offline'));
window.toast = toast;

// === APP PRINCIPAL ===
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📱 DOM carregado');
  theme.init();
  
  const allButtons = document.querySelectorAll('.nav-btn, .nav-item');
  const tabs = document.querySelectorAll('.tab-content');

  if (!tabs.length) {
    console.error('❌ Não encontrou .tab-content no HTML');
    document.body.innerHTML = `
      <div style="padding:40px;text-align:center">
        <h1>⚠️ Erro de carregamento</h1>
        <p>Não encontrou as abas. Verifica o index.html</p>
      </div>
    `;
    return;
  }

  // FIX: switchTab agora é async e tem try/catch
  const switchTab = async (targetId) => {
    console.log('🔄 Mudando para:', targetId);
    
    tabs.forEach(t => t.classList.remove('active'));
    allButtons.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    
    const targetTab = document.getElementById(`tab-${targetId}`);
    if (!targetTab) {
      console.error('❌ Não encontrou tab:', targetId);
      return;
    }
    
    targetTab.classList.add('active');
    document.querySelectorAll(`[data-target="${targetId}"]`).forEach(btn => {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    });

    // FIX: await + try/catch pra não rebentar
    try {
      if (targetId === 'dashboard') await renderDashboard();
      if (targetId === 'receitas') await renderReceitas();
      if (targetId === 'agenda') await renderAgenda();
      if (targetId === 'gestao') await renderGestao();
      console.log('✅ Renderizou:', targetId);
    } catch (err) {
      console.error('❌ Erro ao renderizar', targetId, err);
      targetTab.innerHTML = `
        <div class="empty-state">
          <div class="emoji">⚠️</div>
          <h2>Erro ao carregar</h2>
          <p style="font-size:.875rem;color:var(--text-secondary);margin:12px 0">${err.message}</p>
          <button class="btn btn-primary" onclick="location.reload()">Recarregar Página</button>
        </div>
      `;
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Event listeners nos botões
  allButtons.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const target = e.currentTarget.dataset.target;
      if (target) switchTab(target);
    });
  });

  // Arranca com dashboard
  console.log('🎯 Iniciando dashboard...');
  await switchTab('dashboard');
});

// Debug global de erros JS
window.addEventListener('error', (e) => {
  console.error('💥 Erro global:', e.error);
  window.toast('❌ Erro: ' + e.message);
});

// Debug de promises rejeitadas
window.addEventListener('unhandledrejection', (e) => {
  console.error('💥 Promise rejeitada:', e.reason);
  window.toast('❌ Erro: ' + e.reason);
});
