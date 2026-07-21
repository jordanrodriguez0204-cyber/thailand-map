// Échelle visuelle unique de l'app — à utiliser pour tout NOUVEAU style inline.
// Objectif : 4 tailles de texte, 3 rayons, 3 gris — pas de valeurs arbitraires.

export const FONT = {
  xs: 11,    // badges, légendes (minimum lisible mobile)
  sm: 12,    // texte secondaire
  md: 13.5,  // texte courant
  lg: 17,    // titres de panneaux
}

export const RADIUS = {
  sm: 8,     // boutons, badges
  md: 12,    // cards
  lg: 20,    // panneaux, modals
}

export const GRAY = {
  soft: '#9ca3af',   // décoratif uniquement (jamais pour de l'info utile)
  text: '#6b7280',   // texte secondaire
  dark: '#374151',   // texte principal atténué
}

export const ACCENT = {
  violet: '#6366f1', // sélection / action principale
  green:  '#16a34a', // validé / positif
  amber:  '#f59e0b', // attention
  red:    '#dc2626', // destructif
}
