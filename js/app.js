import { renderDashboard } from './modules/dashboard.js';
import { renderReceitas } from './modules/receitas.js';
import { renderAgenda } from './modules/agenda.js';
import { renderGestao } from './modules/gestao.js';

// Registo do Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('✅ Service Worker registado', reg.scope))
            .catch(err => console.error('❌ Erro no SW', err));
    });
}

// Lógica de Navegação das Abas
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.nav-btn');
    const tabs = document.querySelectorAll('.tab-content');

    const switchTab = (targetId) => {
        // Esconder tudo
        tabs.forEach(tab => tab.classList.remove('active'));
        buttons.forEach(btn => btn.classList.remove('active'));

        // Mostrar atual
        document.getElementById(`tab-${targetId}`).classList.add('active');
        document.querySelector(`[data-target="${targetId}"]`).classList.add('active');

        // Carregar conteúdo dinamicamente
        if(targetId === 'dashboard') renderDashboard();
        if(targetId === 'receitas') renderReceitas();
        if(targetId === 'agenda') renderAgenda();
        if(targetId === 'gestao') renderGestao();
    };

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.currentTarget.dataset.target);
        });
    });

    // Iniciar na primeira aba
    renderDashboard();
});
