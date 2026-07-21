import { CityIcon } from './CityIcon'
import { IslandIcon } from './IslandIcon'
import { ParkIcon } from './ParkIcon'
import { ExcursionIcon } from './ExcursionIcon'
import { TransitIcon } from './TransitIcon'

const MAP = {
  ville: CityIcon,
  'île': IslandIcon,
  'parc national': ParkIcon,
  excursion: ExcursionIcon,
  transit: TransitIcon,
}

// Wrapper générique : <CategoryIcon category="ville" size={16} color="#38bdf8" />
export function CategoryIcon({ category, size = 16, color = 'currentColor', style, ...props }) {
  const Icon = MAP[category] || CityIcon
  return <Icon size={size} style={{ color, flexShrink: 0, ...style }} {...props} />
}

// Version chaîne SVG brute — pour les L.divIcon Leaflet (html string, pas de JSX)
const RAW = {
  ville: '<path d="M2.5 17.5h15"/><path d="M4 17.5V9.5h3.5v8"/><path d="M8.5 17.5V4.5H12v13"/><path d="M13.5 17.5V7.5H16.5v10"/>',
  'île': '<path d="M10 14V7"/><path d="M10 7Q6.5 6.5 5 3.5q4-.5 5 3.5"/><path d="M10 7q3.5-.5 5-3.5-4-.5-5 3.5"/><path d="M2 16.5q2-1.5 4 0t4 0 4 0 4 0"/>',
  'parc national': '<path d="M2 16.5 7.5 6l3.2 6"/><path d="M2 16.5h16"/><path d="M14.5 16.5V13"/><path d="m14.5 4-3 4.5h1.5l-2 3.5h7l-2-3.5H17Z"/>',
  excursion: '<circle cx="10" cy="10" r="7.5"/><path d="m13 7-1.8 4.2L7 13l1.8-4.2z" fill="currentColor" stroke="none"/>',
  transit: '<path d="M17.5 10c0 .8-.7 1.5-1.5 1.5h-4.5l-3.5 5H6l1.75-5H4.5l-1.5 1.5H1.5l1-3-1-3H3l1.5 1.5h3.25L6 3.5h2l3.5 5H16c.8 0 1.5.7 1.5 1.5Z"/>',
}

export function categoryIconSvg(category, size = 16, color = '#fff') {
  const inner = RAW[category] || RAW.ville
  return `<svg width="${size}" height="${size}" viewBox="0 0 20 20" stroke="${color}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color:${color};display:block">${inner}</svg>`
}
