const Calc = {
  render() {
    return `
    <div class="tab active">
      <div class="card">
        <h3>🧮 Regra de 3</h3>
        <div class="grid2">
          <input id="c1-a" type="number" placeholder="Se 500g">
          <input id="c1-b" type="number" placeholder="= 20 un">
        </div>
        <input id="c1-c" type="number" placeholder="Quanto para 35 un?">
        <button class="btn btn-rosa" onclick="Calc.regra3()">Calcular</button>
        <h2 id="c1-out" style="color:var(--rosa);text-align:center"></h2>
      </div>

      <div class="card">
        <h3>💯 % Padeiro</h3>
        <input id="p-farinha" type="number" placeholder="Farinha 1000g = 100%">
        <input id="p-agua" type="number" placeholder="Água 650g">
        <input id="p-sal" type="number" placeholder="Sal 20g">
        <input id="p-fermento" type="number" placeholder="Fermento 10g">
        <button class="btn btn-rosa" onclick="Calc.padeiro()">Calcular %</button>
        <div id="p-out"></div>
      </div>

      <div class="card">
        <h3>🔄 Conversor</h3>
        <div class="grid2">
          <input id="conv-val" type="number" placeholder="Valor">
          <select id="conv-tipo">
            <option value="g-colher">g → colher sopa</option>
            <option value="ml-chavena">ml → chávena</option>
            <option value="c-f">ºC → ºF</option>
            <option value="oz-g">oz → g</option>
          </select>
        </div>
        <button class="btn btn-rosa" onclick="Calc.converter()">Converter</button>
        <h2 id="conv-out" style="color:var(--rosa);text-align:center"></h2>
      </div>

      <div class="card">
        <h3>💰 Preço Venda</h3>
        <input id="v-custo" type="number" placeholder="Custo total €">
        <input id="v-margem" type="number" placeholder="Margem % ex: 300">
        <button class="btn btn-rosa" onclick="Calc.preco()">Calcular PVP</button>
        <h2 id="v-out" style="color:var(--rosa);text-align:center"></h2>
      </div>
    </div>`;
  },

  bind() {},

  regra3() {
    const a = +c1_a.value, b = +c1_b.value, c = +c1_c.value;
    if (a && b && c) c1_out.textContent = `= ${(c * a / b).toFixed(1)}g`;
  },

  padeiro() {
    const f = +p_farinha.value || 1000;
    const agua = +p_agua.value, sal = +p_sal.value, ferm = +p_fermento.value;
    p_out.innerHTML = `
      <p>💧 Hidratação: ${(agua/f*100).toFixed(1)}%</p>
      <p>🧂 Sal: ${(sal/f*100).toFixed(1)}%</p>
      <p>🍞 Fermento: ${(ferm/f*100).toFixed(1)}%</p>
    `;
  },

  converter() {
    const v = +conv_val.value;
    const t = conv_tipo.value;
    let r = 0;
    if (t==='g-colher') r = v/15 + ' colheres';
    if (t==='ml-chavena') r = v/240 + ' chávenas';
    if (t==='c-f') r = (v*9/5+32).toFixed(1) + 'ºF';
    if (t==='oz-g') r = (v*28.35).toFixed(1) + 'g';
    conv_out.textContent = r;
  },

  preco() {
    const c = +v_custo.value, m = +v_margem.value;
    if (c && m) v_out.textContent = `PVP: ${(c * (1 + m/100)).toFixed(2)}€`;
  }
};
