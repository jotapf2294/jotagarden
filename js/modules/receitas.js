import { addData, getAllData, deleteData } from '../db.js';

const ALERGENOS = ['Glúten','Ovos','Leite','Frutos Casca Rija','Soja','Amendoins','Sésamo','Peixe','Crustáceos','Mostarda','Aipo','Tremoço','Sulfitos','Moluscos'];
const CATEGORIAS = ['Bolos Aniversário','Pastelaria','Sobremesas','Padaria','Salgados','Sem Glúten','Vegan'];
const PERIGOS = ['Biológico','Químico','Físico','Alergénico'];

const bc = new BroadcastChannel('docegestao');

export const renderReceitas = async () => {
  const c = document.getElementById('tab-receitas');
  const receitas = await getAllData('receitas');

  c.innerHTML = `
  <div class="receitas-layout">
    <div class="receitas-sidebar">
      <div class="sidebar-header">
        <h2>📖 Receitas HACCP</h2>
        <div class="search-box">
          <input id="search" placeholder="🔍 Pesquisar...">
          <select id="filtro-cat"><option value="">Todas</option>${CATEGORIAS.map(x=>`<option>${x}</option>`).join('')}</select>
        </div>
        <button id="btn-nova" class="btn-action">+ Nova Ficha Técnica</button>
      </div>
      <div id="lista-receitas" class="lista-scroll"></div>
    </div>

    <div class="receitas-detail" id="detail-view">
      <div class="empty-state">
        <div style="font-size:4rem">🧁</div>
        <h3>Seleciona uma receita</h3>
        <p>Ou cria uma nova ficha técnica HACCP</p>
      </div>
    </div>
  </div>

  <!-- MODAL FULLSCREEN -->
  <div id="modal-receita" class="modal-full">
    <div class="modal-container">
      <header class="modal-header">
        <h2 id="modal-titulo">Nova Ficha Técnica HACCP</h2>
        <button class="close-modal">&times;</button>
      </header>

      <form id="form-receita" class="form-haccp">
        <nav class="form-tabs">
          <button type="button" data-tab="geral" class="active">1. Geral</button>
          <button type="button" data-tab="composicao">2. Composição</button>
          <button type="button" data-tab="haccp">3. HACCP</button>
          <button type="button" data-tab="rotulagem">4. Rotulagem</button>
        </nav>

        <div class="form-content">
          <!-- ABA 1: GERAL -->
          <div class="tab-pane active" id="tab-geral">
            <div class="grid-2">
              <div><label>Nome Produto *</label><input id="r-nome" required></div>
              <div><label>Código Interno</label><input id="r-codigo" placeholder="BB-001"></div>
              <div><label>Categoria *</label><select id="r-cat" required>${CATEGORIAS.map(x=>`<option>${x}</option>`).join('')}</select></div>
              <div><label>Versão</label><input id="r-versao" value="1.0"></div>
              <div><label>Rendimento (un)</label><input type="number" id="r-rend" value="1" step="0.1"></div>
              <div><label>Peso unitário (g)</label><input type="number" id="r-peso" step="1"></div>
              <div><label>Margem %</label><input type="number" id="r-margem" value="200"></div>
              <div><label>Preço venda</label><input type="number" id="r-preco" step="0.01" readonly style="background:#f5f5f5"></div>
            </div>
            <label>Descrição Comercial</label>
            <textarea id="r-desc" rows="2" placeholder="Ex: Bolo húmido de chocolate belga..."></textarea>
          </div>

          <!-- ABA 2: COMPOSIÇÃO -->
          <div class="tab-pane" id="tab-composicao">
            <div class="ingredientes-header">
              <h4>Ingredientes (por ordem decrescente)</h4>
              <button type="button" id="add-ing" class="btn-small">+ Adicionar</button>
            </div>
            <div class="table-wrap">
              <table class="ing-table">
                <thead><tr><th>Ingrediente *</th><th>Qtd (g)</th><th>%</th><th>€/kg</th><th>Origem</th><th>Lote</th><th></th></tr></thead>
                <tbody id="tbody-ing"></tbody>
              </table>
            </div>
            <div class="totais">
              <span>Total: <b id="total-peso">0g</b></span>
              <span>Custo: <b id="total-custo">0.00€</b></span>
            </div>
          </div>

          <!-- ABA 3: HACCP -->
          <div class="tab-pane" id="tab-haccp">
            <div class="grid-2">
              <div><label>Temp. Cozedura (°C) *</label><input type="number" id="r-temp" required></div>
              <div><label>Tempo (min)</label><input type="number" id="r-tempo"></div>
              <div><label>Temp. Armazenamento</label><input id="r-arm-temp" placeholder="0-4°C"></div>
              <div><label>Validade (dias) *</label><input type="number" id="r-validade" required></div>
              <div><label>Humidade max (%)</label><input type="number" id="r-humidade" step="0.1"></div>
              <div><label>pH</label><input type="number" id="r-ph" step="0.1"></div>
            </div>

            <h4>Pontos Críticos de Controlo (PCC)</h4>
            <div id="pcc-list"></div>
            <button type="button" id="add-pcc" class="btn-small">+ Adicionar PCC</button>

            <h4>Alérgenos (Reg. 1169/2011)</h4>
            <div class="alerg-grid">${ALERGENOS.map(a=>`<label><input type="checkbox" name="alerg" value="${a}"><span>${a}</span></label>`).join('')}</div>

            <label>Modo Preparação Detalhado *</label>
            <textarea id="r-prep" rows="5" required></textarea>
          </div>

          <!-- ABA 4: ROTULAGEM -->
          <div class="tab-pane" id="tab-rotulagem">
            <div class="grid-2">
              <div><label>Denominação Legal</label><input id="r-denom"></div>
              <div><label>País Origem</label><input id="r-origem" value="Portugal"></div>
            </div>
            <label>Lista Ingredientes (automática)</label>
            <textarea id="r-ing-lista" rows="3" readonly style="background:#f9f9f9"></textarea>

            <h4>Declaração Nutricional (por 100g)</h4>
            <div class="grid-4">
              <div><label>Energia (kcal)</label><input type="number" id="n-kcal"></div>
              <div><label>Lípidos (g)</label><input type="number" id="n-lip" step="0.1"></div>
              <div><label>Hidratos (g)</label><input type="number" id="n-hc" step="0.1"></div>
              <div><label>Proteínas (g)</label><input type="number" id="n-prot" step="0.1"></div>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <div class="custos-bar">
            <span>Custo/un: <strong id="custo-view">0.00€</strong></span>
            <span>PVP: <strong id="pvp-view">0.00€</strong></span>
            <span>Margem: <strong id="margem-view">0%</strong></span>
          </div>
          <div class="actions">
            <button type="button" class="btn-secondary close-modal">Cancelar</button>
            <button type="submit" class="btn-primary">💾 Guardar Ficha HACCP</button>
          </div>
        </footer>
      </form>
    </div>
  </div>`;

  // CSS para layout tablet
  if (!document.getElementById('receitas-css')) {
    const style = document.createElement('style');
    style.id = 'receitas-css';
    style.textContent = `
     .receitas-layout{display:flex;gap:12px;height:calc(100vh - 140px)}
     .receitas-sidebar{width:340px;flex-shrink:0;display:flex;flex-direction:column;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)}
     .sidebar-header{padding:14px;border-bottom:1px solid #eee}
     .search-box{display:grid;grid-template-columns:1fr 110px;gap:6px;margin:8px 0}
     .search-box input,.search-box select{padding:8px;border:1px solid #ddd;border-radius:6px;font-size:.9rem}
     .lista-scroll{flex:1;overflow-y:auto;padding:8px}
     .receita-item{padding:10px;border-radius:8px;margin-bottom:6px;cursor:pointer;border:1px solid #f0f0f0;transition:.2s}
     .receita-item:hover{background:#fff5f8;border-color:var(--primary)}
     .receita-item.active{background:var(--primary);color:white}
     .receita-item h4{font-size:.95rem;margin-bottom:2px}
     .receita-item small{opacity:.8}
     .receitas-detail{flex:1;background:white;border-radius:12px;overflow:auto;box-shadow:0 1px 3px rgba(0,0,0,.1);padding:20px}
     .empty-state{text-align:center;margin-top:15vh;color:#999}

     .modal-full{position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;z-index:1000}
     .modal-full.show{display:flex}
     .modal-container{background:white;width:100%;height:100%;max-width:1200px;margin:auto;display:flex;flex-direction:column}
     .modal-header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:2px solid var(--primary);background:#fff5f8}
     .modal-header h2{margin:0;color:var(--dark)}
     .close-modal{background:none;border:none;font-size:32px;cursor:pointer;color:#999}
     .form-haccp{flex:1;display:flex;flex-direction:column;overflow:hidden}
     .form-tabs{display:flex;background:#f8f8;border-bottom:1px solid #ddd;padding:0 20px;gap:4px}
     .form-tabs button{padding:12px 20px;border:none;background:none;cursor:pointer;border-bottom:3px solid transparent;font-weight:500}
     .form-tabs button.active{border-color:var(--primary);color:var(--primary);background:white}
     .form-content{flex:1;overflow-y:auto;padding:20px}
     .tab-pane{display:none}
     .tab-pane.active{display:block;animation:fade.2s}
     .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
     .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
     .form-content label{display:block;font-size:.85rem;font-weight:600;margin-bottom:4px;color:#555}
     .form-content input,.form-content select,.form-content textarea{width:100%;padding:9px;border:1px solid #ddd;border-radius:6px;font-size:.95rem}
     .form-content input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 2px rgba(255,107,157,.1)}
     .ingredientes-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
     .table-wrap{overflow-x:auto;border:1px solid #eee;border-radius:8px}
     .ing-table{width:100%;border-collapse:collapse;font-size:.9rem;min-width:800px}
     .ing-table th{background:#f8f8f8;padding:8px;text-align:left;font-weight:600;font-size:.8rem;text-transform:uppercase;color:#666}
     .ing-table td{padding:6px;border-top:1px solid #f0f0f0}
     .ing-table input{padding:6px;border:1px solid #e5e5e5;border-radius:4px;width:100%}
     .totais{display:flex;gap:20px;margin-top:10px;padding:10px;background:#f9f9f9;border-radius:6px;font-size:.9rem}
     .alerg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}
     .alerg-grid label{display:flex;align-items:center;gap:6px;padding:6px;border:1px solid #eee;border-radius:6px;cursor:pointer;font-size:.85rem}
     .alerg-grid input:checked+span{font-weight:600;color:var(--primary)}
     .modal-footer{border-top:1px solid #eee;padding:14px 20px;background:#fafafa}
     .custos-bar{display:flex;gap:24px;margin-bottom:10px;font-size:.95rem}
     .actions{display:flex;gap:10px;justify-content:flex-end}
     .btn-primary{background:var(--primary);color:white;border:none;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer}
     .btn-secondary{background:white;border:1px solid #ddd;padding:10px 20px;border-radius:8px;cursor:pointer}
     .btn-small{background:#4caf50;color:white;border:none;padding:6px 12px;border-radius:6px;font-size:.85rem;cursor:pointer}

      @media(max-width:900px){
       .receitas-layout{flex-direction:column;height:auto}
       .receitas-sidebar{width:100%;height:40vh}
       .grid-2,.grid-4{grid-template-columns:1fr}
       .alerg-grid{grid-template-columns:1fr 1fr}
      }
      @keyframes fade{from{opacity:0}to{opacity:1}}
    `;
    document.head.appendChild(style);
  }

  setupReceitas(receitas);
};

