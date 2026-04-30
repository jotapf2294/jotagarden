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
    `;

    // Removido o print-area daqui de dentro! Ele deve viver apenas no index.html.

    setupEvents(receitas, insumos);
    renderCards(receitas, insumos);
};

// ... (setupEvents, renderCards, resetForm, atualizarListaTemp mantêm-se iguais)

window.visualizarFicha = async (id) => {
    const receitas = await getAll('receitas');
    const insumos = await getAll('insumos');
    const r = receitas.find(x => x.id === id);

    // Seleciona a print-area que está no ROOT do documento (index.html)
    const printArea = document.getElementById('print-area');
    if (!printArea) {
        console.error("ERRO: Elemento #print-area não encontrado no index.html");
        return;
    }

    // Injetamos com IDs específicos para garantir que o CSS de impressão os veja
    printArea.innerHTML = `
        <div id="section-to-print">
            <div class="ficha-haccp-wrapper" style="margin-bottom: 40px;">
                ${gerarLayoutHACCP(r, insumos)}
            </div>
            <div style="page-break-before: always;"></div>
            <div class="ficha-producao-wrapper">
                ${gerarLayoutProducao(r)}
            </div>
        </div>
    `;

    // Forçamos o browser a "respirar" para desenhar o HTML antes de imprimir
    setTimeout(() => {
        window.print();
    }, 800);

    window.onafterprint = () => {
        printArea.innerHTML = "";
    };
};

// ... (funções gerarLayoutHACCP e gerarLayoutProducao )


function gerarLayoutHACCP(r, insumos) {
    const total = calcularTotalGeral(r.ingredientes, insumos);
    const rendimento = parseFloat(r.rendimento) || 1;
    const custoPorPorcao = total / rendimento;

    return `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: auto;">
            <div style="background-color: #28a745; color: white; text-align: center; padding: 5px; font-weight: bold; border: 1px solid #000;">
                FICHA TÉCNICA DE PREPARAÇÃO
            </div>
            
            <div style="display: flex; border: 1px solid #000; border-top: none;">
                <div style="flex: 1; padding: 10px; border-right: 1px solid #000;">
                    <p style="margin: 0; font-weight: bold;">NOME DA PREPARAÇÃO:</p>
                    <p style="margin: 5px 0 15px 0; font-size: 1.2rem;">${r.nome.toUpperCase()}</p>
                    <p style="margin: 0; font-weight: bold;">PROFISSIONAL:</p>
                    <p style="margin: 5px 0 0 0;">Babe's Bakery</p>
                </div>
                <div style="width: 250px; height: 150px; background: #eee; display: flex; align-items: center; justify-content: center;">
                    ${r.foto ? `<img src="${r.foto}" style="width:100%; height:100%; object-fit:cover;">` : 'FOTO'}
                </div>
            </div>

            <div style="background-color: #28a745; color: white; text-align: center; padding: 3px; font-size: 0.9rem; font-weight: bold; border: 1px solid #000; border-top: none;">
                INSUMOS
            </div>

            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                <thead>
                    <tr style="background-color: #28a745; color: white; font-size: 0.8rem;">
                        <th style="border: 1px solid #000; padding: 5px; text-align: left;">ITEM</th>
                        <th style="border: 1px solid #000; padding: 5px;">UN</th>
                        <th style="border: 1px solid #000; padding: 5px;">Peso Bruto</th>
                        <th style="border: 1px solid #000; padding: 5px;">Peso Líquido</th>
                        <th style="border: 1px solid #000; padding: 5px;">FC</th>
                        <th style="border: 1px solid #000; padding: 5px;">Custo Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${r.ingredientes.map(ing => {
                        const info = insumos.find(i => i.id === ing.idInsumo);
                        const custo = calcularCustoIngrediente(info, ing.pesoBruto);
                        const fc = (ing.pesoBruto / (ing.pesoLiquido || 1)).toFixed(3);
                        return `
                            <tr style="font-size: 0.85rem; text-align: center;">
                                <td style="border: 1px solid #000; padding: 4px; text-align: left;">${ing.nome.toUpperCase()}</td>
                                <td style="border: 1px solid #000; padding: 4px;">${ing.un}</td>
                                <td style="border: 1px solid #000; padding: 4px;">${ing.pesoBruto.toFixed(3)}</td>
                                <td style="border: 1px solid #000; padding: 4px;">${ing.pesoLiquido.toFixed(3)}</td>
                                <td style="border: 1px solid #000; padding: 4px;">${fc}</td>
                                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${custo.toFixed(2)}€</td>
                            </tr>
                        `;
                    }).join('')}
                    <tr style="font-weight: bold; background: #eee;">
                        <td colspan="5" style="border: 1px solid #000; padding: 5px; text-align: right;">TOTAL DOS INSUMOS:</td>
                        <td style="border: 1px solid #000; padding: 5px; text-align: right;">${total.toFixed(2)}€</td>
                    </tr>
                </tbody>
            </table>

            <div style="border: 1px solid #000; border-top: none; padding: 10px;">
                <p style="margin: 0; font-weight: bold; text-decoration: underline;">Modo de Preparo:</p>
                <p style="margin: 10px 0; font-size: 0.9rem; white-space: pre-wrap;">${r.preparo || 'Sem instruções.'}</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid #000; border-top: none; font-size: 0.9rem;">
                <div style="padding: 5px; border-right: 1px solid #000;">Rendimento: ${r.rendimento} ${r.unidade}</div>
                <div style="padding: 5px; border-right: 1px solid #000;">Custo Total: ${total.toFixed(2)}€</div>
                <div style="padding: 5px;">Custo/Unidade: ${custoPorPorcao.toFixed(2)}€</div>
            </div>
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