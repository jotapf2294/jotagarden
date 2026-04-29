// js/modules/receitas/logic.js

/**
 * Calcula o custo de um único ingrediente baseado no preço do insumo e quantidade usada
 */
export const calcularCustoIngrediente = (insumoInfo, qtdUsada) => {
    if (!insumoInfo) return 0;
    const precoOriginal = parseFloat(insumoInfo.preco);
    const qtdOriginal = parseFloat(insumoInfo.qtd);
    
    if (qtdOriginal === 0) return 0;
    return (precoOriginal / qtdOriginal) * parseFloat(qtdUsada);
};

/**
 * Calcula o custo total de uma receita percorrendo todos os seus ingredientes
 */
export const calcularCustoTotalReceita = (ingredientesReceita, listaInsumos) => {
    if (!ingredientesReceita || !listaInsumos) return 0;
    return ingredientesReceita.reduce((total, ing) => {
        const info = listaInsumos.find(i => i.id === ing.idInsumo);
        return total + calcularCustoIngrediente(info, ing.qtd);
    }, 0);
};
