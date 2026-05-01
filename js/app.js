// js/app.js
import { initDB } from './db.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderGestao } from './modules/gestao/index.js'; // Ajustado o caminho para a pasta
import { renderReceitas } from './modules/receitas/index.js';

const renderPlaceholder = (targetId) => {
    const container = document.getElementById(`tab-${targetId}`);
    if (container) {
        container.innerHTML = `<div style="padding: 40px; text-align: center; color: #64748b;">
            <div style="font-size: 3rem; margin-bottom: 15px;">📅</div>
            <h3 style="color: var(--primary);">Próximo passo: Agenda</h3>
            <p>Este módulo será integrado na próxima fase do projeto.</p>
        </div>`;
    }
};

const router = async (targetId) => {
    // 1. Reset visual (remove ativos de Sidebar e Bottom Nav)
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item, .nav-btn').forEach(b => b.classList.remove('active'));

    // 2. Ativar conteúdo e botões
    const targetTab = document.getElementById(`tab-${targetId}`);
    if (targetTab) targetTab.classList.add('active');
    
    // Seleciona todos os botões que apontam para este alvo (independente de ser desktop ou mobile)
    document.querySelectorAll(`[data-target="${targetId}"]`).forEach(btn => {
        btn.classList.add('active');
    });

    // 3. Renderização Dinâmica
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
        // Scroll para o topo ao trocar de aba (útil no iPad)
        window.scrollTo(0, 0);
    } catch (err) {
        console.error(`💥 Erro ao carregar aba ${targetId}:`, err);
        if (targetTab) {
            targetTab.innerHTML = `<div style="color:red; padding:20px;">Erro técnico: ${err.message}</div>`;
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        
        // Listener universal para qualquer elemento com data-target
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-target]');
            if (btn) {
                const target = btn.getAttribute('data-target');
                router(target);
            }
        });

        // Início padrão
        await router('dashboard');

    } catch (error) {
        console.error('🚨 Erro no arranque:', error);
    }
});
