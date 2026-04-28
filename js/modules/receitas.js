import { addData, getAllData } from '../db.js';

// Lista de Alérgenos (Norma Europeia 1169/2011)
const ALERGENOS_LIST = ['Glúten', 'Ovos', 'Leite', 'Frutos de Casca Rija', 'Soja', 'Amendoins', 'Sésamo'];
const CATEGORIAS = ['Bolos de Aniversário', 'Pastelaria Semanal', 'Sobremesas', 'Padaria', 'Salgados'];

export const renderReceitas = async () => {
    const container = document.getElementById('tab-receitas');
    const receitas = await getAllData('receitas');

    container.innerHTML = `
        <div class="header-section">
            <h2>📖 Fichas Técnicas HACCP</h2>
            <div class="search-bar">
                <input type="text" id="search-receita" placeholder="🔍 Pesquisar por nome ou ingrediente...">
                <select id="filter-categoria">
                    <option value="">Todas as Categorias</option>
                    ${CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            </div>
            <button id="btn-abrir-modal" class="btn-action" style="margin-top:10px;">+ Criar Ficha Profissional</button>
        </div>
        
        <div id="lista-receitas" class="grid-receitas"></div>

        <div id="modal-receita" class="modal" style="display:none;">
            <div class="modal-content card">
                <span class="close-modal">&times;</span>
                <h3>Nova Ficha Técnica de Produção</h3>
                
                <form id="form-receita">
                    <div class="tabs-form">
                        <button type="button" class="tab-btn active" data-tab="geral">Geral/Custos</button>
                        <button type="button" class="tab-btn" data-tab="haccp">Segurança (HACCP)</button>
                    </div>

                    <div id="form-geral" class="form-section active">
                        <input type="text" id="rec-nome" placeholder="Designação do Produto" required>
                        <select id="rec-categoria" required>
                            <option value="">Escolha uma Categoria</option>
                            ${CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                        
                        <div class="input-group">
                            <label>Rendimento Final (Ex: 12 unidades):</label>
                            <input type="number" id="rec-rendimento" value="1" step="0.01">
                        </div>

                        <h4>Ingredientes (Custo MP)</h4>
                        <table id="tabela-ingredientes">
                            <tbody id="corpo-tabela"></tbody>
                        </table>
                        <button type="button" id="add-ingrediente" class="btn-small">+ Item</button>
                    </div>

                    <div id="form-haccp" class="form-section">
                        <h4>⚠️ Controlo de Alérgenos</h4>
                        <div class="alergenos-grid">
                            ${ALERGENOS_LIST.map(a => `
                                <label><input type="checkbox" name="alergenos" value="${a}"> ${a}</label>
                            `).join('')}
                        </div>

                        <h4>🌡️ Processo e Conservação</h4>
                        <textarea id="rec-preparacao" placeholder="Modo de preparação detalhado..."></textarea>
                        <div class="input-group">
                            <label>Temp. Cozedura (°C):</label>
                            <input type="number" id="rec-temp-coz" placeholder="180">
                        </div>
                        <div class="input-group">
                            <label>Validade (Dias):</label>
                            <input type="number" id="rec-validade" placeholder="3">
                        </div>
                    </div>

                    <div class="resumo-fixo card">
                        <span>Custo Un: <strong id="custo-unitario">0.00€</strong></span>
                        <span>PV Sugerido: <strong id="preco-venda" style="color:var(--primary)">0.00€</strong></span>
                    </div>

                    <button type="submit" class="btn-action">Validar e Guardar Ficha</button>
                </form>
            </div>
        </div>
    `;

    setupLógica(receitas);
    filtrarLista(receitas);
};

function setupLógica(receitas) {
    const modal = document.getElementById('modal-receita');
    const searchInput = document.getElementById('search-receita');
    const filterCat = document.getElementById('filter-categoria');

    // Pesquisa e Filtro
    const atualizar = () => {
        const termo = searchInput.value.toLowerCase();
        const cat = filterCat.value;
        const filtradas = receitas.filter(r => 
            (r.nome.toLowerCase().includes(termo) || r.ingredientes.some(i => i.nome.toLowerCase().includes(termo))) &&
            (cat === "" || r.categoria === cat)
        );
        document.getElementById('lista-receitas').innerHTML = renderizarLista(filtradas);
    };

    searchInput.addEventListener('input', atualizar);
    filterCat.addEventListener('change', atualizar);

    // Gestão de Tabs no Modal
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn, .form-section').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`form-${btn.dataset.tab}`).classList.add('active');
        };
    });

    // Abrir Modal
    document.getElementById('btn-abrir-modal').onclick = () => {
        document.getElementById('form-receita').reset();
        document.getElementById('corpo-tabela').innerHTML = '';
        adicionarLinhaIngrediente();
        modal.style.display = 'block';
    };

    document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
    document.getElementById('add-ingrediente').onclick = adicionarLinhaIngrediente;
    document.getElementById('corpo-tabela').addEventListener('input', calcularTotaisRec);
}

