import { CATEGORIAS } from './constants.js';
import { calcIngredientes } from './calc.js';

export function createModal() {
  const modal = document.createElement('div');
  modal.id = 'modal-receita';
  modal.className = 'modalx';
  modal.innerHTML = `
    <div class="modalx-box" style="max-width:900px;height:auto;max-height:92vh">
      <header>
        <h2 id="m-tit">Nova Ficha Técnica</h2>
        <button class="x" type="button" aria-label="Fechar">&times;</button>
      </header>
      <form id="f-rec">
        <nav class="tabs" role="tablist">
          <button type="button" data-t="g" class="on" role="tab" aria-selected="true" aria-controls="p-g">1. Geral</button>
          <button type="button" data-t="c" role="tab" aria-selected="false" aria-controls="p-c">2. Composição</button>
        </nav>
        <div class="panes">
          <div class="pane on" id="p-g" role="tabpanel" aria-labelledby="tab-g">
            <div class="grid2">
              <div><label>Nome *<input id="n-nome" required placeholder="Bolo de Chocolate"></label></div>
              <div><label>Código<input id="n-cod" placeholder="BB-001"></label></div>
              <div><label>Categoria *<select id="n-cat" required><option value="">Escolher</option>${CATEGORIAS.map(x=>`<option>${x}</option>`).join('')}</select></label></div>
              <div><label>Versão<input id="n-ver" value="1.0"></label></div>
              <div><label>Rendimento<input type="number" id="n-rend" value="1" step="0.1" min="0.1"></label></div>
              <div><label>Peso un (g)<input type="number" id="n-peso" placeholder="100"></label></div>
              <div><label>Margem %<input type="number" id="n-marg" value="200" min="0"></label></div>
              <div><label>PVP €<input id="n-pvp" readonly style="background:#f5f5f5"></label></div>
            </div>
            <label>Descrição<textarea id="n-desc" rows="3" placeholder="Notas, observações..."></textarea></label>
            <div class="grid2" style="margin-top:16px">
              <div><label>Validade dias<input type="number" id="h-val" placeholder="3"></label></div>
              <div><label>Temp armazenamento<input id="h-arm" placeholder="0-4°C"></label></div>
            </div>
          </div>
          
          <div class="pane" id="p-c" role="tabpanel" aria-labelledby="tab-c">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <h4>Ingredientes (ordem decrescente)</h4>
              <button type="button" id="add-ing" class="btn-s">+ Ingrediente</button>
            </div>
            <div class="tbl-wrap">
              <table class="tbl">
                <thead><tr><th>Ingrediente *</th><th>Qtd g</th><th>%</th><th>€/kg</th><th></th></tr></thead>
                <tbody id="tb-ing"></tbody>
              </table>
            </div>
            <div class="tot">
              <span>Peso total: <b id="t-peso">0g</b></span>
              <span>Custo total: <b id="t-custo">0€</b></span>
              <span>Custo/un: <b id="t-unit">0€</b></span>
            </div>
            <label style="margin-top:16px">Modo preparação<textarea id="h-prep" rows="4" placeholder="1. Pesar ingredientes...&#10;2. Misturar...&#10;3. Cozer a X°C..."></textarea></label>
          </div>
        <footer>
          <div class="bar">
            <span>Custo: <b id="v-custo">0€</b></span>
            <span>PVP: <b id="v-pvp">0€</b></span>
            <span>Margem: <b id="v-marg">200%</b></span>
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
    modal.querySelectorAll('.tabs button,.pane').forEach(x => {
      x.classList.remove('on');
      x.setAttribute('aria-selected', 'false');
    });
    b.classList.add('on');
    b.setAttribute('aria-selected', 'true');
    modal.querySelector('#p-' + b.dataset.t).classList.add('on');
  });

  modal.querySelector('#add-ing').onclick = () => addIngRow(modal);
  modal.querySelector('#tb-ing').oninput = () => { 
    calcIngredientes(); 
    modal.querySelector('#f-rec').dataset.dirty = 'true';
  };
  
  ['n-rend', 'n-marg', 'n-nome', 'n-cat', 'n-peso', 'h-val', 'h-arm', 'h-prep'].forEach(id => {
    modal.querySelector('#' + id).oninput = () => {
      calcIngredientes();
      modal.querySelector('#f-rec').dataset.dirty = 'true';
    };
  });
}

export function openModal(modal, rec = null) {
  modal.classList.add('show');
  modal.querySelector('#f-rec').dataset.edit = rec?.id || '';
  modal.querySelector('#f-rec').dataset.dirty = 'false';

  // Reset para primeira tab
  modal.querySelectorAll('.tabs button,.pane').forEach(x => {
    x.classList.remove('on');
    x.setAttribute('aria-selected', 'false');
  });
  modal.querySelector('[data-t="g"]').classList.add('on');
  modal.querySelector('[data-t="g"]').setAttribute('aria-selected', 'true');
  modal.querySelector('#p-g').classList.add('on');

  if (rec) {
    modal.querySelector('#m-tit').textContent = 'Editar Ficha Técnica';
    modal.querySelector('#n-nome').value = rec.nome || '';
    modal.querySelector('#n-cod').value = rec.codigo || '';
    modal.querySelector('#n-cat').value = rec.categoria || '';
    modal.querySelector('#n-ver').value = rec.versao || '1.0';
    modal.querySelector('#n-rend').value = rec.rendimento || 1;
    modal.querySelector('#n-peso').value = rec.pesoUn || '';
    modal.querySelector('#n-marg').value = rec.margem || 200;
    modal.querySelector('#n-desc').value = rec.descricao || '';
    modal.querySelector('#h-val').value = rec.validade || '';
    modal.querySelector('#h-arm').value = rec.armazenamento?.temp || '';
    modal.querySelector('#h-prep').value = rec.preparacao || '';

    const tb = modal.querySelector('#tb-ing');
    tb.innerHTML = '';
    rec.ingredientes?.forEach(i => addIngRow(modal, i));
  } else {
    modal.querySelector('#m-tit').textContent = 'Nova Ficha Técnica';
    modal.querySelector('#f-rec').reset();
    modal.querySelector('#n-marg').value = 200;
    modal.querySelector('#n-rend').value = 1;
    modal.querySelector('#n-ver').value = '1.0';
    modal.querySelector('#tb-ing').innerHTML = '';
    addIngRow(modal);
  }
  calcIngredientes();
}

export function closeModal(modal) {
  if (modal.querySelector('#f-rec').dataset.dirty === 'true') {
    if (!confirm('Descartar alterações? Tens dados não guardados.')) return;
  }
  modal.classList.remove('show');
}

export function addIngRow(modal, d = {}) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input class="nome" value="${d.nome || ''}" required placeholder="Farinha T55"></td>
    <td><input type="number" class="qtd" value="${d.qtd || 0}" style="width:80px" step="0.1" min="0"></td>
    <td class="pct">0%</td>
    <td><input type="number" step="0.01" class="preco" value="${d.preco || 0}" style="width:80px" placeholder="1.20" min="0"></td>
    <td><button type="button" class="btn-remove" style="background:var(--danger);color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer">×</button></td>
  `;
  tr.querySelector('.btn-remove').onclick = () => { 
    tr.remove(); 
    calcIngredientes(); 
  };
  modal.querySelector('#tb-ing').appendChild(tr);
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
        preco: parseFloat(tr.querySelector('.preco')?.value) || 0
      });
    }
  });

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
    validade: parseFloat(modal.querySelector('#h-val').value) || null,
    preparacao: modal.querySelector('#h-prep').value,
    armazenamento: {
      temp: modal.querySelector('#h-arm').value
    },
    updatedAt: new Date().toISOString()
  };
                                           }
