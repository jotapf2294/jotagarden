// js/modules/receitas/index.js
import { getAll, save, remove } from '../../db.js';
import { calcularFC, calcularCustoIngrediente, calcularTotalGeral } from './logic.js';

let ingredientesTemp = [];
let fotoBase64 = "";

export const renderReceitas = async () => {
    const container = document.getElementById('tab-receitas');
    if (!container) return;

    const [receitas, insumos] = await Promise.all([
        getAll('receitas'),
        getAll('insumos')
    ]);

    container.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto; padding: 10px;">
            <details style="background: white; padding: 15px; border-radius: 12px; box-shadow: var(--shadow); margin-bottom: 20px;">
                <summary style="cursor:pointer; font-weight:bold; color:var(--primary);">➕ Criar Nova Ficha Técnica</summary>
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
                                <option value="">Insumo...</option>
                                ${insumos.map(i => `<option value="${i.id}">${i.nome}</option>`).join('')}
                            </select>
                            <input type="number" id="inp-bruto" placeholder="Bruto" step="0.001" style="padding: 8px;">
                            <input type="number" id="inp-liquido" placeholder="Líq." step="0.001" style="padding: 8px;">
                            <button type="button" id="btn-add-ing" style="background:var(--primary); color:white; border:none; border-radius:4px;">+</button>
                        </div>
                        <div id="lista-temp-ing" style="margin-top:10px; display:flex; flex-wrap:wrap; gap:5px;"></div>
                    </div>
                    <textarea id="rec-preparo" placeholder="Modo de preparo..." style="padding: 10px; border-radius: 8px; height: 60px;"></textarea>
                    <button type="submit" style="background:#27ae60; color:white; border:none; padding:12px; border-radius:8px; font-weight:bold;">Guardar Ficha</button>
                </form>
            </details>

            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="search-receita" placeholder="🔍 Pesquisar receita..." style="flex: 2; padding: 12px; border-radius: 25px; border: 1px solid #ddd;">
                <select id="filter-categoria" style="flex: 1; padding: 12px; border-radius: 25px; border: 1px solid #ddd;">
                    <option value="Todas">Todas Categorias</option>
                    <option value="Bolos">Bolos</option>
                    <option value="Tartes">Tartes</option>
                    <option value="Salgados">Salgados</option>
                </select>
            </div>

            <div id="lista-receitas-cards" style="display: grid; gap: 15px;"></div>
        </div>
    `;

    // --- LÓGICA DE INTERAÇÃO ---
    const inputFoto = document.getElementById('rec-foto');
    inputFoto.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = () => { fotoBase64 = reader.result; };
        reader.readAsDataURL(e.target.files[0]);
    };

    const btnAdd = document.getElementById('btn-add-ing');
    btnAdd.onclick = () => {
        const id = document.getElementById('sel-insumo').value;
        const bruto = document.getElementById('inp-bruto').value;
        const liquido = document.getElementById('inp-liquido').value;
        const insumo = insumos.find(i => i.id === id);

        if (insumo && bruto && liquido) {
            ingredientesTemp.push({ 
                idInsumo: id, 
                nome: insumo.nome, 
                un: insumo.unidade,
                pesoBruto: parseFloat(bruto), 
                pesoLiquido: parseFloat(liquido) 
            });
            atualizarListaTemp();
            ['inp-bruto', 'inp-liquido', 'sel-insumo'].forEach(i => document.getElementById(i).value = '');
        }
    };

    const form = document.getElementById('form-receita');
    form.onsubmit = async (e) => {
        e.preventDefault();
        if (ingredientesTemp.length === 0) return alert("Adicione ingredientes!");
        const nova = {
            id: Date.now().toString(),
            nome: document.getElementById('rec-nome').value,
            categoria: document.getElementById('rec-categoria').value,
            rendimento: document.getElementById('rec-rendimento').value,
            unidade: document.getElementById('rec-unidade').value,
            preparo: document.getElementById('rec-preparo').value,
            foto: fotoBase64,
            ingredientes: ingredientesTemp
        };
        await save('receitas', nova);
        ingredientesTemp = [];
        fotoBase64 = "";
        renderReceitas();
    };

    // PESQUISA EM TEMPO REAL
    const filtrar = () => {
        const termo = document.getElementById('search-receita').value.toLowerCase();
        const cat = document.getElementById('filter-categoria').value;
        const filtradas = receitas.filter(r => 
            r.nome.toLowerCase().includes(termo) && (cat === "Todas" || r.categoria === cat)
        );
        renderCards(filtradas, insumos);
    };

    document.getElementById('search-receita').oninput = filtrar;
    document.getElementById('filter-categoria').onchange = filtrar;

    renderCards(receitas, insumos);
};

const atualizarListaTemp = () => {
    const div = document.getElementById('lista-temp-ing');
    div.innerHTML = ingredientesTemp.map((ing, idx) => `
        <span style="background:#ddd; padding:2px 8px; border-radius:15px; font-size:12px;">
            ${ing.nome} ${ing.pesoBruto}kg <b style="cursor:pointer; color:red;" onclick="window.removeIngTemp(${idx})">x</b>
        </span>
    `).join('');
};

window.removeIngTemp = (idx) => {
    ingredientesTemp.splice(idx, 1);
    atualizarListaTemp();
};

const renderCards = (lista, insumos) => {
    const display = document.getElementById('lista-receitas-cards');
    display.innerHTML = lista.map(r => {
        const total = calcularTotalGeral(r.ingredientes, insumos);
        return `
            <div class="card-ficha" style="background:white; border-radius:12px; overflow:hidden; box-shadow:var(--shadow); display:flex; flex-direction:column;">
                <div style="display:flex; padding:10px; gap:15px; align-items:center;">
                    <div style="width:80px; height:80px; background:#eee; border-radius:8px; overflow:hidden; flex-shrink:0;">
                        ${r.foto ? `<img src="${r.foto}" style="width:100%; height:100%; object-fit:cover;">` : `<div style="text-align:center; padding-top:25px; color:#ccc;">📷</div>`}
                    </div>
                    <div style="flex:1;">
                        <h4 style="margin:0;">${r.nome}</h4>
                        <small style="color:#666;">${r.categoria} | Rende ${r.rendimento} ${r.unidade}</small>
                        <div style="color:var(--primary); font-weight:bold; margin-top:5px;">Custo: ${total.toFixed(2)}€</div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <button onclick="window.imprimirFicha('${r.id}')" style="border:none; background:#eee; padding:5px 10px; border-radius:4px; cursor:pointer;">🖨️</button>
                        <button onclick="window.eliminarFicha('${r.id}')" style="border:none; background:#fff0f0; color:red; padding:5px 10px; border-radius:4px; cursor:pointer;">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

// FUNÇÕES GLOBAIS PARA OS BOTÕES DENTRO DOS CARDS
window.eliminarFicha = async (id) => {
    if (confirm("Tem a certeza que quer eliminar esta ficha?")) {
        await remove('receitas', id);
        renderReceitas();
    }
};

window.imprimirFicha = (id) => {
    // Lógica para abrir apenas aquela ficha e imprimir
    // Por agora, para ser simples:
    window.print();
};
