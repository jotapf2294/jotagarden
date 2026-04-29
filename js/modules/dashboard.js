// js/modules/dashboard.js
import { getAllData } from '../db.js';

// Utilitários internos para evitar erros de import
const toNumber = (val) => {
  const n = parseFloat(String(val).replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

const formatCurrency = (val) => 
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);

const hojeISO = () => new Date().toISOString().split('T')[0];

export const renderDashboard = async () => {
  const container = document.getElementById('tab-dashboard');
  if (!container) return;

  // 1. Limpar e criar esqueleto
  container.innerHTML = `
    <div class="dash-grid">
      <div class="dash-card">
        <small>💰 Faturação Hoje</small>
        <h2 id="stat-faturacao">0,00 €</h2>
      </div>
      <div class="dash-card">
        <small>📦 Encomendas Hoje</small>
        <h2 id="stat-encomendas">0</h2>
      </div>
      <div class="dash-card">
        <small>📖 Receitas Totais</small>
        <h2 id="stat-receitas">0</h2>
      </div>
    </div>
    
    <div class="dash-section" style="margin-top:20px">
      <h3>📅 Próximas Entregas</h3>
      <div id="lista-entregas" class="dash-list">Carregando...</div>
    </div>

    <style>
      .dash-grid { display: grid; gap: 15px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
      .dash-card { background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-left: 4px solid var(--primary, #e91e63); }
      .dash-card small { color: #666; text-transform: uppercase; font-size: 0.7rem; }
      .dash-card h2 { margin: 5px 0 0; color: #333; }
      .dash-list { background: #fff; border-radius: 12px; padding: 10px; margin-top: 10px; }
      .entrega-item { padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
    </style>
  `;

  // 2. Carregar dados
  try {
    const [agenda, receitas] = await Promise.all([
      getAllData('agenda'),
      getAllData('receitas')
    ]);

    const hoje = hojeISO();
    const hojeAgenda = agenda.filter(e => e.data === hoje);
    
    // Cálculo de faturação
    let totalHoje = 0;
    hojeAgenda.forEach(enc => {
      const rec = receitas.find(r => r.nome === enc.pedido);
      if (rec) totalHoje += toNumber(rec.venda);
    });

    // Atualizar UI
    document.getElementById('stat-faturacao').textContent = formatCurrency(totalHoje);
    document.getElementById('stat-encomendas').textContent = hojeAgenda.length;
    document.getElementById('stat-receitas').textContent = receitas.length;

    // Lista de entregas
    const lista = document.getElementById('lista-entregas');
    if (hojeAgenda.length === 0) {
      lista.innerHTML = '<p style="padding:10px; color:#999">Nenhuma entrega para hoje.</p>';
    } else {
      lista.innerHTML = hojeAgenda.map(enc => `
        <div class="entrega-item">
          <span><strong>${enc.hora || '--:--'}</strong> - ${enc.cliente}</span>
          <span style="color:var(--primary)">${enc.pedido}</span>
        </div>
      `).join('');
    }

  } catch (err) {
    console.error("Erro no dashboard:", err);
    container.innerHTML += `<p style="color:red">Erro ao carregar dados: ${err.message}</p>`;
  }
};
