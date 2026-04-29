// js/modules/dashboard.js
import { initDB } from '../db.js';

export const renderDashboard = async () => {
  const container = document.getElementById('tab-dashboard');
  if (!container) return;

  try {
    // Tenta ligar à base de dados para garantir que funciona
    await initDB();
    
    // Injeta HTML diretamente
    container.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2>📊 Dashboard Ativo!</h2>
        <p style="color: green; font-weight: bold;">✅ JavaScript, Módulos e Base de Dados estão a comunicar perfeitamente.</p>
        <hr>
        <p>A partir daqui, podes começar a adicionar os teus gráficos e estatísticas de forma segura.</p>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="error-box">
        <h3>💥 Erro Crítico no Dashboard</h3>
        <p>${error}</p>
      </div>
    `;
  }
};
