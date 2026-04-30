import { getAll, save, remove, getById } from '../../db.js';
import { calcularFC, calcularCustoIngrediente, calcularTotalGeral } from './logic.js';

let ingredientesTemp = [];
let fotoBase64 = "";
let modoEdicaoId = null;

export const renderReceitas = async () => {
    const container = document.getElementById('tab-receitas');
    if (!container) return;

    ingredientesTemp = [];
    fotoBase64 = "";
    modoEdicaoId = null;

    const [receitas, insumos] = await Promise.all([
        getAll('receitas'),
        getAll('insumos')
    ]);

    container.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto; padding: 10px;">
            <details id="details-form" style="background: white; padding: 15px; border-radius: 12px; box-shadow: var(--shadow); margin-bottom: 20px; border: 1px solid var(--border);">
                <summary id="form-title" style="cursor:pointer; font-weight:bold; color:var(--primary); padding: 5px;">➕ Nova Ficha Técnica</summary>
                <form id="form-receita" style="display: grid; gap: 12px; margin-top:15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <input type="text" id="rec-nome" placeholder="Nome da Receita" required>
                        <select id="rec-categoria">
                            <option value="Bolos">Bolos</option>
                            <option value="Tartes">Tartes</option>
                            <option value="Salgados">Salgados</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <input type="number" id="rec-rendimento" placeholder="Rende quanto?" required>
                        <input type="text" id="rec-unidade" placeholder="Ex: fatias, unidades" required>
                        <input type="file" id="rec-foto" accept="image/*" style="font-size: 12px;">
                    </div>
                    <div style="background: var(--bg); padding: 15px; border-radius: 8px; border: 1px dashed var(--border);">
                        <label style="font-size: 0.8rem; font-weight: bold;">ADICIONAR INGREDIENTES:</label>
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 40px; gap: 8px; margin-top: 10px;">
                            <select id="sel-insumo">
                                <option value="">Escolher Insumo...</option>
                                ${insumos.map(i => `<option value="${i.id}">${i.nome}</option>`).join('')}
                            </select>
                            <input type="number" id="inp-bruto" placeholder="P. Bruto" step="0.001">
                            <input type="number" id="inp-liquido" placeholder="P. Líquido" step="0.001">
                            <button type="button" id="btn-add-ing" style="background:var(--primary); color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">+</button>
                        </div>
                        <div id="lista-temp-ing" style="margin-top:15px; display:flex; flex-wrap:wrap; gap:8px;"></div>
                    </div>
                    <textarea id="rec-preparo" placeholder="Modo de preparo..." style="height: 100px;"></textarea>
                    <div style="display:flex; gap:10px;">
                        <button type="submit" class="btn btn-primary" style="flex:2; padding: 15px;">GUARDAR RECEITA</button>
                        <button type="button" id="btn-cancelar-edit" class="btn" style="flex:1;">CANCELAR</button>
                    </div>
                </form>
            </details>
            <div style="margin-bottom: 20px;">
                <input type="text" id="search-receita" placeholder="🔍 Pesquisar receitas..." style="padding: 15px; border-radius: 30px;">
            </div>
            <div id="lista-receitas-cards" style="display: grid; gap: 15px;"></div>
        </div>
    `;

    setupEvents(receitas, insumos);
    renderCards(receitas, insumos);
};

const setupEvents = (receitas, insumos) => {
    document.getElementById('rec-foto').onchange = (e) => {
        const reader = new FileReader();
        reader.onload = () => { fotoBase64 = reader.result; };
        if(e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
    };

    document.getElementById('btn-add-ing').onclick = () => {
        const id = document.getElementById('sel-insumo').value;
        const bruto = document.getElementById('inp-bruto').value;
        const liquido = document.getElementById('inp-liquido').value;
        const insumo = insumos.find(i => i.id === id);

        if (insumo && bruto) {
            ingredientesTemp.push({ 
                idInsumo: id, nome: insumo.nome, un: insumo.unidade,
                pesoBruto: parseFloat(bruto), pesoLiquido: parseFloat(liquido || bruto) 
            });
            atualizarListaTemp();
            document.getElementById('inp-bruto').value = '';
            document.getElementById('inp-liquido').value = '';
            document.getElementById('sel-insumo').value = '';
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
        renderReceitas();
    };

    document.getElementById('btn-cancelar-edit').onclick = () => renderReceitas();

    document.getElementById('search-receita').oninput = (e) => {
        const termo = e.target.value.toLowerCase();
        const filtradas = receitas.filter(r => r.nome.toLowerCase().includes(termo));
        renderCards(filtradas, insumos);
    };
};

const renderCards = (lista, insumos) => {
    const display = document.getElementById('lista-receitas-cards');
    if (!display) return;
    display.innerHTML = lista.map(r => {
        const total = calcularTotalGeral(r.ingredientes, insumos);
        return `
            <div class="card" style="display:flex; align-items:center; padding:12px; gap:15px;">
                <div style="width:60px; height:60px; border-radius:8px; overflow:hidden;">
                    ${r.foto ? `<img src="${r.foto}" style="width:100%; height:100%; object-fit:cover;">` : '📷'}
                </div>
                <div style="flex:1;">
                    <h4 style="margin:0;">${r.nome}</h4>
                    <div style="color:var(--success); font-weight:bold;">${total.toFixed(2)}€</div>
                </div>
                <div style="display:flex; gap:5px;">
                    <button class="btn btn-sm" onclick="window.visualizarFicha('${r.id}')">👁️</button>
                    <button class="btn btn-sm" onclick="window.editarFicha('${r.id}')">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="window.eliminarFicha('${r.id}')">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
};

