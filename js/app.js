// js/app.js
import { initDB } from './db.js';
import { renderDashboard } from './modules/dashboard.js';

// Função para simular o "renderReceitas" enquanto não o crias de raiz
const renderReceitas = async () => {
  const container = document.getElementById('tab-receitas');
  if (container) {
    container.innerHTML = `<h2>📖 Área de Receitas (A funcionar)</h2>`;
  }
};

// Gestor de Abas Blindado
const switchTab = async (targetId) => {
  // Esconde todas
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  // Mostra a selecionada
  const targetTab = document.getElementById(`tab-${targetId}`);
  const targetBtn = document.querySelector(`[data-target="${targetId}"]`);
  
  if (targetTab) targetTab.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');

  // Renderiza com try/catch para evitar falhas silenciosas
  try {
    if (targetId === 'dashboard') await renderDashboard();
    if (targetId === 'receitas') await renderReceitas();
  } catch (err) {
    if (targetTab) {
      targetTab.innerHTML = `<div class="error-box">Erro ao carregar ${targetId}: ${err.message}</div>`;
    }
  }
};

// Arranque da Aplicação
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Inicia a DB antes de qualquer outra coisa
    await initDB();
    console.log("✅ DB Iniciada com sucesso");

    // 2. Configura os cliques dos botões
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-target');
        switchTab(target);
      });
    });

    // 3. Força a renderização inicial do Dashboard
    await switchTab('dashboard');

  } catch (error) {
    // Se a app morrer no arranque, avisa o utilizador no HTML
    document.body.innerHTML = `
      <div style="padding: 40px;">
        <div class="error-box">
          <h2>❌ Falha Fatal no Arranque</h2>
          <p>${error}</p>
          <p>Verifica a consola (F12) para mais detalhes.</p>
        </div>
      </div>
    `;
    console.error("Erro fatal no app.js:", error);
  }
});
