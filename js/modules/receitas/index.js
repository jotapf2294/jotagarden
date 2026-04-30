// js/modules/receitas/index.js
import { getAll, save, remove, getById } from '../../db.js';
import { calcularFC, calcularCustoIngrediente, calcularTotalGeral } from './logic.js';

// Variáveis de estado do módulo
let ingredientesTemp = [];
let fotoBase64 = "";
let modoEdicaoId = null;

export const renderReceitas = async () => {
    const container = document.getElementById('tab-receitas');
    if (!container) return;

    // Reset de estado ao abrir a aba
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
                    <textarea id="rec-preparo" placeholder="Modo de preparo / Passo-a-passo..." style="height: 100px;"></textarea>
                    <div style="display:flex; gap:10px;">
                        <button type="submit" class="btn btn-primary" style="flex:2; padding: 15px;">GUARDAR RECEITA</button>
                        <button type="button" id="btn-cancelar-edit" class="btn" style="flex:1;">CANCELAR</button>
                    </div>
                </form>
            </details>

            <div style="margin-bottom: 20px;">
                <input type="text" id="search-receita" placeholder="🔍 Pesquisar receitas por nome..." style="padding: 15px; border-radius: 30px;">
            </div>

            <div id="lista-receitas-cards" style="display: grid; gap: 15px;"></div>
        </div>

        <div id="print-area" class="only-print"></div>
    `;

    // Vincular Eventos
    setupEvents(receitas, insumos);
    renderCards(receitas, insumos);
};

const setupEvents = (receitas, insumos) => {
    // Foto Base64
    document.getElementById('rec-foto').onchange = (e) => {
        const reader = new FileReader();
        reader.onload = () => { fotoBase64 = reader.result; };
        if(e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
    };

    // Adicionar Ingrediente
    document.getElementById('btn-add-ing').onclick = () => {
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
            document.getElementById('inp-bruto').value = '';
            document.getElementById('inp-liquido').value = '';
            document.getElementById('sel-insumo').value = '';
        } else {
            alert("Seleciona um insumo e define o peso bruto!");
        }
    };

    // Guardar Receita
    document.getElementById('form-receita').onsubmit = async (e) => {
        e.preventDefault();
        if (ingredientesTemp.length === 0) return alert("A receita precisa de pelo menos 1 ingrediente!");

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

    // Pesquisa
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
            <div class="card" style="display:flex; align-items:center; padding:12px; gap:15px; margin-bottom: 0;">
                <div style="width:70px; height:70px; background:var(--bg-hover); border-radius:8px; overflow:hidden; flex-shrink:0; border: 1px solid var(--border);">
                    ${r.foto ? `<img src="${r.foto}" style="width:100%; height:100%; object-fit:cover;">` : `<div style="text-align:center; padding-top:22px; color:var(--text-secondary); font-size:1.2rem;">📷</div>`}
                </div>
                <div style="flex:1;">
                    <h4 style="margin:0; font-size: 1rem;">${r.nome}</h4>
                    <span class="badge" style="font-size: 0.7rem;">${r.categoria}</span>
                    <div style="color:var(--success); font-weight:bold; font-size: 0.9rem; margin-top: 4px;">${total.toFixed(2)}€</div>
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

const resetForm = () => {
    modoEdicaoId = null;
    ingredientesTemp = [];
    fotoBase64 = "";
    const form = document.getElementById('form-receita');
    if(form) form.reset();
    document.getElementById('form-title').innerText = "➕ Nova Ficha Técnica";
    document.getElementById('lista-temp-ing').innerHTML = "";
    document.getElementById('details-form').open = false;
};

const atualizarListaTemp = () => {
    const div = document.getElementById('lista-temp-ing');
    div.innerHTML = ingredientesTemp.map((ing, idx) => `
        <span style="background:var(--primary); color:white; padding:5px 12px; border-radius:20px; font-size:0.75rem; display:flex; align-items:center; gap:8px;">
            ${ing.nome} (${ing.pesoBruto}) 
            <b style="cursor:pointer; background:rgba(0,0,0,0.2); border-radius:50%; width:16px; height:16px; text-align:center; line-height:16px;" onclick="window.removeIngTemp(${idx})">×</b>
        </span>
    `).join('');
};

// --- EXPOSIÇÃO GLOBAL (Crucial para funcionar os botões do HTML) ---
window.removeIngTemp = (idx) => {
    ingredientesTemp.splice(idx, 1);
    atualizarListaTemp();
};

window.eliminarFicha = async (id) => {
    if (confirm("Deseja apagar esta receita definitivamente?")) {
        await remove('receitas', id);
        renderReceitas();
    }
};

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
    ingredientesTemp = [...r.ingredientes];
    fotoBase64 = r.foto || "";
    atualizarListaTemp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.visualizarFicha = async (id) => {
    const receitas = await getAll('receitas');
    const insumos = await getAll('insumos');
    const r = receitas.find(x => x.id === id);
    
    const printArea = document.getElementById('print-area');
    
    // Geramos as duas! Uma folha para a pasta da ASAE e outra para a Bancada.
    printArea.innerHTML = `
        <div class="ficha-haccp">${gerarLayoutHACCP(r, insumos)}</div>
        <div style="page-break-before: always;" class="ficha-producao">${gerarLayoutProducao(r)}</div>
    `;
    
    window.print();
};

// 1. VISÃO ASAE / CONTROLO DE GESTÃO (Com Alergénios e Custos)
function gerarLayoutHACCP(r, insumos) {
    const total = calcularTotalGeral(r.ingredientes, insumos);
    const custoUn = total / (parseFloat(r.rendimento) || 1);
    
    return `
        <div style="padding: 30px; font-family: 'Segoe UI', Arial; color: #333; border: 1px solid #000; background: #fff;">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px;">
                <div>
                    <h1 style="margin:0; color:#000;">FICHA TÉCNICA DE PRODUTO ACABADO</h1>
                    <p style="margin:5px 0; font-size: 1.1rem;"><b>PRODUTO:</b> ${r.nome.toUpperCase()}</p>
                    <p style="margin:5px 0;"><b>CATEGORIA:</b> ${r.categoria}</p>
                </div>
                <div style="text-align: right; font-size: 0.8rem;">
                    <p>Cód. Receita: ${r.id}</p>
                    <p>Data de Emissão: ${new Date().toLocaleDateString('pt-PT')}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <div style="border: 1px solid #ccc; padding: 10px;">
                    <h4 style="margin:0 0 10px 0; background: #f0f0f0; padding: 5px;">CONSERVAÇÃO E VALIDADE</h4>
                    <p><b>Temp. Conservação:</b> < 5°C (Refrigeração)</p>
                    <p><b>Validade:</b> 3 a 5 dias</p>
                    <p><b>Condições:</b> Local seco e fresco, em recipiente hermético.</p>
                </div>
                <div style="border: 1px solid #e74c3c; padding: 10px;">
                    <h4 style="margin:0 0 10px 0; background: #fdeaea; color: #c0392b; padding: 5px;">⚠️ ALERGÉNIOS (Reg. UE 1169/2011)</h4>
                    <p style="font-size: 0.9rem;">Contém: Glúten, Ovos, Leite. Pode conter vestígios de frutos de casca rija.</p>
                </div>
            </div>

            <h4 style="background: #000; color: #fff; padding: 8px; margin-top: 20px;">COMPOSIÇÃO E CUSTOS</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                    <tr style="border-bottom: 2px solid #000;">
                        <th style="text-align: left; padding: 8px;">Ingrediente</th>
                        <th style="text-align: center; padding: 8px;">P. Bruto</th>
                        <th style="text-align: center; padding: 8px;">P. Líquido</th>
                        <th style="text-align: center; padding: 8px;">FC</th>
                        <th style="text-align: right; padding: 8px;">Custo Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${r.ingredientes.map(ing => {
                        const info = insumos.find(i => i.id === ing.idInsumo);
                        const custo = calcularCustoIngrediente(info, ing.pesoBruto);
                        const fc = (ing.pesoBruto / (ing.pesoLiquido || 1)).toFixed(2);
                        return `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 8px;">${ing.nome.toUpperCase()}</td>
                                <td style="padding: 8px; text-align: center;">${ing.pesoBruto} ${ing.un}</td>
                                <td style="padding: 8px; text-align: center;">${ing.pesoLiquido} ${ing.un}</td>
                                <td style="padding: 8px; text-align: center;">${fc}</td>
                                <td style="padding: 8px; text-align: right;">${custo.toFixed(2)}€</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold; background: #f9f9f9;">
                        <td colspan="4" style="padding: 10px; text-align: right;">CUSTO TOTAL DA RECEITA:</td>
                        <td style="padding: 10px; text-align: right;">${total.toFixed(2)}€</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
}

// 2. VISÃO PRODUÇÃO (Operacional - Robusta para a cozinha)
function gerarLayoutProducao(r) {
    return `
        <div style="padding: 20px; font-family: 'Arial Black', Gadget, sans-serif;">
            <div style="border: 4px solid #000; padding: 15px; text-align: center; margin-bottom: 20px;">
                <h1 style="margin:0; font-size: 2.5rem;">ORDEM DE PRODUÇÃO</h1>
                <h2 style="margin:5px 0; background: #000; color: #fff; padding: 10px;">${r.nome.toUpperCase()}</h2>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 1.2rem; margin-bottom: 20px;">
                <span><b>RENDIMENTO:</b> ${r.rendimento} ${r.unidade}</span>
                <span><b>LOTE:</b> ___________</span>
            </div>

            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #ddd; border: 2px solid #000;">
                        <th style="padding: 15px; text-align: left; font-size: 1.3rem;">INGREDIENTE</th>
                        <th style="padding: 15px; text-align: right; font-size: 1.3rem;">PESAR (LÍQUIDO)</th>
                        <th style="padding: 15px; text-align: center; width: 80px;">V</th>
                    </tr>
                </thead>
                <tbody>
                    ${r.ingredientes.map(ing => `
                        <tr style="border-bottom: 2px solid #000;">
                            <td style="padding: 15px; font-size: 1.2rem;">${ing.nome.toUpperCase()}</td>
                            <td style="padding: 15px; text-align: right; font-size: 1.8rem;"><b>${ing.pesoLiquido} ${ing.un}</b></td>
                            <td style="border-left: 2px solid #000;"></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="margin-top: 20px; border: 2px solid #000; padding: 15px;">
                <h3 style="margin-top: 0; text-decoration: underline;">INSTRUÇÕES TÉCNICAS (HACCP):</h3>
                <p style="font-size: 1.2rem; line-height: 1.5;">${r.preparo || 'Consultar manual de boas práticas.'}</p>
                <p style="margin-top: 20px; font-size: 0.9rem;"><i>* Higienizar as mãos e bancada antes de iniciar. Utilizar utensílios desinfetados.</i></p>
            </div>
        </div>
    `;
}