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

// Reutiliza as funções de cálculo e adição de linha da versão anterior, 
// mas adicionando os campos de categoria e alérgenos no salvamento.
