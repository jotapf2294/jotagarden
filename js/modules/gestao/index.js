import { getAll, save, remove, getById } from '../../db.js';

export const renderGestao = async () => {
    const container = document.getElementById('tab-gestao');
    if (!container) return;

    const insumos = await getAll('insumos');
    const valorStock = insumos.reduce((acc, i) => acc + (parseFloat(i.preco) || 0), 0);
    const categoriasInsumos = [...new Set(insumos.map(i => i.categoria || 'Geral'))];

    container.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto; padding: 15px;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; background: white; padding: 25px; border-radius: 16px; box-shadow: var(--shadow-md); border: 1px solid var(--border);">
                <div>
                    <h2 style="color: var(--primary); margin: 0; display: flex; align-items: center; gap: 10px;">
                        <span>📦</span> Gestão de Inventário
                    </h2>
                    <p style="margin: 5px 0 0 0; color: var(--text-secondary); font-size: 0.95rem;">Controlo de stock e custos de produção</p>
                </div>
                <div style="text-align: right; background: #f0f7ff; padding: 10px 20px; border-radius: 12px; border: 1px solid #e0e7ff;">
                    <small style="color: #4338ca; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Valor Total</small>
                    <div style="font-size: 24px; font-weight: 800; color: #1e3a8a;">${valorStock.toFixed(2)} €</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; margin-bottom: 20px;">
                <div style="position: relative;">
                    <input type="text" id="ins-search" placeholder="Pesquisar ingrediente..." 
                           style="padding: 14px 14px 14px 40px; border-radius: 12px; border: 1px solid var(--border); width: 100%;">
                    <span style="position: absolute; left: 14px; top: 14px;">🔍</span>
                </div>
                <select id="ins-filter-cat" style="padding: 12px; border-radius: 12px; border: 1px solid var(--border); background: white;">
                    <option value="Todos">Todas as Categorias</option>
                    ${categoriasInsumos.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
                <button id="btn-novo-ins" style="background: var(--primary); color: white; border: none; border-radius: 12px; padding: 0 25px; cursor: pointer; font-weight: bold; transition: 0.2s;">
                    ➕ NOVO
                </button>
            </div>

            <div style="background: white; border-radius: 16px; box-shadow: var(--shadow); overflow: hidden; border: 1px solid var(--border);">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 18px;">Ingrediente</th>
                            <th style="padding: 18px; text-align: center;">Preço Compra</th>
                            <th style="padding: 18px; text-align: center;">Stock Disponível</th>
                            <th style="padding: 18px; text-align: right;">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="insumos-tbody">
                        ${insumos.map(i => {
                            const isLow = parseFloat(i.qtd) <= 0;
                            return `
                            <tr class="insumo-row" data-nome="${i.nome.toLowerCase()}" data-cat="${i.categoria || 'Geral'}" style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;">
                                <td style="padding: 18px;">
                                    <div style="font-weight: 700; color: var(--text);">${i.nome}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${i.categoria || 'Geral'}</div>
                                </td>
                                <td style="padding: 18px; text-align: center; font-family: monospace; font-weight: 600;">
                                    ${parseFloat(i.preco).toFixed(2)}€
                                </td>
                                <td style="padding: 18px; text-align: center;">
                                    <span style="background: ${isLow ? '#fee2e2' : '#f0fdf4'}; 
                                                 color: ${isLow ? '#b91c1c' : '#15803d'}; 
                                                 padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; border: 1px solid ${isLow ? '#fecaca' : '#dcfce7'};">
                                        ${i.qtd} ${i.un}
                                    </span>
                                </td>
                                <td style="padding: 18px; text-align: right;">
                                    <div style="display: flex; justify-content: flex-end; gap: 10px;">
                                        <button onclick="window.reporStockRápido('${i.id}')" title="Repor Stock" 
                                                style="background: #eff6ff; border: 1px solid #bfdbfe; color: #2563eb; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                                            ➕ Repor
                                        </button>
                                        <button onclick="window.abrirEdicaoInsumo('${i.id}')" style="background:none; border:none; cursor:pointer; font-size: 1.1rem;">✏️</button>
                                        <button onclick="window.eliminarInsumo('${i.id}')" style="background:none; border:none; cursor:pointer; font-size: 1.1rem;">🗑️</button>
                                    </div>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="modal-insumo" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.7); z-index:9999; align-items:center; justify-content:center; backdrop-filter: blur(4px);">
            <div style="background:white; padding:30px; border-radius:20px; width:90%; max-width:450px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                <h3 id="modal-title" style="margin: 0 0 20px 0; font-size: 1.5rem; color: var(--text);">Ficha do Ingrediente</h3>
                <form id="form-insumo-gestao">
                    <div style="margin-bottom: 15px;">
                        <label style="display:block; font-size: 0.85rem; font-weight: 600; margin-bottom: 5px;">Nome do Ingrediente</label>
                        <input type="text" id="ins-nome" required style="width:100%; padding:12px; border: 1px solid var(--border); border-radius: 8px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display:block; font-size: 0.85rem; font-weight: 600; margin-bottom: 5px;">Categoria</label>
                        <input type="text" id="ins-cat" placeholder="Ex: Lacticínios, Farinhas..." required style="width:100%; padding:12px; border: 1px solid var(--border); border-radius: 8px;">
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom: 15px;">
                        <div>
                            <label style="display:block; font-size: 0.85rem; font-weight: 600; margin-bottom: 5px;">Preço (€)</label>
                            <input type="number" id="ins-preco" step="0.01" required style="width:100%; padding:12px; border: 1px solid var(--border); border-radius: 8px;">
                        </div>
                        <div>
                            <label style="display:block; font-size: 0.85rem; font-weight: 600; margin-bottom: 5px;">Stock Atual</label>
                            <input type="number" id="ins-qtd" step="0.001" required style="width:100%; padding:12px; border: 1px solid var(--border); border-radius: 8px;">
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display:block; font-size: 0.85rem; font-weight: 600; margin-bottom: 5px;">Unidade de Medida</label>
                        <select id="ins-un" style="width:100%; padding:12px; border: 1px solid var(--border); border-radius: 8px; background: white;">
                            <option value="g">Gramas (g)</option>
                            <option value="kg">Quilos (kg)</option>
                            <option value="ml">Mililitros (ml)</option>
                            <option value="un">Unidades (un)</option>
                        </select>
                    </div>
                    <button type="submit" style="width:100%; padding:16px; background:var(--primary); color:white; border:none; border-radius:12px; font-weight:bold; font-size: 1rem; cursor:pointer; box-shadow: 0 4px 6px -1px rgba(233, 30, 99, 0.4);">
                        GRAVAR INGREDIENTE
                    </button>
                    <button type="button" onclick="document.getElementById('modal-insumo').style.display='none'" style="width:100%; margin-top:12px; border:none; background:none; cursor:pointer; color:#64748b; font-weight: 500;">Cancelar</button>
                </form>
            </div>
        </div>
    `;
    setupGestaoEvents();
};

// --- LOGICA DE EVENTOS ---
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
        document.getElementById('modal-title').innerText = "Novo Ingrediente";
        document.getElementById('modal-insumo').style.display = 'flex';
    };

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const id = form.dataset.editId || Date.now().toString();
            const valorQtd = parseFloat(document.getElementById('ins-qtd').value);
            
            const novo = {
                id,
                nome: document.getElementById('ins-nome').value,
                categoria: document.getElementById('ins-cat').value,
                preco: document.getElementById('ins-preco').value,
                qtd: valorQtd,
                qtdOriginal: valorQtd, // Guardamos a dose padrão de compra
                un: document.getElementById('ins-un').value
            };
            
            await save('insumos', novo);
            document.getElementById('modal-insumo').style.display = 'none';
            renderGestao();
        };
    }
};

