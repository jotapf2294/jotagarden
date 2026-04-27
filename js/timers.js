const Timers = {
  lista: JSON.parse(localStorage.getItem('timers')||'[]'),

  render() {
    return `
    <div class="tab active">
      <div class="card">
        <h3>⏰ Novo Timer</h3>
        <div class="grid2">
          <input id="t-nome" placeholder="Nome: Forno">
          <input id="t-min" type="number" placeholder="Minutos">
        </div>
        <button class="btn btn-rosa" id="btn-iniciar-timer">▶️ Iniciar</button>
      </div>
      <div id="lista-timers"></div>
    </div>`;
  },

  bind() {
    document.getElementById('btn-iniciar-timer').onclick = () => this.add();
    this.renderLista();
  },

  add(nome, min) {
    const tNome = nome || document.getElementById('t-nome').value || 'Timer';
    const tMin = min || +document.getElementById('t-min').value;
    if (!tMin) return App.toast('Mete os minutos');

    const t = { id: Date.now(), nome: tNome, end: Date.now() + tMin * 60000 };
    this.lista.push(t);
    this.save();
    if (!nome) {
      document.getElementById('t-nome').value = '';
      document.getElementById('t-min').value = '';
    }
    this.renderLista();
  },

  renderLista() {
    const html = this.lista.map(t => {
      const s = Math.max(0, Math.floor((t.end - Date.now()) / 1000));
      const m = Math.floor(s/60), ss = s%60;
      return `
        <div class="timer-card">
          <h3>${t.nome}</h3>
          <div class="timer-time">${m}:${ss.toString().padStart(2,'0')}</div>
          <button class="btn btn-small" onclick="Timers.stop(${t.id})">⏹️ Parar</button>
        </div>`;
    }).join('');
    document.getElementById('lista-timers').innerHTML = html || '<div class="card">Sem timers ativos</div>';
  },

  stop(id) {
    this.lista = this.lista.filter(t => t.id!== id);
    this.save();
    this.renderLista();
  },

  save() {
    localStorage.setItem('timers', JSON.stringify(this.lista));
  },

  tick() {
    this.renderLista();
    this.lista.forEach(t => {
      if (t.end < Date.now()) {
        navigator.vibrate && navigator.vibrate([200,100,200]);
        if (Notification.permission === 'granted') new Notification(`⏰ ${t.nome} terminou!`);
        this.stop(t.id);
      }
    });
  }
};

window.Timers = Timers;
setInterval(() => Timers.tick(), 1000);
