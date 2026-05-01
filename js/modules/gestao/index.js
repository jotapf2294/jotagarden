import { getAll, save, remove } from '../../db.js';
import { calcularTotalGeral } from '../receitas/logic.js';

export const renderGestao = async () => {
    const container = document.getElementById('tab-gestao');
    if (!container) return;

    const [receitas, insumos] = await Promise.all([
        getAll('receitas'),
        getAll('insumos')
    ]);

    const valorStock = insumos.reduce((acc, i) => acc + (parseFloat(i.preco) || 0), 0);
    const categoriasReceitas = [...new Set(receitas.map(r => r.categoria || 'Sem Categoria'))];

    container.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto; padding: 15px; font-family: sans-serif;">
            
            <details style="background: white; padding: 15px; border-radius: 12px; box-shadow: var(--shadow); margin-bottom: 25px; border: 1px solid var(--border);">
                <summary style="cursor:pointer; font-weight:bold; color:var(--primary);">➕ Adicionar Novo Ingrediente (Insumo)</summary>
                <form id="form-insumo" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 100px; gap: 10px; margin-top: 15px;">
                    <input type="text" id="ins-nome" placeholder="Nome do Ingrediente (ex: Farinha T55)" required style="padding:8px; border-radius:6px; border:1px solid #ddd;">
                    <input type="number" id="ins-preco" placeholder="Preço (€)" step="0.01" required style="padding:8px; border-radius:6px; border:1px solid #ddd;">
                    <input type="number" id="ins-qtd" placeholder="Qtd Base" step="0.001" required style="padding:8px; border-radius:6px; border:1px solid #ddd;">
                    <select id="ins-un" style="padding:8px; border-radius:6px; border:1px solid #ddd;">
                        <option value="g">gramas (g)</option>
                        <option value="kg">quilos (kg)</option>
                        <option value="ml">mililitros (ml)</option>
                        <option value="un">unidades (un)</option>
                    </select>
                    <button type="submit" style="background:var(--primary); color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">GRAVAR</button>
                </form>
                
                <div id="mini-lista-insumos" style="margin-top: 15px; max-height: 150px; overflow-y: auto; font-size: 0.8rem; border-top: 1px solid #eee; padding-top: 10px;">
                    ${insumos.map(i => `
                        <div style="display:flex; justify-content:space-between; padding: 5px; border-bottom: 1px solid #f9f9f9;">
                            <span>${i.nome} - ${i.preco}€ / ${i.qtd}${i.un}</span>
                            <button onclick="window.eliminarInsumo('${i.id}')" style="background:none; border:none; color:red; cursor:pointer;">🗑️</button>
                        </div>
                    `).join('')}
                </div>
            </details>

            <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: var(--primary); margin: 0;">📊 Gestão de Resultados</h2>
                <div style="background: #f1f5f9; padding: 10px 20px; border-radius: 10px; border: 1px solid #cbd5e1;">
                    <small style="color: #64748b; display: block; font-size: 0.7rem;">VALOR TOTAL EM STOCK</small>
                    <strong style="font-size: 1.2rem; color: #1e3a8a;">${valorStock.toFixed(2)} €</strong>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 15px; margin-bottom: 20px;">
                <input type="text" id="gestao-search" placeholder="🔍 Pesquisar produto..." style="padding: 12px; border-radius: 10px; border: 1px solid var(--border);">
                <select id="gestao-filter-cat" style="padding: 12px; border-radius: 10px; border: 1px solid var(--border);">
                    <option value="Todos">Todas as Categorias</option>
                    ${categoriasReceitas.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>

            <div style="background: white; border-radius: 12px; box-shadow: var(--shadow); overflow: hidden; border: 1px solid var(--border);">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: #f8fafc; text-align: left; color: #475569; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 15px;">Produto / Categoria</th>
                            <th style="padding: 15px; text-align: center;">Custo Unit.</th>
                            <th style="padding: 15px; text-align: center;">Sugestão (3x)</th>
                            <th style="padding: 15px; text-align: center;">Margem Bruta</th>
                        </tr>
                    </thead>
                    <tbody id="gestao-tbody">
                        ${renderTableRows(receitas, insumos)}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    setupGestaoEvents(receitas, insumos);
};

const renderTableRows = (receitas, insumos) => {
    return receitas.map(r => {
        const custoTotal = calcularTotalGeral(r.ingredientes, insumos);
        const custoUnit = custoTotal / (parseFloat(r.rendPorcoes) || 1);
        const precoSugerido = custoUnit * 3;
        const margem = precoSugerido > 0 ? ((precoSugerido - custoUnit) / precoSugerido) * 100 : 0;

        return `
            <tr class="gestao-row" data-nome="${r.nome.toLowerCase()}" data-cat="${r.categoria}" style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 15px;">
                    <div style="font-weight: bold;">${r.nome}</div>
                    <div style="font-size: 0.7rem; color: #94a3b8;">${r.categoria}</div>
                </td>
                <td style="padding: 15px; text-align: center;">${custoUnit.toFixed(2)} €</td>
                <td style="padding: 15px; text-align: center; font-weight: bold; color: #059669;">${precoSugerido.toFixed(2)} €</td>
                <td style="padding: 15px; text-align: center;">
                    <span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 20px; font-weight: bold; font-size: 0.75rem;">
                        ${margem.toFixed(0)}%
                    </span>
                </td>
            </tr>
        `;
    }).join('');
};

const setupGestaoEvents = (receitas, insumos) => {
    const formInsumo = document.getElementById('form-insumo');
    const searchInput = document.getElementById('gestao-search');
    const filterCat = document.getElementById('gestao-filter-cat');

    if (formInsumo) {
        formInsumo.onsubmit = async (e) => {
            e.preventDefault();
            const novo = {
                id: Date.now().toString(),
                nome: document.getElementById('ins-nome').value,
                preco: document.getElementById('ins-preco').value,
                qtd: document.getElementById('ins-qtd').value,
                un: document.getElementById('ins-un').value
            };
            await save('insumos', novo);
            renderGestao(); // Recarrega a aba
        };
    }

    if (searchInput) {
        searchInput.oninput = () => {
            const termo = searchInput.value.toLowerCase();
            const cat = filterCat.value;
            document.querySelectorAll('.gestao-row').forEach(row => {
                const bateNome = row.dataset.nome.includes(termo);
                const bateCat = (cat === 'Todos' || row.dataset.cat === cat);
                row.style.display = (bateNome && bateCat) ? 'table-row' : 'none';
            });
        };
    }

    if (filterCat) {
        filterCat.onchange = () => searchInput.oninput();
    }
};

// Função global para eliminar insumos
window.eliminarInsumo = async (id) => {
    if (confirm("Deseja eliminar este ingrediente? Isso afetará os custos das receitas!")) {
        await remove('insumos', id);
        renderGestao();
    }
};
