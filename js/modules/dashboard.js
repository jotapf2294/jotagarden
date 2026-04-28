import { getAllData } from '../db.js';

export const renderDashboard = async () => {
    const container = document.getElementById('tab-dashboard');
    const hoje = new Date().toISOString().split('T')[0];
    
    // Buscar encomendas de hoje
    const encomendas = await getAllData('agenda');
    const encomendasHoje = encomendas.filter(e => e.data === hoje);

    container.innerHTML = `
        <div class="welcome-section">
            <h2>Bom dia, Chef! 👩‍🍳</h2>
            <p>Hoje é dia ${new Date().toLocaleDateString('pt-PT')}</p>
        </div>

        <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0;">
            <div class="card" style="border-left-color: #ffb6c1; margin-bottom:0;">
                <small>Entregas Hoje</small>
                <h3>${encomendasHoje.length}</h3>
            </div>
            <div class="card" style="border-left-color: #4caf50; margin-bottom:0;">
                <small>Alertas</small>
                <h3>${encomendasHoje.length > 0 ? '🔔' : '✅'}</h3>
            </div>
        </div>

        <section id="timers-section" class="card">
            <h3>⏱️ Timers de Produção</h3>
            <div id="timer-list">
                <p style="font-size: 0.8rem; color: #888;">Nenhum timer ativo.</p>
            </div>
            <button id="add-timer" class="btn-action" style="margin-top:10px; padding: 0.5rem; font-size: 0.8rem;">+ Iniciar Temporizador</button>
        </section>

        <section id="entregas-hoje">
            <h3>🚚 Entregas para Hoje</h3>
            ${encomendasHoje.length > 0 ? 
                encomendasHoje.map(e => `
                    <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${e.cliente}</strong><br>
                            <small>📦 ${e.pedido}</small>
                        </div>
                        <span style="color: var(--primary); font-weight: bold;">${e.hora}</span>
                    </div>
                `).join('') 
                : `<p class="card">Não há encomendas marcadas para hoje. Aproveite para criar novas receitas! ✨</p>`
            }
        </section>
    `;

    // Lógica simples de Timer
    document.getElementById('add-timer').addEventListener('click', () => {
        const min = prompt("Quantos minutos para o timer?", "15");
        if (!min) return;
        iniciarTimer(parseInt(min));
    });
};

function iniciarTimer(minutos) {
    const list = document.getElementById('timer-list');
    const timerId = Date.now();
    let tempo = minutos * 60;
    
    const div = document.createElement('div');
    div.className = 'timer-item';
    div.id = `timer-${timerId}`;
    div.style = "display:flex; justify-content:space-between; background:#fff5f7; padding:5px; margin:5px 0; border-radius:5px;";
    
    const updateDisplay = () => {
        const m = Math.floor(tempo / 60);
        const s = tempo % 60;
        div.innerHTML = `<span>⏳ Forno: <strong>${m}:${s < 10 ? '0'+s : s}</strong></span>`;
        if (tempo <= 0) {
            div.innerHTML = `<span>🔔 <strong>PRONTO!</strong></span>`;
            div.style.backgroundColor = "#ffb6c1";
            // Notificação simples do Browser se estiver offline mas aberta
            new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play();
            return;
        }
        tempo--;
        setTimeout(updateDisplay, 1000);
    };
    
    list.appendChild(div);
    updateDispla
y();
}
