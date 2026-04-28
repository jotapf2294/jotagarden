import { addData, getAllData } from '../db.js';

export const renderAgenda = async () => {
  const container = document.getElementById('tab-agenda');
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h2>📅 Agenda</h2>
      <button id="btn-nova-encomenda" class="btn-action" style="width:auto;padding:8px 14px">+ Novo</button>
    </div>
    <div id="lista-agenda" style="margin-top:12px"></div>
  `;

  const carregar = async () => {
    const lista = document.getElementById('lista-agenda');
    const dados = await getAllData('agenda');
    dados.sort((a,b)=> new Date(a.data+'T'+a.hora) - new Date(b.data+'T'+b.hora));
    lista.innerHTML = dados.length ? dados.map(e=>`
      <div class="card" style="border-left-color:${new Date(e.data)<new Date().setHours(0,0,0,0)?'#ccc':'var(--primary)'}">
        <div style="display:flex;justify-content:space-between"><strong>${e.data.split('-').reverse().join('/')} às ${e.hora}</strong><span style="background:var(--secondary);padding:2px 8px;border-radius:10px;font-size:.7rem">${e.pago?'✅ Pago':'⏳ Pendente'}</span></div>
        <p style="margin-top:6px">👤 ${e.cliente}</p>
        <p style="color:#666;font-size:.9rem">📝 ${e.pedido}</p>
      </div>`).join('') : '<p class="card" style="text-align:center">Sem encomendas</p>';
  };

  document.getElementById('btn-nova-encomenda').onclick = async () => {
    const cliente = prompt('Cliente:'); if(!cliente) return;
    const pedido = prompt('Pedido:'); if(!pedido) return;
    const data = prompt('Data (AAAA-MM-DD):', new Date().toISOString().split('T')[0]);
    const hora = prompt('Hora:', '10:00');
    await addData('agenda', { id:Date.now().toString(), cliente, pedido, data, hora, pago:false });
    carregar();
  };

  carregar();
};
