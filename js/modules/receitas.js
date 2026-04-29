// js/modules/receitas.js
import { getAll, save, remove } from '../db.js';

export const renderReceitas = async () => {
  const container = document.getElementById('tab-receitas');
  if (!container) return;

  // 1. Carregar dados da DB
  const [receitas, insumos] = await Promise.all([
    getAll('receitas'),
    getAll('insumos')
  ]);

  // Função auxiliar para calcular o custo de uma receita
  const calcularCustoTotal = (ingredientesSelecionados) => {
    return ingredientesSelecionados.reduce((total, ing) => {
      const insumoInfo = insumos.find(i => i.id === ing.idInsumo);
      if (insumoInfo) {
        // Cálculo: (Preço / Qtd Original) * Qtd Usada
        const custoIngrediente = (parseFloat(insumoInfo.preco) / parseFloat(insumoInfo.qtd)) * parseFloat(ing.qtd);
        return total + custoIngrediente;
      }
      return total;
    }, 0);
  };

  // 2. Renderizar HTML
  container.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
      <div style="background: white; padding: 20px; border-radius: var(--radius); shadow: var(--shadow); margin-bottom: 30px;">
        <h3 style="margin-top:0; color: var(--primary);">📖 Nova Ficha Técnica</h3>
        <form id="form-receita" style="display: flex; flex-direction: column; gap: 15px;">
          <input type="text" id="rec-nome" placeholder="Nome da Receita (Ex: Bolo de Chocolate)" required style="padding: 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 16px;">
          
          <div style="display: flex; gap: 10px;">
            <input type="number" id="rec-rendimento" placeholder="Rende quanto?" required style="flex: 1; padding: 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 16px;">
            <input type="text" id="rec-unidade" placeholder="Unidade (ex: fatias, kg)" required style="flex: 1; padding: 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 16px;">
          </div>

          <div style="border: 1px solid #eee; padding: 15px; border-radius: 8px; background: #fafafa;">
            <label style="font-weight: bold; display: block; margin-bottom: 10px;">Adicionar Ingredientes:</label>
            
            <div style="display: flex; gap: 8px; margin-bottom: 15px;">
              <select id="sel-insumo" style="flex: 2; padding: 10px; border-radius: 6px; border: 1px solid #ccc;">
                <option value="">Escolher ingrediente...</option>
                ${insumos.map(i => `<option value="${i.id}">${i.nome} (${i.unidade})</option>`).join('')}
              </select>
              <input type="number" id="qtd-insumo-rec" placeholder="Qtd" step="0.01" style="flex: 1; padding: 10px; border-radius: 6px; border: 1px solid #ccc;">
              <button type="button" id="btn-add-ing" style="background: #2ecc71; color: white; border: none; padding: 0 15px; border-radius: 6px; cursor: pointer; font-weight: bold;">+</button>
            </div>

            <div id="lista-temp-ingredientes" style="display: flex; flex-wrap: wrap; gap: 8px;">
              </div>
          </div>

          <button type="submit" style="background: var(--primary); color: white; border: none; padding: 15px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 16px;">
            Guardar Ficha Técnica
          </button>
        </form>
      </div>

      <div id="lista-receitas">
        <h3 style="margin-bottom: 15px;">Minhas Receitas</h3>
        <div style="display: grid; gap: 15px;">
          ${receitas.length === 0 ? '<p style="color: #666; text-align: center;">Ainda não tens receitas criadas.</p>' : ''}
          ${receitas.map(r => {
            const custoTotal = calcularCustoTotal(r.ingredientes);
            const custoPorUnidade = custoTotal / parseFloat(r.rendimento);
            
            return `
              <div style="background: white; padding: 20px; border-radius: var(--radius); border-left: 6px solid var(--primary); box-shadow: var(--shadow); position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                  <div>
                    <strong style="font-size: 1.2rem; display: block;">${r.nome}</strong>
                    <span style="font-size: 0.85rem; color: #666;">Rendimento: ${r.rendimento} ${r.unidade}</span>
                  </div>
                  <button class="btn-del-rec" data-id="${r.id}" style="background: none; border: none; color: #ff7675; cursor: pointer; font-size: 1.2rem;">🗑️</button>
                </div>
                
                <div style="display: flex; gap: 20px; background: #fff5f7; padding: 10px; border-radius: 8px;">
                  <div>
                    <div style="font-size: 0.75rem; color: #666; text-transform: uppercase;">Custo Total</div>
                    <div style="font-weight: bold; color: #d63031;">${custoTotal.toFixed(2)}€</div>
                  </div>
                  <div style="border-left: 1px solid #fab1a0; padding-left: 20px;">
                    <div style="font-size: 0.75rem; color: #666; text-transform: uppercase;">Por ${r.unidade.slice(0, -1) || 'unid.'}</div>
                    <div style="font-weight: bold; color: var(--primary);">${custoPorUnidade.toFixed(2)}€</div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  // --- LÓGICA DO FORMULÁRIO ---
  const listaTemp = [];
  const divTemp = document.getElementById('lista-temp-ingredientes');

  // Adicionar ingrediente à lista temporária
  document.getElementById('btn-add-ing').onclick = () => {
    const idInsumo = document.getElementById('sel-insumo').value;
    const qtd = document.getElementById('qtd-insumo-rec').value;
    const insumoObj = insumos.find(i => i.id === idInsumo);

    if (insumoObj && qtd) {
      listaTemp.push({ idInsumo, nome: insumoObj.nome, qtd: parseFloat(qtd) });
      
      // Atualizar as etiquetas visuais
      divTemp.innerHTML = listaTemp.map(item => `
        <span style="background: #e17055; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">
          ${item.nome}: ${item.qtd}
        </span>
      `).join('');

      // Limpar campos
      document.getElementById('sel-insumo').value = '';
      document.getElementById('qtd-insumo-rec').value = '';
    }
  };

  // Guardar a Receita na DB
  document.getElementById('form-receita').onsubmit = async (e) => {
    e.preventDefault();
    if (listaTemp.length === 0) return alert("Por favor, adiciona pelo menos um ingrediente!");

    const novaReceita = {
      id: Date.now().toString(),
      nome: document.getElementById('rec-nome').value,
      rendimento: document.getElementById('rec-rendimento').value,
      unidade: document.getElementById('rec-unidade').value,
      ingredientes: listaTemp
    };

    await save('receitas', novaReceita);
    renderReceitas(); // Recarregar a lista
  };

  // Apagar Receita
  container.querySelectorAll('.btn-del-rec').forEach(btn => {
    btn.onclick = async () => {
      if (confirm('Desejas apagar esta ficha técnica?')) {
        await remove('receitas', btn.dataset.id);
        renderReceitas();
      }
    };
  });
};