function setupReceitas(receitas) {
  const lista = document.getElementById('lista-receitas');
  const detail = document.getElementById('detail-view');

  const renderLista = (dados) => {
    lista.innerHTML = dados.map(r => `
      <div class="receita-item" data-id="${r.id}">
        <h4>${r.nome}</h4>
        <small>${r.codigo||'—'} • ${r.categoria} • ${r.versao||'v1.0'}</small>
        <div style="margin-top:4px;font-size:.8rem;color:#666">PVP: ${r.venda?.toFixed(2)||'0.00'}€ | Val: ${r.validade||'?'}d</div>
      </div>
    `).join('');

    document.querySelectorAll('.receita-item').forEach(el => {
      el.onclick = () => {
        document.querySelectorAll('.receita-item').forEach(i=>i.classList.remove('active'));
        el.classList.add('active');
        mostrarDetalhe(receitas.find(r=>r.id===el.dataset.id));
      };
    });
  };

  const mostrarDetalhe = (r) => {
    if (!r) return;
    detail.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:20px">
        <div>
          <h1 style="margin:0 0 4px 0">${r.nome}</h1>
          <div style="color:#666">${r.codigo||''} • Versão ${r.versao||'1.0'} • ${r.categoria}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-small" onclick="editarReceita('${r.id}')" style="background:var(--primary)">✏️ Editar</button>
          <button class="btn-small" onclick="gerarFT('${r.id}')" style="background:#5D4037">📄 FT</button>
          <button class="btn-small" onclick="gerarProducao('${r.id}')" style="background:#2196F3">🏭 Produção</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:24px">
        <div class="card" style="margin:0"><small>Custo/un</small><h3>${(r.custoTotal/(r.rendimento||1)).toFixed(2)}€</h3></div>
        <div class="card" style="margin:0"><small>PVP</small><h3 style="color:#4caf50">${r.venda?.toFixed(2)||'0.00'}€</h3></div>
        <div class="card" style="margin:0"><small>Validade</small><h3>${r.validade||'?'} dias</h3></div>
        <div class="card" style="margin:0"><small>Temp cozedura</small><h3>${r.tempCoz||'?'}°C</h3></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div>
          <h3>📋 Composição</h3>
          <table style="width:100%;font-size:.9rem"><tr style="background:#f5f5f5"><th>Ingrediente</th><th>%</th><th>Qtd</th></tr>
            ${r.ingredientes?.map(i=>`<tr><td>${i.nome}</td><td>${((i.qtd/r.ingredientes.reduce((a,b)=>a+b.qtd,0))*100).toFixed(1)}%</td><td>${i.qtd}g</td></tr>`).join('')||''}
          </table>
          ${r.alergenos?.length?`<div style="margin-top:12px;padding:10px;background:#ffebee;border-left:4px solid #e53935;border-radius:4px"><strong>⚠️ Alérgenos:</strong> ${r.alergenos.join(', ')}</div>`:''}
        </div>
        <div>
          <h3>🔬 HACCP</h3>
          <p><strong>Armazenamento:</strong> ${r.armazenamento?.temp||'0-4°C'}</p>
          <p><strong>PCCs:</strong> ${r.pccs?.length||0} identificados</p>
          <p><strong>Preparação:</strong></p>
          <div style="background:#f9f9f9;padding:10px;border-radius:6px;white-space:pre-wrap;font-size:.9rem;max-height:200px;overflow:auto">${r.preparacao||'—'}</div>
        </div>
      </div>
    `;
  };

  window.editarReceita = (id) => abrirModal(receitas.find(r=>r.id===id));
  window.gerarFT = (id) => gerarFichaTecnica(receitas.find(r=>r.id===id));
  window.gerarProducao = (id) => gerarOrdemProducao(receitas.find(r=>r.id===id));

  document.getElementById('btn-nova').onclick = () => abrirModal(null);
  document.getElementById('search').oninput = e => {
    const t = e.target.value.toLowerCase();
    renderLista(receitas.filter(r=>r.nome.toLowerCase().includes(t)));
  };
  document.getElementById('filtro-cat').onchange = e => {
    const c = e.target.value;
    renderLista(c? receitas.filter(r=>r.categoria===c) : receitas);
  };

  renderLista(receitas);
  if (receitas[0]) {
    document.querySelector('.receita-item')?.click();
  }
}

//... resto das funções abrirModal, calcular, guardar, gerarFT, gerarProducao (mantém lógica atual mas com novos campos)
