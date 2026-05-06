// Obtiene el precio vigente para un combustible en una fecha
export function obtenerPrecioVigente(precios, combustibleId, fecha) {
  const preciosComb = precios
    .filter(p => p.combustible_id === combustibleId && p.fecha_desde <= fecha)
    .sort((a, b) => b.fecha_desde.localeCompare(a.fecha_desde));
  return preciosComb.length > 0 ? preciosComb[0].precio_por_litro : null;
}

// Formatea número como moneda con símbolo
export function formatMonto(amount, moneda = 'USD') {
  if (amount == null) return '—';
  const formatted = new Intl.NumberFormat('es-CU', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(amount);
  const symbolMap = { USD: '$', EUR: '€', CUP: '$', MLC: '$' };
  const symbol = symbolMap[moneda] || '$';
  return `${symbol} ${formatted}`;
}
