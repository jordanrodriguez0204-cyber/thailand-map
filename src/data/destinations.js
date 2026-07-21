// ── Climat moyen en août pour chaque destination ──────────────────────────
export const CLIMATE_AUGUST = {
  'Bangkok':               { max: 33, min: 26, rain: 17, humid: 86, uv: 'Très élevé', desc: 'Saison des pluies — averses courtes le soir, chaleur humide', icon: '⛈️' },
  'Koh Samui':             { max: 30, min: 25, rain: 8,  humid: 80, uv: 'Élevé',      desc: 'Côte est — moins pluvieuse qu\'en octobre, bon temps général', icon: '⛅' },
  'Ang Thong Marine Park': { max: 31, min: 25, rain: 10, humid: 82, uv: 'Élevé',      desc: 'Variable — vérifier météo la veille, mer parfois agitée',    icon: '🌤️' },
  'Koh Phangan':           { max: 30, min: 25, rain: 8,  humid: 80, uv: 'Élevé',      desc: 'Bonnes conditions côté est, quelques averses en soirée',     icon: '⛅' },
  'Koh Tao':               { max: 31, min: 26, rain: 6,  humid: 78, uv: 'Élevé',      desc: 'Idéal pour la plongée — mer calme, visibilité excellente',   icon: '🌤️' },
  'Retour Koh Samui':      { max: 30, min: 25, rain: 8,  humid: 80, uv: 'Élevé',      desc: 'Journée de transit',                                         icon: '⛅' },
  'Chiang Mai':            { max: 33, min: 24, rain: 20, humid: 85, uv: 'Très élevé', desc: 'Mousson — pluies fréquentes en soirée, verdure magnifique',  icon: '🌧️' },
  'Doi Inthanon':          { max: 26, min: 17, rain: 22, humid: 88, uv: 'Modéré',     desc: 'Altitude 2 565 m — frais, brumeux, prévoir une veste',       icon: '🌧️' },
  'Chiang Rai':            { max: 32, min: 23, rain: 19, humid: 84, uv: 'Très élevé', desc: 'Saison des pluies — paysages verts et luxuriants',           icon: '⛈️' },
  'Bangkok (retour)':      { max: 33, min: 26, rain: 17, humid: 86, uv: 'Très élevé', desc: 'Saison des pluies',                                          icon: '⛈️' },
}

// Codes météo Open-Meteo → emoji
export const WMO_ICONS = {
  0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',
  51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',
  71:'🌨️',73:'🌨️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',
  95:'⛈️',96:'⛈️',99:'⛈️',
}

// ── Tips par catégorie ────────────────────────────────────────────────────
const CATEGORY_TIPS = {
  ville: [
    '🛺 BTS/MRT bien plus rapide que les tuk-tuks dans les embouteillages',
    '🕌 Épaules et genoux couverts obligatoires dans les temples',
    '💧 Eau en bouteille uniquement — éviter la glace des marchés de rue',
    '💳 7-Eleven partout pour retrait cash et snacks',
    '🌡️ Restez hydratés — chaleur et humidité épuisent rapidement',
  ],
  île: [
    '🤿 Crème solaire biodégradable obligatoire dans les zones marines protégées',
    '🌊 Respecter les drapeaux de baignade (rouge = interdiction absolue)',
    '🛵 Scooter : casque obligatoire, routes sinueuses, conduire prudemment',
    '🔦 Coupures électriques fréquentes la nuit — prévoir une lampe',
    '⛵ Réserver les ferries à l\'avance en haute saison',
  ],
  'parc national': [
    '🐘 Sanctuaires éthiques uniquement — jamais de balade à dos d\'éléphant',
    '👟 Chaussures fermées indispensables pour les sentiers de randonnée',
    '🦟 Répulsif anti-moustiques puissant (dengue présente en août)',
    '📵 Signal mobile inexistant dans les zones reculées — télécharger les cartes hors-ligne',
  ],
  excursion: [
    '⛵ Vérifier les conditions météo avant toute sortie en bateau',
    '🌅 Partir à l\'aube pour éviter la foule et la chaleur de la journée',
    '💶 Prévoir du cash — peu de distributeurs hors des villes',
    '📷 Powerbank chargé : les journées sont longues et chargées',
  ],
  transit: [
    '⏰ Prévoir 2h de marge pour les correspondances dans les aéroports thaïs',
    '🧳 Vols intérieurs : franchises bagages souvent limitées à 15 kg',
    '🍱 Emporter snacks et eau pour les trajets bus/train',
    '📱 Télécharger les billets hors-ligne avant le départ',
  ],
}

