// js/app.js
import { initDB } from './db.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderGestao } from './modules/gestao.js'; // NOVO

const router = async (targetId) => {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  const targetTab = document.getElementById(`tab-${targetId}`);
  const targetBtn = document.querySelector(`[data-target="${targetId}"]`);
  
  if (targetTab) targetTab.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');

  try {
    if (targetId === 'dashboard') await renderDashboard();
    if (targetId === 'gestao') await renderGestao(); // NOVO
    if (targetId === 'receitas') document.getElementById('tab-receitas').innerHTML = '🛠️ Próximo passo: Fichas Técnicas';
    if (targetId === 'agenda') document.getElementById('tab-agenda').innerHTML = '📅 Próximo passo: Agenda';
  } catch (err) {
    console.error(err);
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await initDB();
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => router(btn.dataset.target);
  });
  router('dashboard');
});

// Controlador de Navegação
const router = async (targetId) => {
  console.log(`🧭 A navegar para: ${targetId}`);
  
  // 1. Atualizar UI dos botões e abas
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  document.getElementById(`tab-${targetId}`)?.classList.add('active');
  document.querySelector(`[data-target="${targetId}"]`)?.classList.add('active');

  // 2. Carregar o módulo correspondente
  const container = document.getElementById(`tab-${targetId}`);
  
  try {
    if (targetId === 'dashboard') {
      await renderDashboard();
    } else {
      renderPlaceholder(targetId);
    }
  } catch (err) {
    console.error(`💥 Erro fatal ao renderizar ${targetId}:`, err);
    if (container) {
      container.innerHTML = `<div class="sys-error">Falha ao carregar aba.<br><small>${err.message}</small></div>`;
    }
  }
};

// Arranque Global (Bootstrap)
document.addEventListener('DOMContentLoaded', async () => {
  console.log('⚡ Iniciando Sistema...');

  try {
    // Garante que a DB liga antes de mostrar qualquer ecrã
    await initDB();
    console.log('✅ Base de Dados Operacional');
    
    // Configura os cliques no menu
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-target');
        router(target);
      });
    });

    // Arranca o Dashboard por defeito
    await router('dashboard');

  } catch (error) {
    // Se a app morrer na raiz, mostramos um ecrã de pânico
    document.getElementById('app-main').innerHTML = `
      <div class="sys-error" style="margin: 40px;">
        <h3>🚨 Falha Crítica no Arranque</h3>
        <p>${error}</p>
      </div>
    `;
  }
});
