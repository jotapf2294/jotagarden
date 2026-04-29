// js/app.js
import { initDB } from './db.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderGestao } from './modules/gestao.js';
import { renderReceitas } from './modules/receitas.js'; // ADICIONADO

const router = async (targetId) => {
  // ... (mesma lógica de UI de antes) ...

  try {
    if (targetId === 'dashboard') await renderDashboard();
    if (targetId === 'gestao') await renderGestao();
    if (targetId === 'receitas') await renderReceitas(); // ADICIONADO
    if (targetId === 'agenda') document.getElementById('tab-agenda').innerHTML = '📅 Próximo passo: Agenda';
  } catch (err) {
    console.error(err);
  }
};
  
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

        // Configura os cliques em TODOS os botões de navegação (Sidebar + Bottom Nav)
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-target');
        
        // Sincroniza todos os botões com o mesmo target
        document.querySelectorAll('.nav-btn').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-target') === target);
        });

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