const DESTINATION_TIPS = {
  'Bangkok': [
    '🏛️ Grand Palais : arriver à 8h30 avant les groupes de touristes',
    '🍜 Chinatown (Yaowarat Rd) : street food incontournable en soirée',
    '🛥️ Khlong (bateaux express) : plus rapides que les taxis aux heures de pointe',
    '🎭 Muay Thai au Rajadamnern Stadium : mar/jeu/dim soir',
    '🛍️ Marché Chatuchak : le samedi et dimanche uniquement',
  ],
  'Koh Samui': [
    '🌴 Chaweng (nord) = animé, Lamai (sud) = plus calme et local',
    '🎂 Pour l\'anniversaire : Dining on the Rocks ou Azure Beach Club',
    '🛥️ Ferries depuis Surat Thani — réserver plusieurs jours à l\'avance',
    '🛵 Tour complet de l\'île en scooter ≈ 2h sans arrêt',
  ],
  'Ang Thong Marine Park': [
    '⛵ Excursion en bateau uniquement — aucun hébergement sur place',
    '🏊 Lagon intérieur (émeraude) = point fort absolu de la journée',
    '🤿 Snorkeling au corail, visibilité excellente en août',
    '📦 Apporter pique-nique — les options restauration sont limitées',
  ],
  'Koh Phangan': [
    '🏖️ Bottle Beach : accès uniquement par bateau-taxi depuis Ban Chalok Lam',
    '💧 Cascade Phaeng : randonnée 30 min, eau fraîche garantie',
    '🌙 Full Moon Party en août : si ça tombe pendant ton séjour, prépare les oreilles',
    '🐠 Meilleure plongée côté nord-ouest, loin des fêtes',
  ],
  'Koh Tao': [
    '🤿 Meilleurs spots : Japanese Garden, Shark Bay, Twin Peaks',
    '🎓 Certification PADI Open Water : 3-4 jours, le moins cher d\'Asie',
    '🦈 Requins-baleines parfois visibles en août — demander aux dive shops',
    '🌅 Sunset depuis Sairee Beach avec Koh Nang Yuan en arrière-plan',
  ],
  'Chiang Mai': [
    '🏯 Vieille ville : louer un vélo, taille parfaite pour se déplacer',
    '🍛 Khao Soi = curry de nouilles local, spécialité incontournable',
    '🌸 Sunday Walking Street (Wualai Rd) : meilleur artisanat de la ville',
    '🐘 Ethical Elephant Sanctuary : réserver 2-3 semaines à l\'avance',
    '💆 Massage thaï authentique : se méfier des "touristiques" de la vieille ville',
  ],
  'Doi Inthanon': [
    '🌿 Point culminant de Thaïlande (2 565 m) — prévoir une veste légère',
    '🐦 Plus de 400 espèces d\'oiseaux recensées — paradis pour les ornithologues',
    '💐 Jardins royaux Sirithan & Napha Methanidon : à ne pas manquer',
    '⏰ Départ très tôt recommandé — brouillard dissipé avant 9h en général',
  ],
  'Chiang Rai': [
    '⛪ Wat Rong Khun (Temple Blanc) : ouvre 8h, fermé le vendredi matin',
    '💙 Wat Rong Suea Ten (Temple Bleu) : moins connu, moins de monde, tout aussi beau',
    '☕ Région productrice de café arabica de montagne — les cafés locaux valent le détour',
    '🌉 Triangle d\'or à 1h — voir la Birmanie et le Laos depuis la rive',
    '🏛️ Baan Dam (Maison Noire) : collection d\'art de Thawan Duchanee, fascinant',
  ],
}

export function getTips(step) {
  const specific = DESTINATION_TIPS[step.nom] || []
  const generic = CATEGORY_TIPS[step.categorie] || []
  return [...specific, ...generic].slice(0, 7)
}

// ── Modes de transport ────────────────────────────────────────────────────
export const TRANSPORT_MODES = {
  plane: { label: 'Avion',   icon: '✈️', color: '#6366f1', dash: '10 6' },
  train: { label: 'Train',   icon: '🚂', color: '#ef4444', dash: null   },
  bus:   { label: 'Bus',     icon: '🚌', color: '#16a34a', dash: '6 5'  },
  ferry: { label: 'Ferry',   icon: '⛴️', color: '#0891b2', dash: '8 6'  },
  car:   { label: 'Voiture', icon: '🚗', color: '#9ca3af', dash: null   },
}

const SPEED    = { plane: 800, train: 80,  bus: 60,  ferry: 28, car: 70  }
const OVERHEAD = { plane: 180, train: 30,  bus: 15,  ferry: 30, car: 10  }
const FACTOR   = { plane: 1.1, train: 1.4, bus: 1.5, ferry: 1.3, car: 1.3 }

export function estimateDuration(km, mode) {
  return Math.round((km * FACTOR[mode] / SPEED[mode]) * 60) + OVERHEAD[mode]
}

export function formatDuration(minutes) {
  if (minutes == null || isNaN(minutes)) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}
