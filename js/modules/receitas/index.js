import { getAll, save, remove, getById } from '../../db.js';
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
            <details id="details-form" style="background: white; padding: 15px; border-radius: 12px; box-shadow: var(--shadow); margin-bottom: 20px; border: 1px solid var(--border);">
                <summary id="form-title" style="cursor:pointer; font-weight:bold; color:var(--primary); padding: 5px;">➕ Nova Ficha Técnica</summary>
                <form id="form-receita" style="display: grid; gap: 12px; margin-top:15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <input type="text" id="rec-codigo" placeholder="Cód. Receita (Ex: 1777)">
                        <input type="text" id="rec-nome" placeholder="Nome da Receita" required style="grid-column: span 2;">
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <select id="rec-categoria">
                            <option value="Bolos">Bolos</option>
                            <option value="Tartes">Tartes</option>
                            <option value="Salgados">Salgados</option>
                            <option value="Outros">Outros</option>
                        </select>
                        <input type="number" id="rec-rendimento" placeholder="Rende quanto?" required>
                        <input type="text" id="rec-unidade" placeholder="Ex: fatias, kg" required>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <input type="text" id="rec-temp" placeholder="Temp. Conservação (Ex: < 5°C)">
                        <input type="text" id="rec-validade" placeholder="Validade (Ex: 3 a 5 dias)">
                    </div>

                    <input type="text" id="rec-alergenos" placeholder="Alérgenos (Ex: Glúten, Ovos, Leite)">
                    
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center;">
                        <input type="file" id="rec-foto" accept="image/*" style="font-size: 12px;">
                        <div id="preview-foto" style="width:40px; height:40px; border-radius:4px; background:#eee; overflow:hidden;"></div>
                    </div>

                    <div style="background: var(--bg); padding: 15px; border-radius: 8px; border: 1px dashed var(--border);">
                        <label style="font-size: 0.8rem; font-weight: bold;">INGREDIENTES:</label>
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

                    <textarea id="rec-preparo" placeholder="Modo de preparo detalhado..." style="height: 120px;"></textarea>

                    <div style="display:flex; gap:10px;">
                        <button type="submit" class="btn btn-primary" style="flex:2; padding: 15px;">GUARDAR FICHA</button>
                        <button type="button" id="btn-cancelar-edit" class="btn" style="flex:1;">CANCELAR</button>
                    </div>
                </form>
            </details>
            <div id="lista-receitas-cards" style="display: grid; gap: 15px;"></div>
        </div>
    `;

    setupEvents(receitas, insumos);
    renderCards(receitas, insumos);
};

const setupEvents = (receitas, insumos) => {
    document.getElementById('rec-foto').onchange = (e) => {
        const reader = new FileReader();
        reader.onload = () => { 
            fotoBase64 = reader.result;
            document.getElementById('preview-foto').innerHTML = `<img src="${fotoBase64}" style="width:100%; height:100%; object-fit:cover;">`;
        };
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
                pesoBruto: parseFloat(bruto), 
                pesoLiquido: liquido ? parseFloat(liquido) : parseFloat(bruto) // CORREÇÃO: Fallback para bruto se líquido estiver vazio
            });
            atualizarListaTemp();
            document.getElementById('inp-bruto').value = '';
            document.getElementById('inp-liquido').value = '';
        }
    };

    document.getElementById('form-receita').onsubmit = async (e) => {
        e.preventDefault();
        const nova = {
            id: modoEdicaoId || Date.now().toString(),
            codigo: document.getElementById('rec-codigo').value,
            nome: document.getElementById('rec-nome').value,
            categoria: document.getElementById('rec-categoria').value,
            rendimento: document.getElementById('rec-rendimento').value,
            unidade: document.getElementById('rec-unidade').value,
            temp: document.getElementById('rec-temp').value,
            validade: document.getElementById('rec-validade').value,
            alergenos: document.getElementById('rec-alergenos').value,
            preparo: document.getElementById('rec-preparo').value,
            foto: fotoBase64,
            ingredientes: ingredientesTemp,
            dataEmissao: new Date().toLocaleDateString()
        };
        await save('receitas', nova);
        renderReceitas();
    };

    document.getElementById('btn-cancelar-edit').onclick = () => renderReceitas();
};

const renderCards = (lista, insumos) => {
    const display = document.getElementById('lista-receitas-cards');
    if (!display) return;
    display.innerHTML = lista.map(r => {
        const total = calcularTotalGeral(r.ingredientes, insumos);
        return `
            <div class="card" style="display:flex; align-items:center; padding:12px; gap:15px;">
                <div style="width:60px; height:60px; border-radius:8px; overflow:hidden; background:#eee;">
                    ${r.foto ? `<img src="${r.foto}" style="width:100%; height:100%; object-fit:cover;">` : '📷'}
                </div>
                <div style="flex:1;">
                    <h4 style="margin:0;">${r.nome}</h4>
                    <small>${r.categoria} | Cód: ${r.codigo || '---'}</small>
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

