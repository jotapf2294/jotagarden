import {
  addData,
  getAllData,
  deleteData
} from '../db.js';

const ALERGENOS_LIST = ['Glúten', 'Ovos', 'Leite', 'Frutos de Casca Rija', 'Soja', 'Amendoins', 'Sésamo'];
const CATEGORIAS = ['Bolos de Aniversário', 'Pastelaria Semanal', 'Sobremesas', 'Padaria', 'Salgados'];

// Canal pra sincronizar abas
const bc = new BroadcastChannel('docegestao');

export const renderReceitas = async () => {
  const container = document.getElementById('tab-receitas');
  const receitas = await getAllData('receitas');

  container.innerHTML = `
  <div class="header-section">
    <h2>📖 Fichas Técnicas HACCP</h2>
    <div class="search-bar" style="display:grid; grid-template-columns: 1fr 120px; gap:8px; margin:10px 0;">
      <input type="text" id="search-receita" placeholder="🔍 Pesquisar receita..." style="padding:10px; border-radius:8px; border:1px solid #ddd;">
      <select id="filter-categoria" style="padding:10px; border-radius:8px; border:1px solid #ddd;">
        <option value="">Todas</option>
        ${CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
    </div>
    <button id="btn-abrir-modal" class="btn-action" style="width:100%;">+ Criar Nova Ficha</button>
  </div>

  <div id="lista-receitas" class="grid-receitas" style="display:grid; gap:10px; margin-top:15px;"></div>

  <div id="modal-receita" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; overflow-y:auto;">
    <div class="modal-content card" style="margin:20px; max-width:600px; margin-left:auto; margin-right:auto;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3 id="modal-titulo">Nova Ficha Técnica</h3>
        <span class="close-modal" style="font-size:28px; cursor:pointer;">&times;</span>
      </div>

      <form id="form-receita">
        <div class="tabs-form" style="display:flex; gap:5px; margin:15px 0;">
          <button type="button" class="tab-btn active" data-tab="geral" style="flex:1; padding:8px; border:none; background:var(--primary); color:white; border-radius:6px;">Geral/Custos</button>
          <button type="button" class="tab-btn" data-tab="haccp" style="flex:1; padding:8px; border:1px solid #ddd; background:white; border-radius:6px;">HACCP</button>
        </div>

        <div id="form-geral" class="form-section active">
          <input type="text" id="rec-nome" placeholder="Nome da Receita" required style="width:100%; padding:10px; margin:5px 0; border-radius:8px; border:1px solid #ddd;">
          <select id="rec-categoria" required style="width:100%; padding:10px; margin:5px 0; border-radius:8px; border:1px solid #ddd;">
            <option value="">Escolha uma Categoria</option>
            ${CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin:10px 0;">
            <div>
              <label style="font-size:0.8rem;">Rendimento Un/Kg:</label>
              <input type="number" id="rec-rendimento" value="1" step="0.01" required style="width:100%; padding:8px; border-radius:6px; border:1px solid #ddd;">
            </div>
            <div>
              <label style="font-size:0.8rem;">Margem %:</label>
              <input type="number" id="rec-margem" value="200" step="10" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ddd;">
            </div>
          </div>

          <h4 style="margin-top:15px;">Ingredientes</h4>
          <table id="tabela-ingredientes" style="width:100%; font-size:0.85rem;">
            <thead>
              <tr style="background:#f5f5f5;"><th>Item</th><th>Qtd(g)</th><th>€/Kg</th><th>Sub</th><th></th></tr>
            </thead>
            <tbody id="corpo-tabela"></tbody>
          </table>
          <button type="button" id="add-ingrediente" class="btn-small" style="margin-top:8px; padding:6px 12px; background:#4caf50; color:white; border:none; border-radius:6px;">+ Item</button>
        </div>

        <div id="form-haccp" class="form-section" style="display:none;">
          <h4>⚠️ Alérgenos</h4>
          <div class="alergenos-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:5px; font-size:0.9rem;">
            ${ALERGENOS_LIST.map(a => `<label><input type="checkbox" name="alergenos" value="${a}"> ${a}</label>`).join('')}
          </div>
          <textarea id="rec-preparacao" placeholder="Modo de preparação detalhado..." style="margin-top:15px; height:100px; width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;"></textarea>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
            <input type="number" id="rec-temp-coz" placeholder="Cozedura °C *" style="padding:10px; border-radius:8px; border:1px solid #ddd;">
            <input type="number" id="rec-validade" placeholder="Validade Dias *" style="padding:10px; border-radius:8px; border:1px solid #ddd;">
          </div>
          <small style="color:#666;">* Campos obrigatórios para HACCP</small>
        </div>

        <div class="resumo-fixo card" style="background:#333; color:white; margin-top:15px; padding:15px;">
          <div style="display:flex; justify-content:space-between; font-size:1.1rem;">
            <span>Custo Un: <strong id="custo-unitario" style="color:var(--primary)">0.00€</strong></span>
            <span>Venda: <strong id="preco-venda" style="color:#4caf50">0.00€</strong></span>
          </div>
        </div>

        <button type="submit" class="btn-action" style="margin-top:15px; width:100%;">Guardar Ficha</button>
      </form>
    </div>
  </div>
  `;

  setupLogic(receitas);
  renderLista(receitas);
  
  // Escuta mudanças de outras abas
  bc.onmessage = (e) => {
    if (e.data === 'receitas-updated') renderReceitas();
  };
};

