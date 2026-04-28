// receitas/calc.js
import { formatCurrency } from './utils.js';

// FIX: Converte vírgula PT pra ponto antes do parseFloat
const toNumber = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(String(val).replace(',', '.')) || 0;
};

export function calcIngredientes() {
  const modal = document.getElementById('modal-receita');
  if (!modal) return;

  const tb = modal.querySelector('#tb-ing');
  const linhas = tb.querySelectorAll('tr');
  
  // 1. Calcula peso total
  let pesoTotal = 0;
  linhas.forEach(tr => {
    const qtd = toNumber(tr.querySelector('.qtd')?.value);
    pesoTotal += qtd;
  });

  // 2. Calcula % e custo de cada ingrediente
  let custoTotal = 0;
  linhas.forEach(tr => {
    const qtd = toNumber(tr.querySelector('.qtd')?.value);
    const preco = toNumber(tr.querySelector('.preco')?.value); // €/kg
    const pctEl = tr.querySelector('.pct');
    
    const pct = pesoTotal > 0 ? (qtd / pesoTotal) * 100 : 0;
    if (pctEl) pctEl.textContent = pct.toFixed(1) + '%';
    
    const custoIng = (qtd / 1000) * preco; // qtd em g, preco em €/kg
    custoTotal += custoIng;
  });

  // 3. Atualiza totais da tabela de ingredientes
  const tPeso = modal.querySelector('#t-peso');
  const tCusto = modal.querySelector('#t-custo');
  const tUnit = modal.querySelector('#t-unit');
  if (tPeso) tPeso.textContent = pesoTotal.toFixed(0) + 'g';
  if (tCusto) tCusto.textContent = formatCurrency(custoTotal);

  // 4. Calcula custo/un e PVP
  const rend = toNumber(modal.querySelector('#n-rend')?.value) || 1;
  const custoUnit = custoTotal / rend;
  if (tUnit) tUnit.textContent = formatCurrency(custoUnit);

  const marg = toNumber(modal.querySelector('#n-marg')?.value) || 200;
  const pvp = custoUnit * (1 + marg / 100);

  // 5. Atualiza footer do modal
  const vCusto = modal.querySelector('#v-custo');
  const vPvp = modal.querySelector('#v-pvp');
  const vMarg = modal.querySelector('#v-marg');
  const nPvp = modal.querySelector('#n-pvp');

  if (vCusto) vCusto.textContent = formatCurrency(custoTotal);
  if (vPvp) vPvp.textContent = formatCurrency(pvp);
  if (vMarg) vMarg.textContent = marg.toFixed(0) + '%';
  if (nPvp) nPvp.value = pvp.toFixed(2);

  return {
    pesoTotal,
    custoTotal: Math.round(custoTotal * 100) / 100, // FIX: arredonda 2 casas
    custoUnit: Math.round(custoUnit * 100) / 100,
    pvp: Math.round(pvp * 100) / 100,
    margem: marg
  };
}

// Exporta função auxiliar pra usar no detail.js também
export function calcCustoFromIngredientes(ingredientes = [], rendimento = 1) {
  const custoTotal = ingredientes.reduce((acc, i) => {
    const qtd = toNumber(i.qtd);
    const preco = toNumber(i.preco);
    return acc + (qtd / 1000) * preco;
  }, 0);
  
  const custoUnit = custoTotal / (rendimento || 1);
  return {
    custoTotal: Math.round(custoTotal * 100) / 100,
    custoUnit: Math.round(custoUnit * 100) / 100
  };
}