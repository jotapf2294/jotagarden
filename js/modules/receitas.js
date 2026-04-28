import { addData, getAllData, initDB } from '../db.js';

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
        <div style="margin-top:10px; display:flex; gap:5px;">
            <button class="btn-small btn-edit" data-id="${r.id}" style="flex:2; background:var(--primary); color:white;">📝 Editar</button>
            <button class="btn-small btn-produce" data-id="${r.id}" style="flex:2; background:#6c757d; color:white;">👨‍🍳 Produzir</button>
            <button class="btn-small btn-delete" data-id="${r.id}" style="flex:1; background:#ff4444; color:white;">🗑️</button>
        </div>
    </div>
  `).join('');

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.onclick = () => abrirEdicao(btn.dataset.id, receitas);
  });
  document.querySelectorAll('.btn-produce').forEach(btn => {
    btn.onclick = () => abrirProducao(btn.dataset.id, receitas);
  });
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.onclick = () => eliminarReceita(btn.dataset.id);
  });
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

// FUNÇÕES DE PRODUÇÃO (AGORA FORA DA ELIMINAR)
function abrirProducao(id, receitas) {
    const receita = receitas.find(r => r.id === id);
    if (!receita) return;

    const modalProd = document.createElement('div');
    modalProd.className = 'modal';
    modalProd.style.display = 'block';
    modalProd.innerHTML = `
        <div class="modal-content card" style="border-top: 10px solid #6c757d; max-width:500px;">
            <span class="close-prod" style="float:right; cursor:pointer; font-size:24px;">&times;</span>
            <h3>👨‍🍳 Produção: ${receita.nome}</h3>
            <div style="background:#f8f9fa; padding:10px; border-radius:8px; margin:10px 0;">
                <label>Fator Escala:</label>
                <input type="number" id="prod-factor" value="1" step="0.1" style="width:60px;">
            </div>
            <table style="width:100%; border-collapse:collapse;">
                <thead><tr style="border-bottom:1px solid #ddd;"><th>Item</th><th style="text-align:right;">Peso</th></tr></thead>
                <tbody id="corpo-producao">${renderLinhasProducao(receita.ingredientes, 1)}</tbody>
            </table>
            <div style="margin-top:15px; padding:10px; background:#fff3cd; border-radius:8px; font-size:0.9rem;">
                <strong>Instruções:</strong><br>${receita.preparacao || 'Sem notas.'}
            </div>
            <button onclick="window.print()" class="btn-action" style="margin-top:15px; background:#333;">🖨️ Imprimir</button>
        </div>
    `;
    document.body.appendChild(modalProd);
    modalProd.querySelector('.close-prod').onclick = () => modalProd.remove();
    modalProd.querySelector('#prod-factor').oninput = (e) => {
        const factor = parseFloat(e.target.value) || 0;
        document.getElementById('corpo-producao').innerHTML = renderLinhasProducao(receita.ingredientes, factor);
    };
}

function renderLinhasProducao(ingredientes, factor) {
    return ingredientes.map(ing => `
        <tr style="border-bottom:1px solid #eee;">
            <td style="padding:8px;">${ing.nome}</td>
            <td style="text-align:right; padding:8px;"><strong>${(ing.qtd * factor).toFixed(0)}g</strong></td>
        </tr>
    `).join('');
    }