function setupLogic(receitasTodas) {
  let receitas = receitasTodas;
  const modal = document.getElementById('modal-receita');
  const form = document.getElementById('form-receita');

  document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

  document.getElementById('btn-abrir-modal').onclick = () => {
    delete form.dataset.editId;
    form.reset();
    document.getElementById('modal-titulo').innerText = "Nova Ficha Técnica";
    document.getElementById('corpo-tabela').innerHTML = '';
    document.querySelector('button[type="submit"]').innerText = "Guardar Ficha";
    switchTab('geral');
    adicionarLinha();
    modal.style.display = 'block';
  };

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(el => {
      el.style.background = el.dataset.tab === tab ? 'var(--primary)' : 'white';
      el.style.color = el.dataset.tab === tab ? 'white' : '#333';
      el.style.border = el.dataset.tab === tab ? 'none' : '1px solid #ddd';
    });
    document.querySelectorAll('.form-section').forEach(el => el.style.display = 'none');
    document.getElementById(`form-${tab}`).style.display = 'block';
  }

  document.getElementById('add-ingrediente').onclick = adicionarLinha;
  document.getElementById('corpo-tabela').addEventListener('input', calcular);
  document.getElementById('rec-rendimento').addEventListener('input', calcular);
  document.getElementById('rec-margem').addEventListener('input', calcular);

  form.onsubmit = async (e) => {
    e.preventDefault();
    
    // Validação HACCP
    const temp = document.getElementById('rec-temp-coz').value;
    const val = document.getElementById('rec-validade').value;
    if (!temp || !val) {
      alert('⚠️ HACCP: Preenche Temperatura de Cozedura e Validade!');
      switchTab('haccp');
      return;
    }
    
    try {
      const dados = capturarDados();
      if (form.dataset.editId) dados.id = form.dataset.editId;
      await addData('receitas', dados);
      modal.style.display = 'none';
      bc.postMessage('receitas-updated'); // Avisa outras abas
      renderReceitas();
    } catch (err) {
      console.error(err);
      alert('Erro ao guardar: ' + err.message);
    }
  };

  // Filtros combinados: busca + categoria
  function aplicarFiltros() {
    const termo = document.getElementById('search-receita').value.toLowerCase();
    const cat = document.getElementById('filter-categoria').value;
    const filtradas = receitas.filter(r => {
      const matchNome = r.nome.toLowerCase().includes(termo);
      const matchCat = !cat || r.categoria === cat;
      return matchNome && matchCat;
    });
    renderLista(filtradas);
  }

  document.getElementById('search-receita').oninput = aplicarFiltros;
  document.getElementById('filter-categoria').onchange = aplicarFiltros;
}