function renderizarLista(dados) {
    return dados.map(r => `
        <div class="card haccp-card">
            <div class="card-tag">${r.categoria}</div>
            <h4>${r.nome}</h4>
            <div class="card-details">
                <span>📋 ${r.ingredientes.length} itens</span>
                <span>🌡️ ${r.tempCoz || '--'}°C</span>
                <span>⚠️ ${r.alergenos.length > 0 ? 'Contém Alérgenos' : 'Livre de Alérgenos'}</span>
            </div>
            <div class="card-price">Venda: <strong>${r.venda.toFixed(2)}€</strong></div>
        </div>
    `).join('');
}
function adicionarLinhaIngrediente() {
    const tbody = document.getElementById('corpo-tabela');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="ing-nome" placeholder="Item" required></td>
        <td><input type="number" class="ing-qtd" placeholder="g/ml" required></td>
        <td><input type="number" class="ing-preco" placeholder="Preço/Kg" step="0.01" required></td>
        <td class="ing-subtotal" style="font-weight:bold; color:var(--text-color)">0.00€</td>
    `;
    tbody.appendChild(tr);
}

function calcularTotaisRec() {
    let totalMP = 0;
    const rows = document.querySelectorAll('#corpo-tabela tr');
    
    rows.forEach(row => {
        const qtd = parseFloat(row.querySelector('.ing-qtd').value) || 0;
        const precoKg = parseFloat(row.querySelector('.ing-preco').value) || 0;
        const subtotal = (qtd / 1000) * precoKg;
        totalMP += subtotal;
        row.querySelector('.ing-subtotal').innerText = subtotal.toFixed(2) + '€';
    });

    const rendimento = parseFloat(document.getElementById('rec-rendimento').value) || 1;
    const margemPercent = 200; // Podes tornar isto um input dinâmico se quiseres
    
    const custoUnitario = totalMP / rendimento;
    const precoVenda = custoUnitario * (1 + margemPercent / 100);

    document.getElementById('custo-unitario').innerText = custoUnitario.toFixed(2) + '€';
    document.getElementById('preco-venda').innerText = precoVenda.toFixed(2) + '€';
    
    return { totalMP, custoUnitario, precoVenda };
}

async function salvarReceita() {
    // 1. Capturar Dados Gerais
    const nome = document.getElementById('rec-nome').value;
    const categoria = document.getElementById('rec-categoria').value;
    const rendimento = parseFloat(document.getElementById('rec-rendimento').value);
    
    // 2. Capturar Alérgenos (Checkboxes)
    const alergenos = Array.from(document.querySelectorAll('input[name="alergenos"]:checked'))
                           .map(cb => cb.value);

    // 3. Capturar Dados HACCP
    const preparacao = document.getElementById('rec-preparacao').value;
    const tempCoz = document.getElementById('rec-temp-coz').value;
    const validade = document.getElementById('rec-validade').value;

    // 4. Capturar Ingredientes
    const ingredientes = [];
    document.querySelectorAll('#corpo-tabela tr').forEach(row => {
        ingredientes.push({
            nome: row.querySelector('.ing-nome').value,
            qtd: parseFloat(row.querySelector('.ing-qtd').value),
            preco: parseFloat(row.querySelector('.ing-preco').value)
        });
    });

    const totais = calcularTotaisRec();

    const fichaHACCP = {
        id: Date.now().toString(),
        nome,
        categoria,
        rendimento,
        ingredientes,
        alergenos,
        preparacao,
        tempCoz,
        validade,
        custoTotal: totais.totalMP,
        venda: totais.precoVenda,
        margem: 200 // Valor fixo para este exemplo
    };

    try {
        await addData('receitas', fichaHACCP);
        alert('✔️ Ficha Técnica Guardada com Sucesso!');
    } catch (err) {
        console.error("Erro ao guardar:", err);
        alert('❌ Erro na Base de Dados Offline.');
    }
}

// Reutiliza as funções de cálculo e adição de linha da versão anterior, 
// mas adicionando os campos de categoria e alérgenos no salvamento.

