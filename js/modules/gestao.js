// js/modules/gestao.js
import { getAll, save, remove } from '../db.js';

export const renderGestao = async () => {
  const container = document.getElementById('tab-gestao');
  if (!container) return;

  const insumos = await getAll('insumos');

  container.innerHTML = `
    <div style="max-width: 600px; margin: 0 auto;">
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <h3 style="margin-top:0">➕ Novo Ingrediente</h3>
        <form id="form-insumo" style="display: flex; flex-direction: column; gap: 10px;">
          <input type="text" id="insumo-nome" placeholder="Ex: Farinha T55" required style="padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
          <div style="display: flex; gap: 10px;">
            <input type="number" id="insumo-preco" placeholder="Preço (€)" step="0.01" required style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            <input type="number" id="insumo-qtd" placeholder="Qtd" step="0.01" required style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            <select id="insumo-unidade" style="padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="un">un</option>
              <option value="l">L</option>
            </select>
          </div>
          <button type="submit" style="background: var(--primary); color: white; border: none; padding: 12px; border-radius: 4px; font-weight: bold; cursor: pointer;">Guardar Ingrediente</button>
        </form>
      </div>

      <div id="lista-insumos" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="margin-top:0">📦 Meus Insumos</h3>
        ${insumos.length === 0 ? '<p style="color:#666">Nenhum ingrediente registado.</p>' : ''}
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${insumos.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
              <div>
                <div style="font-weight: bold;">${item.nome}</div>
                <div style="font-size: 0.8rem; color: #666;">${item.preco}€ / ${item.qtd}${item.unidade}</div>
              </div>
              <button class="btn-delete" data-id="${item.id}" style="background: #fee2e2; color: #ef4444; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Apagar</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Lógica do Formulário
  document.getElementById('form-insumo').onsubmit = async (e) => {
    e.preventDefault();
    const novo = {
      id: Date.now().toString(),
      nome: document.getElementById('insumo-nome').value,
      preco: document.getElementById('insumo-preco').value,
      qtd: document.getElementById('insumo-qtd').value,
      unidade: document.getElementById('insumo-unidade').value
    };
    await save('insumos', novo);
    renderGestao(); // Atualiza a lista
  };

  // Lógica de Apagar
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.onclick = async () => {
      if (confirm('Apagar este ingrediente?')) {
        await remove('insumos', btn.dataset.id);
        renderGestao();
      }
    };
  });
};
