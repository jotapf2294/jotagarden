// js/modules/receitas/logic.js

/**
 * Calcula o Fator de Correção (FC = Peso Bruto / Peso Líquido)
 */
export const calcularFC = (bruto, liquido) => {
    if (!liquido || liquido === 0) return 1;
    return bruto / liquido;
};

/**
 * Calcula o custo de um ingrediente considerando o Fator de Correção
 * Custo = (Preço Insumo / Qtd Insumo) * Peso Bruto
 */
export const calcularCustoIngrediente = (insumoInfo, pesoBruto) => {
    if (!insumoInfo || !pesoBruto) return 0;
    const precoBase = parseFloat(insumoInfo.preco);
    const qtdBase = parseFloat(insumoInfo.qtd);
    return (precoBase / qtdBase) * parseFloat(pesoBruto);
};

/**
 * Calcula o total geral da ficha técnica
 */
export const calcularTotalGeral = (ingredientes, listaInsumos) => {
    return ingredientes.reduce((total, ing) => {
        const info = listaInsumos.find(i => i.id === ing.idInsumo);
        return total + calcularCustoIngrediente(info, ing.pesoBruto);
    }, 0);
};