window.editarFicha = async (id) => {
    const r = await getById('receitas', id);
    if (!r) return;
    modoEdicaoId = id;
    document.getElementById('details-form').open = true;
    document.getElementById('form-title').innerText = "✏️ Editando: " + r.nome;
    
    // REPOPULAR TODOS OS CAMPOS (CORREÇÃO)
    document.getElementById('rec-codigo').value = r.codigo || "";
    document.getElementById('rec-nome').value = r.nome;
    document.getElementById('rec-categoria').value = r.categoria;
    document.getElementById('rec-rendimento').value = r.rendimento;
    document.getElementById('rec-unidade').value = r.unidade;
    document.getElementById('rec-temp').value = r.temp || "";
    document.getElementById('rec-validade').value = r.validade || "";
    document.getElementById('rec-alergenos').value = r.alergenos || "";
    document.getElementById('rec-preparo').value = r.preparo || "";
    
    ingredientesTemp = [...r.ingredientes];
    fotoBase64 = r.foto || "";
    if(fotoBase64) document.getElementById('preview-foto').innerHTML = `<img src="${fotoBase64}" style="width:100%; height:100%; object-fit:cover;">`;
    atualizarListaTemp();
};

const atualizarListaTemp = () => {
    document.getElementById('lista-temp-ing').innerHTML = ingredientesTemp.map((ing, idx) => `
        <span style="background:var(--primary); color:white; padding:4px 10px; border-radius:15px; font-size:0.7rem; display:flex; align-items:center; gap:5px;">
            ${ing.nome} (${ing.pesoBruto}${ing.un}) <b style="cursor:pointer" onclick="window.removeIngTemp(${idx})">×</b>
        </span>
    `).join('');
};

window.removeIngTemp = (idx) => { ingredientesTemp.splice(idx, 1); atualizarListaTemp(); };

window.visualizarFicha = async (id) => {
    const receitas = await getAll('receitas');
    const insumos = await getAll('insumos');
    const r = receitas.find(x => x.id === id);
    const printArea = document.getElementById('print-area');

    printArea.innerHTML = `
        <div id="section-to-print" style="display: flex; flex-direction: column; gap: 10px;">
            <div class="ficha-haccp-wrapper">${gerarLayoutHACCP(r, insumos)}</div>
            <div class="ficha-producao-wrapper" style="border-top: 1px dashed #000; padding-top: 10px;">
                ${gerarLayoutProducao(r)}
            </div>
        </div>
    `;
    setTimeout(() => { window.print(); }, 800);
};

