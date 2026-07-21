// Échelle visuelle unique de l'app — DA "Coastal Indigo".
// À utiliser pour tout NOUVEAU style inline. Pas de valeurs arbitraires.

export const COLOR = {
  bg:          '#0d1f3c',  // fond principal app + sidebar
  surface:     '#0a2a52',  // cards, panels, modals
  raised:      '#0e3468',  // éléments surélevés, header sidebar
  input:       '#061528',  // fond des inputs
  border:      'rgba(56,189,248,0.15)',
  sep:         'rgba(255,255,255,0.07)',
  aqua:        '#38bdf8',  // action principale
  aquaLight:   '#7dd3fc',  // texte liens, hover
  green:       '#4ade80',  // hôtels, validé
  amber:       '#fbbf24',  // attention, rating
  red:         '#f87171',  // destructif
  violet:      '#a78bfa',  // transit, secondaire
  textPrimary: '#e8f4fd',
  textMuted:   '#8fa8c4',
  textDark:    '#0d1f3c',  // texte sombre sur bouton aqua
}

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

// Compat : anciens alias encore importés çà et là
export const GRAY = {
  soft: COLOR.textMuted,
  text: COLOR.textMuted,
  dark: COLOR.textPrimary,
}
export const ACCENT = {
  violet: COLOR.aqua,
  green:  COLOR.green,
  amber:  COLOR.amber,
  red:    COLOR.red,
}
