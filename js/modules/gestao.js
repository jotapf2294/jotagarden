import { getAllData, addData } from '../db.js';

export const renderGestao = () => {
  const c = document.getElementById('tab-gestao');
  c.innerHTML = `
    <h2>📊 Gestão</h2>
    <div class="card">
      <h3>💾 Backup</h3>
      <p>Exporta e importa todos os dados.</p>
      <button id="btn-export" class="btn-action" style="background:#4caf50;margin-top:10px">⬇️ Exportar</button>
      <input type="file" id="file-import" accept=".json" style="display:none">
      <button id="btn-import" class="btn-action" style="background:#ff9800;margin-top:8px">⬆️ Importar</button>
    </div>
    <div class="card">
      <h3>ℹ️ Sobre</h3>
      <p>Doce Gestão v2.1 - PWA Offline<br>Desenvolvido para Babe's Bakery</p>
    </div>
  `;

  document.getElementById('btn-export').onclick = async () => {
    const receitas = await getAllData('receitas');
    const agenda = await getAllData('agenda');
    const blob = new Blob([JSON.stringify({data:new Date().toISOString(), receitas, agenda}, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup-docegestao-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const fi = document.getElementById('file-import');
  document.getElementById('btn-import').onclick = () => fi.click();
  fi.onchange = e => {
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = async ev => {
      try {
        const d = JSON.parse(ev.target.result);
        if(d.receitas) for(const rec of d.receitas) await addData('receitas', rec);
        if(d.agenda) for(const ag of d.agenda) await addData('agenda', ag);
        alert('✅ Backup restaurado!');
      } catch { alert('❌ Erro no ficheiro'); }
    };
    r.readAsText(f);
  };
};