function gerarLayoutHACCP(r, insumos) {
    const total = calcularTotalGeral(r.ingredientes, insumos);
    return `
        <div style="font-family: Arial; font-size: 9pt; border: 1.5px solid #000; padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
                <h2 style="margin:0; font-size: 14pt;">FICHA TÉCNICA DE PRODUTO ACABADO</h2>
                <div style="text-align: right; font-size: 8pt;">Cód: ${r.codigo || '---'}<br>Emissão: ${r.dataEmissao}</div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 15px; margin-bottom: 10px;">
                <div>
                    <b>PRODUTO:</b> ${r.nome.toUpperCase()}<br>
                    <b>CATEGORIA:</b> ${r.categoria}<br>
                    <b>RENDIMENTO:</b> ${r.rendimento} ${r.unidade}
                </div>
                <div style="border: 1px solid #ddd; height: 80px; text-align: center;">
                    ${r.foto ? `<img src="${r.foto}" style="width:100%; height:100%; object-fit:contain;">` : 'FOTO'}
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div style="border: 1px solid #000; padding: 5px; background: #f9f9f9;">
                    <b style="font-size: 8pt; text-decoration: underline;">CONSERVAÇÃO E VALIDADE</b><br>
                    Temp: ${r.temp || 'N/A'}<br>
                    Validade: ${r.validade || 'N/A'}
                </div>
                <div style="border: 1px solid #d1242f; padding: 5px; color: #d1242f;">
                    <b style="font-size: 8pt;">⚠️ ALERGÉNIOS (Reg. UE 1169/2011)</b><br>
                    ${r.alergenos || 'Não especificado.'}
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                <tr style="background: #000; color: #fff;">
                    <th style="border: 1px solid #000; text-align: left; padding: 4px;">ITEM</th>
                    <th style="border: 1px solid #000; padding: 4px;">P. BRUTO</th>
                    <th style="border: 1px solid #000; padding: 4px;">P. LÍQUIDO</th>
                    <th style="border: 1px solid #000; padding: 4px;">CUSTO</th>
                </tr>
                ${r.ingredientes.map(ing => {
                    const info = insumos.find(i => i.id === ing.idInsumo);
                    const custo = calcularCustoIngrediente(info, ing.pesoBruto);
                    return `<tr>
                        <td style="border: 1px solid #000; padding: 3px;">${ing.nome.toUpperCase()}</td>
                        <td style="border: 1px solid #000; text-align: center;">${ing.pesoBruto}${ing.un}</td>
                        <td style="border: 1px solid #000; text-align: center;">${ing.pesoLiquido}${ing.un}</td>
                        <td style="border: 1px solid #000; text-align: right;">${custo.toFixed(2)}€</td>
                    </tr>`;
                }).join('')}
                <tr style="font-weight: bold; background: #eee;">
                    <td colspan="3" style="border: 1px solid #000; text-align: right; padding: 4px;">TOTAL CUSTO PRODUÇÃO:</td>
                    <td style="border: 1px solid #000; text-align: right; padding: 4px;">${total.toFixed(2)}€</td>
                </tr>
            </table>
        </div>
    `;
}

function gerarLayoutProducao(r) {
    return `
        <div style="font-family: Arial; font-size: 10pt; border: 1.5px solid #000; padding: 10px;">
            <div style="text-align: center; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">ORDEM DE PRODUÇÃO: ${r.nome.toUpperCase()}</div>
            <div style="margin-bottom: 10px;"><b>PESAR (VALORES LÍQUIDOS):</b></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                ${r.ingredientes.map(ing => `
                    <div style="border-bottom: 1px solid #eee; padding: 3px; font-size: 11pt;">
                        ☐ <b>${ing.pesoLiquido}${ing.un}</b> - ${ing.nome.toUpperCase()}
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 15px; border-top: 1px solid #000; padding-top: 5px;">
                <b style="text-decoration: underline;">MODO DE PREPARAÇÃO:</b><br>
                <div style="white-space: pre-wrap; font-size: 10pt; margin-top: 5px;">${r.preparo || 'Consultar manual.'}</div>
            </div>
        </div>
    `;
}