function adicionarLinha() {
  const tbody = document.getElementById('corpo-tabela');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="ing-nome" required style="width:100%; padding:4px; border:1px solid #ddd; border-radius:4px;"></td>
    <td><input type="number" class="ing-qtd" value="0" required style="width:60px; padding:4px; border:1px solid #ddd; border-radius:4px;"></td>
    <td><input type="number" class="ing-preco" value="0" step="0.01" required style="width:60px; padding:4px; border:1px solid #ddd; border-radius:4px;"></td>
    <td class="ing-sub" style="font-weight:bold;">0.00€</td>
    <td><button type="button" class="btn-remove" style="background:#ff4444; color:white; border:none; border-radius:4px; padding:2px 6px;">×</button></td>
  `;
  tr.querySelector('.btn-remove').onclick = () => { tr.remove(); calcular(); };
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
  const margem = parseFloat(document.getElementById('rec-margem').value) || 200;
  const custoUn = totalMP / rend;
  const venda = custoUn * (1 + margem/100);
  document.getElementById('custo-unitario').innerText = custoUn.toFixed(2) + '€';
  document.getElementById('preco-venda').innerText = venda.toFixed(2) + '€';
}

function capturarDados() {
  const ingredientes = [];
  document.querySelectorAll('#corpo-tabela tr').forEach(row => {
    const nome = row.querySelector('.ing-nome').value;
    if (nome) { // Só adiciona se tem nome
      ingredientes.push({
        nome,
        qtd: parseFloat(row.querySelector('.ing-qtd').value) || 0,
        preco: parseFloat(row.querySelector('.ing-preco').value) || 0
      });
    }
  });
  const custoTotal = ingredientes.reduce((acc, i) => acc + (i.qtd/1000)*i.preco, 0);
  const rend = parseFloat(document.getElementById('rec-rendimento').value) || 1;
  const margem = parseFloat(document.getElementById('rec-margem').value) || 200;
  
  return {
    id: Date.now().toString(),
    nome: document.getElementById('rec-nome').value,
    categoria: document.getElementById('rec-categoria').value,
    rendimento: rend,
    margem,
    ingredientes,
    alergenos: Array.from(document.querySelectorAll('input[name="alergenos"]:checked')).map(cb => cb.value),
    preparacao: document.getElementById('rec-preparacao').value,
    tempCoz: document.getElementById('rec-temp-coz').value,
    validade: document.getElementById('rec-validade').value,
    custoTotal,
    venda: (custoTotal / rend) * (1 + margem/100)
  };
}

function renderLista(receitas) {
  const lista = document.getElementById('lista-receitas');
  if (receitas.length === 0) {
    lista.innerHTML = '<p class="card" style="text-align:center;">Nenhuma receita encontrada. Cria a primeira! ✨</p>';
    return;
  }
  
  lista.innerHTML = receitas.map(r => `
    <div class="card haccp-card" style="border-left: 4px solid var(--primary);">
      <div class="card-tag" style="background:var(--secondary); display:inline-block; padding:2px 8px; border-radius:10px; font-size:0.7rem; margin-bottom:5px;">${r.categoria}</div>
      <h4 style="margin:5px 0;">${r.nome}</h4>
      <div style="display:flex; justify-content:space-between; font-size:0.9rem; color:#666;">
        <span>Custo: ${r.custoTotal.toFixed(2)}€</span>
        <span style="font-weight:bold; color:#4caf50;">Venda: ${r.venda.toFixed(2)}€</span>
      </div>
      ${r.alergenos.length ? `<div style="margin-top:5px; font-size:0.75rem; color:#e57373;">⚠️ ${r.alergenos.join(', ')}</div>` : ''}
      <div style="margin-top:10px; display:grid; grid-template-columns: 1fr 1fr; gap:4px;">
        <button class="btn-small btn-edit" data-id="${r.id}" style="padding:6px; background:var(--primary); color:white; border:none; border-radius:6px;">📝 Editar</button>
        <button class="btn-small btn-duplicate" data-id="${r.id}" style="padding:6px; background:#2196F3; color:white; border:none; border-radius:6px;">📋 Duplicar</button>
        <button class="btn-small btn-ft" data-id="${r.id}" style="padding:6px; background:#5D4037; color:white; border:none; border-radius:6px;">📄 FT</button>
        <button class="btn-small btn-produce" data-id="${r.id}" style="padding:6px; background:#6c757d; color:white; border:none; border-radius:6px;">👨‍🍳 Fabrico</button>
      </div>
      <button class="btn-small btn-delete" data-id="${r.id}" style="width:100%; margin-top:4px; padding:4px; background:#ff4444; color:white; border:none; border-radius:6px;">🗑️ Eliminar</button>
    </div>
  `).join('');

  document.querySelectorAll('.btn-edit').forEach(btn => btn.onclick = () => abrirEdicao(btn.dataset.id, receitas));
  document.querySelectorAll('.btn-duplicate').forEach(btn => btn.onclick = () => duplicarReceita(btn.dataset.id, receitas));
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
  document.getElementById('rec-margem').value = receita.margem || 200;
  document.getElementById('rec-preparacao').value = receita.preparacao || '';
  document.getElementById('rec-temp-coz').value = receita.tempCoz || '';
  document.getElementById('rec-validade').value = receita.validade || '';
  
  receita.ingredientes.forEach(ing => {
    adicionarLinha();
    const lastRow = document.querySelector('#corpo-tabela tr:last-child');
    lastRow.querySelector('.ing-nome').value = ing.nome;
    lastRow.querySelector('.ing-qtd').value = ing.qtd;
    lastRow.querySelector('.ing-preco').value = ing.preco;
  });
  
  document.querySelectorAll('input[name="alergenos"]').forEach(cb => cb.checked = receita.alergenos.includes(cb.value));
  calcular();
  modal.style.display = 'block';
}

async function duplicarReceita(id, receitas) {
  const receita = receitas.find(r => r.id === id);
  if (!receita) return;
  const nova = {...receita, id: Date.now().toString(), nome: receita.nome + ' (Cópia)'};
  await addData('receitas', nova);
  bc.postMessage('receitas-updated');
  renderReceitas();
}

async function eliminarReceita(id) {
  if (confirm('Eliminar esta receita permanentemente?')) {
    await deleteData('receitas', id);
    bc.postMessage('receitas-updated');
    renderReceitas();
  }
}

// Mantém as funções gerarFichaTecnica e abrirProducao iguais ao teu código anterior
function gerarFichaTecnica(id, receitas) {
  const r = receitas.find(rec => rec.id === id);
  if (!r) return;
  const pesoTotal = r.ingredientes.reduce((acc, i) => acc + i.qtd, 0);
  const dataHoje = new Date().toLocaleDateString('pt-PT');
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>FT - ${r.nome}</title><style>@page{size:A4;margin:12mm}body{font-family:Arial,sans-serif;color:#1a1a1a;font-size:10.5pt;line-height:1.4;padding:20px}.header{border-bottom:4px solid #5D4037;padding-bottom:10px;margin-bottom:15px;display:flex;justify-content:space-between;align-items:center}.logo{font-size:26px;font-weight:900;color:#FF6B9D}.doc-meta{text-align:right;font-size:9pt;color:#666}.doc-meta h1{font-size:16pt;color:#5D4037;margin:0}.box{border:2px solid #5D4037;border-radius:6px;padding:10px;margin-bottom:12px}.box-title{background:#5D4037;color:#fff;margin:-10px -10px 8px -10px;padding:6px 10px;font-weight:700;font-size:9pt;text-transform:uppercase}table{width:100%;border-collapse:collapse;font-size:9.5pt}th{background:#FFF5F8;border:1px solid #5D4037;padding:5px;text-align:left}td{border:1px solid #ccc;padding:5px}.alergenios{background:#FFEBEE;border:2px solid #E57373;padding:8px;margin:8px 0;font-weight:700;text-align:center;color:#b71c1c}@media print{.no-print{display:none}}</style></head><body><div class="no-print" style="text-align:center;margin-bottom:20px"><button onclick="window.print()">🖨️ Imprimir</button></div><div class="header"><div class="logo">🧁 BABE'S BAKERY</div><div class="doc-meta"><h1>FICHA TÉCNICA</h1><div>Ref: FT-${r.id.slice(-6)}</div><div>${dataHoje}</div></div></div><div class="box"><div class="box-title">1. Identificação</div><table><tr><th>Denominação</th><td colspan="3"><b>${r.nome}</b></td></tr><tr><th>Categoria</th><td>${r.categoria}</td><th>Código</th><td>BB-${r.id.slice(-4)}</td></tr><tr><th>Rendimento</th><td>${r.rendimento} un/kg</td><th>Peso Un.</th><td>${(pesoTotal/r.rendimento).toFixed(0)}g</td></tr><tr><th>Validade</th><td colspan="3">${r.validade} dias</td></tr></table></div><div class="box"><div class="box-title">2. Ingredientes</div><div style="font-size:9pt;">${r.ingredientes.sort((a,b)=>b.qtd-a.qtd).map(i=>`${i.nome} (${((i.qtd/pesoTotal)*100).toFixed(1)}%)`).join(', ')}</div></div>${r.alergenos.length?`<div class="alergenios">⚠️ ALERGÉNIOS: ${r.alergenos.join(', ').toUpperCase()}</div>`:''}<div class="box"><div class="box-title">3. Processo</div><div style="white-space:pre-wrap;font-size:9pt;">${r.preparacao||'Padrão.'}<br><b>Temp Cozedura:</b> ${r.tempCoz}°C</div></div></body></html>`);
  win.document.close();
}

