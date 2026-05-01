import { getAll, save, remove } from '../../db.js';
import { calcularTotalGeral } from '../receitas/logic.js';

export const renderGestao = async () => {
    const container = document.getElementById('tab-gestao');
    if (!container) return;

    const [receitas, insumos] = await Promise.all([
        getAll('receitas'),
        getAll('insumos')
    ]);

    // Cálculo do valor total em stock
    const valorStock = insumos.reduce((acc, i) => acc + (parseFloat(i.preco) || 0), 0);
    
    // Categorias únicas de insumos para o filtro
    const categoriasInsumos = [...new Set(insumos.map(i => i.categoria || 'Geral'))];

    container.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto; padding: 15px; font-family: sans-serif;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; background: white; padding: 20px; border-radius: 12px; box-shadow: var(--shadow);">
                <div>
                    <h2 style="color: var(--primary); margin: 0;">📦 Gestão de Inventário</h2>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 0.9rem;">Controlo de preços e categorias de ingredientes</p>
                </div>
                <div style="text-align: right;">
                    <small style="color: #64748b; font-weight: bold;">INVESTIMENTO EM STOCK</small>
                    <div style="font-size: 22px; font-weight: bold; color: #1e3a8a;">${valorStock.toFixed(2)} €</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr 150px; gap: 15px; margin-bottom: 20px;">
                <input type="text" id="insumo-search" placeholder="🔍 Pesquisar ingrediente..." 
                    style="padding: 12px; border-radius: 10px; border: 1px solid var(--border);">
                
                <select id="insumo-filter-cat" style="padding: 12px; border-radius: 10px; border: 1px solid var(--border);">
                    <option value="Todos">Todas as Categorias</option>
                    ${categoriasInsumos.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>

                <button id="btn-novo-insumo" style="background: var(--primary); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">
                    ➕ NOVO
                </button>
            </div>

            <div style="background: white; border-radius: 12px; box-shadow: var(--shadow); overflow: hidden; border: 1px solid var(--border);">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: #f8fafc; text-align: left; color: #475569; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 15px;">Ingrediente</th>
                            <th style="padding: 15px;">Categoria</th>
                            <th style="padding: 15px; text-align: center;">Preço (€)</th>
                            <th style="padding: 15px; text-align: center;">Qtd Base</th>
                            <th style="padding: 15px; text-align: center;">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="insumos-tbody">
                        ${insumos.map(i => `
                            <tr class="insumo-row" data-nome="${i.nome.toLowerCase()}" data-cat="${i.categoria || 'Geral'}" style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 15px; font-weight: bold; color: #1e293b;">${i.nome}</td>
                                <td style="padding: 15px; color: #64748b;">
                                    <span style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem;">${i.categoria || 'Geral'}</span>
                                </td>
                                <td style="padding: 15px; text-align: center;">
                                    <input type="number" step="0.01" value="${i.preco}" 
                                        onchange="window.atualizarRapidoInsumo('${i.id}', 'preco', this.value)"
                                        style="width: 70px; padding: 5px; border-radius: 4px; border: 1px solid #eee; text-align: center;">
                                </td>
                                <td style="padding: 15px; text-align: center;">
                                    <input type="number" step="0.001" value="${i.qtd}" 
                                        onchange="window.atualizarRapidoInsumo('${i.id}', 'qtd', this.value)"
                                        style="width: 70px; padding: 5px; border-radius: 4px; border: 1px solid #eee; text-align: center;">
                                    <small>${i.un}</small>
                                </td>
                                <td style="padding: 15px; text-align: center;">
                                    <button onclick="window.eliminarInsumo('${i.id}')" style="background:none; border:none; cursor:pointer; font-size: 1.1rem;">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="modal-insumo" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; align-items:center; justify-content:center;">
            <div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:400px;">
                <h3 style="margin-top:0; color:var(--primary);">Novo Ingrediente</h3>
                <form id="form-novo-insumo">
                    <input type="text" id="new-ins-nome" placeholder="Nome (ex: Chocolate Belga)" required style="width:100%; padding:10px; margin-bottom:10px; border-radius:8px; border:1px solid #ddd;">
                    <input type="text" id="new-ins-cat" placeholder="Categoria (ex: Laticínios)" required style="width:100%; padding:10px; margin-bottom:10px; border-radius:8px; border:1px solid #ddd;">
                    <div style="display:flex; gap:10px; margin-bottom:10px;">
                        <input type="number" id="new-ins-preco" placeholder="Preço €" step="0.01" required style="flex:1; padding:10px; border-radius:8px; border:1px solid #ddd;">
                        <input type="number" id="new-ins-qtd" placeholder="Qtd" step="0.001" required style="flex:1; padding:10px; border-radius:8px; border:1px solid #ddd;">
                        <select id="new-ins-un" style="padding:10px; border-radius:8px; border:1px solid #ddd;">
                            <option value="g">g</option><option value="kg">kg</option>
                            <option value="ml">ml</option><option value="un">un</option>
                        </select>
                    </div>
                    <div style="display:flex; gap:10px; margin-top:15px;">
                        <button type="button" onclick="document.getElementById('modal-insumo').style.display='none'" style="flex:1; padding:12px; border:none; border-radius:8px; cursor:pointer;">Cancelar</button>
                        <button type="submit" style="flex:1; padding:12px; background:var(--primary); color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">GRAVAR</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    setupGestaoEvents(insumos);
};

const setupGestaoEvents = (insumos) => {
    const searchInput = document.getElementById('insumo-search');
    const filterCat = document.getElementById('insumo-filter-cat');
    const btnNovo = document.getElementById('btn-novo-insumo');
    const modal = document.getElementById('modal-insumo');
    const form = document.getElementById('form-novo-insumo');

    // Pesquisa e Filtro por Categoria
    const filtrar = () => {
        const termo = searchInput.value.toLowerCase();
        const cat = filterCat.value;
        document.querySelectorAll('.insumo-row').forEach(row => {
            const bateNome = row.dataset.nome.includes(termo);
            const bateCat = (cat === 'Todos' || row.dataset.cat === cat);
            row.style.display = (bateNome && bateCat) ? 'table-row' : 'none';
        });
    };

    if (searchInput) searchInput.oninput = filtrar;
    if (filterCat) filterCat.onchange = filtrar;
    if (btnNovo) btnNovo.onclick = () => modal.style.display = 'flex';

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const novo = {
                id: Date.now().toString(),
                nome: document.getElementById('new-ins-nome').value,
                categoria: document.getElementById('new-ins-cat').value,
                preco: document.getElementById('new-ins-preco').value,
                qtd: document.getElementById('new-ins-qtd').value,
                un: document.getElementById('new-ins-un').value
            };
            await save('insumos', novo);
            renderGestao();
        };
    }
};

// Edição rápida de preço ou stock diretamente na tabela
window.atualizarRapidoInsumo = async (id, campo, valor) => {
    const insumos = await getAll('insumos');
    const i = insumos.find(x => x.id === id);
    if (i) {
        i[campo] = valor;
        await save('insumos', i);
        console.log(`✅ ${campo} atualizado para ${valor}`);
    }
};

window.eliminarInsumo = async (id) => {
    if (confirm("Eliminar este ingrediente?")) {
        await remove('insumos', id);
        renderGestao();
    }
};
