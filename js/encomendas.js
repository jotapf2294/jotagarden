const Encomendas = {
  render() {
    return `
    <div class="tab active">
      <div class="card">
        <h3>📅 Nova Encomenda</h3>
        <input id="e-cliente" placeholder="Cliente: Ana Silva">
        <input id="e-tel" type="tel" placeholder="Telefone: 912345678">
        <input id="e-bolo" placeholder="Bolo: Chocolate 2kg">
        <div class="grid2">
          <input id="e-data" type="date">
          <input id="e-hora" type="time">
        </div>
        <div class="grid2">
          <input id="e-valor" type="number" placeholder="Valor €">
          <input id="e-sinal" type="number" placeholder="Sinal €">
        </div>
        <textarea id="e-notas" rows="2" placeholder="Notas: sem lactose"></textarea>
        <button class="btn btn-rosa" onclick="Encomendas.save()">💾 Guardar</button>
      </div>
      <div class="card">
        <h3>📋 Próximos 7 dias</h3>
        <div id="lista-7dias"></div>
      </div>
      <div id="lista-encomendas"></div>
    </div>`;
  },

  bind() { this.loadLista(); },

  async save() {
    const e = {
      cliente: e_cliente.value,
      tel: e_tel.value,
      bolo: e_bolo.value,
      data: e_data.value,
      hora: e_hora.value,
      valor: +e_valor.value,
      sinal: +e_sinal.value,
      notas: e_notas.value,
      estado: 'Recebida'
    };
    if (!e.cliente ||!e.data) return App.toast('Cliente e data obrigatórios');
    await DB.save('encomendas', e);
    App.toast('Encomenda guardada 📅');
    this.loadLista();
    document.querySelectorAll('#encomendas input, #encomendas textarea').forEach(el => el.value = '');
  },

  async loadLista() {
    const all = await DB.getAll('encomendas');
    const hoje = new Date().toISOString().split('T')[0];
    const prox7 = all.filter(e => e.data >= hoje).sort((a,b) => (a.data+a.hora).localeCompare(b.data+b.hora));

    document.getElementById('lista-7dias').innerHTML = prox7.slice(0,7).map(e => `
      <div class="card" style="margin:8px 0">
        <b>${e.cliente}</b> - ${e.bolo}<br>
        📅 ${e.data} ${e.hora} | 💰 ${e.valor}€ | Sinal: ${e.sinal}€<br>
        <span class="badge badge-verde">${e.estado}</span>
        <button class="btn-small" onclick="Encomendas.print(${e.id})">🖨️ Talão</button>
        <select onchange="Encomendas.estado(${e.id},this.value)">
          <option ${e.estado==='Recebida'?'selected':''}>Recebida</option>
          <option ${e.estado==='Em Prep'?'selected':''}>Em Prep</option>
          <option ${e.estado==='Pronta'?'selected':''}>Pronta</option>
          <option ${e.estado==='Entregue'?'selected':''}>Entregue</option>
          <option ${e.estado==='Paga'?'selected':''}>Paga</option>
        </select>
      </div>
    `).join('') || 'Sem encomendas próximas';
  },

  async estado(id, novo) {
    const all = await DB.getAll('encomendas');
    const e = all.find(x => x.id === id);
    e.estado = novo;
    await DB.save('encomendas', e);
    App.toast('Estado atualizado');
  },

  async print(id) {
    const e = (await DB.getAll('encomendas')).find(x => x.id === id);
    const w = window.open('', '', 'width=300');
    w.document.write(`
      <div class="print-area" style="width:58mm;font-family:monospace;font-size:12px">
        <center><b>BABE'S BAKERY</b><br>*** TALÃO ***</center>
        <hr>
        Cliente: ${e.cliente}<br>
        Tel: ${e.tel}<br>
        <hr>
        ${e.bolo}<br>
        Entrega: ${e.data} ${e.hora}<br>
        ${e.notas? 'Obs: '+e.notas+'<br>' : ''}
        <hr>
        Total: ${e.valor.toFixed(2)}€<br>
        Sinal: ${e.sinal.toFixed(2)}€<br>
        <b>Falta: ${(e.valor-e.sinal).toFixed(2)}€</b><br>
        <hr>
        <center>Obrigada! 🧁</center>
      </div>
    `);
    w.print();
  }
};
