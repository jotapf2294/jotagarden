import { calcPercent } from './utils.js';

export function calcIngredientes() {
  let pesoTotal = 0;
  let custoTotal = 0;

  const rows = document.querySelectorAll('#tb-ing tr');
  rows.forEach(tr => {
    const qtd = parseFloat(tr.querySelector('.qtd')?.value) || 0;
    const preco = parseFloat(tr.querySelector('.preco')?.value) || 0;
    pesoTotal += qtd;
    custoTotal += (qtd / 1000) * preco;
  });

  rows.forEach(tr => {
    const qtd = parseFloat(tr.querySelector('.qtd')?.value) || 0;
    tr.querySelector('.pct').textContent = calcPercent(qtd, pesoTotal) + '%';
  });

  const rend = parseFloat(document.getElementById('n-rend')?.value) || 1;
  const marg = parseFloat(document.getElementById('n-marg')?.value) || 200;
  const custoUnit = custoTotal / rend;
  const pvp = custoUnit * (1 + marg / 100);

  document.getElementById('t-peso').textContent = pesoTotal + 'g';
  document.getElementById('t-custo').textContent = custoTotal.toFixed(2) + '€';
  document.getElementById('t-unit').textContent = custoUnit.toFixed(2) + '€';
  document.getElementById('v-custo').textContent = custoUnit.toFixed(2) + '€';
  document.getElementById('v-pvp').textContent = pvp.toFixed(2) + '€';
  document.getElementById('v-marg').textContent = marg + '%';
  document.getElementById('n-pvp').value = pvp.toFixed(2);
}

export function gerarListaIngredientes() {
  const ings = [];
  document.querySelectorAll('#tb-ing tr').forEach(tr => {
    const nome = tr.querySelector('.nome')?.value;
    const qtd = parseFloat(tr.querySelector('.qtd')?.value) || 0;
    if (nome && qtd > 0) ings.push({ nome, qtd });
  });
  ings.sort((a, b) => b.qtd - a.qtd);
  document.getElementById('r-lista').value = ings.map(i => i.nome).join(', ');
}