function abrirProducao(id, receitas) {
  const r = receitas.find(rec => rec.id === id);
  if (!r) return;
  const hoje = new Date();
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Produção - ${r.nome}</title><style>@page{size:A4;margin:10mm}body{font-family:Arial,sans-serif;font-size:10pt;padding:20px}.header{background:#5D4037;color:white;padding:10px;display:flex;justify-content:space-between}.lote{background:#FF6B9D;color:white;padding:8px;text-align:center;font-weight:700;margin:10px 0;border-radius:4px}.box{border:2px solid #5D4037;border-radius:6px;padding:10px;margin-bottom:10px}.box-title{background:#5D4037;color:white;margin:-10px -10px 8px -10px;padding:6px 10px;font-weight:700;font-size:9pt}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#FFF5F8}.check{width:30px;text-align:center}@media print{.no-print{display:none}}</style></head><body><div class="no-print" style="text-align:center"><button onclick="window.print()">🖨️ Imprimir Ordem</button></div><div class="header"><div><h1>FICHA DE PRODUÇÃO</h1><h2>${r.nome}</h2></div><div style="text-align:right">Data: ${hoje.toLocaleDateString('pt-PT')}<br>Operador: ___________</div></div><div class="lote">LOTE: BB-${hoje.toISOString().slice(2,10).replace(/-/g,'')}-001</div><div class="box"><div class="box-title">Checklist de Pesagem</div><table><thead><tr><th>Ingrediente</th><th>Qtd Padrão</th><th>Qtd Real</th><th class="check">OK</th></tr></thead><tbody>${r.ingredientes.map(i=>`<tr><td>${i.nome}</td><td>${i.qtd}g</td><td>________</td><td class="check">☐</td></tr>`).join('')}</tbody></table></div><div class="box"><div class="box-title">Processo</div><div style="white-space:pre-wrap;min-height:80px;">${r.preparacao}</div><div style="margin-top:10px;font-weight:bold;">🌡️ Temp Alvo: ${r.tempCoz}°C | Real: ____°C</div></div></body></html>`);
  win.document.close();
}
