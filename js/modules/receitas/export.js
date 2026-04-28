import { sanitizeHTML, formatCurrency, formatDate } from './utils.js';

// Gera Ficha Técnica PDF-friendly via window.print
export function gerarFichaTecnica(receita) {
  const w = window.open('', '_blank');
  const totalQtd = receita.ingredientes?.reduce((a, b) => a + b.qtd, 0) || 0;

  w.document.write(`
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <title>FT - ${sanitizeHTML(receita.nome)}</title>
      <style>
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
      </style>
    </head>
    <body>
      <div class="no-print" style="text-align:right;margin-bottom:10px">
        <button onclick="window.print()" style="padding:8px 16px;background:#FF6B9D;color:white;border:none;border-radius:6px;cursor:pointer">🖨️ Imprimir</button>
      </div>

      <div class="header">
        <div>
          <h1>FICHA TÉCNICA HACCP</h1>
          <div class="meta">Reg. (CE) 852/2004 | Reg. (UE) 1169/2011</div>
        </div>
        <div style="text-align:right">
          <strong>Babe's Bakery</strong><br>
          <span class="meta">Doc: ${sanitizeHTML(receita.codigo || 'FT-' + receita.id)} | Versão: ${sanitizeHTML(receita.versao || '1.0')}</span><br>
          <span class="meta">Data: ${formatDate(receita.updatedAt || new Date())}</span>
        </div>
      </div>

      <h2>1. IDENTIFICAÇÃO DO PRODUTO</h2>
      <table>
        <tr><th style="width:30%">Denominação</th><td>${sanitizeHTML(receita.nome)}</td></tr>
        <tr><th>Código Interno</th><td>${sanitizeHTML(receita.codigo || '—')}</td></tr>
        <tr><th>Categoria</th><td>${sanitizeHTML(receita.categoria)}</td></tr>
        <tr><th>Denominação Legal</th><td>${sanitizeHTML(receita.denomLegal || receita.nome)}</td></tr>
        <tr><th>Descrição</th><td>${sanitizeHTML(receita.descricao || '—')}</td></tr>
        <tr><th>Rendimento</th><td>${receita.rendimento || 1} unidades | ${receita.pesoUn || '?'} g/un</td></tr>
        <tr><th>Validade</th><td>${receita.validade || '?'} dias após produção</td></tr>
        <tr><th>Lote</th><td>${sanitizeHTML(receita.loteTipo || 'LAAAAMMDD')}</td></tr>
      </table>

      <h2>2. COMPOSIÇÃO QUALITATIVA E QUANTITATIVA</h2>
      <table>
        <thead><tr><th>Ingrediente</th><th>%</th><th>Quantidade (g)</th><th>Origem</th><th>Fornecedor</th></tr></thead>
        <tbody>
          ${receita.ingredientes?.map(i => `
            <tr>
              <td>${sanitizeHTML(i.nome)}</td>
              <td>${((i.qtd / totalQtd) * 100).toFixed(2)}%</td>
              <td>${i.qtd}</td>
              <td>${sanitizeHTML(i.origem || '—')}</td>
              <td>${sanitizeHTML(i.fornecedor || '—')}</td>
            </tr>
          `).join('') || '<tr><td colspan="5">Sem ingredientes</td></tr>'}
        </tbody>
      </table>
      <p><strong>Peso total:</strong> ${totalQtd}g | <strong>Custo produção:</strong> ${formatCurrency(receita.custoTotal || 0)} | <strong>PVP:</strong> ${formatCurrency(receita.venda || 0)}</p>

      ${receita.alergenos?.length? `
        <div class="alerta">
          <strong>⚠️ ALERGÉNIOS - Reg. (UE) 1169/2011:</strong><br>
          ${receita.alergenos.map(a => sanitizeHTML(a)).join(', ')}
        </div>
      ` : ''}

      <h2>3. PROCESSO DE FABRICO E PCC</h2>
      <table>
        <tr><th style="width:30%">Temperatura Cozedura</th><td>${receita.tempCoz || '?'} °C</td></tr>
        <tr><th>Tempo</th><td>${receita.tempoCoz || '?'} min</td></tr>
        <tr><th>Arrefecimento</th><td>Atingir ≤ 4°C em máximo 2h</td></tr>
        <tr><th>Armazenamento</th><td>${sanitizeHTML(receita.armazenamento?.temp || '0-4°C')} | aw: ${receita.armazenamento?.aw || '—'} | pH: ${receita.armazenamento?.ph || '—'}</td></tr>
      </table>

      <strong>Modo de Preparação:</strong>
      <div style="background:#f9f9f9;padding:10px;border-radius:4px;white-space:pre-wrap;font-size:12px;margin:8px 0">${sanitizeHTML(receita.preparacao || '—')}</div>

      ${receita.pccs?.length? `
        <strong>Pontos Críticos de Controlo (PCC):</strong>
        ${receita.pccs.map(p => `
          <div class="pcc">
            <strong>${sanitizeHTML(p.etapa)} - ${sanitizeHTML(p.tipo)}:</strong>
            ${sanitizeHTML(p.perigo)} | <strong>Limite Crítico:</strong> ${sanitizeHTML(p.limite)}
          </div>
        `).join('')}
      ` : '<p>Sem PCCs definidos</p>'}

      ${receita.perigos? `
        <strong>Perigos Identificados:</strong>
        <div style="background:#fff3e0;padding:8px;border-radius:4px;font-size:12px">${sanitizeHTML(receita.perigos)}</div>
      ` : ''}

      <h2>4. INFORMAÇÃO NUTRICIONAL (por 100g)</h2>
      <table>
        <tr><th>Energia</th><td>${receita.nutricional?.kcal || '—'} kcal</td><th>Lípidos</th><td>${receita.nutricional?.lip || '—'} g</td></tr>
        <tr><th>dos quais saturados</th><td>${receita.nutricional?.sat || '—'} g</td><th>Hidratos carbono</th><td>${receita.nutricional?.hc || '—'} g</td></tr>
        <tr><th>dos quais açúcares</th><td>${receita.nutricional?.ac || '—'} g</td><th>Proteínas</th><td>${receita.nutricional?.prot || '—'} g</td></tr>
        <tr><th>Sal</th><td>${receita.nutricional?.sal || '—'} g</td><th>Fibras</th><td>${receita.nutricional?.fib || '—'} g</td></tr>
      </table>

      <div class="assinatura">
        <div class="linha">Elaborado por:<br>Data: ___/___/______</div>
        <div class="linha">Aprovado por (Resp. Qualidade):<br>Data: ___/___/______</div>
      </div>
    </body>
    </html>
  `);
  w.document.close();
}

