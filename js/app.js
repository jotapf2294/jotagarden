const App = {
  tab: 'receitas',
  wakeLock: null,
  notifPermission: false,

  async init() {
    await DB.init();
    this.bindNav();
    this.renderTab();
    this.initOnlineStatus();
    await this.initNotifications();
    await this.initWakeLock();
    this.initServiceWorker();
    setInterval(() => Timers.tick(), 1000);
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
    window[this.tab.charAt(0).toUpperCase() + this.tab.slice(1)]?.bind();
  },

  initOnlineStatus() {
    const update = () => {
      const online = navigator.onLine;
      document.getElementById('status-online').innerHTML = online? '<span class="dot dot-green"></span>Online' : '⚫ Offline';
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  },

  async initNotifications() {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      this.notifPermission = perm === 'granted';
      document.getElementById('status-notif').textContent = this.notifPermission? '🔔' : '🔕';
      document.getElementById('status-notif').onclick = () => {
        if (!this.notifPermission) Notification.requestPermission().then(p => {
          this.notifPermission = p === 'granted';
          document.getElementById('status-notif').textContent = this.notifPermission? '🔔' : '🔕';
        });
      };
    }
  },

  async initWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        document.getElementById('status-wake').textContent = '☀️';
        this.wakeLock.addEventListener('release', () => {
          document.getElementById('status-wake').textContent = '🌙';
        });
      } catch(e) {
        document.getElementById('status-wake').textContent = '🌙';
      }
    }
    document.getElementById('status-wake').onclick = () => this.initWakeLock();
  },

  initServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js');
    }
  },

  toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  },

  async share(data) {
    if (navigator.share) {
      try {
        await navigator.share(data);
        this.toast('Partilhado! 📤');
      } catch(e) {
        if (e.name!== 'AbortError') this.toast('Erro ao partilhar');
      }
    } else {
      await navigator.clipboard?.writeText(data.text || data.url);
      this.toast('Copiado! 📋');
    }
  },

  async exportBackup() {
    const data = {
      receitas: await DB.getAll('receitas'),
      stock: await DB.getAll('stock'),
      encomendas: await DB.getAll('encomendas'),
      exportDate: new Date().toISOString(),
      version: '2.1'
    };
    const blob = new Blob([JSON.stringify(data,null,2)], {type: 'application/json'});

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `babe-backup-${Date.now()}.json`,
          types: [{description: 'JSON', accept: {'application/json': ['.json']}}]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        this.toast('Backup guardado! 💾');
        return;
      } catch(e) {
        if (e.name === 'AbortError') return;
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `babe-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async notify(title, body, tag = 'babe') {
    if (this.notifPermission) {
      new Notification(title, {
        body,
        tag,
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧁</text></svg>',
        vibrate: [200, 100, 200]
      });
    }
  },

  printHTML(html) {
    const frame = document.getElementById('print-frame');
    frame.innerHTML = `<iframe id="pf" style="width:0;height:0;border:0"></iframe>`;
    const pf = document.getElementById('pf');
    const doc = pf.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      pf.contentWindow.focus();
      pf.contentWindow.print();
    }, 300);
  }
};

App.init();
