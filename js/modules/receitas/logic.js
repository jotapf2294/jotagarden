// js/modules/receitas/logic.js

export const calcularFC = (bruto, liquido) => {
    const b = parseFloat(bruto) || 0;
    const l = parseFloat(liquido) || 0;
    return l > 0 ? b / l : 1;
};

export const calcularCustoIngrediente = (insumoInfo, pesoBruto) => {
    if (!insumoInfo) return 0;
    const precoBase = parseFloat(insumoInfo.preco) || 0;
    const qtdBase = parseFloat(insumoInfo.qtd) || 1;
    return (precoBase / qtdBase) * (parseFloat(pesoBruto) || 0);
};

export const calcularTotalGeral = (ingredientes, listaInsumos) => {
    return ingredientes.reduce((total, ing) => {
        const info = listaInsumos.find(i => i.id === ing.idInsumo);
        return total + calcularCustoIngrediente(info, ing.pesoBruto);
    }, 0);
};
