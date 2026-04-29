// js/app.js
import { initDB } from './db.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderGestao } from './modules/gestao.js';

/**
 * Função Placeholder para módulos que ainda vamos construir
 */
const renderPlaceholder = (targetId) => {
  const container = document.getElementById(`tab-${targetId}`);
  if (container) {
    const nomes = { receitas: 'Fichas Técnicas', agenda: 'Agenda' };
    container.innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">
      <h3>🛠️ Próximo passo: ${nomes[targetId] || targetId}</h3>
      <p>Este módulo será migrado a seguir.</p>
    </div>`;
  }
};

/**
 * Maestro de Navegação (Router)
 */
const router = async (targetId) => {
  console.log(`🧭 A navegar para: ${targetId}`);
  
  // 1. Atualizar UI: Esconder todas as abas e desativar botões
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  // 2. Ativar a aba e o botão correto
  const targetTab = document.getElementById(`tab-${targetId}`);
  const targetBtn = document.querySelector(`[data-target="${targetId}"]`);
  
  if (targetTab) targetTab.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');

  // 3. Renderizar o conteúdo dinâmico
  try {
    if (targetId === 'dashboard') {
      await renderDashboard();
    } else if (targetId === 'gestao') {
      await renderGestao();
    } else {
      renderPlaceholder(targetId);
    }
  } catch (err) {
    console.error(`💥 Erro ao carregar aba ${targetId}:`, err);
    if (targetTab) {
      targetTab.innerHTML = `<div style="color:red; padding:20px;">Erro: ${err.message}</div>`;
    }
  }
};

/**
 * Inicialização do Sistema
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('⚡ Iniciando Doce Gestão...');

  try {
    // Inicializa a BD antes de tudo
    await initDB();
    console.log('✅ Base de Dados Operacional');

    // Configura os eventos de clique nos botões da nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-target');
        router(target);
      });
    });

    // Carrega o dashboard inicial
    await router('dashboard');

  } catch (error) {
    console.error('🚨 Erro fatal no arranque:', error);
    document.body.innerHTML = `<div style="padding:40px; color:red;">
      <h2>🚨 Erro Crítico</h2>
      <p>${error}</p>
    </div>`;
  }
});
