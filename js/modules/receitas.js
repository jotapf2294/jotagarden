// js/modules/receitas.js
import { getAll, save, remove } from '../db.js';

export const renderReceitas = async () => {
  const container = document.getElementById('tab-receitas');
  if (!container) return;

  const [receitas, insumos] = await Promise.all([
    getAll('receitas'),
    getAll('insumos')
  ]);

  container.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
      <div style="background: white; padding: 20px; border-radius: var(--radius); shadow: var(--shadow); margin-bottom: 20px;">
        <h3 style="margin-top:0">📖 Nova Receita</h3>
        <form id="form-receita" style="display: flex; flex-direction: column; gap: 15px;">
          <input type="text" id="rec-nome" placeholder="Nome da Receita (Ex: Brownie)" required style="padding: 12px; border: 1px solid var(--border); border-radius: 8px;">
          
          <div style="display: flex; gap: 10px;">
            <input type="number" id="rec-rendimento" placeholder="Rende (Ex: 10)" required style="flex: 1; padding: 12px; border: 1px solid var(--border); border-radius: 8px;">
            <input type="text" id="rec-unidade" placeholder="Unid. (Ex: fatias)" required style="flex: 1; padding: 12px; border: 1px solid var(--border); border-radius: 8px;">
          </div>

          <div id="ingredientes-selecionados" style="border-top: 1px solid #eee; padding-top: 15px;">
            <label style="font-weight: bold; font-size: 0.9rem;">Ingredientes:</label>
            <div id="lista-temp-ingredientes" style="margin: 10px 0;"></div>
            
            <div style="display: flex; gap: 5px; background: #f8f9fa; padding: 10px; border-radius: 8px;">
              <select id="sel-insumo" style="flex: 2; padding: 8px; border-radius: 4px;">
                <option value="">Escolher Insumo...</option>
                ${insumos.map(i => `<option value="${i.id}">${i.nome}</option>`).join('')}
              </select>
              <input type="number" id="qtd-insumo-rec" placeholder="Qtd" style="flex: 1; padding: 8px; border-radius: 4px;">
              <button type="button" id="btn-add-ing" style="background: #2ecc71; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">+</button>
            </div>
          </div>

          <button type="submit" style="background: var(--primary); color: white; border: none; padding: 15px; border-radius: 8px; font-weight: bold; cursor: pointer;">Guardar Receita Completa</button>
        </form>
      </div>

      <div id="lista-receitas">
        <h3 style="margin-bottom: 15px;">Minhas Fichas Técnicas</h3>
        <div style="display: grid; gap: 15px;">
          ${receitas.map(r => `
            <div style="background: white; padding: 15px; border-radius: var(--radius); border-left: 5px solid var(--primary); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 1.1rem;">${r.nome}</strong>
                <div style="font-size: 0.85rem; color: #666;">Rendimento: ${r.rendimento} ${r.unidade}</div>
              </div>
              <button class="btn-del-rec" data-id="${r.id}" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.2rem;">🗑️</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Lógica para adicionar ingredientes à lista temporária antes de guardar a receita
  const listaTemp = [];
  const divTemp = document.getElementById('lista-temp-ingredientes');

  document.getElementById('btn-add-ing').onclick = () => {
    const idInsumo = document.getElementById('sel-insumo').value;
    const qtd = document.getElementById('qtd-insumo-rec').value;
    const insumoObj = insumos.find(i => i.id === idInsumo);

    if (insumoObj && qtd) {
      listaTemp.push({ idInsumo, nome: insumoObj.nome, qtd: parseFloat(qtd) });
      divTemp.innerHTML = listaTemp.map(item => `
        <div style="font-size: 0.9rem; background: #eee; padding: 5px 10px; border-radius: 20px; display: inline-block; margin-right: 5px;">
          ${item.nome}: ${item.qtd} <small>un/g/ml</small>
        </div>
      `).join('');
      document.getElementById('qtd-insumo-rec').value = '';
    }
  };

  // Guardar Receita
  document.getElementById('form-receita').onsubmit = async (e) => {
    e.preventDefault();
    if (listaTemp.length === 0) return alert("Adiciona pelo menos um ingrediente!");

    const novaReceita = {
      id: Date.now().toString(),
      nome: document.getElementById('rec-nome').value,
      rendimento: document.getElementById('rec-rendimento').value,
      unidade: document.getElementById('rec-unidade').value,
      ingredientes: listaTemp
    };

    await save('receitas', novaReceita);
    renderReceitas();
  };

  // Apagar Receita
  container.querySelectorAll('.btn-del-rec').forEach(btn => {
    btn.onclick = async () => {
      if (confirm('Apagar esta receita?')) {
        await remove('receitas', btn.dataset.id);
        renderReceitas();
      }
    };
  });
};
