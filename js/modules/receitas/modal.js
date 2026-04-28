import { CATEGORIAS, ALERGENOS, TIPOS_PCC } from './constants.js';
import { calcIngredientes, gerarListaIngredientes } from './calc.js';

export function createModal() {
  const modal = document.createElement('div');
  modal.id = 'modal-receita';
  modal.className = 'modalx';
  modal.innerHTML = `
    <div class="modalx-box">
      <header>
        <h2 id="m-tit">Nova Ficha Técnica</h2>
        <button class="x" type="button" aria-label="Fechar">&times;</button>
      </header>
      <form id="f-rec">
        <nav class="tabs" role="tablist">
          <button type="button" data-t="g" class="on" role="tab" aria-selected="true">1. Geral</button>
          <button type="button" data-t="c" role="tab">2. Composição</button>
          <button type="button" data-t="h" role="tab">3. HACCP</button>
          <button type="button" data-t="r" role="tab">4. Rotulagem</button>
        </nav>
        <div class="panes">
          <div class="pane on" id="p-g" role="tabpanel">
            <div class="grid2">
              <div><label>Nome *<input id="n-nome" required></label></div>
              <div><label>Código<input id="n-cod" placeholder="BB-001"></label></div>
              <div><label>Categoria *<select id="n-cat" required><option value="">Escolher</option>${CATEGORIAS.map(x=>`<option>${x}</option>`).join('')}</select></label></div>
              <div><label>Versão<input id="n-ver" value="1.0"></label></div>
              <div><label>Rendimento<input type="number" id="n-rend" value="1" step="0.1"></label></div>
              <div><label>Peso un (g)<input type="number" id="n-peso"></label></div>
              <div><label>Margem %<input type="number" id="n-marg" value="200"></label></div>
              <div><label>PVP €<input id="n-pvp" readonly style="background:#f5f5f5"></label></div>
            </div>
            <label>Descrição<textarea id="n-desc" rows="2"></textarea></label>
          </div>
          <div class="pane" id="p-c" role="tabpanel">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <h4>Ingredientes (ordem decrescente)</h4>
              <button type="button" id="add-ing" class="btn-s">+ Ingrediente</button>
            </div>
            <div class="tbl-wrap">
              <table class="tbl">
                <thead><tr><th>Ingrediente *</th><th>Qtd g</th><th>%</th><th>€/kg</th><th>Origem</th><th>Fornecedor</th><th></th></tr></thead>
                <tbody id="tb-ing"></tbody>
              </table>
            </div>
            <div class="tot">
              <span>Peso total: <b id="t-peso">0g</b></span>
              <span>Custo total: <b id="t-custo">0€</b></span>
              <span>Custo/un: <b id="t-unit">0€</b></span>
            </div>
          <div class="pane" id="p-h" role="tabpanel">
            <div class="grid2">
              <div><label>Temp cozedura °C *<input type="number" id="h-temp" required></label></div>
              <div><label>Tempo min<input type="number" id="h-tempo"></label></div>
              <div><label>Temp armazenamento<input id="h-arm" placeholder="0-4°C"></label></div>
              <div><label>Validade dias *<input type="number" id="h-val" required></label></div>
              <div><label>aw (atividade água)<input type="number" step="0.01" id="h-aw"></label></div>
              <div><label>pH<input type="number" step="0.1" id="h-ph"></label></div>
            </div>
            <h4>PCC - Pontos Críticos</h4>
            <div id="pcc-wrap"></div>
            <button type="button" id="add-pcc" class="btn-s">+ Adicionar PCC</button>
            <h4>Alérgenos Reg.1169/2011</h4>
            <div class="alerg">${ALERGENOS.map(a=>`<label><input type="checkbox" value="${a}"><span>${a}</span></label>`).join('')}</div>
            <label>Modo preparação detalhado *<textarea id="h-prep" rows="6" required></textarea></label>
            <label>Perigos identificados<textarea id="h-perigos" rows="2" placeholder="Biológicos, químicos, físicos..."></textarea></label>
          </div>
          <div class="pane" id="p-r" role="tabpanel">
            <div class="grid2">
              <div><label>Denominação legal<input id="r-denom"></label></div>
              <div><label>Lote tipo<input id="r-lote" placeholder="LAAAAMMDD"></label></div>
            </div>
            <label>Lista ingredientes (auto)<textarea id="r-lista" rows="3" readonly style="background:#f9f9f9"></textarea></label>
            <h4>Info nutricional /100g</h4>
            <div class="grid4">
              <div><label>Energia kcal<input type="number" id="n-kcal"></label></div>
              <div><label>Lípidos g<input type="number" step="0.1" id="n-lip"></label></div>
              <div><label>Saturados g<input type="number" step="0.1" id="n-sat"></label></div>
              <div><label>Hidratos g<input type="number" step="0.1" id="n-hc"></label></div>
              <div><label>Açúcares g<input type="number" step="0.1" id="n-ac"></label></div>
              <div><label>Proteínas g<input type="number" step="0.1" id="n-prot"></label></div>
              <div><label>Sal g<input type="number" step="0.1" id="n-sal"></label></div>
              <div><label>Fibras g<input type="number" step="0.1" id="n-fib"></label></div>
            </div>
          </div>
        </div>
        <footer>
          <div class="bar">
            <span>Custo: <b id="v-custo">0€</b></span>
            <span>PVP: <b id="v-pvp">0€</b></span>
            <span>Margem: <b id="v-marg">0%</b></span>
          </div>
          <div>
            <button type="button" class="btn-ghost x">Cancelar</button>
            <button type="submit" class="btn-pri">💾 Guardar</button>
          </div>
        </footer>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  setupModalEvents(modal);
  return modal;
}

function setupModalEvents(modal) {
  modal.querySelectorAll('.x').forEach(b => b.onclick = () => closeModal(modal));

  modal.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
    modal.querySelectorAll('.tabs button,.pane').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    b.setAttribute('aria-selected', 'true');
    modal.querySelector('#p-' + b.dataset.t).classList.add('on');
  });

  modal.querySelector('#add-ing').onclick = () => addIngRow(modal);
  modal.querySelector('#add-pcc').onclick = () => addPccRow(modal);
  modal.querySelector('#tb-ing').oninput = () => { calcIngredientes(); gerarListaIngredientes(); };
  ['n-rend', 'n-marg'].forEach(id => modal.querySelector('#' + id).oninput = calcIngredientes);
}

export function openModal(modal, rec = null) {
  modal.classList.add('show');
  modal.querySelector('#f-rec').dataset.edit = rec?.id || '';

  if (rec) {
    modal.querySelector('#m-tit').textContent = 'Editar Ficha';
    modal.querySelector('#n-nome').value = rec.nome || '';
    modal.querySelector('#n-cod').value = rec.codigo || '';
    modal.querySelector('#n-cat').value = rec.categoria || '';
    modal.querySelector('#n-ver').value = rec.versao || '1.0';
    modal.querySelector('#n-rend').value = rec.rendimento || 1;
    modal.querySelector('#n-peso').value = rec.pesoUn || '';
    modal.querySelector('#n-marg').value = rec.margem || 200;
    modal.querySelector('#n-desc').value = rec.descricao || '';
    modal.querySelector('#h-temp').value = rec.tempCoz || '';
    modal.querySelector('#h-tempo').value = rec.tempoCoz || '';
    modal.querySelector('#h-arm').value = rec.armazenamento?.temp || '';
    modal.querySelector('#h-val').value = rec.validade || '';
    modal.querySelector('#h-aw').value = rec.armazenamento?.aw || '';
    modal.querySelector('#h-ph').value = rec.armazenamento?.ph || '';
    modal.querySelector('#h-prep').value = rec.preparacao || '';
    modal.querySelector('#h-perigos').value = rec.perigos || '';
    modal.querySelector('#r-denom').value = rec.denomLegal || '';
    modal.querySelector('#r-lote').value = rec.loteTipo || '';

    const tb = modal.querySelector('#tb-ing');
    tb.innerHTML = '';
    rec.ingredientes?.forEach(i => addIngRow(modal, i));

    modal.querySelectorAll('.alerg input').forEach(cb => cb.checked = rec.alergenos?.includes(cb.value));

    modal.querySelector('#pcc-wrap').innerHTML = '';
    rec.pccs?.forEach(p => addPccRow(modal, p));

    ['kcal', 'lip', 'sat', 'hc', 'ac', 'prot', 'sal', 'fib'].forEach(k => {
      const el = modal.querySelector('#n-' + k);
      if (el) el.value = rec.nutricional?.[k] || '';
    });
  } else {
    modal.querySelector('#f-rec').reset();
    modal.querySelector('#tb-ing').innerHTML = '';
    modal.querySelector('#pcc-wrap').innerHTML = '';
    addIngRow(modal);
  }
  calcIngredientes();
}

export function closeModal(modal) {
  if (modal.querySelector('#f-rec').dataset.dirty === 'true') {
    if (!confirm('Descartar alterações?')) return;
  }
  modal.classList.remove('show');
}

export function addIngRow(modal, d = {}) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input class="nome" value="${d.nome || ''}" required></td>
    <td><input type="number" class="qtd" value="${d.qtd || 0}" style="width:80px"></td>
    <td class="pct">0%</td>
    <td><input type="number" step="0.01" class="preco" value="${d.preco || 0}" style="width:80px"></td>
    <td><input class="origem" value="${d.origem || ''}" placeholder="PT"></td>
    <td><input class="fornecedor" value="${d.fornecedor || ''}"></td>
    <td><button type="button" class="btn-remove" style="background:var(--danger);color:#fff;border:none;padding:4px 8px;border-radius:4px">×</button></td>
  `;
  tr.querySelector('.btn-remove').onclick = () => { tr.remove(); calcIngredientes(); };
  modal.querySelector('#tb-ing').appendChild(tr);
}

