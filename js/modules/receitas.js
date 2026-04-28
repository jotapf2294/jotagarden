import { addData, getAllData } from '../db.js';

const ALERGENOS_LIST = ['Glúten', 'Ovos', 'Leite', 'Frutos de Casca Rija', 'Soja', 'Amendoins', 'Sésamo'];
const CATEGORIAS = ['Bolos de Aniversário', 'Pastelaria Semanal', 'Sobremesas', 'Padaria', 'Salgados'];

export const renderReceitas = async () => {
    const container = document.getElementById('tab-receitas');
    const receitas = await getAllData('receitas');

    container.innerHTML = `
        <div class="header-section">
            <h2>📖 Fichas Técnicas HACCP</h2>
            <div class="search-bar">
                <input type="text" id="search-receita" placeholder="🔍 Pesquisar...">
                <select id="filter-categoria">
                    <option value="">Todas</option>
                    ${CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            </div>
            <button id="btn-abrir-modal" class="btn-action" style="margin-top:10px;">+ Criar Nova Ficha</button>
        </div>
        
        <div id="lista-receitas" class="grid-receitas"></div>

        <div id="modal-receita" class="modal" style="display:none;">
            <div class="modal-content card">
                <span class="close-modal">&times;</span>
                <h3>Nova Ficha Técnica</h3>
                
                <form id="form-receita">
                    <div class="tabs-form">
                        <button type="button" class="tab-btn active" data-tab="geral">Geral/Custos</button>
                        <button type="button" class="tab-btn" data-tab="haccp">HACCP</button>
                    </div>

                    <div id="form-geral" class="form-section active">
                        <input type="text" id="rec-nome" placeholder="Nome da Receita" required>
                        <select id="rec-categoria" required>
                            <option value="">Escolha uma Categoria</option>
                            ${CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                        
                        <div class="input-group">
                            <label>Rendimento (Un/Kg):</label>
                            <input type="number" id="rec-rendimento" value="1" step="0.01" required>
                        </div>

                        <h4>Ingredientes</h4>
                        <table id="tabela-ingredientes">
                            <thead>
                                <tr><th>Item</th><th>Qtd(g)</th><th>€/Kg</th><th>Sub</th></tr>
                            </thead>
                            <tbody id="corpo-tabela"></tbody>
                        </table>
                        <button type="button" id="add-ingrediente" class="btn-small">+ Item</button>
                    </div>

                    <div id="form-haccp" class="form-section">
                        <h4>⚠️ Alérgenos</h4>
                        <div class="alergenos-grid">
                            ${ALERGENOS_LIST.map(a => `<label><input type="checkbox" name="alergenos" value="${a}"> ${a}</label>`).join('')}
                        </div>
                        <textarea id="rec-preparacao" placeholder="Modo de preparação..." style="margin-top:10px; height:80px;"></textarea>
                        <input type="number" id="rec-temp-coz" placeholder="Temp. Cozedura °C">
                        <input type="number" id="rec-validade" placeholder="Validade (Dias)">
                    </div>

                    <div class="resumo-fixo card">
                        <span>Custo Un: <strong id="custo-unitario">0.00€</strong></span>
                        <span>Venda: <strong id="preco-venda">0.00€</strong></span>
                    </div>

                    <button type="submit" class="btn-action">Guardar Ficha</button>
                </form>
            </div>
        </div>
    `;

    setupLogic(receitas);
    renderLista(receitas);
};

function setupLogic(receitas) {
    const modal = document.getElementById('modal-receita');
    const form = document.getElementById('form-receita');

    // Fechar Modal
    document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';

    // Abrir Modal e Reset
    document.getElementById('btn-abrir-modal').onclick = () => {
        form.reset();
        document.getElementById('corpo-tabela').innerHTML = '';
        adicionarLinha();
        modal.style.display = 'block';
    };

    // Navegação Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn, .form-section').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`form-${btn.dataset.tab}`).classList.add('active');
        };
    });

    // Cálculos em tempo real
    document.getElementById('add-ingrediente').onclick = adicionarLinha;
    document.getElementById('corpo-tabela').addEventListener('input', calcular);
    document.getElementById('rec-rendimento').addEventListener('input', calcular);

    // Submissão do Formulário
    form.onsubmit = async (e) => {
        e.preventDefault();
        console.log("Iniciando salvamento...");
        
        try {
            const novaFicha = capturarDados();
            await addData('receitas', novaFicha);
            modal.style.display = 'none';
            alert('✅ Guardado!');
            renderReceitas(); // Recarregar aba
        } catch (err) {
            console.error("Erro ao guardar ficha:", err);
            alert('Erro ao guardar. Verifica a consola.');
        }
    };
}

function adicionarLinha() {
    const tbody = document.getElementById('corpo-tabela');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="ing-nome" required></td>
        <td><input type="number" class="ing-qtd" value="0" required></td>
        <td><input type="number" class="ing-preco" value="0" step="0.01" required></td>
        <td class="ing-sub">0.00€</td>
    `;
    tbody.appendChild(tr);
}

function calcular() {
    let totalMP = 0;
    document.querySelectorAll('#corpo-tabela tr').forEach(row => {
        const q = parseFloat(row.querySelector('.ing-qtd').value) || 0;
        const p = parseFloat(row.querySelector('.ing-preco').value) || 0;
        const sub = (q / 1000) * p;
        totalMP += sub;
        row.querySelector('.ing-sub').innerText = sub.toFixed(2) + '€';
    });

    const rend = parseFloat(document.getElementById('rec-rendimento').value) || 1;
    const custoUn = totalMP / rend;
    const vendaSugerida = custoUn * 3; // Margem de 200% (x3)

    document.getElementById('custo-unitario').innerText = custoUn.toFixed(2) + '€';
    document.getElementById('preco-venda').innerText = vendaSugerida.toFixed(2) + '€';
}

function capturarDados() {
    const ingredientes = [];
    document.querySelectorAll('#corpo-tabela tr').forEach(row => {
        ingredientes.push({
            nome: row.querySelector('.ing-nome').value,
            qtd: parseFloat(row.querySelector('.ing-qtd').value),
            preco: parseFloat(row.querySelector('.ing-preco').value)
        });
    });

    const custoTotal = ingredientes.reduce((acc, i) => acc + (i.qtd/1000)*i.preco, 0);
    const rendimento = parseFloat(document.getElementById('rec-rendimento').value) || 1;

    return {
        id: Date.now().toString(),
        nome: document.getElementById('rec-nome').value,
        categoria: document.getElementById('rec-categoria').value,
        rendimento: rendimento,
        ingredientes: ingredientes,
        alergenos: Array.from(document.querySelectorAll('input[name="alergenos"]:checked')).map(cb => cb.value),
        preparacao: document.getElementById('rec-preparacao').value,
        tempCoz: document.getElementById('rec-temp-coz').value,
        validade: document.getElementById('rec-validade').value,
        custoTotal: custoTotal,
        venda: (custoTotal / rendimento) * 3
    };
}

function renderLista(receitas) {
    const lista = document.getElementById('lista-receitas');
    if (!receitas.length) {
        lista.innerHTML = '<p>Nenhuma ficha encontrada.</p>';
        return;
    }
    lista.innerHTML = receitas.map(r => `
        <div class="card">
            <small>${r.categoria}</small>
            <h4>${r.nome}</h4>
            <p>Venda: <strong>${r.venda.toFixed(2)}€</strong></p>
        </div>
    `).join('');
}
