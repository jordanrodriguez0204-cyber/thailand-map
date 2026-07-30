// Arrondi suisse : toujours au 5 centimes supérieur (1234.51 → 1234.55)
export function ceil5cts(v) {
  // toFixed(6) neutralise les imprécisions flottantes avant le ceil
  return Math.ceil(Number((v * 20).toFixed(6))) / 20
}

export function fmtCHF(v) {
  if (!(v > 0)) return '—'
  const r = ceil5cts(v)
  const opts = Number.isInteger(r) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  return `${r.toLocaleString('fr-FR', opts)} CHF`
}
