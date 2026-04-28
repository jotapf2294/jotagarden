import { initDB, getAllData, addData } from '../db.js';

export const renderGestao = () => {
    const container = document.getElementById('tab-gestao');
    container.innerHTML = `
        <h2>📊 Gestão & Definições</h2>
        
        <div class="card">
            <h3>💾 Sistema de Backup</h3>
            <p>Guarda os teus dados em segurança e restaura em qualquer dispositivo.</p>
            <br>
            <button id="btn-export" class="btn-action" style="background:#4caf50;">⬇️ Exportar Dados (Backup)</button>
            <br><br>
            <input type="file" id="file-import" accept=".json" style="display:none;">
            <button id="btn-import" class="btn-action" style="background:#ff9800;">⬆️ Importar Dados</button>
        </div>
    `;

    // ⬇️ Exportar Backup
    document.getElementById('btn-export').addEventListener('click', async () => {
        const receitas = await getAllData('receitas');
        const agenda = await getAllData('agenda');
        
        const backupData = {
            data: new Date().toISOString(),
            receitas,
            agenda
        };

        const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_docegestao_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // ⬆️ Importar Backup
    const fileInput = document.getElementById('file-import');
    document.getElementById('btn-import').addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                // Restaurar tabelas
                if (data.receitas) {
                    for (const rec of data.receitas) await addData('receitas', rec);
                }
                if (data.agenda) {
                    for (const ag of data.agenda) await addData('agenda', ag);
                }
                alert('✅ Backup restaurado com sucesso!');
            } catch (error) {
                alert('❌ Erro ao ler o ficheiro de backup.');
            }
        };
        reader.readAsText(file);
    }
                              );
};
