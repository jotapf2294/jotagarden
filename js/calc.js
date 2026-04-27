const Calc = {
  render() {
    return `
    <div class="tab active">
      <div class="card">
        <h3>🧮 Calculadora Rápida</h3>
        <input id="c-custo" type="number" step="0.01" placeholder="Custo total matéria-prima: 5.40€" oninput="Calc.calcRapida()">
        <input id="c-rend" type="number" placeholder="Rendimento: 12 unidades" oninput="Calc.calcRapida()">
        <input id="c-margem" type="number" placeholder="Margem %: 300" value="300" oninput="Calc.calcRapida()">
        <div id="c-resultado" style="background:#FFF5F8;padding:16px;border-radius:12px;margin-top:10px">
          <b>Custo/Un:</b> 0.00€<br>
          <b>PVP Sugerido:</b> 0.00€<br>
          <b>Lucro/Un:</b> 0.00€
        </div>
      </div>

      <div class="card">
        <h3>💧 Hidratação Massa</h3>
        <input id="h-farinha" type="number" placeholder="Farinha: 1000g" oninput="Calc.calcHidrat()">
        <input id="h-agua" type="number" placeholder="Água/Leite: 650g" oninput="Calc.calcHidrat()">
        <div id="h-resultado" style="background:#FFF5F8;padding:16px;border-radius:12px;margin-top:10px">
          <b>Hidratação:</b> 0%<br>
          <b>Tipo:</b> -
        </div>
      </div>

      <div class="card">
        <h3>📏 Escalar Receita</h3>
        <input id="e-atual" type="number" placeholder="Rendimento atual: 12" oninput="Calc.calcEscala()">
        <input id="e-novo" type="number" placeholder="Novo rendimento: 24" oninput="Calc.calcEscala()">
        <div id="e-resultado" style="background:#FFF5F8;padding:16px;border-radius:12px;margin-top:10px">
          <b>Fator:</b> x0<br>
          <b>Exemplo 100g →</b> 0g
        </div>
      </div>
    </div>`;
  },

  bind() {},

  calcRapida() {
    const custo = +document.getElementById('c-custo').value || 0;
    const rend = +document.getElementById('c-rend').value || 1;
    const margem = +document.getElementById('c-margem').value || 0;
    const custoUn = custo / rend;
    const pvp = custoUn * (1 + margem/100);
    const lucro = pvp - custoUn;
    document.getElementById('c-resultado').innerHTML = `
      <b>Custo/Un:</b> ${custoUn.toFixed(2)}€<br>
      <b>PVP Sugerido:</b> ${pvp.toFixed(2)}€<br>
      <b>Lucro/Un:</b> ${lucro.toFixed(2)}€
    `;
  },

  calcHidrat() {
    const farinha = +document.getElementById('h-farinha').value || 0;
    const agua = +document.getElementById('h-agua').value || 0;
    const hid = farinha > 0 ? (agua/farinha*100).toFixed(0) : 0;
    let tipo = '-';
    if (hid < 55) tipo = 'Massa seca - Biscoitos';
    else if (hid < 65) tipo = 'Massa firme - Pão';
    else if (hid < 75) tipo = 'Massa macia - Bolo';
    else tipo = 'Massa mole - Ciabatta';
    document.getElementById('h-resultado').innerHTML = `
      <b>Hidratação:</b> ${hid}%<br>
      <b>Tipo:</b> ${tipo}
    `;
  },

  calcEscala() {
    const atual = +document.getElementById('e-atual').value || 1;
    const novo = +document.getElementById('e-novo').value || 0;
    const fator = (novo / atual).toFixed(2);
    document.getElementById('e-resultado').innerHTML = `
      <b>Fator:</b> x${fator}<br>
      <b>Exemplo 100g →</b> ${(100*fator).toFixed(0)}g
    `;
  }
};

window.Calc = Calc;