const atualizarListaTemp = () => {
    document.getElementById('lista-temp-ing').innerHTML = ingredientesTemp.map((ing, idx) => `
        <span style="background:var(--primary); color:white; padding:4px 10px; border-radius:15px; font-size:0.7rem;">
            ${ing.nome} <b style="cursor:pointer" onclick="window.removeIngTemp(${idx})">×</b>
        </span>
    `).join('');
};

window.removeIngTemp = (idx) => { ingredientesTemp.splice(idx, 1); atualizarListaTemp(); };

window.eliminarFicha = async (id) => {
    if (confirm("Apagar receita?")) { await remove('receitas', id); renderReceitas(); }
};

window.editarFicha = async (id) => {
    const r = await getById('receitas', id);
    if (!r) return;
    modoEdicaoId = id;
    document.getElementById('details-form').open = true;
    document.getElementById('rec-nome').value = r.nome;
    ingredientesTemp = [...r.ingredientes];
    fotoBase64 = r.foto || "";
    atualizarListaTemp();
};

window.visualizarFicha = async (id) => {
    const receitas = await getAll('receitas');
    const insumos = await getAll('insumos');
    const r = receitas.find(x => x.id === id);
    const printArea = document.getElementById('print-area');

    printArea.innerHTML = `
        <div id="section-to-print" style="display: flex; flex-direction: column; gap: 5px;">
            <div class="ficha-haccp-wrapper">${gerarLayoutHACCP(r, insumos)}</div>
            <div class="ficha-producao-wrapper" style="border-top: 1px dashed #000; margin-top: 10px;">
                ${gerarLayoutProducao(r)}
            </div>
        </div>
    `;
    setTimeout(() => { window.print(); }, 800);
    window.onafterprint = () => { printArea.innerHTML = ""; };
};

function gerarLayoutHACCP(r, insumos) {
    const total = calcularTotalGeral(r.ingredientes, insumos);
    return `
        <div style="font-family: Arial; font-size: 10pt; border: 1px solid #000; padding: 8px;">
            <div style="background: #28a745; color: white; text-align: center; font-weight: bold; padding: 3px;">FICHA TÉCNICA: ${r.nome.toUpperCase()}</div>
            <div style="display: flex; margin: 5px 0;">
                <div style="flex: 1;"><b>Rendimento:</b> ${r.rendimento} ${r.unidade}</div>
                <div style="width: 100px; height: 60px; border: 1px solid #ddd;">${r.foto ? `<img src="${r.foto}" style="width:100%; height:100%; object-fit:cover;">` : ''}</div>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #eee;">
                    <th style="border: 1px solid #000;">Ingrediente</th>
                    <th style="border: 1px solid #000;">Peso Bruto</th>
                    <th style="border: 1px solid #000;">Custo</th>
                </tr>
                ${r.ingredientes.map(ing => {
                    const info = insumos.find(i => i.id === ing.idInsumo);
                    return `<tr>
                        <td style="border: 1px solid #000; padding: 2px;">${ing.nome}</td>
                        <td style="border: 1px solid #000; text-align: center;">${ing.pesoBruto} ${ing.un}</td>
                        <td style="border: 1px solid #000; text-align: right;">${calcularCustoIngrediente(info, ing.pesoBruto).toFixed(2)}€</td>
                    </tr>`;
                }).join('')}
            </table>
        </div>
    `;
}

function gerarLayoutProducao(r) {
    return `
        <div style="font-family: Arial; font-size: 10pt; border: 1px solid #000; padding: 8px;">
            <div style="text-align: center; font-weight: bold; border-bottom: 1px solid #000;">ORDEM DE PRODUÇÃO</div>
            <ul style="margin: 5px 0;">
                ${r.ingredientes.map(ing => `<li><b>${ing.pesoLiquido}${ing.un}</b> - ${ing.nome}</li>`).join('')}
            </ul>
            <div style="font-size: 9pt;"><b>Modo:</b> ${r.preparo || 'N/A'}</div>
        </div>
    `;
}
