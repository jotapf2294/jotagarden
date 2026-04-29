// js/modules/dashboard.js
import { getAll } from '../db.js';

export const renderDashboard = async () => {
  const container = document.getElementById('tab-dashboard');
  if (!container) return;

  try {
    // Vamos buscar dados de forma segura
    const [receitas, agenda] = await Promise.all([
      getAll('receitas'),
      getAll('agenda')
    ]);

    // Injetamos o HTML no ecrã
    container.innerHTML = `
      <div style="background: var(--card); padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="margin-top: 0; color: var(--primary);">🚀 Sistema Operacional!</h2>
        <p>A arquitetura base está a funcionar a 100%.</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px;">
          <div style="background: var(--bg); padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; font-weight: bold; color: var(--text);">${receitas.length}</div>
            <div style="font-size: 0.8rem; color: #666; text-transform: uppercase;">Receitas Salvas</div>
          </div>
          <div style="background: var(--bg); padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; font-weight: bold; color: var(--text);">${agenda.length}</div>
            <div style="font-size: 0.8rem; color: #666; text-transform: uppercase;">Eventos na Agenda</div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="sys-error"><b>Erro no Dashboard:</b><br>${error.message}</div>`;
  }
};
