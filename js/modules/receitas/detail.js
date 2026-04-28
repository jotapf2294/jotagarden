import { sanitizeHTML, formatCurrency } from './utils.js';

export function showDetail(r, detailEl, callbacks) {
  detailEl.innerHTML = '';

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:start;gap:20px;flex-wrap:wrap';

  const titleWrap = document.createElement('div');
  const h1 = document.createElement('h1');
  h1.style.margin = '0 0 6px';
  h1.textContent = r.nome;
  const sub = document.createElement('div');
  sub.style.color = '#666';
  sub.textContent = `${r.codigo || 'Sem código'} • ${r.categoria} • Versão ${r.versao || '1.0'}`;
  titleWrap.append(h1, sub);

  const btns = document.createElement('div');
  btns.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
  btns.innerHTML = `
    <button class="btn-s" style="background:var(--primary)" data-action="edit">✏️ Editar</button>
    <button class="btn-s" style="background:#5D4037" data-action="ft">📄 Ficha Técnica</button>
    <button class="btn-s" style="background:#2196F3" data-action="prod">🏭 Produção</button>
    <button class="btn-s" style="background:var(--danger)" data-action="del">🗑️</button>
  `;

  btns.querySelector('[data-action="edit"]').onclick = () => callbacks.onEdit(r);
  btns.querySelector('[data-action="ft"]').onclick = () => callbacks.onFT(r);
  btns.querySelector('[data-action="prod"]').onclick = () => callbacks.onProd(r);
  btns.querySelector('[data-action="del"]').onclick = () => callbacks.onDelete(r.id);

  header.append(titleWrap, btns);

  const stats = document.createElement('div');
  stats.className = 'detail-grid';
  stats.innerHTML = `
    <div class="stat"><small>Custo/Un</small><h3>${formatCurrency((r.custoTotal || 0) / (r.rendimento || 1))}</h3></div>
    <div class="stat"><small>PVP</small><h3 style="color:var(--success)">${formatCurrency(r.venda || 0)}</h3></div>
    <div class="stat"><small>Margem</small><h3>${r.margem || 200}%</h3></div>
    <div class="stat"><small>Validade</small><h3>${r.validade || '?'}d</h3></div>
    <div class="stat"><small>Cozedura</small><h3>${r.tempCoz || '?'}°C</h3></div>
    <div class="stat"><small>Peso</small><h3>${r.pesoUn || '?'}g</h3></div>
  `;

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px';

  const comp = document.createElement('div');
  comp.innerHTML = '<h3>📋 Composição</h3>';
  const tblWrap = document.createElement('div');
  tblWrap.className = 'tbl-wrap';
  const table = document.createElement('table');
  table.className = 'tbl';
  table.style.minWidth = 'auto';
  table.innerHTML = '<thead><tr><th>Ingrediente</th><th>%</th><th>Qtd</th><th>Origem</th></tr></thead>';
  const tbody = document.createElement('tbody');
  const totQtd = r.ingredientes?.reduce((a, b) => a + b.qtd, 0) || 0;
  r.ingredientes?.forEach(i => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${sanitizeHTML(i.nome)}</td><td>${((i.qtd / totQtd) * 100).toFixed(1)}%</td><td>${i.qtd}g</td><td>${sanitizeHTML(i.origem || '—')}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tblWrap.appendChild(table);
  comp.appendChild(tblWrap);

  if (r.alergenos?.length) {
    const alert = document.createElement('div');
    alert.style.cssText = 'margin-top:12px;padding:12px;background:#ffebee;border-left:4px solid #d32f2f;border-radius:6px';
    alert.innerHTML = `<strong>⚠️ Alérgenos:</strong> ${r.alergenos.map(a => sanitizeHTML(a)).join(', ')}`;
    comp.appendChild(alert);
  }

  const haccp = document.createElement('div');
  haccp.innerHTML = `
    <h3>🔬 HACCP / ASAE</h3>
    <p><strong>Armazenamento:</strong> ${sanitizeHTML(r.armazenamento?.temp || '0-4°C')} | aw ${r.armazenamento?.aw || '—'} | pH ${r.armazenamento?.ph || '—'}</p>
    <p><strong>PCCs identificados:</strong> ${r.pccs?.length || 0}</p>
  `;
  r.pccs?.forEach(p => {
    const div = document.createElement('div');
    div.style.cssText = 'padding:8px;background:#f5f5f5;margin:4px 0;border-radius:6px;font-size:.85rem';
    div.innerHTML = `<b>${sanitizeHTML(p.etapa)}:</b> ${sanitizeHTML(p.perigo)} (${sanitizeHTML(p.tipo)}) - Limite: ${sanitizeHTML(p.limite)}`;
    haccp.appendChild(div);
  });
  const prepTitle = document.createElement('h4');
  prepTitle.style.marginTop = '16px';
  prepTitle.textContent = 'Preparação';
  const prep = document.createElement('div');
  prep.style.cssText = 'background:#f9f9f9;padding:12px;border-radius:8px;max-height:180px;overflow:auto;white-space:pre-wrap;font-size:.9rem';
  prep.textContent = r.preparacao || '—';
  haccp.append(prepTitle, prep);

  grid.append(comp, haccp);
  detailEl.append(header, stats, grid);
}
