import { initDB } from './js/db.js';
import { renderDashboard } from './js/modules/dashboard.js';
import { renderAgenda } from './js/modules/agenda.js';
import { renderGestao } from './js/modules/gestao.js';
import { renderReceitas } from './js/modules/receitas.js';

async function switchTab(targetId) {
  console.log("A tentar carregar aba:", targetId);
  const tabs = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.nav-btn, .nav-item');
  
  tabs.forEach(t => t.classList.remove('active'));
  buttons.forEach(b => b.classList.remove('active'));

  const targetTab = document.getElementById(`tab-${targetId}`);
  if (!targetTab) {
    alert("ERRO: Não encontrei no HTML o ID: tab-" + targetId);
    return;
  }

  targetTab.classList.add('active');
  document.querySelectorAll(`[data-target="${targetId}"]`).forEach(b => b.classList.add('active'));
  
  try {
    if (targetId === 'dashboard') await renderDashboard();
    if (targetId === 'receitas') await renderReceitas();
    if (targetId === 'agenda') await renderAgenda();
    if (targetId === 'gestao') await renderGestao();
    console.log("Renderizado com sucesso:", targetId);
  } catch (err) {
    console.error(err);
    targetTab.innerHTML = `<div style="color:red; padding:20px;">Erro ao carregar módulo: ${err.message}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initDB();
    // Forçar clique inicial
    switchTab('dashboard');
  } catch (e) {
    alert("Falha no arranque: " + e);
  }

  document.querySelectorAll('[data-target]').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.target);
  });
});
