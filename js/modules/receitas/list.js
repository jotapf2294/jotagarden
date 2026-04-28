import { sanitizeHTML } from './utils.js';
import { showDetail } from './detail.js';

export function renderLista(receitas, listaEl, onSelect) {
  listaEl.innerHTML = '';

  if (!receitas.length) {
    listaEl.innerHTML = '<p class="card" style="text-align:center">Sem fichas técnicas</p>';
    return;
  }

  receitas.forEach(r => {
    const div = document.createElement('div');
    div.className = 'rec-item';
    div.dataset.id = r.id;

    const h4 = document.createElement('h4');
    h4.textContent = r.nome;

    const meta1 = document.createElement('div');
    meta1.className = 'meta';
    meta1.innerHTML = `<span>${sanitizeHTML(r.codigo || 's/cod')} • ${sanitizeHTML(r.categoria)}</span><span>v${sanitizeHTML(r.versao || '1.0')}</span>`;

    const meta2 = document.createElement('div');
    meta2.className = 'meta';
    meta2.style.marginTop = '4px';
    meta2.innerHTML = `<span>PVP ${r.venda?.toFixed(2) || '0.00'}€</span><span>${r.validade || '?'} dias</span>`;

    div.append(h4, meta1, meta2);
    div.onclick = () => {
      listaEl.querySelectorAll('.rec-item').forEach(i => i.classList.remove('on'));
      div.classList.add('on');
      onSelect(r);
    };
    listaEl.appendChild(div);
  });
}
