// js/modules/receitas/index.js
import { getAll, save, remove, getById } from '../../db.js'; // Garante que tens o getById no db.js
import { calcularFC, calcularCustoIngrediente, calcularTotalGeral } from './logic.js';

let ingredientesTemp = [];
let fotoBase64 = "";
let modoEdicaoId = null;

export const renderReceitas = async () => {
    const container = document.getElementById('tab-receitas');
    if (!container) return;

    const [receitas, insumos] = await Promise.all([
        getAll('receitas'),
        getAll('insumos')
    ]);

    container.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto; padding: 10px;">
            <details id="details-form" style="background: white; padding: 15px; border-radius: 12px; box-shadow: var(--shadow); margin-bottom: 20px;">
                <summary id="form-title" style="cursor:pointer; font-weight:bold; color:var(--primary);">➕ Nova Ficha Técnica / Editar</summary>
                <form id="form-receita" style="display: grid; gap: 12px; margin-top:15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <input type="text" id="rec-nome" placeholder="Nome da Receita" required style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                        <select id="rec-categoria" style="padding: 10px; border-radius: 8px;">
                            <option value="Bolos">Bolos</option>
                            <option value="Tartes">Tartes</option>
                            <option value="Salgados">Salgados</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <input type="number" id="rec-rendimento" placeholder="Rende" required style="padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                        <input type="text" id="rec-unidade" placeholder="Ex: fatias" required style="padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                        <input type="file" id="rec-foto" accept="image/*" style="font-size: 12px;">
                    </div>
                    <div style="background: #f0f2f5; padding: 10px; border-radius: 8px;">
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 40px; gap: 5px;">
                            <select id="sel-insumo" style="padding: 8px;">
                                <option value="">Escolher Insumo...</option>
                                ${insumos.map(i => `<option value="${i.id}">${i.nome}</option>`).join('')}
                            </select>
                            <input type="number" id="inp-bruto" placeholder="Bruto" step="0.001">
                            <input type="number" id="inp-liquido" placeholder="Líq.">
                            <button type="button" id="btn-add-ing" style="background:var(--primary); color:white; border:none; border-radius:4px;">+</button>
                        </div>
                        <div id="lista-temp-ing" style="margin-top:10px; display:flex; flex-wrap:wrap; gap:5px;"></div>
                    </div>
                    <textarea id="rec-preparo" placeholder="Passo a passo da produção..." style="padding: 10px; border-radius: 8px; height: 80px;"></textarea>
                    <div style="display:flex; gap:10px;">
                        <button type="submit" style="flex:2; background:#27ae60; color:white; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer;">Guardar Alterações</button>
                        <button type="button" id="btn-cancelar-edit" style="flex:1; background:#95a5a6; color:white; border:none; border-radius:8px; cursor:pointer;">Cancelar</button>
                    </div>
                </form>
            </details>

            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="search-receita" placeholder="🔍 Pesquisar receitas..." style="flex: 1; padding: 12px; border-radius: 25px; border: 1px solid #ddd; outline:none;">
            </div>

            <div id="lista-receitas-cards" style="display: grid; gap: 15px;"></div>
        </div>

        <div id="print-area" class="only-print"></div>
    `;

    setupEvents(receitas, insumos);
    renderCards(receitas, insumos);
};

const setupEvents = (receitas, insumos) => {
    const btnAdd = document.getElementById('btn-add-ing');
    btnAdd.onclick = () => {
        const id = document.getElementById('sel-insumo').value;
        const bruto = document.getElementById('inp-bruto').value;
        const liquido = document.getElementById('inp-liquido').value;
        const insumo = insumos.find(i => i.id === id);

        if (insumo && bruto) {
            ingredientesTemp.push({ 
                idInsumo: id, 
                nome: insumo.nome, 
                un: insumo.unidade,
                pesoBruto: parseFloat(bruto), 
                pesoLiquido: parseFloat(liquido || bruto) 
            });
            atualizarListaTemp();
            ['inp-bruto', 'inp-liquido', 'sel-insumo'].forEach(i => document.getElementById(i).value = '');
        }
    };

    document.getElementById('form-receita').onsubmit = async (e) => {
        e.preventDefault();
        const nova = {
            id: modoEdicaoId || Date.now().toString(),
            nome: document.getElementById('rec-nome').value,
            categoria: document.getElementById('rec-categoria').value,
            rendimento: document.getElementById('rec-rendimento').value,
            unidade: document.getElementById('rec-unidade').value,
            preparo: document.getElementById('rec-preparo').value,
            foto: fotoBase64,
            ingredientes: ingredientesTemp
        };
        await save('receitas', nova);
        resetForm();
        renderReceitas();
    };

    document.getElementById('btn-cancelar-edit').onclick = resetForm;
    document.getElementById('search-receita').oninput = (e) => {
        const filtradas = receitas.filter(r => r.nome.toLowerCase().includes(e.target.value.toLowerCase()));
        renderCards(filtradas, insumos);
    };
};

const renderCards = (lista, insumos) => {
    const display = document.getElementById('lista-receitas-cards');
    display.innerHTML = lista.map(r => `
        <div class="card-ficha" style="background:white; border-radius:12px; overflow:hidden; box-shadow:var(--shadow); display:flex; align-items:center; padding:10px; gap:15px;">
            <div style="width:60px; height:60px; background:#eee; border-radius:8px; overflow:hidden; flex-shrink:0;">
                ${r.foto ? `<img src="${r.foto}" style="width:100%; height:100%; object-fit:cover;">` : `<div style="text-align:center; padding-top:18px; color:#ccc;">📷</div>`}
            </div>
            <div style="flex:1;">
                <h4 style="margin:0;">${r.nome}</h4>
                <small>${r.categoria} | ${r.rendimento} ${r.unidade}</small>
            </div>
            <div style="display:flex; gap:8px;">
                <button onclick="window.visualizarFicha('${r.id}')" style="border:none; background:#3498db; color:white; padding:8px; border-radius:6px; cursor:pointer;">👁️</button>
                <button onclick="window.editarFicha('${r.id}')" style="border:none; background:#f1c40f; color:white; padding:8px; border-radius:6px; cursor:pointer;">✏️</button>
                <button onclick="window.eliminarFicha('${r.id}')" style="border:none; background:#e74c3c; color:white; padding:8px; border-radius:6px; cursor:pointer;">🗑️</button>
            </div>
        </div>
    `).join('');
};

// --- FUNÇÕES GLOBAIS ---

window.editarFicha = async (id) => {
    const r = await getById('receitas', id);
    if (!r) return;
    
    modoEdicaoId = id;
    document.getElementById('details-form').open = true;
    document.getElementById('form-title').innerText = "✏️ Editando: " + r.nome;
    document.getElementById('rec-nome').value = r.nome;
    document.getElementById('rec-categoria').value = r.categoria;
    document.getElementById('rec-rendimento').value = r.rendimento;
    document.getElementById('rec-unidade').value = r.unidade;
    document.getElementById('rec-preparo').value = r.preparo;
    ingredientesTemp = r.ingredientes;
    fotoBase64 = r.foto || "";
    atualizarListaTemp();
    window.scrollTo(0,0);
};

window.visualizarFicha = async (id) => {
    const receitas = await getAll('receitas');
    const insumos = await getAll('insumos');
    const r = receitas.find(x => x.id === id);
    
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = gerarLayoutImpressao(r, insumos);
    window.print();
};

const resetForm = () => {
    modoEdicaoId = null;
    ingredientesTemp = [];
    fotoBase64 = "";
    document.getElementById('form-receita').reset();
    document.getElementById('form-title').innerText = "➕ Nova Ficha Técnica";
    document.getElementById('lista-temp-ing').innerHTML = "";
    document.getElementById('details-form').open = false;
};

const atualizarListaTemp = () => {
    const div = document.getElementById('lista-temp-ing');
    div.innerHTML = ingredientesTemp.map((ing, idx) => `
        <span style="background:#ddd; padding:4px 10px; border-radius:15px; font-size:12px;">
            ${ing.nome} | <b style="cursor:pointer; color:red;" onclick="window.removeIngTemp(${idx})">x</b>
        </span>
    `).join('');
};

window.removeIngTemp = (idx) => {
    ingredientesTemp.splice(idx, 1);
    atualizarListaTemp();
};

window.eliminarFicha = async (id) => {
    if (confirm("Eliminar esta receita permanentemente?")) {
        await remove('receitas', id);
        renderReceitas();
    }
};

// --- LAYOUT DE PRODUÇÃO (PRINT) ---
function gerarLayoutImpressao(r, insumos) {
    return `
        <div style="padding: 20px; font-family: sans-serif; color: #000;">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
                <div>
                    <h1 style="margin:0; text-transform: uppercase;">${r.nome}</h1>
                    <p style="margin:5px 0;"><b>Categoria:</b> ${r.categoria} | <b>Rendimento:</b> ${r.rendimento} ${r.unidade}</p>
                </div>
                <div style="width: 100px; height: 100px; border: 1px solid #ddd;">
                    ${r.foto ? `<img src="${r.foto}" style="width:100%; height:100%; object-fit:cover;">` : ''}
                </div>
            </div>

            <h3 style="background: #eee; padding: 5px;">🛒 INGREDIENTES (PESOS PARA PRODUÇÃO)</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="border-bottom: 1px solid #000;">
                        <th style="text-align: left; padding: 8px;">INGREDIENTE</th>
                        <th style="text-align: right; padding: 8px;">QUANTIDADE (PESO LÍQUIDO)</th>
                        <th style="text-align: center; padding: 8px;">CHECK</th>
                    </tr>
                </thead>
                <tbody>
                    ${r.ingredientes.map(ing => `
                        <tr style="border-bottom: 1px dotted #ccc;">
                            <td style="padding: 10px;">${ing.nome.toUpperCase()}</td>
                            <td style="padding: 10px; text-align: right; font-size: 1.2rem;"><b>${ing.pesoLiquido} ${ing.un}</b></td>
                            <td style="text-align: center;">[ ]</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <h3 style="background: #eee; padding: 5px;">👨‍🍳 MODO DE PREPARO</h3>
            <div style="font-size: 1.1rem; line-height: 1.6; white-space: pre-wrap; padding: 10px; border: 1px solid #eee; margin-bottom: 20px;">
                ${r.preparo || 'Nenhuma instrução adicionada.'}
            </div>

            <div style="border-top: 1px solid #000; padding-top: 10px; font-size: 0.8rem; color: #666;">
                <p>Impresso em: ${new Date().toLocaleString('pt-PT')} | Doce Gestão - Babe's Bakery</p>
            </div>
        </div>
    `;
}