import { getAll } from '../db.js';

export const renderDashboard = async () => {
    const container = document.getElementById('tab-dashboard');
    if (!container) return;

    // 1. Recolha de Dados (Engenharia de Performance: Carregamento em Paralelo)
    const [encomendas, insumos, receitas] = await Promise.all([
        getAll('agenda'),
        getAll('insumos'),
        getAll('receitas')
    ]);

    // 2. Cálculos de Negócio
    const totalVendas = encomendas
        .filter(e => e.status !== 'Cancelado')
        .reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);
    
    const pendentes = encomendas.filter(e => e.status === 'Pendente').length;
    
    // Alerta de stock: itens com menos de 500g/ml ou 10 unidades
    const stockCritico = insumos.filter(i => {
        const qtd = parseFloat(i.qtd);
        return (i.un === 'un' && qtd < 10) || (i.un !== 'un' && qtd < 500);
    });

    container.innerHTML = `
        <div style="max-width: 1100px; margin: 0 auto; padding: 15px;">
            <header style="margin-bottom: 30px;">
                <h2 style="color: var(--primary); margin: 0; font-size: 1.8rem;">Painel de Controlo 🧁</h2>
                <p style="color: var(--text-secondary); margin: 5px 0 0 0;">Resumo da tua produção e ferramentas rápidas</p>
            </header>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div class="card" style="border-top: 5px solid var(--primary); display: flex; flex-direction: column; align-items: center; padding: 20px;">
                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Volume de Vendas</span>
                    <div style="font-size: 2rem; font-weight: 800; margin: 10px 0;">${totalVendas.toFixed(2)}€</div>
                    <small style="color: #059669;">Bruto em Agenda</small>
                </div>
                <div class="card" style="border-top: 5px solid var(--warning); display: flex; flex-direction: column; align-items: center; padding: 20px;">
                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Pedidos Pendentes</span>
                    <div style="font-size: 2rem; font-weight: 800; margin: 10px 0;">${pendentes}</div>
                    <small style="color: var(--text-secondary);">Aguardando entrega</small>
                </div>
                <div class="card" style="border-top: 5px solid ${stockCritico.length > 0 ? 'var(--danger)' : 'var(--success)'}; display: flex; flex-direction: column; align-items: center; padding: 20px;">
                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Alertas de Stock</span>
                    <div style="font-size: 2rem; font-weight: 800; margin: 10px 0;">${stockCritico.length}</div>
                    <small style="color: ${stockCritico.length > 0 ? 'var(--danger)' : 'var(--success)'}; font-weight: 600;">
                        ${stockCritico.length > 0 ? 'Necessita reposição!' : 'Stock em dia'}
                    </small>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 25px;">
                
                <div class="card" style="background: #f8fafc; border: 1px solid #e2e8f0;">
                    <h3 style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px; font-size: 1.1rem;">
                        <span>🧮</span> Conversor de Medidas
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div>
                            <label style="font-size: 0.8rem; font-weight: bold; display: block; margin-bottom: 5px;">De:</label>
                            <div style="display: flex; gap: 5px;">
                                <input type="number" id="calc-valor" placeholder="Qtd" style="flex: 1; padding: 10px;">
                                <select id="calc-de" style="flex: 1; padding: 10px; background: white;">
                                    <option value="cup">Cup (Chávena)</option>
                                    <option value="tbsp">Colher Sopa</option>
                                    <option value="tsp">Colher Chá</option>
                                    <option value="g">Gramas (Farinha)</option>
                                </select>
                            </div>
                        </div>
                        <div style="text-align: center; font-size: 1.2rem;">⬇️</div>
                        <div>
                            <label style="font-size: 0.8rem; font-weight: bold; display: block; margin-bottom: 5px;">Para:</label>
                            <select id="calc-para" style="width: 100%; padding: 10px; background: white; margin-bottom: 15px;">
                                <option value="g">Gramas (g)</option>
                                <option value="ml">Mililitros (ml)</option>
                                <option value="cup">Cup (Chávena)</option>
                            </select>
                            <div id="calc-resultado" style="background: white; padding: 15px; border-radius: 8px; text-align: center; font-weight: 800; font-size: 1.3rem; border: 2px dashed var(--primary); color: var(--primary);">
                                0
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="card">
                        <h3 style="font-size: 1rem; margin-bottom: 15px;">🗓️ Próximas 3 Entregas</h3>
                        <div style="display: grid; gap: 10px;">
                            ${encomendas.filter(e => e.status !== 'Entregue').slice(0, 3).map(e => `
                                <div style="padding: 10px; background: #fff5f8; border-radius: 8px; border-left: 4px solid var(--primary);">
                                    <div style="display: flex; justify-content: space-between;">
                                        <strong>${e.cliente}</strong>
                                        <small>${new Date(e.data).toLocaleDateString('pt-PT')}</small>
                                    </div>
                                    <div style="font-size: 0.85rem; color: #666; margin-top: 4px;">${e.pedido}</div>
                                </div>
                            `).join('') || '<p style="color: #94a3b8; font-size: 0.85rem;">Nenhuma entrega agendada.</p>'}
                        </div>
                    </div>

                    <div class="card" style="background: #fff; border: 1px solid var(--border);">
                        <h3 style="font-size: 1rem; margin-bottom: 10px; color: var(--danger);">⚠️ Stock em Baixa</h3>
                        <div style="font-size: 0.9rem;">
                            ${stockCritico.length > 0 ? 
                                stockCritico.map(i => `• ${i.nome} (${i.qtd}${i.un})`).join('<br>') : 
                                '✅ Todos os ingredientes com stock saudável.'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    setupDashboardEvents();
};

const setupDashboardEvents = () => {
    const valor = document.getElementById('calc-valor');
    const de = document.getElementById('calc-de');
    const para = document.getElementById('calc-para');
    const res = document.getElementById('calc-resultado');

    if (!valor) return;

    const calcular = () => {
        const v = parseFloat(valor.value) || 0;
        const from = de.value;
        const to = para.value;
        let resultado = 0;

        // Base de Conversão (Médias de Pastelaria Profissional)
        // 1 cup = 125g (farinha) | 1 cup = 240ml
        // 1 tbsp = 15g | 1 tsp = 5g
        
        let emGramas = 0;
        if (from === 'cup') emGramas = v * 125;
        else if (from === 'tbsp') emGramas = v * 15;
        else if (from === 'tsp') emGramas = v * 5;
        else emGramas = v;

        if (to === 'g' || to === 'ml') resultado = emGramas; // Simplificado para água/leite/farinha base
        else if (to === 'cup') resultado = emGramas / 125;

        res.innerText = resultado > 0 ? `${resultado.toFixed(1)} ${to}` : '0';
    };

    valor.oninput = calcular;
    de.onchange = calcular;
    para.onchange = calcular;
};
                                           
