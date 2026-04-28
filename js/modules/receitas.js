import { addData, getAllData } from '../db.js';

export const renderReceitas = async () => {
    const container = document.getElementById('tab-receitas');
    const receitas = await getAllData('receitas');

    container.innerHTML = `
        <div class="header-actions">
            <h2>📖 Fichas Técnicas Profissionais</h2>
            <button id="btn-abrir-modal" class="btn-action" style="width:auto; padding:10px 20px;">+ Nova Ficha</button>
        </div>
        
        <div id="lista-receitas" class="grid-receitas">
            ${renderizarLista(receitas)}
        </div>

        <div id="modal-receita" class="modal" style="display:none;">
            <div class="modal-content card">
                <span class="close-modal">&times;</span>
                <h3>Estrutura de Produção</h3>
                <form id="form-receita">
                    <input type="text" id="rec-nome" placeholder="Nome da Receita (ex: Macaron de Pistácio)" required>
                    
                    <div class="input-group">
                        <label>Rendimento Base (Unidades/Kg):</label>
                        <input type="number" id="rec-rendimento" value="1" step="0.1">
                    </div>

                    <h4>Ingredientes e Custos</h4>
                    <table id="tabela-ingredientes">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qtd (g/ml)</th>
                                <th>Preço/Kg</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody id="corpo-tabela">
                            </tbody>
                    </table>
                    <button type="button" id="add-ingrediente" class="btn-small">+ Ingrediente</button>

                    <div class="resumo-custos card" style="background: #f9f9f9; border-left: 5px solid gold;">
                        <p>Custo Total Matéria-Prima: <strong id="custo-total">0.00€</strong></p>
                        <p>Custo por Unidade: <strong id="custo-unitario">0.00€</strong></p>
                        <hr>
                        <label>Margem de Lucro Desejada (%):</label>
                        <input type="number" id="rec-margem" value="200">
                        <h4>Sugerido para Venda: <span id="preco-venda" style="color: green;">0.00€</span></h4>
                    </div>

                    <button type="submit" class="btn-action">Guardar Ficha Técnica</button>
                </form>
            </div>
        </div>
    `;

    setupEventos();
};

function renderizarLista(receitas) {
    if (receitas.length === 0) return '<p>Sem fichas técnicas registadas.</p>';
    return receitas.map(r => `
        <div class="card recipe-card">
            <div style="display:flex; justify-content:space-between;">
                <h4>${r.nome}</h4>
                <span>💰 ${r.venda.toFixed(2)}€</span>
            </div>
            <small>Custo Prod: ${r.custoTotal.toFixed(2)}€ | Margem: ${r.margem}%</small>
            <div style="margin-top:10px;">
                <button class="btn-small btn-edit" onclick="alert('Editar funcionalidade em breve')">📝 Detalhes</button>
            </div>
        </div>
    `).join('');
}

function setupEventos() {
    const modal = document.getElementById('modal-receita');
    document.getElementById('btn-abrir-modal').onclick = () => {
        modal.style.display = 'block';
        adicionarLinhaIngrediente();
    };

    document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';

    document.getElementById('add-ingrediente').onclick = () => adicionarLinhaIngrediente();

    document.getElementById('form-receita').onsubmit = async (e) => {
        e.preventDefault();
        await salvarReceita();
        renderReceitas();
    };

    // Delegação de eventos para cálculos em tempo real
    document.getElementById('corpo-tabela').addEventListener('input', calcularTotais);
    document.getElementById('rec-rendimento').addEventListener('input', calcularTotais);
    document.getElementById('rec-margem').addEventListener('input', calcularTotais);
}

function adicionarLinhaIngrediente() {
    const tbody = document.getElementById('corpo-tabela');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="ing-nome" placeholder="Farinha T55" required></td>
        <td><input type="number" class="ing-qtd" placeholder="500" required></td>
        <td><input type="number" class="ing-preco" placeholder="1.20" step="0.01" required></td>
        <td class="ing-subtotal">0.00€</td>
    `;
    tbody.appendChild(tr);
}

function calcularTotais() {
    let totalMP = 0;
    const rows = document.querySelectorAll('#corpo-tabela tr');
    
    rows.forEach(row => {
        const qtd = row.querySelector('.ing-qtd').value || 0;
        const precoKg = row.querySelector('.ing-preco').value || 0;
        const subtotal = (qtd / 1000) * precoKg;
        totalMP += subtotal;
        row.querySelector('.ing-subtotal').innerText = subtotal.toFixed(2) + '€';
    });

    const rendimento = document.getElementById('rec-rendimento').value || 1;
    const margemPercent = document.getElementById('rec-margem').value || 0;
    
    const custoUnitario = totalMP / rendimento;
    const precoVenda = custoUnitario * (1 + margemPercent / 100);

    document.getElementById('custo-total').innerText = totalMP.toFixed(2) + '€';
    document.getElementById('custo-unitario').innerText = custoUnitario.toFixed(2) + '€';
    document.getElementById('preco-venda').innerText = precoVenda.toFixed(2) + '€';
}

async function salvarReceita() {
    const nome = document.getElementById('rec-nome').value;
    const rendimento = parseFloat(document.getElementById('rec-rendimento').value);
    const margem = parseFloat(document.getElementById('rec-margem').value);
    
    // Capturar lista de ingredientes
    const ingredientes = [];
    document.querySelectorAll('#corpo-tabela tr').forEach(row => {
        ingredientes.push({
            nome: row.querySelector('.ing-nome').value,
            qtd: parseFloat(row.querySelector('.ing-qtd').value),
            preco: parseFloat(row.querySelector('.ing-preco').value)
        });
    });

    // Calcular totais finais para gravar
    const custoTotal = ingredientes.reduce((acc, curr) => acc + (curr.qtd / 1000) * curr.preco, 0);
    const venda = (custoTotal / rendimento) * (1 + margem / 100);

    const ficha = {
        id: Date.now().toString(),
        nome,
        rendimento,
        margem,
        ingredientes,
        custoTotal,
        venda
    };

    await addData('receitas', ficha);
    document.getElementById('modal-receita').style.display = 'none';
}
