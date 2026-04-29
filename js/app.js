// js/app.js
import { initDB } from './db.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderGestao } from './modules/gestao.js';
import { renderReceitas } from './modules/receitas/index.js';

/**
 * Renderiza um aviso para abas ainda não construídas
 */
const renderPlaceholder = (targetId) => {
    const container = document.getElementById(`tab-${targetId}`);
    if (container) {
        container.innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">
            <h3>📅 Próximo passo: Agenda</h3>
            <p>Este módulo será integrado em breve.</p>
        </div>`;
    }
};

/**
 * Maestro de Navegação (Router)
 */
const router = async (targetId) => {
    console.log(`🧭 A navegar para: ${targetId}`);

    // 1. Atualizar UI: Esconder todas as abas e desativar botões
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    // 2. Ativar a aba e os botões corretos (Sincroniza Sidebar e Bottom Nav)
    const targetTab = document.getElementById(`tab-${targetId}`);
    if (targetTab) targetTab.classList.add('active');
    
    document.querySelectorAll(`[data-target="${targetId}"]`).forEach(btn => {
        btn.classList.add('active');
    });

    // 3. Renderizar o conteúdo dinâmico
    try {
        if (targetId === 'dashboard') {
            await renderDashboard();
        } else if (targetId === 'gestao') {
            await renderGestao();
        } else if (targetId === 'receitas') {
            await renderReceitas();
        } else {
            renderPlaceholder(targetId);
        }
    } catch (err) {
        console.error(`💥 Erro ao carregar aba ${targetId}:`, err);
        if (targetTab) {
            targetTab.innerHTML = `<div style="color:red; padding:20px;">Erro: ${err.message}</div>`;
        }
    }
};

/**
 * Inicialização do Sistema (DOMContentLoaded)
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('⚡ Iniciando Doce Gestão...');

    try {
        // Inicializa a BD antes de tudo
        await initDB();
        console.log('✅ Base de Dados Operacional');

        // Configura os cliques em TODOS os botões de navegação
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget.getAttribute('data-target');
                router(target);
            });
        });

        // Carrega o dashboard inicial
        await router('dashboard');

    } catch (error) {
        console.error('🚨 Erro fatal no arranque:', error);
        document.body.innerHTML = `
            <div style="padding:40px; color:red; font-family:sans-serif;">
                <h2>🚨 Erro Crítico de Sistema</h2>
                <p>${error}</p>
                <button onclick="location.reload()" style="padding:10px; cursor:pointer;">Tentar Novamente</button>
            </div>`;
    }
});