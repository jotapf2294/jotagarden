import { getAll, save, remove, getById } from '../../db.js';
import { calcularCustoIngrediente, calcularTotalGeral } from './logic.js';

let ingredientesTemp = [];
let fotoBase64 = "";
let modoEdicaoId = null;

// --- FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO ---
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
                <summary id="form-title" style="cursor:pointer; font-weight:bold; color:var(--primary); padding: 5px;">➕ Nova Ficha Técnica Pro</summary>
                <form id="form-receita" style="display: grid; gap: 12px; margin-top:15px;">
                    
                    <div style="display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 10px;">
                        <input type="text" id="rec-codigo" placeholder="Cód. FTP (Ex: 001)">
                        <input type="text" id="rec-nome" placeholder="Nome da Receita" required>
                        <select id="rec-categoria">
                            <option value="Bolos">Bolos</option>
                            <option value="Doces Conventuais">Doces Conventuais</option>
                            <option value="Massas">Massas</option>
                            <option value="Tartes">Tartes</option>
                            <option value="Salgados">Salgados</option>
                        </select>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                        <input type="text" id="rec-rend-total" placeholder="Rend. Total">
                        <input type="number" id="rec-rend-porcoes" placeholder="Nº Porções" value="1">
                        <input type="text" id="rec-tempo" placeholder="Tempo Prep.">
                        <input type="text" id="rec-temp-arm" placeholder="Temp. Armaz.">
                    </div>

                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <label style="font-size: 0.75rem; font-weight: bold; color: var(--primary);">ADICIONAR INGREDIENTE (CUSTOS E PESOS):</label>
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 40px; gap: 8px; margin-top: 10px;">
                            <select id="sel-insumo">
                                <option value="">Insumo...</option>
                                ${insumos.map(i => `<option value="${i.id}">${i.nome}</option>`).join('')}
                            </select>
                            <input type="text" id="inp-un" placeholder="Un (g/kg)">
                            <input type="number" id="inp-bruto" placeholder="P. Bruto" step="0.001">
                            <input type="number" id="inp-fc" placeholder="FC (1.00)" step="0.01" value="1.00">
                            <button type="button" id="btn-add-ing" style="background:var(--accent); color:white; border:none; border-radius:4px; cursor:pointer;">+</button>
                        </div>
                        <div id="lista-temp-ing" style="margin-top:10px; display:flex; flex-wrap:wrap; gap:5px;"></div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <textarea id="rec-pcc" placeholder="PCC: Ex: Cozedura > 75°C..." style="height: 60px; border-left: 3px solid #f59e0b; padding:5px;"></textarea>
                        <textarea id="rec-preparo" placeholder="Modo de Preparo..." style="height: 60px; padding:5px;"></textarea>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <input type="text" id="rec-embalagem" placeholder="Embalagem">
                        <input type="text" id="rec-validade" placeholder="Validade">
                    </div>
                    <input type="text" id="rec-alergenos" placeholder="Alergénios (Glúten, Ovos, etc)">

                    <div style="display:flex; gap:10px;">
                        <button type="submit" class="btn btn-primary" style="flex:2; padding: 12px;">GUARDAR FICHA</button>
                        <button type="button" id="btn-cancelar-edit" class="btn" style="flex:1;">CANCELAR</button>
                    </div>
                </form>
            </details>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="search-nome" placeholder="🔍 Pesquisar por nome..." style="padding: 12px; border-radius: 25px; border:1px solid var(--border);">
                <select id="search-categoria" style="padding: 12px; border-radius: 25px; border:1px solid var(--border);">
                    <option value="Todos">Todas Categorias</option>
                    <option value="Bolos">Bolos</option>
                    <option value="Doces Conventuais">Doces Conventuais</option>
                    <option value="Massas">Massas</option>
                    <option value="Salgados">Salgados</option>
                </select>
            </div>

            <div id="lista-receitas-cards" style="display: grid; gap: 12px;"></div>
        </div>
    `;

    // Chamar as funções de suporte explicitamente
    setupEvents(receitas, insumos);
    renderCards(receitas, insumos);
};

// --- FUNÇÃO PARA CONFIGURAR EVENTOS ---
const setupEvents = (receitas, insumos) => {
    const btnAdd = document.getElementById('btn-add-ing');
    const form = document.getElementById('form-receita');
    const searchNome = document.getElementById('search-nome');
    const searchCat = document.getElementById('search-categoria');

    if (btnAdd) {
        btnAdd.onclick = () => {
            const id = document.getElementById('sel-insumo').value;
            const un = document.getElementById('inp-un').value;
            const bruto = document.getElementById('inp-bruto').value;
            const fc = document.getElementById('inp-fc').value || 1.00;
            const insumo = insumos.find(i => i.id === id);

            if (insumo && bruto) {
                ingredientesTemp.push({ 
                    idInsumo: id, 
                    nome: insumo.nome, 
                    un: un || "g",
                    pesoBruto: parseFloat(bruto), 
                    fc: parseFloat(fc),
                    pesoLiquido: parseFloat(bruto) / parseFloat(fc) 
                });
                atualizarListaTemp();
                document.getElementById('inp-bruto').value = '';
                document.getElementById('inp-un').value = '';
            }
        };
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const nova = {
                id: modoEdicaoId || Date.now().toString(),
                codigo: document.getElementById('rec-codigo').value,
                nome: document.getElementById('rec-nome').value,
                categoria: document.getElementById('rec-categoria').value,
                rendTotal: document.getElementById('rec-rend-total').value,
                rendPorcoes: document.getElementById('rec-rend-porcoes').value,
                tempo: document.getElementById('rec-tempo').value,
                tempArm: document.getElementById('rec-temp-arm').value,
                pcc: document.getElementById('rec-pcc').value,
                preparo: document.getElementById('rec-preparo').value,
                embalagem: document.getElementById('rec-embalagem').value,
                validade: document.getElementById('rec-validade').value,
                alergenos: document.getElementById('rec-alergenos').value,
                ingredientes: ingredientesTemp,
                dataAtual: new Date().toLocaleDateString('pt-PT')
            };
            await save('receitas', nova);
            renderReceitas();
            modoEdicaoId = null;
            ingredientesTemp = [];
        };
    }

    const filtrar = () => {
        const termo = searchNome.value.toLowerCase();
        const cat = searchCat.value;
        const filtradas = receitas.filter(r => 
            (r.nome.toLowerCase().includes(termo)) && 
            (cat === "Todos" || r.categoria === cat)
        );
        renderCards(filtradas, insumos);
    };

    if (searchNome) searchNome.oninput = filtrar;
    if (searchCat) searchCat.onchange = filtrar;
    if (document.getElementById('btn-cancelar-edit')) {
        document.getElementById('btn-cancelar-edit').onclick = () => renderReceitas();
    }
};

// --- FUNÇÃO PARA RENDERIZAR OS CARDS ---
const renderCards = (lista, insumos) => {
    const display = document.getElementById('lista-receitas-cards');
    if (!display) return;
    
    display.innerHTML = lista.map(r => `
        <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-radius:8px; background:white; border:1px solid var(--border);">
            <div>
                <h4 style="margin:0; color:var(--primary);">${r.nome}</h4>
                <small>${r.categoria} | FTP-${r.codigo || '---'}</small>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="btn btn-sm" onclick="window.visualizarFicha('${r.id}')" title="Ver Ficha">👁️</button>
                <button class="btn btn-sm" onclick="window.editarFicha('${r.id}')" title="Editar">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="window.eliminarFicha('${r.id}')" title="Eliminar">🗑️</button>
            </div>
        </div>
    `).join('');
};

// --- FUNÇÕES GLOBAIS (WINDOW) ---

const atualizarListaTemp = () => {
    const lista = document.getElementById('lista-temp-ing');
    if (!lista) return;
    lista.innerHTML = ingredientesTemp.map((ing, idx) => `
        <span style="background:var(--primary); color:white; padding:4px 10px; border-radius:15px; font-size:0.7rem; display:flex; align-items:center; gap:5px;">
            ${ing.nome} (${ing.pesoBruto}${ing.un}) 
            <b style="cursor:pointer; font-size:1rem;" onclick="window.removeIngTemp(${idx})">×</b>
        </span>
    `).join('');
};

window.removeIngTemp = (idx) => {
    ingredientesTemp.splice(idx, 1);
    atualizarListaTemp();
};

window.eliminarFicha = async (id) => {
    if (confirm("Deseja apagar permanentemente esta ficha técnica?")) {
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
    
    document.getElementById('rec-codigo').value = r.codigo || "";
    document.getElementById('rec-nome').value = r.nome;
    document.getElementById('rec-categoria').value = r.categoria;
    document.getElementById('rec-rend-total').value = r.rendTotal || "";
    document.getElementById('rec-rend-porcoes').value = r.rendPorcoes || 1;
    document.getElementById('rec-tempo').value = r.tempo || "";
    document.getElementById('rec-temp-arm').value = r.tempArm || "";
    document.getElementById('rec-pcc').value = r.pcc || "";
    document.getElementById('rec-preparo').value = r.preparo || "";
    document.getElementById('rec-embalagem').value = r.embalagem || "";
    document.getElementById('rec-validade').value = r.validade || "";
    document.getElementById('rec-alergenos').value = r.alergenos || "";
    
    ingredientesTemp = [...r.ingredientes];
    atualizarListaTemp();
};

window.visualizarFicha = async (id) => {
    const receitas = await getAll('receitas');
    const insumos = await getAll('insumos');
    const r = receitas.find(x => x.id === id);
    const printArea = document.getElementById('print-area');

    const totalMP = calcularTotalGeral(r.ingredientes, insumos);
    const custoPorcao = totalMP / (parseFloat(r.rendPorcoes) || 1);

    printArea.innerHTML = `
        <div class="ficha" style="background: white; border: 1px solid #000; font-family: sans-serif; padding:0; width:210mm; margin:auto;">
            <div style="background: #1e3a8a; color: white; padding: 20px; display: flex; justify-content: space-between;">
                <h1 style="font-size: 20px; margin:0;">FICHA TÉCNICA DE PRODUÇÃO</h1>
                <div style="font-size: 11px; text-align: right;">Doc: FTP-${r.codigo || '000'}<br>Rev: 01 | ${r.dataAtual}</div>
            </div>

            <div style="padding: 24px;">
                <h2 style="font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; margin-bottom:12px;">Informações Básicas</h2>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; font-size: 12px; margin-bottom: 20px;">
                    <div><b>PRODUTO:</b><br>${r.nome}</div>
                    <div><b>CATEGORIA:</b><br>${r.categoria}</div>
                    <div><b>RENDIMENTO:</b><br>${r.rendTotal}</div>
                    <div><b>PORÇÕES:</b><br>${r.rendPorcoes}</div>
                </div>

                <h2 style="font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; margin-bottom:12px;">Ingredientes e Custos</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align:left;">Ingrediente</th>
                            <th style="border: 1px solid #e2e8f0; padding: 8px;">PB</th>
                            <th style="border: 1px solid #e2e8f0; padding: 8px;">Un</th>
                            <th style="border: 1px solid #e2e8f0; padding: 8px;">FC</th>
                            <th style="border: 1px solid #e2e8f0; padding: 8px;">PL Usado</th>
                            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align:right;">€ Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${r.ingredientes.map(ing => {
                            const info = insumos.find(i => i.id === ing.idInsumo);
                            const custo = calcularCustoIngrediente(info, ing.pesoBruto);
                            return `<tr>
                                <td style="border: 1px solid #e2e8f0; padding: 6px;">${ing.nome}</td>
                                <td style="border: 1px solid #e2e8f0; padding: 6px; text-align:center;">${ing.pesoBruto}</td>
                                <td style="border: 1px solid #e2e8f0; padding: 6px; text-align:center;">${ing.un}</td>
                                <td style="border: 1px solid #e2e8f0; padding: 6px; text-align:center;">${ing.fc}</td>
                                <td style="border: 1px solid #e2e8f0; padding: 6px; text-align:center;">${ing.pesoLiquido.toFixed(3)}</td>
                                <td style="border: 1px solid #e2e8f0; padding: 6px; text-align:right;">${custo.toFixed(2)}€</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius:6px; margin-bottom: 20px;">
                    <div style="display:flex; justify-content: space-between; font-weight: bold; color: #1e3a8a; font-size:14px;">
                        <span>CUSTO TOTAL DA RECEITA:</span>
                        <span>${totalMP.toFixed(2)} €</span>
                    </div>
                    <div style="display:flex; justify-content: space-between; font-size: 11px; margin-top:5px;">
                        <span>Custo por Porção (${r.rendPorcoes}):</span>
                        <span>${custoPorcao.toFixed(3)} €</span>
                    </div>
                </div>

                <h2 style="font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; margin-bottom:12px;">Modo de Preparo e Segurança</h2>
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; font-size: 11px; margin-bottom: 12px; border-radius:4px;">
                    <strong>⚠️ PCC (PONTO CRÍTICO):</strong> ${r.pcc || 'Não especificado'}
                </div>
                <div style="font-size: 12px; white-space: pre-wrap; margin-bottom: 20px; border: 1px solid #f1f5f9; padding: 15px; border-radius:4px;">${r.preparo}</div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <h2 style="font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; margin-bottom:8px;">EMBALAGEM</h2>
                        <div style="font-size: 12px;">Tipo: ${r.embalagem}<br>Validade: ${r.validade}</div>
                    </div>
                    <div>
                        <h2 style="font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; margin-bottom:8px;">ALERGÉNIOS</h2>
                        <div style="font-size: 12px; color: #dc2626; font-weight:bold;">${r.alergenos}</div>
                    </div>
                </div>
            </div>

            <div style="background: #f1f5f9; padding: 20px; font-size: 10px; display: flex; justify-content: space-between; margin-top: 30px; border-top: 1px solid #e2e8f0;">
                <div>Elaborado por: ___________________</div>
                <div>Reg. CE 852/2004 | ASAE</div>
            </div>
        </div>
    `;
    setTimeout(() => { window.print(); }, 800);
};
