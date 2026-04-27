const Timers = {
  lista: [],

  render() {
    return `
    <div class="tab active">
      <div class="card">
        <h3>⏰ Novo Timer</h3>
        <input id="t-nome" placeholder="Nome: Forno Bolo Chocolate">
        <div class="grid2">
          <input id="t-min" type="number" placeholder="Minutos: 30">
          <input id="t-seg" type="number" placeholder="Segundos: 0">
        </div>
        <button class="btn btn-rosa" onclick="Timers.add()">▶️ Iniciar Timer</button>
      </div>
      <div id="lista-timers"></div>
    </div>`;
  },

  bind() {
    this.loadLista();
  },

  add(nome, minutos) {
    if (nome && minutos) {
      document.getElementById('t-nome').value = nome;
      document.getElementById('t-min').value = minutos;
    }
    const n = document.getElementById('t-nome').value || 'Timer';
    const m = +document.getElementById('t-min').value || 0;
    const s = +document.getElementById('t-seg').value || 0;
    const total = m * 60 + s;
    if (total === 0) return App.toast('Tempo inválido');
    
    this.lista.push({
      id: Date.now(),
      nome: n,
      total: total,
      restante: total,
      ativo: true
    });
    document.getElementById('t-nome').value = '';
    document.getElementById('t-min').value = '';
    document.getElementById('t-seg').value = '';
    this.loadLista();
    App.toast('Timer iniciado ⏰');
  },

  tick() {
    let mudou = false;
    this.lista = this.lista.filter(t => {
      if (!t.ativo) return true;
      t.restante--;
      if (t.restante <= 0) {
        App.notify('⏰ Timer!', `${t.nome} terminou!`, `timer-${t.id}`);
        App.toast(`⏰ ${t.nome} terminou!`);
        return false;
      }
      return true;
    });
    if (App.tab === 'timers') this.loadLista();
  },

  loadLista() {
    const div = document.getElementById('lista-timers');
    if (!div) return;
    div.innerHTML = this.lista.map(t => {
      const min = Math.floor(t.restante / 60);
      const seg = t.restante % 60;
      const perc = ((t.total - t.restante) / t.total * 100).toFixed(0);
      return `
        <div class="timer-card">
          <h3>${t.nome}</h3>
          <div class="timer-time">${String(min).padStart(2,'0')}:${String(seg).padStart(2,'0')}</div>
          <div style="background:rgba(255,255,255,0.2);height:6px;border-radius:3px;margin:10px 0">
            <div style="background:var(--rosa);height:100%;width:${perc}%;border-radius:3px;transition:width 1s"></div>
          </div>
          <button class="btn btn-small" onclick="Timers.del(${t.id})">❌ Parar</button>
        </div>
      `;
    }).join('') || '<div class="card">Sem timers ativos</div>';
  },

  del(id) {
    this.lista = this.lista.filter(t => t.id !== id);
    this.loadLista();
  }
};

window.Timers = Timers;
