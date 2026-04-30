// js/modules/receitas/logic.js

/**
 * Calcula o Fator de Correção (FC)
 * FC = Peso Bruto / Peso Líquido
 */
export const calcularFC = (bruto, liquido) => {
    const b = parseFloat(bruto) || 0;
    const l = parseFloat(liquido) || 0;
    return l > 0 ? b / l : 1;
};

/**
 * Calcula o Peso Líquido com base no FC
 * PL = Peso Bruto / FC
 */
export const calcularPesoLiquido = (bruto, fc) => {
    const b = parseFloat(bruto) || 0;
    const f = parseFloat(fc) || 1;
    return f > 0 ? b / f : b;
};

/**
 * Calcula o custo de um ingrediente baseado no Peso Bruto
 * (Preço / Quantidade Base) * Peso Bruto
 */
export const calcularCustoIngrediente = (insumoInfo, pesoBruto) => {
    if (!insumoInfo) return 0;
    
    const precoBase = parseFloat(insumoInfo.preco) || 0;
    const qtdBase = parseFloat(insumoInfo.qtd) || 1; // Quantidade da embalagem (ex: 1kg = 1000g)
    const bruto = parseFloat(pesoBruto) || 0;

    // Cálculo: (Preço da embalagem / gramas na embalagem) * gramas usadas
    return (precoBase / qtdBase) * bruto;
};

/**
 * Calcula o custo total de todos os ingredientes da receita
 */
export const calcularTotalGeral = (ingredientes, listaInsumos) => {
    if (!ingredientes || !Array.isArray(ingredientes)) return 0;

    return ingredientes.reduce((total, ing) => {
        const info = listaInsumos.find(i => i.id === ing.idInsumo);
        return total + calcularCustoIngrediente(info, ing.pesoBruto);
    }, 0);
};
