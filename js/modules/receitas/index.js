// js/modules/receitas/index.js
import { getAll, save, remove } from '../../db.js';
import { calcularFC, calcularCustoIngrediente, calcularTotalGeral } from './logic.js';

export const renderReceitas = async () => {
    const container = document.getElementById('tab-receitas');
    if (!container) return;

    const [receitas, insumos] = await Promise.all([
        getAll('receitas'),
        getAll('insumos')
    ]);

    container.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto; padding-bottom: 50px;">
            <div class="no-print" style="background: white; padding: 20px; border-radius: 12px; box-shadow: var(--shadow); margin-bottom: 30px;">
                <h3 style="margin-top:0; color: var(--primary);">📝 Criar Ficha Técnica Profissional</h3>
                <form id="form-receita" style="display: grid; gap: 15px;">
                    <input type="text" id="rec-nome" placeholder="Nome da Preparação" required style="padding: 12px; border: 1px solid #ddd; border-radius: 8px;">
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <input type="number" id="rec-rendimento" placeholder="Rendimento (ex: 20)" required style="padding: 12px; border: 1px solid #ddd; border-radius: 8px;">
                        <input type="text" id="rec-unidade" placeholder="Unidade (ex: porções)" required style="padding: 12px; border: 1px solid #ddd; border-radius: 8px;">
                    </div>

                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px dashed #ccc;">
                        <label style="font-weight:bold; display:block; margin-bottom:10px;">Adicionar Insumos</label>
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 40px; gap: 8px; margin-bottom: 10px;">
                            <select id="sel-insumo" style="padding: 10px; border-radius: 6px;">
                                <option value="">Insumo...</option>
                                ${insumos.map(i => `<option value="${i.id}">${i.nome}</option>`).join('')}
                            </select>
                            <input type="number" id="inp-bruto" placeholder="P. Bruto" step="0.001" style="padding: 10px; border-radius: 6px;">
                            <input type="number" id="inp-liquido" placeholder="P. Líquido" step="0.001" style="padding: 10px; border-radius: 6px;">
                            <button type="button" id="btn-add-ing" style="background: var(--primary); color:white; border:none; border-radius:6px; cursor:pointer;">+</button>
                        </div>
                        <div id="lista-temp-ing" style="font-size: 0.85rem; color: #555;"></div>
                    </div>

                    <textarea id="rec-preparo" placeholder="Modo de Preparo" style="padding: 12px; border: 1px solid #ddd; border-radius: 8px; height: 100px;"></textarea>
                    
                    <button type="submit" style="background: #27ae60; color: white; border: none; padding: 15px; border-radius: 8px; font-weight: bold; cursor: pointer;">Guardar Receita</button>
                </form>
            </div>

            <div id="secao-fichas">
                ${receitas.map(r => renderCardFicha(r, insumos)).join('')}
            </div>
        </div>
    `;

    // --- LÓGICA DE EVENTOS ---
    const listaTemp = [];
    document.getElementById('btn-add-ing').onclick = () => {
        const id = document.getElementById('sel-insumo').value;
        const bruto = document.getElementById('inp-bruto').value;
        const liquido = document.getElementById('inp-liquido').value;
        const insumo = insumos.find(i => i.id === id);

        if (insumo && bruto && liquido) {
            listaTemp.push({ 
                idInsumo: id, 
                nome: insumo.nome, 
                un: insumo.unidade,
                pesoBruto: parseFloat(bruto), 
                pesoLiquido: parseFloat(liquido) 
            });
            document.getElementById('lista-temp-ing').innerHTML = listaTemp.map(i => `• ${i.nome} (${i.pesoBruto}kg)`).join(' ');
            ['inp-bruto', 'inp-liquido', 'sel-insumo'].forEach(id => document.getElementById(id).value = '');
        }
    };

    document.getElementById('form-receita').onsubmit = async (e) => {
        e.preventDefault();
        const nova = {
            id: Date.now().toString(),
            nome: document.getElementById('rec-nome').value,
            rendimento: document.getElementById('rec-rendimento').value,
            unidade: document.getElementById('rec-unidade').value,
            preparo: document.getElementById('rec-preparo').value,
            ingredientes: listaTemp
        };
        await save('receitas', nova);
        renderReceitas();
    };

    container.querySelectorAll('.btn-print').forEach(btn => {
        btn.onclick = () => window.print();
    });
};

function renderCardFicha(r, insumos) {
    const totalCusto = calcularTotalGeral(r.ingredientes, insumos);
    const custoPorPorcao = totalCusto / parseFloat(r.rendimento);

    return `
        <div class="ficha-tecnica-print" style="background: white; padding: 20px; border: 1px solid #000; margin-bottom: 40px; position: relative;">
            <div class="no-print" style="position: absolute; right: 10px; top: 10px;">
                <button class="btn-print" style="padding: 5px 15px; cursor: pointer;">🖨️ Imprimir</button>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                <tr style="background: #27ae60; color: white;">
                    <th colspan="2" style="padding: 10px; border: 1px solid #000;">FICHA TÉCNICA DE PREPARAÇÃO</th>
                </tr>
                <tr>
                    <td style="width: 60%; border: 1px solid #000; padding: 10px;">
                        <b>NOME DA PREPARAÇÃO:</b><br>${r.nome.toUpperCase()}
                    </td>
                    <td rowspan="2" style="width: 40%; border: 1px solid #000; text-align: center; color: #ccc;">
                        FOTO
                    </td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 10px;">
                        <b>PROFISSIONAL:</b><br>Babe's Bakery
                    </td>
                </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: center;">
                <tr style="background: #27ae60; color: white;">
                    <th style="border: 1px solid #000; padding: 5px;">ITEM</th>
                    <th style="border: 1px solid #000; padding: 5px;">UN</th>
                    <th style="border: 1px solid #000; padding: 5px;">Peso Bruto</th>
                    <th style="border: 1px solid #000; padding: 5px;">Peso Líquido</th>
                    <th style="border: 1px solid #000; padding: 5px;">FC</th>
                    <th style="border: 1px solid #000; padding: 5px;">Custo Total</th>
                </tr>
                ${r.ingredientes.map(ing => {
                    const info = insumos.find(i => i.id === ing.idInsumo);
                    const fc = calcularFC(ing.pesoBruto, ing.pesoLiquido);
                    const custo = calcularCustoIngrediente(info, ing.pesoBruto);
                    return `
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; text-align: left;">${ing.nome.toUpperCase()}</td>
                            <td style="border: 1px solid #000; padding: 5px;">${ing.un}</td>
                            <td style="border: 1px solid #000; padding: 5px;">${ing.pesoBruto.toFixed(3)}</td>
                            <td style="border: 1px solid #000; padding: 5px;">${ing.pesoLiquido.toFixed(3)}</td>
                            <td style="border: 1px solid #000; padding: 5px;">${fc.toFixed(3)}</td>
                            <td style="border: 1px solid #000; padding: 5px;">${custo.toFixed(2)}€</td>
                        </tr>
                    `;
                }).join('')}
                <tr>
                    <td colspan="5" style="border: 1px solid #000; text-align: right; padding: 5px;"><b>TOTAL DOS INSUMOS</b></td>
                    <td style="border: 1px solid #000; padding: 5px;"><b>${totalCusto.toFixed(2)}€</b></td>
                </tr>
            </table>

            <div style="margin-top: 15px; border: 1px solid #000; padding: 10px;">
                <b>Modo de Preparo:</b><br>
                <p style="font-size: 0.85rem; white-space: pre-wrap;">${r.preparo || 'Não definido.'}</p>
            </div>

            <div style="margin-top: 10px; display: flex; justify-content: space-between; border: 1px solid #000; padding: 10px; font-weight: bold;">
                <span>Rendimento: ${r.rendimento} ${r.unidade}</span>
                <span>Custo Total: ${totalCusto.toFixed(2)}€</span>
                <span>Custo/Porção: ${custoPorPorcao.toFixed(2)}€</span>
            </div>
        </div>
    `;
}
