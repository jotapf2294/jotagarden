import { addData, getAllData } from '../db.js';

export const renderAgenda = async () => {
    const container = document.getElementById('tab-agenda');
    
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2>📅 Agenda de Encomendas</h2>
            <button id="btn-nova-encomenda" class="btn-action" style="width: auto;">+ Novo</button>
        </div>

        <div id="calendar-view" class="card" style="text-align: center; background: var(--secondary);">
            <p>🗓️ <strong>Visualização de Lista Próxima</strong></p>
        </div>

        <div id="lista-agenda"></div>
    `;

    const carregarEncomendas = async () => {
        const lista = document.getElementById('lista-agenda');
        const dados = await getAllData('agenda');
        
        // Ordenar por data mais próxima
        dados.sort((a, b) => new Date(a.data) - new Date(b.data));

        lista.innerHTML = dados.length === 0 ? 
            '<p style="text-align:center; margin-top:20px;">Sem encomendas agendadas.</p>' :
            dados.map(e => `
                <div class="card" style="border-left-color: ${new Date(e.data) < new Date() ? '#ccc' : 'var(--primary)'}">
                    <div style="display:flex; justify-content:space-between;">
                        <strong>${e.data.split('-').reverse().join('/')} às ${e.hora}</strong>
                        <span style="background: var(--secondary); padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">${e.pago ? '✅ Pago' : '⏳ Pendente'}</span>
                    </div>
                    <p style="margin-top:8px;">👤 ${e.cliente}</p>
                    <p style="font-size: 0.9rem; color: #666;">📝 ${e.pedido}</p>
                </div>
            `).join('');
    };

    document.getElementById('btn-nova-encomenda').addEventListener('click', async () => {
        const cliente = prompt("Nome do Cliente:");
        const pedido = prompt("Descrição do Pedido (ex: 1kg Bolo Brigadeiro):");
        const data = prompt("Data (AAAA-MM-DD):", new Date().toISOString().split('T')[0]);
        const hora = prompt("Hora de entrega (HH:MM):", "10:00");

        if (cliente && pedido) {
            const novaEncomenda = {
                id: Date.now().toString(),
                cliente,
                pedido,
                data,
                hora,
                pago: false
            };
            await addData('agenda', novaEncomenda);
            carregarEncomendas();
        }
    });

    carregarEncomenda
s();
};