// Gera etiqueta 58mm para impressora térmica
export function gerarEtiquetaProducao(receita) {
  const w = window.open('', '_blank', 'width=400,height=600');
  const hoje = new Date();
  const validade = new Date(hoje);
  validade.setDate(hoje.getDate() + (receita.validade || 3));

  w.document.write(`
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
      <div><span class="bold">INGREDIENTES:</span> ${sanitizeHTML(document.getElementById('r-lista')?.value || receita.ingredientes?.map(i => i.nome).join(', '))}</div>
      ${receita.alergenos?.length? `<div class="bold">ALERGÉNIOS: ${receita.alergenos.map(a => sanitizeHTML(a)).join(', ')}</div>` : ''}
      <div class="linha"></div>
      <div class="grid" style="display:grid;grid-template-columns:1fr 1fr">
        <div><span class="bold">PROD:</span> ${formatDate(hoje)}</div>
        <div><span class="bold">VAL:</span> ${formatDate(validade)}</div>
      </div>
      <div><span class="bold">LOTE:</span> L${hoje.getFullYear()}${String(hoje.getMonth()+1).padStart(2,'0')}${String(hoje.getDate()).padStart(2,'0')}</div>
      <div><span class="bold">PESO:</span> ${receita.pesoUn || '?'}g | <span class="bold">PVP:</span> ${formatCurrency(receita.venda || 0)}</div>
      <div class="linha"></div>
      <div class="center small bold">CONSERVAR: ${sanitizeHTML(receita.armazenamento?.temp || '0-4°C')}</div>
      <div class="center small">Babe's Bakery | Conservar refrigerado</div>
    </body>
    </html>
  `);
  w.document.close();
}
