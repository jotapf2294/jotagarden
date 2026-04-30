// js/modules/gestao.js
import { getAll, save, remove } from '../db.js';

export const renderGestao = async () => {
  const container = document.getElementById('tab-gestao');
  if (!container) return;

  const insumos = await getAll('insumos');

  container.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
      
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
            <h2 style="color: var(--primary); font-size: 1.2rem;">➕ Novo Ingrediente</h2>
        </div>
        
        <form id="form-insumo" style="display: grid; gap: 16px; margin-top: 15px;">
          <div>
            <label>Nome do Ingrediente</label>
            <input type="text" id="insumo-nome" placeholder="Ex: Farinha T55" required>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
            <div>
                <label>Preço (€)</label>
                <input type="number" id="insumo-preco" placeholder="0.00" step="0.01" required>
            </div>
            <div>
                <label>Quantidade</label>
                <input type="number" id="insumo-qtd" placeholder="Qtd" step="0.01" required>
            </div>
            <div>
                <label>Unidade</label>
                <select id="insumo-unidade">
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="un">un</option>
                    <option value="l">L</option>
                    <option value="ml">ml</option>
                </select>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" style="padding: 12px; font-weight: bold;">
             GUARDAR INGREDIENTE
          </button>
        </form>
      </div>

      <div class="card">
        <div class="card-header">
            <h2 style="font-size: 1.1rem;">📦 Meus Insumos Registados</h2>
            <span class="badge">${insumos.length} itens</span>
        </div>
        
        <div id="lista-insumos" style="display: grid; gap: 12px; margin-top: 15px;">
          ${insumos.length === 0 ? 
            `<div class="empty-state">
                <p style="color: var(--text-secondary)">Nenhum ingrediente registado.</p>
             </div>` : 
            insumos.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-hover);">
              <div>
                <div style="font-weight: bold; color: var(--text);">${item.nome}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                    ${item.preco}€ / ${item.qtd}${item.unidade} 
                    <span style="color: var(--success); margin-left: 10px; font-weight: 600;">
                        (${(item.preco / item.qtd).toFixed(4)}€ / ${item.unidade})
                    </span>
                </div>
              </div>
              <button class="btn btn-danger btn-sm btn-delete" data-id="${item.id}">
                🗑️
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Lógica do Formulário (Otimizada)
  document.getElementById('form-insumo').onsubmit = async (e) => {
    e.preventDefault();
    const novo = {
      id: Date.now().toString(),
      nome: document.getElementById('insumo-nome').value,
      preco: parseFloat(document.getElementById('insumo-preco').value),
      qtd: parseFloat(document.getElementById('insumo-qtd').value),
      unidade: document.getElementById('insumo-unidade').value
    };
    await save('insumos', novo);
    renderGestao(); 
  };

  // Lógica de Apagar (Delegada para o container)
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.onclick = async () => {
      if (confirm('Deseja apagar este ingrediente? Isto afetará os cálculos das receitas.')) {
        await remove('insumos', btn.dataset.id);
        renderGestao();
      }
    };
  });
};