// --- FUNÇÕES GLOBAIS ---

window.reporStockRápido = async (id) => {
    const i = await getById('insumos', id);
    if (!i) return;

    // Se não houver qtdOriginal definida (em items antigos), usa a qtd atual como base
    const doseReposição = parseFloat(i.qtdOriginal) || parseFloat(i.qtd);
    
    if (confirm(`Deseja repor +${doseReposição}${i.un} de ${i.nome}?\nNovo stock: ${(parseFloat(i.qtd) + doseReposição).toFixed(2)}${i.un}`)) {
        i.qtd = parseFloat(i.qtd) + doseReposição;
        await save('insumos', i);
        renderGestao();
    }
};

window.abrirEdicaoInsumo = async (id) => {
    const i = await getById('insumos', id);
    if (!i) return;
    
    const form = document.getElementById('form-insumo-gestao');
    form.dataset.editId = id;
    document.getElementById('modal-title').innerText = "Editar " + i.nome;
    document.getElementById('ins-nome').value = i.nome;
    document.getElementById('ins-cat').value = i.categoria;
    document.getElementById('ins-preco').value = i.preco;
    document.getElementById('ins-qtd').value = i.qtd;
    document.getElementById('ins-un').value = i.un;
    document.getElementById('modal-insumo').style.display = 'flex';
};

window.eliminarInsumo = async (id) => {
    if (confirm("Tens a certeza que queres eliminar este ingrediente?")) {
        await remove('insumos', id);
        renderGestao();
    }
};
