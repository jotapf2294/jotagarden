// js/modules/receitas/index.js
import { getAll, save, remove } from '../../db.js';
import { calcularCustoTotalReceita } from './logic.js';

export const renderReceitas = async () => {
    const container = document.getElementById('tab-receitas');
    if (!container) return;

    const [receitas, insumos] = await Promise.all([
        getAll('receitas'),
        getAll('insumos')
    ]);

    container.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto;">
            <div style="background: white; padding: 20px; border-radius: var(--radius); box-shadow: var(--shadow); margin-bottom: 30px;">
                <h3 style="margin-top:0; color: var(--primary);">📖 Nova Ficha Técnica</h3>
                <form id="form-receita" style="display: flex; flex-direction: column; gap: 15px;">
                    <input type="text" id="rec-nome" placeholder="Nome da Receita" required style="padding: 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 16px;">
                    <div style="display: flex; gap: 10px;">
                        <input type="number" id="rec-rendimento" placeholder="Rendimento" required style="flex: 1; padding: 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 16px;">
                        <input type="text" id="rec-unidade" placeholder="Unid. (fatias, kg)" required style="flex: 1; padding: 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 16px;">
                    </div>
                    <div style="border: 1px solid #eee; padding: 15px; border-radius: 8px; background: #fafafa;">
                        <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                            <select id="sel-insumo" style="flex: 2; padding: 10px; border-radius: 6px; border: 1px solid #ccc;">
                                <option value="">Escolher ingrediente...</option>
                                ${insumos.map(i => `<option value="${i.id}">${i.nome} (${i.unidade})</option>`).join('')}
                            </select>
                            <input type="number" id="qtd-insumo-rec" placeholder="Qtd" step="0.01" style="flex: 1; padding: 10px; border-radius: 6px; border: 1px solid #ccc;">
                            <button type="button" id="btn-add-ing" style="background: #2ecc71; color: white; border: none; padding: 0 15px; border-radius: 6px; cursor: pointer; font-weight: bold;">+</button>
                        </div>
                        <div id="lista-temp-ingredientes" style="display: flex; flex-wrap: wrap; gap: 8px;"></div>
                    </div>
                    <button type="submit" style="background: var(--primary); color: white; border: none; padding: 15px; border-radius: 8px; font-weight: bold; cursor: pointer;">Guardar Ficha Técnica</button>
                </form>
            </div>

            <div id="lista-receitas">
                <h3 style="margin-bottom: 15px;">Minhas Receitas</h3>
                <div style="display: grid; gap: 15px;">
                    ${receitas.map(r => {
                        const custoTotal = calcularCustoTotalReceita(r.ingredientes, insumos);
                        const custoUnid = custoTotal / (parseFloat(r.rendimento) || 1);
                        return `
                            <div style="background: white; padding: 20px; border-radius: var(--radius); border-left: 6px solid var(--primary); box-shadow: var(--shadow);">
                                <div style="display: flex; justify-content: space-between;">
                                    <strong>${r.nome}</strong>
                                    <button class="btn-del-rec" data-id="${r.id}" style="background:none; border:none; color:#ff7675; cursor:pointer;">🗑️</button>
                                </div>
                                <div style="display: flex; gap: 20px; margin-top: 10px; background: #fff5f7; padding: 10px; border-radius: 8px;">
                                    <span>Custo Total: <b>${custoTotal.toFixed(2)}€</b></span>
                                    <span>Custo p/ ${r.unidade}: <b>${custoUnid.toFixed(2)}€</b></span>
                                </div>
                            </div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    `;

    // Lógica de manipulação de ingredientes e submissão (Mantida aqui por ser interface)
    const listaTemp = [];
    const divTemp = document.getElementById('lista-temp-ingredientes');

    document.getElementById('btn-add-ing').onclick = () => {
        const idInsumo = document.getElementById('sel-insumo').value;
        const qtd = document.getElementById('qtd-insumo-rec').value;
        const insumoObj = insumos.find(i => i.id === idInsumo);
        if (insumoObj && qtd) {
            listaTemp.push({ idInsumo, nome: insumoObj.nome, qtd: parseFloat(qtd) });
            divTemp.innerHTML = listaTemp.map(item => `<span style="background:#e17055; color:white; padding:4px 12px; border-radius:20px; font-size:0.85rem;">${item.nome}: ${item.qtd}</span>`).join('');
            document.getElementById('sel-insumo').value = '';
            document.getElementById('qtd-insumo-rec').value = '';
        }
    };

    document.getElementById('form-receita').onsubmit = async (e) => {
        e.preventDefault();
        if (listaTemp.length === 0) return alert("Adiciona ingredientes!");
        await save('receitas', {
            id: Date.now().toString(),
            nome: document.getElementById('rec-nome').value,
            rendimento: document.getElementById('rec-rendimento').value,
            unidade: document.getElementById('rec-unidade').value,
            ingredientes: listaTemp
        });
        renderReceitas();
    };

    container.querySelectorAll('.btn-del-rec').forEach(btn => {
        btn.onclick = async () => {
            if (confirm('Apagar?')) {
                await remove('receitas', btn.dataset.id);
                renderReceitas();
            }
        };
    });
};

