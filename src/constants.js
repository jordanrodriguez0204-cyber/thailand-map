// Catégories d'étapes — DA Coastal Indigo.
// `emoji` conservé en fallback texte (exports, tooltips simples) ; l'UI utilise <CategoryIcon>.
export const CATEGORIES = {
  ville:           { label: 'Ville',          color: '#38bdf8', emoji: '🏙️' },
  île:             { label: 'Île',             color: '#4ade80', emoji: '🏝️' },
  'parc national': { label: 'Parc national',   color: '#86efac', emoji: '🌿' },
  excursion:       { label: 'Excursion',        color: '#fbbf24', emoji: '⛵' },
  transit:         { label: 'Transit',          color: '#a78bfa', emoji: '✈️' },
}

export const ALL_FILTER = 'tous'

export const USERS = ['Jordan', 'Abbey']

export const STORAGE_KEYS = {
  auth:    'th_auth',
  user:    'th_user',
  history: 'th_history',
}
