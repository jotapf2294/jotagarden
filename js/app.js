import { initDB } from './db.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderGestao } from './modules/gestao/index.js';
import { renderReceitas } from './modules/receitas/index.js';
import { renderAgenda } from './modules/agenda/index.js'; // Importação da Agenda

const router = async (targetId) => {
    // 1. Limpeza de UI: Fechar visualizações de impressão/fichas ao navegar
    const printArea = document.getElementById('print-area');
    if (printArea) printArea.innerHTML = '';

    // 2. Reset visual (remove ativos de Sidebar e Bottom Nav)
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item, .nav-btn').forEach(b => b.classList.remove('active'));

    // 3. Ativar conteúdo e botões correspondentes
    const targetTab = document.getElementById(`tab-${targetId}`);
    if (targetTab) targetTab.classList.add('active');

    document.querySelectorAll(`[data-target="${targetId}"]`).forEach(btn => {
        btn.classList.add('active');
    });

    // 4. Renderização Dinâmica dos Módulos
    try {
        switch (targetId) {
            case 'dashboard':
                await renderDashboard();
                break;
            case 'gestao':
                await renderGestao();
                break;
            case 'receitas':
                await renderReceitas();
                break;
            case 'agenda':
                await renderAgenda(); // Agora chama a função real
                break;
            default:
                console.warn(`Aba ${targetId} não reconhecida.`);
        }
        
        // Scroll para o topo (essencial para a experiência no iPad)
        window.scrollTo(0, 0);
        
    } catch (err) {
        console.error(`💥 Erro ao carregar aba ${targetId}:`, err);
        if (targetTab) {
            targetTab.innerHTML = `
                <div style="color:var(--danger); padding:20px; text-align:center;">
                    <h3>Lamento, ocorreu um erro técnico</h3>
                    <p>${err.message}</p>
                    <button onclick="location.reload()" class="btn" style="margin-top:10px;">Recarregar App</button>
                </div>`;
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Inicializa a Base de Dados antes de qualquer renderização
        await initDB();

        // Listener universal para navegação (Desktop e Mobile)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-target]');
            if (btn) {
                const target = btn.getAttribute('data-target');
                router(target);
            }
        });

        // Carrega o Dashboard por defeito no arranque
        await router('dashboard');

    } catch (error) {
        console.error('🚨 Erro crítico no arranque:', error);
        document.body.innerHTML = `
            <div style="padding:50px; text-align:center; font-family:sans-serif;">
                <h2 style="color:#e91e63;">Falha ao iniciar Doce Gestão</h2>
                <p>O navegador não conseguiu abrir a base de dados local.</p>
                <small>${error}</small>
            </div>`;
    }
});
