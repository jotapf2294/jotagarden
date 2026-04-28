import {
  addData,
  getAllData,
  initDB
} from '../db.js';

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
  <h3 id="modal-titulo">Nova Ficha Técnica</h3>

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
  <textarea id="rec-preparacao" placeholder="Modo de preparação..." style="margin-top:10px; height:80px; width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;"></textarea>
  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
  <input type="number" id="rec-temp-coz" placeholder="Cozedura °C">
  <input type="number" id="rec-validade" placeholder="Validade (Dias)">
  </div>
  </div>

  <div class="resumo-fixo card" style="background:#333; color:white; margin-top:15px; padding:15px;">
  <div style="display:flex; justify-content:space-between;">
  <span>Custo Un: <strong id="custo-unitario" style="color:var(--primary)">0.00€</strong></span>
  <span>Venda: <strong id="preco-venda" style="color:#4caf50">0.00€</strong></span>
  </div>
  </div>

  <button type="submit" class="btn-action" style="margin-top:15px;">Guardar Ficha</button>
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

  document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';

  document.getElementById('btn-abrir-modal').onclick = () => {
    delete form.dataset.editId;
    form.reset();
    document.getElementById('modal-titulo').innerText = "Nova Ficha Técnica";
    document.getElementById('corpo-tabela').innerHTML = '';
    document.querySelector('button[type="submit"]').innerText = "Guardar Ficha";
    document.querySelectorAll('.tab-btn, .form-section').forEach(el => el.classList.remove('active'));
    document.querySelector('[data-tab="geral"]').classList.add('active');
    document.getElementById('form-geral').classList.add('active');
    adicionarLinha();
    modal.style.display = 'block';
  };

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn, .form-section').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`form-${btn.dataset.tab}`).classList.add('active');
    };
  });

  document.getElementById('add-ingrediente').onclick = adicionarLinha;
  document.getElementById('corpo-tabela').addEventListener('input', calcular);
  document.getElementById('rec-rendimento').addEventListener('input', calcular);

  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const dados = capturarDados();
      if (form.dataset.editId) dados.id = form.dataset.editId;
      await addData('receitas', dados);
      modal.style.display = 'none';
      renderReceitas();
    } catch (err) {
      console.error(err);
    }
  };

  document.getElementById('search-receita').oninput = (e) => {
    const termo = e.target.value.toLowerCase();
    const filtradas = receitas.filter(r => r.nome.toLowerCase().includes(termo));
    renderLista(filtradas);
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
  document.getElementById('custo-unitario').innerText = custoUn.toFixed(2) + '€';
  document.getElementById('preco-venda').innerText = (custoUn * 3).toFixed(2) + '€';
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
  const rend = parseFloat(document.getElementById('rec-rendimento').value) || 1;
  return {
    id: Date.now().toString(),
    nome: document.getElementById('rec-nome').value,
    categoria: document.getElementById('rec-categoria').value,
    rendimento: rend,
    ingredientes,
    alergenos: Array.from(document.querySelectorAll('input[name="alergenos"]:checked')).map(cb => cb.value),
    preparacao: document.getElementById('rec-preparacao').value,
    tempCoz: document.getElementById('rec-temp-coz').value,
    validade: document.getElementById('rec-validade').value,
    custoTotal,
    venda: (custoTotal / rend) * 3
  };
}

function renderLista(receitas) {
  const lista = document.getElementById('lista-receitas');
  lista.innerHTML = receitas.map(r => `
    <div class="card haccp-card">
    <div class="card-tag">${r.categoria}</div>
    <h4>${r.nome}</h4>
    <p>Venda: <strong>${r.venda.toFixed(2)}€</strong></p>
    <div style="margin-top:10px; display:flex; gap:4px; flex-wrap: wrap;">
    <button class="btn-small btn-edit" data-id="${r.id}" style="flex:1; background:var(--primary); color:white;">📝 Editar</button>
    <button class="btn-small btn-ft" data-id="${r.id}" style="flex:1; background:#5D4037; color:white;">📄 FT</button>
    <button class="btn-small btn-produce" data-id="${r.id}" style="flex:1; background:#6c757d; color:white;">👨‍🍳 Fabrico</button>
    <button class="btn-small btn-delete" data-id="${r.id}" style="width:35px; background:#ff4444; color:white;">🗑️</button>
    </div>
    </div>
    `).join('');

  document.querySelectorAll('.btn-edit').forEach(btn => btn.onclick = () => abrirEdicao(btn.dataset.id, receitas));
  document.querySelectorAll('.btn-ft').forEach(btn => btn.onclick = () => gerarFichaTecnica(btn.dataset.id, receitas));
  document.querySelectorAll('.btn-produce').forEach(btn => btn.onclick = () => abrirProducao(btn.dataset.id, receitas));
  document.querySelectorAll('.btn-delete').forEach(btn => btn.onclick = () => eliminarReceita(btn.dataset.id));
}

