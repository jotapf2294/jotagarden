// receitas/export.js
import { sanitizeHTML, formatCurrency, formatDate, formatDateTime, gerarLote, isSafeString, toNumber } from './utils.js';

// Helper: valida se receita tem dados perigosos antes de gerar HTML
function validarReceitaSegura(receita) {
  const campos = [
    receita.nome, receita.codigo, receita.categoria, receita.descricao,
    receita.denomLegal, receita.preparacao, receita.perigos
  ];
  for (const campo of campos) {
    if (!isSafeString(campo)) {
      throw new Error('Dados inválidos detectados. Remova código HTML/JS dos campos.');
    }
  }
  receita.ingredientes?.forEach(i => {
    if (!isSafeString(i.nome) || !isSafeString(i.origem) || !isSafeString(i.fornecedor)) {
      throw new Error('Ingrediente com dados inválidos detectado.');
    }
  });
}

// Gera Ficha Técnica PDF-friendly via window.print
export function gerarFichaTecnica(receita) {
  try {
    validarReceitaSegura(receita);
  } catch (err) {
    window.toast('❌ ' + err.message);
    return;
  }

  const w = window.open('', '_blank');
  if (!w) {
    window.toast('❌ Popup bloqueado. Permite popups pra imprimir.');
    return;
  }

  const totalQtd = receita.ingredientes?.reduce((a, b) => a + toNumber(b.qtd), 0) || 0;
  const dataAtual = formatDate(receita.updatedAt || new Date());
  const codigo = sanitizeHTML(receita.codigo || 'FT-' + receita.id);
  const versao = sanitizeHTML(receita.versao || '1.0');

  // FIX: usa DOM API em vez de string gigante pra evitar XSS
  const doc = w.document;
  doc.open();
  
  // HEAD
  const head = doc.createElement('head');
  const meta = doc.createElement('meta');
  meta.charset = 'UTF-8';
  head.appendChild(meta);
  
  const title = doc.createElement('title');
  title.textContent = `FT - ${receita.nome}`; // textContent é seguro
  head.appendChild(title);
  
  const style = doc.createElement('style');
  style.textContent = `
    body{font-family:Arial,sans-serif;margin:20px;color:#222;line-height:1.4}
    h1{color:#FF6B9D;margin:0 0 4px;font-size:24px}
    h2{color:#5D4037;border-bottom:2px solid #FF6B9D;padding-bottom:4px;margin-top:20px;font-size:18px}
    .header{display:flex;justify-content:space-between;align-items:start;margin-bottom:20px}
    .meta{font-size:12px;color:#666}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
    table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}
    th,td{border:1px solid #ddd;padding:6px;text-align:left}
    th{background:#f5f5f5;font-weight:600}
    .alerta{background:#ffebee;border-left:4px solid #d32f2f;padding:10px;margin:10px 0}
    .pcc{background:#f5f5f5;padding:8px;margin:4px 0;border-radius:4px;font-size:11px}
    .assinatura{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:40px}
    .linha{border-top:1px solid #333;padding-top:4px;font-size:11px}
    @media print{body{margin:0}.no-print{display:none}}
  `;
  head.appendChild(style);
  doc.appendChild(head);

  // BODY
  const body = doc.createElement('body');

  // Botão imprimir
  const noPrint = doc.createElement('div');
  noPrint.className = 'no-print';
  noPrint.style.cssText = 'text-align:right;margin-bottom:10px';
  const btnPrint = doc.createElement('button');
  btnPrint.textContent = '🖨️ Imprimir';
  btnPrint.style.cssText = 'padding:8px 16px;background:#FF6B9D;color:white;border:none;border-radius:6px;cursor:pointer';
  btnPrint.onclick = () => w.print();
  noPrint.appendChild(btnPrint);
  body.appendChild(noPrint);

  // Header
  const header = doc.createElement('div');
  header.className = 'header';
  header.innerHTML = `
    <div>
      <h1>FICHA TÉCNICA HACCP</h1>
      <div class="meta">Reg. (CE) 852/2004 | Reg. (UE) 1169/2011</div>
    </div>
    <div style="text-align:right">
      <strong>Babe's Bakery</strong><br>
      <span class="meta">Doc: ${codigo} | Versão: ${versao}</span><br>
      <span class="meta">Data: ${dataAtual}</span>
    </div>
  `;
  body.appendChild(header);

  // 1. IDENTIFICAÇÃO
  body.appendChild(criarH2(doc, '1. IDENTIFICAÇÃO DO PRODUTO'));
  const tabela1 = criarTabela(doc, [
    ['Denominação', receita.nome],
    ['Código Interno', receita.codigo || '—'],
    ['Categoria', receita.categoria],
    ['Denominação Legal', receita.denomLegal || receita.nome],
    ['Descrição', receita.descricao || '—'],
    ['Rendimento', `${receita.rendimento || 1} unidades | ${receita.pesoUn || '?'} g/un`],
    ['Validade', `${receita.validade || '?'} dias após produção`],
    ['Lote', receita.loteTipo || gerarLote()]
  ]);
  body.appendChild(tabela1);

  // 2. COMPOSIÇÃO
  body.appendChild(criarH2(doc, '2. COMPOSIÇÃO QUALITATIVA E QUANTITATIVA'));
  const tabelaIng = doc.createElement('table');
  tabelaIng.innerHTML = `<thead><tr><th>Ingrediente</th><th>%</th><th>Quantidade (g)</th><th>Origem</th><th>Fornecedor</th></tr></thead>`;
  const tbody = doc.createElement('tbody');
  if (receita.ingredientes?.length) {
    receita.ingredientes.forEach(i => {
      const tr = doc.createElement('tr');
      const pct = totalQtd > 0 ? ((toNumber(i.qtd) / totalQtd) * 100).toFixed(2) : '0.00';
      tr.innerHTML = `
        <td>${sanitizeHTML(i.nome)}</td>
        <td>${pct}%</td>
        <td>${toNumber(i.qtd)}</td>
        <td>${sanitizeHTML(i.origem || '—')}</td>
        <td>${sanitizeHTML(i.fornecedor || '—')}</td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    tbody.innerHTML = '<tr><td colspan="5">Sem ingredientes</td></tr>';
  }
  tabelaIng.appendChild(tbody);
  body.appendChild(tabelaIng);

  const pTotais = doc.createElement('p');
  pTotais.innerHTML = `<strong>Peso total:</strong> ${totalQtd}g | <strong>Custo produção:</strong> ${formatCurrency(receita.custoTotal || 0)} | <strong>PVP:</strong> ${formatCurrency(receita.venda || 0)}`;
  body.appendChild(pTotais);

  // Alergénios
  if (receita.alergenos?.length) {
    const alerta = doc.createElement('div');
    alerta.className = 'alerta';
    alerta.innerHTML = `<strong>⚠️ ALERGÉNIOS - Reg. (UE) 1169/2011:</strong><br>${receita.alergenos.map(a => sanitizeHTML(a)).join(', ')}`;
    body.appendChild(alerta);
  }

  // 3. PROCESSO
  body.appendChild(criarH2(doc, '3. PROCESSO DE FABRICO E PCC'));
  const tabela3 = criarTabela(doc, [
    ['Temperatura Cozedura', `${receita.tempCoz || '?'} °C`],
    ['Tempo', `${receita.tempoCoz || '?'} min`],
    ['Arrefecimento', 'Atingir ≤ 4°C em máximo 2h'],
    ['Armazenamento', `${sanitizeHTML(receita.armazenamento?.temp || '0-4°C')} | aw: ${receita.armazenamento?.aw || '—'} | pH: ${receita.armazenamento?.ph || '—'}`]
  ]);
  body.appendChild(tabela3);

  const hPrep = doc.createElement('strong');
  hPrep.textContent = 'Modo de Preparação:';
  body.appendChild(hPrep);
  const divPrep = doc.createElement('div');
  divPrep.style.cssText = 'background:#f9f9f9;padding:10px;border-radius:4px;white-space:pre-wrap;font-size:12px;margin:8px 0';
  divPrep.textContent = receita.preparacao || '—'; // textContent evita XSS
  body.appendChild(divPrep);

  // PCCs
  if (receita.pccs?.length) {
    const hPcc = doc.createElement('strong');
    hPcc.textContent = 'Pontos Críticos de Controlo (PCC):';
    body.appendChild(hPcc);
    receita.pccs.forEach(p => {
      const divPcc = doc.createElement('div');
      divPcc.className = 'pcc';
      divPcc.innerHTML = `<strong>${sanitizeHTML(p.etapa)} - ${sanitizeHTML(p.tipo)}:</strong> ${sanitizeHTML(p.perigo)} | <strong>Limite Crítico:</strong> ${sanitizeHTML(p.limite)}`;
      body.appendChild(divPcc);
    });
  }

  // 4. NUTRICIONAL
  body.appendChild(criarH2(doc, '4. INFORMAÇÃO NUTRICIONAL (por 100g)'));
  const tabelaNut = doc.createElement('table');
  tabelaNut.innerHTML = `
    <tr><th>Energia</th><td>${receita.nutricional?.kcal || '—'} kcal</td><th>Lípidos</th><td>${receita.nutricional?.lip || '—'} g</td></tr>
    <tr><th>dos quais saturados</th><td>${receita.nutricional?.sat || '—'} g</td><th>Hidratos carbono</th><td>${receita.nutricional?.hc || '—'} g</td></tr>
    <tr><th>dos quais açúcares</th><td>${receita.nutricional?.ac || '—'} g</td><th>Proteínas</th><td>${receita.nutricional?.prot || '—'} g</td></tr>
    <tr><th>Sal</th><td>${receita.nutricional?.sal || '—'} g</td><th>Fibras</th><td>${receita.nutricional?.fib || '—'} g</td></tr>
  `;
  body.appendChild(tabelaNut);

  // Assinatura
  const ass = doc.createElement('div');
  ass.className = 'assinatura';
  ass.innerHTML = `
    <div class="linha">Elaborado por:<br>Data: ___/___/______</div>
    <div class="linha">Aprovado por (Resp. Qualidade):<br>Data: ___/___/______</div>
  `;
  body.appendChild(ass);

  doc.appendChild(body);
  doc.close();
}

// Gera etiqueta 58mm para impressora térmica
export function gerarEtiquetaProducao(receita) {
  try {
    validarReceitaSegura(receita);
  } catch (err) {
    window.toast('❌ ' + err.message);
    return;
  }

  const w = window.open('', '_blank', 'width=400,height=600');
  if (!w) {
    window.toast('❌ Popup bloqueado');
    return;
  }

  const hoje = new Date();
  const validade = new Date(hoje);
  validade.setDate(hoje.getDate() + (toNumber(receita.validade) || 3));
  
  // FIX: Não usa mais document.getElementById('r-lista')
  const listaIng = receita.ingredientes?.map(i => sanitizeHTML(i.nome)).join(', ') || '—';
  const lote = gerarLote(hoje);

  const doc = w.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Etiqueta - ${sanitizeHTML(receita.nome)}</title>
      <style>
        @page{size:58mm auto;margin:2mm}
        body{font-family:Arial,sans-serif;width:54mm;margin:0;font-size:9px;line-height:1.2}
        h1{font-size:12px;margin:0 0 2px;text-align:center;font-weight:bold}
        .center{text-align:center}
        .linha{border-top:1px dashed #000;margin:3px 0}
        .small{font-size:8px}
        .bold{font-weight:bold}
        @media print{button{display:none}}
      </style>
    </head>
    <body>
      <button onclick="window.print()" style="width:100%;padding:8px;margin-bottom:5px">🖨️ Imprimir</button>
      <h1>${sanitizeHTML(receita.nome).toUpperCase()}</h1>
      <div class="center small">${sanitizeHTML(receita.codigo || '')}</div>
      <div class="linha"></div>
      <div><span class="bold">INGREDIENTES:</span> ${listaIng}</div>
      ${receita.alergenos?.length ? `<div class="bold">ALERGÉNIOS: ${receita.alergenos.map(a => sanitizeHTML(a)).join(', ')}</div>` : ''}
      <div class="linha"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr">
        <div><span class="bold">PROD:</span> ${formatDate(hoje)}</div>
        <div><span class="bold">VAL:</span> ${formatDate(validade)}</div>
      </div>
      <div><span class="bold">LOTE:</span> ${lote}</div>
      <div><span class="bold">PESO:</span> ${receita.pesoUn || '?'}g | <span class="bold">PVP:</span> ${formatCurrency(receita.venda || 0)}</div>
      <div class="linha"></div>
      <div class="center small bold">CONSERVAR: ${sanitizeHTML(receita.armazenamento?.temp || '0-4°C')}</div>
      <div class="center small">Babe's Bakery | Conservar refrigerado</div>
    </body>
    </html>
  `);
  doc.close();
}

// Helpers DOM
function criarH2(doc, texto) {
  const h2 = doc.createElement('h2');
  h2.textContent = texto;
  return h2;
}

function criarTabela(doc, linhas) {
  const table = doc.createElement('table');
  linhas.forEach(([th, td]) => {
    const tr = doc.createElement('tr');
    const thEl = doc.createElement('th');
    thEl.style.width = '30%';
    thEl.textContent = th;
    const tdEl = doc.createElement('td');
    tdEl.textContent = td;
    tr.appendChild(thEl);
    tr.appendChild(tdEl);
    table.appendChild(tr);
  });
  return table;
}