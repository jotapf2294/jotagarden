import { getAll } from '../../db.js';
import { calcularTotalGeral } from '../receitas/logic.js';

export const renderGestao = async () => {
    const container = document.getElementById('tab-gestao');
    if (!container) return;

    // Busca dados atualizados de receitas e insumos para os cálculos
    const [receitas, insumos] = await Promise.all([
        getAll('receitas'),
        getAll('insumos')
    ]);

    // Cálculo de Inventário Total
    const valorStock = insumos.reduce((acc, i) => acc + (parseFloat(i.preco) || 0), 0);

    // Organizar receitas por categoria para a tabela
    const categorias = [...new Set(receitas.map(r => r.categoria || 'Sem Categoria'))];

    container.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto; padding: 15px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h2 style="color: var(--primary); margin: 0;">📊 Gestão de Resultados</h2>
                <div style="background: var(--primary); color: white; padding: 8px 15px; border-radius: 8px; font-size: 0.9rem;">
                    Stock Total: <strong>${valorStock.toFixed(2)} €</strong>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 15px; margin-bottom: 20px;">
                <input type="text" id="gestao-search" placeholder="🔍 Pesquisar produto na gestão..." 
                    style="padding: 12px; border-radius: 10px; border: 1px solid var(--border); box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);">
                <select id="gestao-filter-cat" style="padding: 12px; border-radius: 10px; border: 1px solid var(--border);">
                    <option value="Todos">Todas as Categorias</option>
                    ${categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>

            <div style="background: white; border-radius: 12px; box-shadow: var(--shadow); overflow: hidden; border: 1px solid var(--border);">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: #f8fafc; text-align: left; color: #475569; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 15px;">Produto / Categoria</th>
                            <th style="padding: 15px; text-align: center;">Custo Unit.</th>
                            <th style="padding: 15px; text-align: center;">Sugestão Venda (Markup 3x)</th>
                            <th style="padding: 15px; text-align: center;">Margem Bruta</th>
                        </tr>
                    </thead>
                    <tbody id="gestao-tbody">
                        ${renderTableRows(receitas, insumos)}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1;">
                    <h4 style="margin-top: 0; color: var(--primary);">🎯 Ponto de Equilíbrio</h4>
                    <p style="font-size: 0.8rem; color: #64748b;">Insira os seus custos fixos mensais (Renda, Luz, Internet):</p>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="number" id="fixos-mensais" value="500" style="padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; width: 100px;">
                        <span style="font-weight: bold;">€ / mês</span>
                    </div>
                </div>
                <div style="background: var(--primary); color: white; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; justify-content: center;">
                    <span style="font-size: 0.8rem; opacity: 0.9;">Faturação mínima necessária:</span>
                    <h3 id="meta-faturacao" style="margin: 5px 0 0 0; font-size: 1.8rem;">---</h3>
                </div>
            </div>
        </div>
    `;

    setupGestaoEvents(receitas, insumos);
};

// Função auxiliar para gerar as linhas da tabela (facilita o filtro)
const renderTableRows = (receitas, insumos) => {
    return receitas.map(r => {
        const custoTotal = calcularTotalGeral(r.ingredientes, insumos);
        const custoUnit = custoTotal / (parseFloat(r.rendPorcoes) || 1);
        const precoSugerido = custoUnit * 3;
        const margem = precoSugerido > 0 ? ((precoSugerido - custoUnit) / precoSugerido) * 100 : 0;

        return `
            <tr class="gestao-row" data-nome="${r.nome.toLowerCase()}" data-cat="${r.categoria}" style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 15px;">
                    <div style="font-weight: bold; color: #1e293b;">${r.nome}</div>
                    <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">${r.categoria}</div>
                </td>
                <td style="padding: 15px; text-align: center; color: #475569;">${custoUnit.toFixed(2)} €</td>
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
    const searchInput = document.getElementById('gestao-search');
    const filterCat = document.getElementById('gestao-filter-cat');
    const fixosInput = document.getElementById('fixos-mensais');
    const metaDisplay = document.getElementById('meta-faturacao');

    const aplicarFiltros = () => {
        const termo = searchInput.value.toLowerCase();
        const categoria = filterCat.value;
        const rows = document.querySelectorAll('.gestao-row');

        rows.forEach(row => {
            const nome = row.getAttribute('data-nome');
            const cat = row.getAttribute('data-cat');
            const bateNome = nome.includes(termo);
            const bateCat = (categoria === 'Todos' || cat === categoria);

            row.style.display = (bateNome && bateCat) ? 'table-row' : 'none';
        });
    };

    const calcularMeta = () => {
        const fixos = parseFloat(fixosInput.value) || 0;
        // Consideramos uma margem de contribuição média de 65%
        const vendasNecessarias = fixos / 0.65;
        metaDisplay.innerText = vendasNecessarias.toFixed(2) + " €";
    };

    if (searchInput) searchInput.oninput = aplicarFiltros;
    if (filterCat) filterCat.onchange = aplicarFiltros;
    if (fixosInput) {
        fixosInput.oninput = calcularMeta;
        calcularMeta();
    }
};
                  
