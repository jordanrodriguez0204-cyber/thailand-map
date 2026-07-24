// Parsing des dates d'étapes ("9-13 août", "15 août", "31 juil - 2 sept")
// → plages de dates réelles pour la vue « Aujourd'hui ».

export const TRIP_YEAR = 2026

const MONTHS = {
  'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
  'juillet': 6, 'juil': 6, 'août': 7, 'aout': 7, 'septembre': 8, 'sept': 8,
  'octobre': 9, 'oct': 9, 'novembre': 10, 'nov': 10, 'décembre': 11, 'déc': 11,
}

function monthIndex(word) {
  const w = (word || '').toLowerCase().replace(/\./g, '')
  return MONTHS[w] ?? null
}

// "9-13 août" → {start, end} ; "15 août" → {start, end: même jour} ; null si non reconnu
export function parseStepDates(dates, year = TRIP_YEAR) {
  if (!dates) return null
  const s = dates.trim().toLowerCase()

  // "9-13 août" / "9–13 août"
  let m = s.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([a-zéûî.]+)$/)
  if (m) {
    const mo = monthIndex(m[3])
    if (mo == null) return null
    return { start: new Date(year, mo, +m[1]), end: new Date(year, mo, +m[2]) }
  }

  // "31 juil - 2 août"
  m = s.match(/^(\d{1,2})\s+([a-zéûî.]+)\s*[-–]\s*(\d{1,2})\s+([a-zéûî.]+)$/)
  if (m) {
    const mo1 = monthIndex(m[2]), mo2 = monthIndex(m[4])
    if (mo1 == null || mo2 == null) return null
    return { start: new Date(year, mo1, +m[1]), end: new Date(year, mo2, +m[3]) }
  }

  // "15 août"
  m = s.match(/^(\d{1,2})\s+([a-zéûî.]+)$/)
  if (m) {
    const mo = monthIndex(m[2])
    if (mo == null) return null
    const d = new Date(year, mo, +m[1])
    return { start: d, end: d }
  }

  return null
}

function atMidnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }

// Fenêtre du voyage = du premier start au dernier end parmi les étapes parsables
export function tripWindow(steps) {
  let start = null, end = null
  for (const s of steps) {
    const r = parseStepDates(s.dates)
    if (!r) continue
    if (!start || r.start < start) start = r.start
    if (!end || r.end > end) end = r.end
  }
  return start && end ? { start, end } : null
}

// Étape "du jour" : celle dont la plage contient la date (la dernière qui matche,
// pour les jours de transition où deux étapes se chevauchent)
export function stepForDate(steps, date) {
  const day = atMidnight(date)
  let found = null
  for (const s of steps) {
    const r = parseStepDates(s.dates)
    if (r && day >= atMidnight(r.start) && day <= atMidnight(r.end)) found = s
  }
  return found
}

// Prochaine étape qui commence strictement après la date
export function nextStepAfter(steps, date) {
  const day = atMidnight(date)
  let best = null, bestStart = null
  for (const s of steps) {
    const r = parseStepDates(s.dates)
    if (!r) continue
    const start = atMidnight(r.start)
    if (start > day && (!bestStart || start < bestStart)) { best = s; bestStart = start }
  }
  return best
}

export function isDuringTrip(steps, date = new Date()) {
  const w = tripWindow(steps)
  if (!w) return false
  const day = atMidnight(date)
  return day >= atMidnight(w.start) && day <= atMidnight(w.end)
}
