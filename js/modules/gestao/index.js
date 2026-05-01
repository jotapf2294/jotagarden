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
    const categoriasInsumos = [...new Set(insumos.map(i => i.categoria || 'Geral'))];

    container.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto; padding: 15px; font-family: sans-serif;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; background: white; padding: 20px; border-radius: 12px; box-shadow: var(--shadow);">
                <div>
                    <h2 style="color: var(--primary); margin: 0;">📦 Gestão de Inventário</h2>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 0.9rem;">Preços e Stock Real</p>
                </div>
                <div style="text-align: right;">
                    <small style="color: #64748b; font-weight: bold;">INVESTIMENTO EM STOCK</small>
                    <div style="font-size: 22px; font-weight: bold; color: #1e3a8a;">${valorStock.toFixed(2)} €</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr 100px; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="insumo-search" placeholder="🔍 Pesquisar..." style="padding: 12px; border-radius: 10px; border: 1px solid var(--border);">
                <select id="insumo-filter-cat" style="padding: 12px; border-radius: 10px; border: 1px solid var(--border);">
                    <option value="Todos">Categorias</option>
                    ${categoriasInsumos.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
                <button id="btn-novo-insumo" style="background: var(--primary); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">➕</button>
            </div>

            <div style="background: white; border-radius: 12px; box-shadow: var(--shadow); overflow-x: auto; border: 1px solid var(--border);">
                <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                    <thead>
                        <tr style="background: #f8fafc; text-align: left; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 12px;">Ingrediente</th>
                            <th style="padding: 12px; text-align: center;">Preço (€)</th>
                            <th style="padding: 12px; text-align: center;">Stock Atual</th>
                            <th style="padding: 12px; text-align: center;">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="insumos-tbody">
                        ${insumos.map(i => `
                            <tr class="insumo-row" data-nome="${i.nome.toLowerCase()}" data-cat="${i.categoria || 'Geral'}" style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 12px;">
                                    <div style="font-weight: bold;">${i.nome}</div>
                                    <div style="font-size: 0.7rem; color: #94a3b8;">${i.categoria || 'Geral'}</div>
                                </td>
                                <td style="padding: 12px; text-align: center;">
                                    <input type="number" step="0.01" value="${i.preco}" onchange="window.atualizarRapidoInsumo('${i.id}', 'preco', this.value)" style="width: 80px; padding: 8px; border-radius: 6px; border: 1px solid #ddd; text-align: center;">
                                </td>
                                <td style="padding: 12px; text-align: center;">
                                    <div style="display: flex; align-items: center; justify-content: center; gap: 5px;">
                                        <input type="number" step="0.001" value="${i.qtd}" onchange="window.atualizarRapidoInsumo('${i.id}', 'qtd', this.value)" style="width: 90px; padding: 8px; border-radius: 6px; border: 1px solid #ddd; text-align: center;">
                                        <small style="color: #64748b;">${i.un}</small>
                                    </div>
                                </td>
                                <td style="padding: 12px; text-align: center;">
                                    <button onclick="window.eliminarInsumo('${i.id}')" style="background:none; border:none; cursor:pointer;">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="modal-insumo" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; align-items:center; justify-content:center; padding: 20px;">
            <div style="background:white; padding:25px; border-radius:15px; width:100%; max-width:450px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                <h3 style="margin-top:0; color:var(--primary); border-bottom: 1px solid #eee; padding-bottom: 10px;">Novo Ingrediente</h3>
                <form id="form-novo-insumo" style="margin-top: 15px;">
                    <label style="font-size: 0.8rem; font-weight: bold; color: #64748b;">NOME</label>
                    <input type="text" id="new-ins-nome" placeholder="Ex: Chocolate Belga" required style="width:100%; padding:12px; margin-bottom:15px; border-radius:8px; border:1px solid #ddd; box-sizing: border-box;">
                    
                    <label style="font-size: 0.8rem; font-weight: bold; color: #64748b;">CATEGORIA</label>
                    <input type="text" id="new-ins-cat" placeholder="Ex: Recheios" required style="width:100%; padding:12px; margin-bottom:15px; border-radius:8px; border:1px solid #ddd; box-sizing: border-box;">
                    
                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <label style="font-size: 0.8rem; font-weight: bold; color: #64748b;">PREÇO (€)</label>
                            <input type="number" id="new-ins-preco" step="0.01" required style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd; box-sizing: border-box;">
                        </div>
                        <div style="flex: 1;">
                            <label style="font-size: 0.8rem; font-weight: bold; color: #64748b;">STOCK/QTD</label>
                            <input type="number" id="new-ins-qtd" step="0.001" required style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd; box-sizing: border-box;">
                        </div>
                    </div>

                    <label style="font-size: 0.8rem; font-weight: bold; color: #64748b;">UNIDADE DE MEDIDA</label>
                    <select id="new-ins-un" style="width:100%; padding:12px; margin-bottom:20px; border-radius:8px; border:1px solid #ddd; background: white;">
                        <option value="g">gramas (g)</option>
                        <option value="kg">quilos (kg)</option>
                        <option value="ml">mililitros (ml)</option>
                        <option value="un">unidades (un)</option>
                    </select>

                    <div style="display:flex; gap:10px;">
                        <button type="button" onclick="document.getElementById('modal-insumo').style.display='none'" style="flex:1; padding:15px; border:none; border-radius:10px; cursor:pointer; background: #f1f5f9; font-weight: bold;">Cancelar</button>
                        <button type="submit" style="flex:1; padding:15px; background:var(--primary); color:white; border:none; border-radius:10px; cursor:pointer; font-weight:bold;">GRAVAR</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    setupGestaoEvents(insumos);
};

// --- FUNÇÃO DE BAIXA AUTOMÁTICA DE STOCK ---
export const descontarStockReceita = async (idReceita) => {
    const [receitas, insumos] = await Promise.all([getAll('receitas'), getAll('insumos')]);
    const r = receitas.find(x => x.id === idReceita);
    if (!r) return;

    for (const ing of r.ingredientes) {
        const insumoIdx = insumos.findIndex(i => i.id === ing.idInsumo);
        if (insumoIdx !== -1) {
            const qtdAtual = parseFloat(insumos[insumoIdx].qtd) || 0;
            const qtdGasta = parseFloat(ing.pesoBruto) || 0;
            insumos[insumoIdx].qtd = Math.max(0, qtdAtual - qtdGasta);
            await save('insumos', insumos[insumoIdx]);
        }
    }
    console.log(`📉 Stock atualizado para a receita: ${r.nome}`);
};

const setupGestaoEvents = (insumos) => {
    const searchInput = document.getElementById('insumo-search');
    const filterCat = document.getElementById('insumo-filter-cat');
    const btnNovo = document.getElementById('btn-novo-insumo');
    const modal = document.getElementById('modal-insumo');
    const form = document.getElementById('form-novo-insumo');

    if (searchInput) searchInput.oninput = () => {
        const termo = searchInput.value.toLowerCase();
        const cat = filterCat.value;
        document.querySelectorAll('.insumo-row').forEach(row => {
            const bateNome = row.dataset.nome.includes(termo);
            const bateCat = (cat === 'Todos' || row.dataset.cat === cat);
            row.style.display = (bateNome && bateCat) ? 'table-row' : 'none';
        });
    };

    if (filterCat) filterCat.onchange = () => searchInput.oninput();
    if (btnNovo) btnNovo.onclick = () => modal.style.display = 'flex';

    if (form) form.onsubmit = async (e) => {
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
};

window.atualizarRapidoInsumo = async (id, campo, valor) => {
    const insumos = await getAll('insumos');
    const i = insumos.find(x => x.id === id);
    if (i) {
        i[campo] = valor;
        await save('insumos', i);
    }
};

window.eliminarInsumo = async (id) => {
    if (confirm("Eliminar este ingrediente?")) {
        await remove('insumos', id);
        renderGestao();
    }
};
