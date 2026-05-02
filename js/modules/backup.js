// js/modules/backup.js
import { initDB, save, getAll } from '../db.js';

export const exportarBackup = async () => {
    const tabelas = ['receitas', 'agenda', 'insumos'];
    const backup = {};

    for (const tabela of tabelas) {
        backup[tabela] = await getAll(tabela);
    }

    const data = JSON.stringify(backup, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_doce_gestao_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

export const importarBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const backup = JSON.parse(e.target.result);
            const tabelas = Object.keys(backup);

            for (const tabela of tabelas) {
                for (const item of backup[tabela]) {
                    await save(tabela, item);
                }
            }
            alert("✅ Backup restaurado com sucesso! A aplicação vai recarregar.");
            window.location.reload();
        } catch (err) {
            alert("❌ Erro ao ler o ficheiro de backup.");
            console.error(err);
        }
    };
    reader.readAsText(file);
};
