// js/app.js
import { initDB } from './db.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderAgenda } from './modules/agenda.js';
import { renderGestao } from './modules/gestao.js';
import { renderReceitas } from './modules/receitas.js';

console.log('🚀 Iniciando Doce Gestão...');

// Função para forçar a renderização mesmo com erro
async function forceRender(targetId) {
    const container = document.getElementById(`tab-${targetId}`);
    if (!container) return;

    try {
        if (targetId === 'dashboard') await renderDashboard();
        if (targetId === 'receitas') await renderReceitas();
        if (targetId === 'agenda') await renderAgenda();
        if (targetId === 'gestao') await renderGestao();
        console.log(`✅ ${targetId} carregado`);
    } catch (err) {
        console.error("Erro ao renderizar:", err);
        container.innerHTML = `<div style="padding:20px; color:red;">
            <h3>⚠️ Erro no Módulo ${targetId}</h3>
            <p>${err.message}</p>
        </div>`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Tenta abrir a DB primeiro
    try {
        await initDB();
        console.log('✅ Base de Dados aberta');
    } catch (e) {
        console.error('❌ Falha na DB:', e);
    }

    // 2. Configura os botões de navegação
    const buttons = document.querySelectorAll('[data-target]');
    buttons.forEach(btn => {
        btn.onclick = async () => {
            const target = btn.dataset.target;
            
            // UI: Troca as abas
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.nav-btn, .nav-item').forEach(b => b.classList.remove('active'));
            
            document.getElementById(`tab-${target}`).classList.add('active');
            btn.classList.add('active');
            
            await forceRender(target);
        };
    });

    // 3. AUTO-START: Força o Dashboard a abrir
    console.log('🎯 Chamando dashboard inicial...');
    await forceRender('dashboard');
});
