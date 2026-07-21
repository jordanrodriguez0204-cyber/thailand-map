import { METRO_STATIONS, METRO_LINES } from '../data/bangkokMetro'
import { haversineKm } from './geo'

function nearBangkok(lat, lng) {
  return lat > 13.4 && lat < 14.2 && lng > 100.2 && lng < 101.1
}

// Retourne les N stations les plus proches (à vol d'oiseau) avec infos
export function getNearestStations(lat, lng, count = 4) {
  if (!lat || !lng || !nearBangkok(lat, lng)) return []
  return METRO_STATIONS
    .map(st => ({
      ...st,
      lineData: METRO_LINES[st.line],
      distStraight: Math.round(haversineKm(lat, lng, st.lat, st.lng) * 1000),
    }))
    .sort((a, b) => a.distStraight - b.distStraight)
    .slice(0, count)
}

// Routing piéton réel via OpenStreetMap — essaie plusieurs endpoints dans l'ordre
const OSRM_FOOT_ENDPOINTS = [
  // routing.openstreetmap.de — supporte explicitement le mode piéton
  (lngA, latA, lngB, latB) =>
    `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${lngA},${latA};${lngB},${latB}?overview=false`,
  // OSRM demo — dernier recours (profil foot parfois indisponible)
  (lngA, latA, lngB, latB) =>
    `https://router.project-osrm.org/route/v1/foot/${lngA},${latA};${lngB},${latB}?overview=false`,
]

const routeCache = new Map()

export async function fetchWalkingRoute(fromLat, fromLng, toLat, toLng) {
  const key = `${fromLat},${fromLng}→${toLat},${toLng}`
  if (routeCache.has(key)) return routeCache.get(key)
  for (const buildUrl of OSRM_FOOT_ENDPOINTS) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 8000)
    try {
      const url = buildUrl(fromLng, fromLat, toLng, toLat)
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) continue
      const data = await res.json()
      if (data.code === 'Ok' && data.routes?.[0]) {
        const result = {
          distM: Math.round(data.routes[0].distance),
          walkMin: Math.ceil(data.routes[0].duration / 60),
          real: true,
        }
        routeCache.set(key, result)
        return result
      }
    } catch { /* essaie l'endpoint suivant */ }
    finally { clearTimeout(id) }
  }
  return null
}

export function walkColor(walkMin) {
  if (walkMin <= 5)  return '#16a34a'
  if (walkMin <= 10) return '#d97706'
  if (walkMin <= 15) return '#ea580c'
  return '#dc2626'
}