export function addPccRow(modal, d = {}) {
  const div = document.createElement('div');
  div.className = 'pcc-row';
  div.innerHTML = `
    <input class="etapa" placeholder="Etapa" value="${d.etapa || ''}">
    <select class="tipo">${TIPOS_PCC.map(x => `<option ${x === d.tipo? 'selected' : ''}>${x}</option>`).join('')}</select>
    <input class="perigo" placeholder="Perigo" value="${d.perigo || ''}">
    <input class="limite" placeholder="Limite crítico" value="${d.limite || ''}">
    <button type="button" class="btn-remove" style="background:var(--danger);color:#fff;border:none;padding:6px 10px;border-radius:6px">×</button>
  `;
  div.querySelector('.btn-remove').onclick = () => div.remove();
  modal.querySelector('#pcc-wrap').appendChild(div);
}

export function collectModalData(modal) {
  const ingredientes = [];
  modal.querySelectorAll('#tb-ing tr').forEach(tr => {
    const nome = tr.querySelector('.nome')?.value;
    const qtd = parseFloat(tr.querySelector('.qtd')?.value) || 0;
    if (nome && qtd > 0) {
      ingredientes.push({
        nome,
        qtd,
        preco: parseFloat(tr.querySelector('.preco')?.value) || 0,
        origem: tr.querySelector('.origem')?.value || '',
        fornecedor: tr.querySelector('.fornecedor')?.value || ''
      });
    }
  });

  const pccs = [];
  modal.querySelectorAll('.pcc-row').forEach(div => {
    const etapa = div.querySelector('.etapa')?.value;
    if (etapa) {
      pccs.push({
        etapa,
        tipo: div.querySelector('.tipo')?.value,
        perigo: div.querySelector('.perigo')?.value,
        limite: div.querySelector('.limite')?.value
      });
    }
  });

  const alergenos = [];
  modal.querySelectorAll('.alerg input:checked').forEach(cb => alergenos.push(cb.value));

  const rend = parseFloat(modal.querySelector('#n-rend').value) || 1;
  const custoTotal = ingredientes.reduce((a, i) => a + (i.qtd / 1000) * i.preco, 0);
  const custoUnit = custoTotal / rend;
  const marg = parseFloat(modal.querySelector('#n-marg').value) || 200;
  const venda = custoUnit * (1 + marg / 100);

  return {
    id: modal.querySelector('#f-rec').dataset.edit || Date.now().toString(),
    nome: modal.querySelector('#n-nome').value,
    codigo: modal.querySelector('#n-cod').value,
    categoria: modal.querySelector('#n-cat').value,
    versao: modal.querySelector('#n-ver').value,
    descricao: modal.querySelector('#n-desc').value,
    rendimento: rend,
    pesoUn: parseFloat(modal.querySelector('#n-peso').value) || null,
    margem: marg,
    custoTotal,
    venda,
    ingredientes,
    tempCoz: parseFloat(modal.querySelector('#h-temp').value) || null,
    tempoCoz: parseFloat(modal.querySelector('#h-tempo').value) || null,
    validade: parseFloat(modal.querySelector('#h-val').value) || null,
    preparacao: modal.querySelector('#h-prep').value,
    perigos: modal.querySelector('#h-perigos').value,
    pccs,
    alergenos,
    armazenamento: {
      temp: modal.querySelector('#h-arm').value,
      aw: parseFloat(modal.querySelector('#h-aw').value) || null,
      ph: parseFloat(modal.querySelector('#h-ph').value) || null
    },
    denomLegal: modal.querySelector('#r-denom').value,
    loteTipo: modal.querySelector('#r-lote').value,
    nutricional: {
      kcal: parseFloat(modal.querySelector('#n-kcal').value) || null,
      lip: parseFloat(modal.querySelector('#n-lip').value) || null,
      sat: parseFloat(modal.querySelector('#n-sat').value) || null,
      hc: parseFloat(modal.querySelector('#n-hc').value) || null,
      ac: parseFloat(modal.querySelector('#n-ac').value) || null,
      prot: parseFloat(modal.querySelector('#n-prot').value) || null,
      sal: parseFloat(modal.querySelector('#n-sal').value) || null,
      fib: parseFloat(modal.querySelector('#n-fib').value) || null
    },
    updatedAt: new Date().toISOString()
  };
      }
