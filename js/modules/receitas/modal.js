// receitas/modal.js
import { CATEGORIAS } from './constants.js';
import { calcIngredientes } from './calc.js';
import { sanitizeHTML, toNumber } from './utils.js';

export function createModal() {
  const modal = document.createElement('div');
  modal.id = 'modal-receita';
  modal.className = 'modalx';
  modal.setAttribute('aria-hidden', 'true');
  
  // FIX: CATEGORIAS com sanitizeHTML pra evitar XSS se vier do DB
  const categoriasOpts = CATEGORIAS.map(x => 
    `<option value="${sanitizeHTML(x)}">${sanitizeHTML(x)}</option>`
  ).join('');

  modal.innerHTML = `
    <div class="modalx-box" role="dialog" aria-modal="true" aria-labelledby="m-tit">
      <header>
        <h2 id="m-tit">Nova Ficha Técnica</h2>
        <button class="x" type="button" aria-label="Fechar modal">&times;</button>
      </header>
      <form id="f-rec" novalidate>
        <nav class="tabs" role="tablist">
          <button type="button" data-t="g" class="on" role="tab" aria-selected="true" aria-controls="p-g">Geral</button>
          <button type="button" data-t="c" role="tab" aria-selected="false" aria-controls="p-c">Composição</button>
        </nav>
        
        <div class="panes">
          <div class="pane on" id="p-g" role="tabpanel" aria-labelledby="tab-g">
            <div class="grid-2">
              <div><label>Nome *<input id="n-nome" required placeholder="Bolo de Chocolate" maxlength="100"></label></div>
              <div><label>Código<input id="n-cod" placeholder="BB-001" maxlength="20"></label></div>
              <div><label>Categoria *<select id="n-cat" required><option value="">Escolher</option>${categoriasOpts}</select></label></div>
              <div><label>Versão<input id="n-ver" value="1.0" maxlength="10"></label></div>
              <div><label>Rendimento<input type="number" id="n-rend" value="1" step="0.1" min="0.1" max="9999"></label></div>
              <div><label>Peso un (g)<input type="number" id="n-peso" placeholder="100" min="0" max="99999" step="1"></label></div>
              <div><label>Margem %<input type="number" id="n-marg" value="200" min="0" max="999"></label></div>
              <div><label>PVP €<input id="n-pvp" readonly tabindex="-1"></label></div>
            </div>
            <label style="margin-top:16px">Descrição<textarea id="n-desc" rows="3" placeholder="Notas, observações..." maxlength="500"></textarea></label>
            <div class="grid-2" style="margin-top:16px">
              <div><label>Validade dias<input type="number" id="h-val" placeholder="3" min="0" max="365"></label></div>
              <div><label>Temp armazenamento<input id="h-arm" placeholder="0-4°C" maxlength="20"></label></div>
            </div>
          </div>
          
          <div class="pane" id="p-c" role="tabpanel" aria-labelledby="tab-c">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px;flex-wrap:wrap">
              <h4 style="margin:0;font-size:.9375rem">Ingredientes</h4>
              <button type="button" id="add-ing" class="btn btn-primary btn-sm">+ Adicionar</button>
            </div>
            <div class="tbl-wrap">
              <table class="tbl">
                <thead>
                  <tr>
                    <th>Ingrediente *</th>
                    <th style="width:90px">Qtd (g)</th>
                    <th style="width:60px">%</th>
                    <th style="width:90px">€/kg</th>
                    <th style="width:40px"></th>
                  </tr>
                </thead>
                <tbody id="tb-ing"></tbody>
              </table>
            </div>
            <div class="tot">
              <span>Peso: <b id="t-peso">0g</b></span>
              <span>Custo: <b id="t-custo">0€</b></span>
              <span>Custo/un: <b id="t-unit">0€</b></span>
            </div>
            <label style="margin-top:16px">Modo preparação<textarea id="h-prep" rows="4" placeholder="1. Pesar ingredientes...&#10;2. Misturar...&#10;3. Cozer a X°C..." maxlength="2000"></textarea></label>
          </div>
        </div>

        <footer>
          <div class="bar">
            <span>Custo: <b id="v-custo">0€</b></span>
            <span>PVP: <b id="v-pvp">0€</b></span>
            <span>Margem: <b id="v-marg">200%</b></span>
          </div>
          <div style="display:flex;gap:8px">
            <button type="button" class="btn x">Cancelar</button>
            <button type="submit" class="btn btn-primary">💾 Guardar</button>
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
  // Fechar modal
  modal.querySelectorAll('.x').forEach(b => b.onclick = () => closeModal(modal));

  // Tabs com ARIA correto
  modal.querySelectorAll('.tabs button').forEach(b => {
    b.onclick = () => {
      modal.querySelectorAll('.tabs button,.pane').forEach(x => {
        x.classList.remove('on');
        x.setAttribute('aria-selected', 'false');
      });
      b.classList.add('on');
      b.setAttribute('aria-selected', 'true');
      modal.querySelector('#p-' + b.dataset.t).classList.add('on');
    };
  });

  // Add ingrediente
  modal.querySelector('#add-ing').onclick = () => {
    addIngRow(modal);
    markDirty(modal);
  };

  // Event delegation na tabela
  const tb = modal.querySelector('#tb-ing');
  tb.oninput = (e) => {
    if (e.target.matches('.qtd, .preco, .nome')) {
      calcIngredientes();
      markDirty(modal);
    }
  };
  tb.onclick = (e) => {
    if (e.target.matches('.btn-remove')) {
      e.target.closest('tr').remove();
      calcIngredientes();
      markDirty(modal);
    }
  };

  // Inputs gerais marcam dirty + recalculam
  ['n-rend', 'n-marg', 'n-nome', 'n-cat', 'n-peso', 'h-val', 'h-arm', 'h-prep', 'n-desc', 'n-cod', 'n-ver'].forEach(id => {
    const el = modal.querySelector('#' + id);
    if (el) {
      el.oninput = () => {
        if (id === 'n-rend' || id === 'n-marg') calcIngredientes();
        markDirty(modal);
      };
    }
  });

  // ESC fecha modal
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal(modal);
  });
}

function markDirty(modal) {
  const form = modal.querySelector('#f-rec');
  if (form) form.dataset.dirty = 'true';
}

export function openModal(modal, rec = null) {
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  
  const form = modal.querySelector('#f-rec');
  form.dataset.edit = rec?.id || '';
  form.dataset.dirty = 'false';

  // Reset tabs
  modal.querySelectorAll('.tabs button,.pane').forEach(x => x.classList.remove('on'));
  const firstTab = modal.querySelector('[data-t="g"]');
  firstTab.classList.add('on');
  firstTab.setAttribute('aria-selected', 'true');
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
    form.reset();
    modal.querySelector('#n-marg').value = 200;
    modal.querySelector('#n-rend').value = 1;
    modal.querySelector('#n-ver').value = '1.0';
    modal.querySelector('#tb-ing').innerHTML = '';
    addIngRow(modal); // 1 linha vazia pra começar
  }
  
  calcIngredientes();
  modal.querySelector('#n-nome').focus(); // A11y: foca primeiro campo
}

export function closeModal(modal) {
  const form = modal.querySelector('#f-rec');
  if (form?.dataset.dirty === 'true') {
    if (!confirm('Descartar alterações? Tens dados não guardados.')) return;
  }
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  if (form) form.dataset.dirty = 'false';
}

export function addIngRow(modal, d = {}) {
  const tr = document.createElement('tr');
  // FIX: sanitizeHTML em todos valores que vêm do DB
  tr.innerHTML = `
    <td><input class="nome" value="${sanitizeHTML(d.nome || '')}" required placeholder="Farinha T55" maxlength="100"></td>
    <td><input type="number" class="qtd" value="${toNumber(d.qtd) || ''}" step="0.1" min="0" max="99999" placeholder="0"></td>
    <td class="pct" style="text-align:center;color:var(--text-secondary)">0%</td>
    <td><input type="number" step="0.01" class="preco" value="${toNumber(d.preco) || ''}" min="0" max="9999" placeholder="1.20"></td>
    <td style="text-align:center"><button type="button" class="btn-remove" aria-label="Remover ingrediente">×</button></td>
  `;
  modal.querySelector('#tb-ing').appendChild(tr);
}

export function collectModalData(modal) {
  const ingredientes = [];
  modal.querySelectorAll('#tb-ing tr').forEach(tr => {
    const nome = tr.querySelector('.nome')?.value?.trim();
    const qtd = toNumber(tr.querySelector('.qtd')?.value);
    const preco = toNumber(tr.querySelector('.preco')?.value);
    
    // FIX: só adiciona se tem nome E qtd > 0
    if (nome && qtd > 0) {
      ingredientes.push({ nome, qtd, preco });
    }
  });

  const rend = toNumber(modal.querySelector('#n-rend').value) || 1;
  const custoTotal = ingredientes.reduce((a, i) => a + (i.qtd / 1000) * i.preco, 0);
  const custoUnit = custoTotal / rend;
  const marg = toNumber(modal.querySelector('#n-marg').value) || 200;
  const venda = custoUnit * (1 + marg / 100);

  return {
    id: modal.querySelector('#f-rec').dataset.edit || '',
    nome: modal.querySelector('#n-nome').value.trim(),
    codigo: modal.querySelector('#n-cod').value.trim(),
    categoria: modal.querySelector('#n-cat').value,
    versao: modal.querySelector('#n-ver').value.trim(),
    descricao: modal.querySelector('#n-desc').value.trim(),
    rendimento: rend,
    pesoUn: toNumber(modal.querySelector('#n-peso').value) || null,
    margem: marg,
    custoTotal: Math.round(custoTotal * 100) / 100, // FIX: arredonda
    venda: Math.round(venda * 100) / 100,
    ingredientes,
    validade: toNumber(modal.querySelector('#h-val').value) || null,
    preparacao: modal.querySelector('#h-prep').value.trim(),
    armazenamento: {
      temp: modal.querySelector('#h-arm').value.trim()
    }
    // updatedAt/createdAt são setados no index.js
  };
}