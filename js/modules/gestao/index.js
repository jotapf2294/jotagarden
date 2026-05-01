import { getAll, save, remove } from '../../db.js';
import { calcularTotalGeral } from '../receitas/logic.js';

export const renderGestao = async () => {
    const container = document.getElementById('tab-gestao');
    if (!container) return;

    const [receitas, insumos] = await Promise.all([getAll('receitas'), getAll('insumos')]);
    const valorStock = insumos.reduce((acc, i) => acc + ((parseFloat(i.preco) || 0)), 0);
    const categoriasInsumos = [...new Set(insumos.map(i => i.categoria || 'Geral'))];

    container.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto; padding: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 25px; background: white; padding: 20px; border-radius: 12px; box-shadow: var(--shadow);">
                <div><h2>📦 Gestão de Inventário</h2></div>
                <div style="text-align: right;"><b>STOCK TOTAL: ${valorStock.toFixed(2)} €</b></div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr 100px; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="ins-search" placeholder="🔍 Pesquisar ingrediente..." style="padding: 12px; border-radius: 10px; border: 1px solid var(--border);">
                <select id="ins-filter-cat" style="padding: 12px; border-radius: 10px; border: 1px solid var(--border);">
                    <option value="Todos">Categorias</option>
                    ${categoriasInsumos.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
                <button id="btn-novo-insumo" style="background: var(--primary); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">➕</button>
            </div>

            <div style="background: white; border-radius: 12px; box-shadow: var(--shadow); overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8fafc; text-align: left; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 12px;">Ingrediente</th>
                            <th style="padding: 12px; text-align: center;">Preço (€)</th>
                            <th style="padding: 12px; text-align: center;">Stock</th>
                            <th style="padding: 12px; text-align: center;">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="insumos-tbody">
                        ${insumos.map(i => `
                            <tr class="insumo-row" data-nome="${i.nome.toLowerCase()}" data-cat="${i.categoria || 'Geral'}" style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 12px;"><b>${i.nome}</b><br><small>${i.categoria || 'Geral'}</small></td>
                                <td style="padding: 12px; text-align: center;">${parseFloat(i.preco).toFixed(2)}€</td>
                                <td style="padding: 12px; text-align: center;">
                                    <span style="color: ${i.qtd <= 100 ? 'red' : 'green'}; font-weight: bold;">${i.qtd} ${i.un}</span>
                                </td>
                                <td style="padding: 12px; text-align: center; display: flex; gap: 10px; justify-content: center;">
                                    <button onclick="window.abrirEdicaoInsumo('${i.id}')" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">✏️</button>
                                    <button onclick="window.eliminarInsumo('${i.id}')" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="modal-insumo" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:400px;">
                <h3 id="modal-title">Novo Ingrediente</h3>
                <form id="form-novo-insumo">
                    <input type="text" id="new-ins-nome" placeholder="Nome" required style="width:100%; padding:10px; margin-bottom:10px;">
                    <input type="text" id="new-ins-cat" placeholder="Categoria" required style="width:100%; padding:10px; margin-bottom:10px;">
                    <div style="display:flex; gap:10px;">
                        <input type="number" id="new-ins-preco" step="0.01" placeholder="Preço" style="flex:1; padding:10px;">
                        <input type="number" id="new-ins-qtd" step="0.001" placeholder="Stock" style="flex:1; padding:10px;">
                    </div>
                    <select id="new-ins-un" style="width:100%; padding:10px; margin:10px 0;">
                        <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="un">un</option>
                    </select>
                    <button type="submit" style="width:100%; padding:15px; background:var(--primary); color:white; border:none; border-radius:8px;">GRAVAR</button>
                    <button type="button" onclick="document.getElementById('modal-insumo').style.display='none'" style="width:100%; margin-top:5px; border:none; background:none;">Cancelar</button>
                </form>
            </div>
        </div>
    `;
    setupGestaoEvents();
};

const setupGestaoEvents = () => {
    const search = document.getElementById('ins-search');
    const filter = document.getElementById('ins-filter-cat');
    const form = document.getElementById('form-novo-insumo');

    search.oninput = () => {
        const termo = search.value.toLowerCase();
        const cat = filter.value;
        document.querySelectorAll('.insumo-row').forEach(row => {
            const match = row.dataset.nome.includes(termo) && (cat === 'Todos' || row.dataset.cat === cat);
            row.style.display = match ? 'table-row' : 'none';
        });
    };
    filter.onchange = search.oninput;
    document.getElementById('btn-novo-insumo').onclick = () => {
        form.reset();
        delete form.dataset.editId;
        document.getElementById('modal-insumo').style.display = 'flex';
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = form.dataset.editId || Date.now().toString();
        const dados = {
            id, nome: document.getElementById('new-ins-nome').value,
            categoria: document.getElementById('new-ins-cat').value,
            preco: document.getElementById('new-ins-preco').value,
            qtd: document.getElementById('new-ins-qtd').value,
            un: document.getElementById('new-ins-un').value
        };
        await save('insumos', dados);
        renderGestao();
    };
};

window.abrirEdicaoInsumo = async (id) => {
    const insumos = await getAll('insumos');
    const i = insumos.find(x => x.id === id);
    const form = document.getElementById('form-novo-insumo');
    form.dataset.editId = id;
    document.getElementById('new-ins-nome').value = i.nome;
    document.getElementById('new-ins-cat').value = i.categoria;
    document.getElementById('new-ins-preco').value = i.preco;
    document.getElementById('new-ins-qtd').value = i.qtd;
    document.getElementById('new-ins-un').value = i.un;
    document.getElementById('modal-insumo').style.display = 'flex';
};

window.eliminarInsumo = async (id) => { if(confirm("Eliminar?")){ await remove('insumos', id); renderGestao(); }};
