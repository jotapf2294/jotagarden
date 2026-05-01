import { getAll, save, remove, getById } from '../../db.js';

export const renderAgenda = async () => {
    const container = document.getElementById('tab-agenda');
    if (!container) return;

    const encomendas = await getAll('agenda');
    // Ordenar por data (mais próximas primeiro)
    encomendas.sort((a, b) => new Date(a.data) - new Date(b.data));

    container.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto; padding: 10px;">
            <details id="form-agenda-details" style="background: white; padding: 15px; border-radius: 12px; box-shadow: var(--shadow); margin-bottom: 20px; border: 1px solid var(--border);">
                <summary style="cursor:pointer; font-weight:bold; color:var(--primary); padding: 5px;">📅 Agendar Nova Encomenda</summary>
                <form id="form-agenda" style="display: grid; gap: 12px; margin-top:15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="font-size: 0.8rem; font-weight: bold;">Data de Entrega:</label>
                            <input type="date" id="ag-data" required>
                        </div>
                        <div>
                            <label style="font-size: 0.8rem; font-weight: bold;">Hora:</label>
                            <input type="time" id="ag-hora">
                        </div>
                    </div>
                    <input type="text" id="ag-cliente" placeholder="Nome do Cliente" required>
                    <textarea id="ag-pedido" placeholder="Detalhes do Pedido (Ex: Bolo de Chocolate 2kg + 20 brigadeiros)" style="height: 80px;"></textarea>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <input type="number" id="ag-valor" step="0.01" placeholder="Valor Total (€)">
                        <select id="ag-status">
                            <option value="Pendente">⏳ Pendente</option>
                            <option value="Pago">✅ Pago</option>
                            <option value="Entregue">📦 Entregue</option>
                            <option value="Cancelado">❌ Cancelado</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="padding: 12px;">GRAVAR NA AGENDA</button>
                </form>
            </details>

            <div id="lista-agenda" style="display: grid; gap: 15px;">
                ${encomendas.length === 0 ? '<p style="text-align:center; color:#64748b;">Nenhuma encomenda agendada.</p>' : ''}
                ${encomendas.map(enc => {
                    const dataFormatada = new Date(enc.data).toLocaleDateString('pt-PT');
                    const statusColor = enc.status === 'Pago' ? '#059669' : enc.status === 'Entregue' ? '#1e3a8a' : '#d97706';
                    
                    return `
                        <div class="card" style="border-left: 5px solid ${statusColor};">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div>
                                    <span style="font-size: 0.8rem; font-weight: bold; color: ${statusColor}; text-transform: uppercase;">${enc.status}</span>
                                    <h3 style="margin: 5px 0;">${enc.cliente}</h3>
                                    <p style="font-size: 0.9rem; color: #475569; margin-bottom: 8px;">${enc.pedido}</p>
                                    <div style="font-size: 0.85rem; font-weight: bold;">
                                        🗓️ ${dataFormatada} ${enc.hora ? 'às ' + enc.hora : ''}
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 1.1rem; font-weight: bold; color: var(--text);">${parseFloat(enc.valor || 0).toFixed(2)}€</div>
                                    <div style="margin-top: 15px; display: flex; gap: 8px;">
                                        <button class="btn btn-sm" onclick="window.editarEncomenda('${enc.id}')">✏️</button>
                                        <button class="btn btn-sm btn-danger" onclick="window.eliminarEncomenda('${enc.id}')">🗑️</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    setupAgendaEvents();
};

const setupAgendaEvents = () => {
    const form = document.getElementById('form-agenda');
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = form.dataset.editId || Date.now().toString();
        const dados = {
            id,
            data: document.getElementById('ag-data').value,
            hora: document.getElementById('ag-hora').value,
            cliente: document.getElementById('ag-cliente').value,
            pedido: document.getElementById('ag-pedido').value,
            valor: document.getElementById('ag-valor').value,
            status: document.getElementById('ag-status').value
        };

        await save('agenda', dados);
        renderAgenda();
    };
};

window.editarEncomenda = async (id) => {
    const enc = await getById('agenda', id);
    if (!enc) return;
    
    document.getElementById('form-agenda-details').open = true;
    const form = document.getElementById('form-agenda');
    form.dataset.editId = id;
    
    document.getElementById('ag-data').value = enc.data;
    document.getElementById('ag-hora').value = enc.hora;
    document.getElementById('ag-cliente').value = enc.cliente;
    document.getElementById('ag-pedido').value = enc.pedido;
    document.getElementById('ag-valor').value = enc.valor;
    document.getElementById('ag-status').value = enc.status;
};

window.eliminarEncomenda = async (id) => {
    if (confirm("Deseja remover esta encomenda da agenda?")) {
        await remove('agenda', id);
        renderAgenda();
    }
};