function abrirEdicao(id, receitas) {
  const receita = receitas.find(r => r.id === id);
  if (!receita) return;
  const modal = document.getElementById('modal-receita');
  const form = document.getElementById('form-receita');
  form.reset();
  document.getElementById('modal-titulo').innerText = "Editar Ficha";
  document.getElementById('corpo-tabela').innerHTML = '';
  form.dataset.editId = receita.id;
  document.getElementById('rec-nome').value = receita.nome;
  document.getElementById('rec-categoria').value = receita.categoria;
  document.getElementById('rec-rendimento').value = receita.rendimento;
  document.getElementById('rec-preparacao').value = receita.preparacao || '';
  document.getElementById('rec-temp-coz').value = receita.tempCoz || '';
  document.getElementById('rec-validade').value = receita.validade || '';
  receita.ingredientes.forEach(ing => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
    <td><input type="text" class="ing-nome" value="${ing.nome}" required></td>
    <td><input type="number" class="ing-qtd" value="${ing.qtd}" required></td>
    <td><input type="number" class="ing-preco" value="${ing.preco}" step="0.01" required></td>
    <td class="ing-sub">0.00€</td>
    `;
    document.getElementById('corpo-tabela').appendChild(tr);
  });
  document.querySelectorAll('input[name="alergenos"]').forEach(cb => cb.checked = receita.alergenos.includes(cb.value));
  calcular();
  modal.style.display = 'block';
}

async function eliminarReceita(id) {
  if (confirm('Eliminar permanentemente?')) {
    const db = await initDB();
    const tx = db.transaction('receitas', 'readwrite');
    await tx.objectStore('receitas').delete(id);
    renderReceitas();
  }
}

// --- GERAÇÃO DE DOCUMENTO: FICHA TÉCNICA COMERCIAL ---
function gerarFichaTecnica(id, receitas) {
  const r = receitas.find(rec => rec.id === id);
  if (!r) return;

  const pesoTotal = r.ingredientes.reduce((acc, i) => acc + i.qtd, 0);
  const dataHoje = new Date().toLocaleDateString('pt-PT');
  const win = window.open('', '_blank');

  win.document.write(`
    <html>
    <head>
    <title>FT - ${r.nome}</title>
    <style>
    @page { size: A4; margin: 12mm; }
    body { font-family:'Arial',sans-serif; color:#1a1a1a; font-size:10.5pt; line-height:1.4; padding:20px; }
    .header { border-bottom:4px solid #5D4037; padding-bottom:10px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center; }
    .logo { font-size:26px; font-weight:900; color:#FF6B9D; letter-spacing:-0.5px; }
    .doc-meta { text-align:right; font-size:9pt; color:#666; }
    .doc-meta h1 { font-size:16pt; color:#5D4037; margin:0; }
    .box { border:2px solid #5D4037; border-radius:6px; padding:10px; margin-bottom:12px; position:relative; background:white; }
    .box-title { background:#5D4037; color:#fff; margin:-10px -10px 8px -10px; padding:6px 10px; font-weight:700; font-size:9pt; text-transform:uppercase; }
    table { width:100%; border-collapse:collapse; font-size:9.5pt; }
    th { background:#FFF5F8; border:1px solid #5D4037; padding:5px; text-align:left; }
    td { border:1px solid #ccc; padding:5px; }
    .alergenios { background:#FFEBEE; border:2px solid #E57373; padding:8px; margin:8px 0; font-weight:700; text-align:center; color:#b71c1c; }
    .watermark { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-45deg); font-size:120px; color:rgba(255,107,157,0.05); font-weight:900; z-index:-1; }
    @media print { .no-print { display:none; } }
    </style>
    </head>
    <body>
    <div class="watermark">BABE'S</div>
    <div class="no-print" style="text-align:center; margin-bottom:20px;"><button onclick="window.print()">🖨️ Imprimir Ficha Técnica</button></div>
    <div class="header">
    <div class="logo">🧁 BABE'S BAKERY</div>
    <div class="doc-meta"><h1>FICHA TÉCNICA</h1><div>Ref: FT-${r.id.slice(-6)}</div><div>${dataHoje}</div></div>
    </div>
    <div class="box">
    <div class="box-title">1. Identificação do Produto</div>
    <table>
    <tr><th>Denominação</th><td colspan="3"><b>${r.nome}</b></td></tr>
    <tr><th>Categoria</th><td>${r.categoria}</td><th>Código</th><td>BB-${r.id.slice(-4)}</td></tr>
    <tr><th>Rendimento</th><td>${r.rendimento} un/kg</td><th>Peso Un.</th><td>${(pesoTotal/r.rendimento).toFixed(0)}g</td></tr>
    <tr><th>Batch Total</th><td>${pesoTotal}g</td><th>Validade</th><td>${r.validade} dias</td></tr>
    </table>
    </div>
    <div class="box">
    <div class="box-title">2. Lista de Ingredientes</div>
    <div style="font-size:9pt;">${r.ingredientes.sort((a, b)=>b.qtd-a.qtd).map(i => `${i.nome} (${((i.qtd/pesoTotal)*100).toFixed(1)}%)`).join(', ')}</div>
    </div>
    ${r.alergenos.length ? `<div class="alergenios">⚠️ ALERGÉNIOS: ${r.alergenos.join(', ').toUpperCase()}</div>`: ''}
    <div class="box">
    <div class="box-title">3. Processo de Fabrico</div>
    <div style="white-space:pre-wrap; font-size:9pt;">${r.preparacao || 'Padrão.'}</div>
    </div>
    <div style="display:flex; justify-content:space-between; margin-top:50px; text-align:center; font-size:8pt;">
    <div style="border-top:1px solid #000; width:30%;">Elaborado</div>
    <div style="border-top:1px solid #000; width:30%;">Aprovado</div>
    <div style="border-top:1px solid #000; width:30%;">Data</div>
    </div>
    </body>
    </html>
    `);
  win.document.close();
}

// --- GERAÇÃO DE DOCUMENTO: ORDEM DE PRODUÇÃO (FABRICO) ---
function abrirProducao(id, receitas) {
  const r = receitas.find(rec => rec.id === id);
  if (!r) return;

  const hoje = new Date();
  const pesoTotal = r.ingredientes.reduce((acc, i) => acc + i.qtd, 0);
  const win = window.open('', '_blank');

  win.document.write(`
    <html>
    <head>
    <title>Produção - ${r.nome}</title>
    <style>
    @page { size: A4; margin: 10mm; }
    body { font-family:'Arial',sans-serif; color:#1a1a1a; font-size:10pt; padding:20px; }
    .header { background:#5D4037; color:#white; padding:10px; display:flex; justify-content:space-between; color:white; }
    .lote { background:#FF6B9D; color:white; padding:8px; text-align:center; font-weight:700; margin:10px 0; border-radius:4px; }
    .box { border:2px solid #5D4037; border-radius:6px; padding:10px; margin-bottom:10px; }
    .box-title { background:#5D4037; color:white; margin:-10px -10px 8px -10px; padding:6px 10px; font-weight:700; font-size:9pt; }
    table { width:100%; border-collapse:collapse; }
    th, td { border:1px solid #ccc; padding:6px; text-align:left; }
    th { background:#FFF5F8; }
    .check { width:30px; text-align:center; }
    @media print { .no-print { display:none; } }
    </style>
    </head>
    <body>
    <div class="no-print" style="text-align:center;"><button onclick="window.print()">🖨️ Imprimir Ordem de Fabrico</button></div>
    <div class="header">
    <div><h1>FICHA DE PRODUÇÃO</h1><h2>${r.nome}</h2></div>
    <div style="text-align:right">Data: ${hoje.toLocaleDateString('pt-PT')}<br>Operador: ___________</div>
    </div>
    <div class="lote">LOTE: BB-${hoje.toISOString().slice(2, 10).replace(/-/g, '')}-001 | VALIDADE: ${r.validade} dias</div>
    <div class="box">
    <div class="box-title">Ingredientes - Checklist de Pesagem</div>
    <table>
    <thead><tr><th>Ingrediente</th><th>Qtd Padrão</th><th>Qtd Real</th><th class="check">OK</th></tr></thead>
    <tbody>
    ${r.ingredientes.map(i => `<tr><td>${i.nome}</td><td>${i.qtd}g</td><td>________</td><td class="check">☐</td></tr>`).join('')}
    </tbody>
    </table>
    </div>
    <div class="box">
    <div class="box-title">Modo de Preparação e Pontos Críticos</div>
    <div style="white-space:pre-wrap; min-height:100px;">${r.preparacao}</div>
    <div style="margin-top:10px; font-weight:bold;">🌡️ Temperatura Alvo: ${r.tempCoz}°C | Real: ____°C</div>
    </div>
    <div class="box">
    <div class="box-title">Rastreabilidade (Lotes MP)</div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
    ${r.ingredientes.slice(0, 4).map(i => `<div>Lote ${i.nome}: ___________</div>`).join('')}
    </div>
    </div>
    </body>
    </html>
    `);
  win.document.close();
}
