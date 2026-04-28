// receitas/utils.js

// FIX: toNumber aceita vírgula PT e evita NaN
export function toNumber(val) {
  if (typeof val === 'number') return val;
  if (!val && val !== 0) return 0;
  // Remove espaços, troca vírgula por ponto
  const cleaned = String(val).trim().replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// FIX: sanitizeHTML não basta pra window.open. Escapa tudo que pode quebrar HTML/JS
export function sanitizeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;'); // FIX: barra fecha tag
}

// FIX: formatCurrency arredonda antes pra evitar 1.999€ 
export function formatCurrency(val) {
  const num = Math.round(toNumber(val) * 100) / 100;
  return new Intl.NumberFormat('pt-PT', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

// FIX: formatDate força timezone PT pra não virar dia anterior
export function formatDate(date) {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-PT', {
      timeZone: 'Europe/Lisbon',
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}

// FIX: formatDateTime pra usar nas FT
export function formatDateTime(date) {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('pt-PT', {
      timeZone: 'Europe/Lisbon',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

// FIX: debounce com .cancel() pra limpar se modal fechar
export function debounce(fn, delay = 300) {
  let timeout;
  function debounced(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  }
  debounced.cancel = () => clearTimeout(timeout);
  return debounced;
}

export function calcPercent(part, total) {
  const p = toNumber(part);
  const t = toNumber(total);
  return t > 0 ? ((p / t) * 100).toFixed(1) : '0.0';
}

// NOVO: helper pra gerar lote ASAE LAAAAMMDD
export function gerarLote(date = new Date()) {
  const d = new Date(date);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `L${ano}${mes}${dia}`;
}

// NOVO: valida se string tem HTML/JS malicioso antes de injetar no PDF
export function isSafeString(str) {
  if (!str) return true;
  const dangerous = /<script|<\/script|javascript:|onerror=|onload=/i;
  return !dangerous.test(str);
}