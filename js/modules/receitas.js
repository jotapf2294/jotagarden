import { addData, getAllData } from '../db.js';

export const renderReceitas = async () => {
    const container = document.getElementById('tab-receitas');
    
    // UI da Aba Receitas
    container.innerHTML = `
        <h2>📖 Fichas Técnicas</h2>
        <button id="btn-nova-receita" class="btn-action">+ Nova Receita</button>
        <div id="lista-receitas" style="margin-top: 15px;"></div>
    `;

    // Carregar do IndexedDB
    const receitas = await getAllData('receitas');
    const lista = document.getElementById('lista-receitas');
    
    if (receitas.length === 0) {
        lista.innerHTML = '<p>Nenhuma receita cadastrada. Cria a primeira! 🍰</p>';
    } else {
        receitas.forEach(rec => {
            lista.innerHTML += `
                <div class="card">
                    <h3>${rec.nome} ${rec.emoji}</h3>
                    <p>Custo Produção: <strong>${rec.custo}€</strong></p>
                    <p>Preço Venda: <strong>${rec.venda}€</strong></p>
                </div>
            `;
        });
    }

    // Lógica para nova receita (Exemplo simplificado)
    document.getElementById('btn-nova-receita').addEventListener('click', async () => {
        const nome = prompt("Nome da receita (ex: Bolo de Cenoura):");
        if (!nome) return;
        
        // Numa app real, isto seria um formulário Modal avançado com cálculo de ingredientes
        const novaReceita = {
            id: Date.now().toString(),
            nome: nome,
            emoji: '🎂',
            ingredientes: [], // Array de {nome, qt, unidade, precoUnitario}
            custo: 2.50, // Calculado via array acima
            venda: 15.00
        };

        await addData('receitas', novaReceita);
        renderReceitas(); // Recarregar a lista
    });
};
