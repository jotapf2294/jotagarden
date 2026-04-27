const App = {
  tab: 'receitas',
  
  init() {
    this.bindNav();
    this.renderTab();
    this.checkOnline();
    setInterval(() => this.checkAlertas(), 60000);
  },

  bindNav() {
    document.querySelectorAll('.bottom-nav button').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.tab = btn.dataset.tab;
        this.renderTab();
      };
    });
  },

  renderTab() {
    const html = {
      receitas: Receitas.render(),
      calc: Calc.render(),
      timers: Timers.render(),
      stock: Stock.render(),
      encomendas: Encomendas.render()
    };
    document.getElementById('app').innerHTML = html[this.tab];
    
    // Bind da tab atual
    if (this.tab === 'receitas') Receitas.bind();
    if (this.tab === 'calc') Calc.bind();
    if (this.tab === 'timers') Timers.bind();
    if (this.tab === 'stock') Stock.bind();
    if (this.tab === 'encomendas') Encomendas.bind();
  },

  checkOnline() {
    const update = () => document.getElementById('status').textContent = navigator.onLine ? 'Online' : 'Offline';
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  },

  async checkAlertas() {
    // Alertas 24h encomendas + validades
    const encs = await DB.getAll('encomendas');
    const amanha = new Date(Date.now() + 86400000);
    encs.forEach(e => {
      if (new Date(e.data) < amanha && e.estado === 'Recebida') {
        if (Notification.permission === 'granted') {
          new Notification(`🧁 Amanhã ${e.hora}: ${e.cliente}`, {body: e.bolo});
        }
      }
    });
  },

  toast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:var(--choco);color:#fff;padding:12px 24px;border-radius:24px;z-index:999';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  }
};

window.onload = () => App.init();
if ('Notification' in window) Notification.requestPermission();
