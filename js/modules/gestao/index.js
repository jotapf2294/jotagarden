import { getAll, save, remove } from '../../db.js';

export const renderGestao = async () => {
    const container = document.getElementById('tab-gestao');
    if (!container) return;

    const insumos = await getAll('insumos');
    const valorStock = insumos.reduce((acc, i) => acc + (parseFloat(i.preco) || 0), 0);
    const categoriasInsumos = [...new Set(insumos.map(i => i.categoria || 'Geral'))];

    container.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto; padding: 15px; font-family: sans-serif;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; background: white; padding: 20px; border-radius: 12px; box-shadow: var(--shadow);">
                <div>
                    <h2 style="color: var(--primary); margin: 0;">📦 Gestão de Inventário</h2>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 0.9rem;">Controlo Real de Stock e Preços</p>
                </div>
                <div style="text-align: right;">
                    <small style="color: #64748b; font-weight: bold;">VALOR EM STOCK</small>
                    <div style="font-size: 22px; font-weight: bold; color: #1e3a8a;">${valorStock.toFixed(2)} €</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr 100px; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="ins-search" placeholder="🔍 Pesquisar ingrediente..." style="padding: 12px; border-radius: 10px; border: 1px solid var(--border);">
                <select id="ins-filter-cat" style="padding: 12px; border-radius: 10px; border: 1px solid var(--border);">
                    <option value="Todos">Categorias</option>
                    ${categoriasInsumos.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
                <button id="btn-novo-ins" style="background: var(--primary); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">➕ NOVO</button>
            </div>

            <div style="background: white; border-radius: 12px; box-shadow: var(--shadow); overflow-x: auto; border: 1px solid var(--border);">
                <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                    <thead>
                        <tr style="background: #f8fafc; text-align: left; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 15px;">Ingrediente</th>
                            <th style="padding: 15px; text-align: center;">Preço (€)</th>
                            <th style="padding: 15px; text-align: center;">Stock</th>
                            <th style="padding: 15px; text-align: center;">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="insumos-tbody">
                        ${insumos.map(i => `
                            <tr class="insumo-row" data-nome="${i.nome.toLowerCase()}" data-cat="${i.categoria || 'Geral'}" style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 15px;">
                                    <div style="font-weight: bold;">${i.nome}</div>
                                    <div style="font-size: 0.7rem; color: #94a3b8;">${i.categoria || 'Geral'}</div>
                                </td>
                                <td style="padding: 15px; text-align: center;">${parseFloat(i.preco).toFixed(2)}€</td>
                                <td style="padding: 15px; text-align: center;">
                                    <span style="background: ${i.qtd <= 0 ? '#fee2e2' : '#f0fdf4'}; color: ${i.qtd <= 0 ? '#991b1b' : '#166534'}; padding: 5px 10px; border-radius: 6px; font-weight: bold;">
                                        ${i.qtd} ${i.un}
                                    </span>
                                </td>
                                <td style="padding: 15px; text-align: center;">
                                    <button onclick="window.abrirEdicaoInsumo('${i.id}')" style="background:none; border:none; cursor:pointer; font-size: 1.2rem; margin-right: 10px;">✏️</button>
                                    <button onclick="window.eliminarInsumo('${i.id}')" style="background:none; border:none; cursor:pointer; font-size: 1.2rem;">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="modal-insumo" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; align-items:center; justify-content:center; padding: 20px;">
            <div style="background:white; padding:25px; border-radius:15px; width:100%; max-width:400px;">
                <h3 id="modal-title" style="margin-top:0;">Ingrediente</h3>
                <form id="form-insumo-gestao">
                    <input type="text" id="ins-nome" placeholder="Nome" required style="width:100%; padding:10px; margin-bottom:10px; box-sizing:border-box;">
                    <input type="text" id="ins-cat" placeholder="Categoria" required style="width:100%; padding:10px; margin-bottom:10px; box-sizing:border-box;">
                    <div style="display:flex; gap:10px; margin-bottom:10px;">
                        <input type="number" id="ins-preco" step="0.01" placeholder="Preço €" required style="flex:1; padding:10px; box-sizing:border-box;">
                        <input type="number" id="ins-qtd" step="0.001" placeholder="Stock" required style="flex:1; padding:10px; box-sizing:border-box;">
                    </div>
                    <select id="ins-un" style="width:100%; padding:10px; margin-bottom:15px;">
                        <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="un">un</option>
                    </select>
                    <button type="submit" style="width:100%; padding:15px; background:var(--primary); color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">GRAVAR</button>
                    <button type="button" onclick="document.getElementById('modal-insumo').style.display='none'" style="width:100%; margin-top:10px; border:none; background:none; cursor:pointer; color:#64748b;">Cancelar</button>
                </form>
            </div>
        </div>
    `;
    setupGestaoEvents();
};

const setupGestaoEvents = () => {
    const search = document.getElementById('ins-search');
    const filter = document.getElementById('ins-filter-cat');
    const btnNovo = document.getElementById('btn-novo-ins');
    const form = document.getElementById('form-insumo-gestao');

    if (search) {
        search.oninput = () => {
            const termo = search.value.toLowerCase();
            const cat = filter.value;
            document.querySelectorAll('.insumo-row').forEach(row => {
                const match = row.dataset.nome.includes(termo) && (cat === 'Todos' || row.dataset.cat === cat);
                row.style.display = match ? 'table-row' : 'none';
            });
        };
    }
    if (filter) filter.onchange = () => search.oninput();
    if (btnNovo) btnNovo.onclick = () => {
        form.reset();
        delete form.dataset.editId;
        document.getElementById('modal-insumo').style.display = 'flex';
    };

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const id = form.dataset.editId || Date.now().toString();
            const novo = {
                id,
                nome: document.getElementById('ins-nome').value,
                categoria: document.getElementById('ins-cat').value,
                preco: document.getElementById('ins-preco').value,
                qtd: document.getElementById('ins-qtd').value,
                un: document.getElementById('ins-un').value
            };
            await save('insumos', novo);
            renderGestao();
        };
    }
};

window.abrirEdicaoInsumo = async (id) => {
    const insumos = await getAll('insumos');
    const i = insumos.find(x => x.id === id);
    if (!i) return;
    const form = document.getElementById('form-insumo-gestao');
    form.dataset.editId = id;
    document.getElementById('ins-nome').value = i.nome;
    document.getElementById('ins-cat').value = i.categoria;
    document.getElementById('ins-preco').value = i.preco;
    document.getElementById('ins-qtd').value = i.qtd;
    document.getElementById('ins-un').value = i.un;
    document.getElementById('modal-insumo').style.display = 'flex';
};

window.eliminarInsumo = async (id) => {
    if (confirm("Deseja eliminar este ingrediente?")) {
        await remove('insumos', id);
        renderGestao();
    }
};
