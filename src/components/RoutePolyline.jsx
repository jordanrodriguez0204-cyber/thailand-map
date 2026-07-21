import { Polyline, Marker } from 'react-leaflet'
import L from 'leaflet'
import { TRANSPORT_MODES } from '../data/destinations'

// Arc quadratique entre deux points — bombé perpendiculairement à la ligne.
// Utilisé pour les vols : lecture immédiate "avion" vs trajets terrestres droits.
function arcPositions(from, to, bend = 0.18, steps = 40) {
  const [lat1, lng1] = from
  const [lat2, lng2] = to
  const mx = (lat1 + lat2) / 2
  const my = (lng1 + lng2) / 2
  // Perpendiculaire (dans l'espace lat/lng — suffisant à l'échelle du pays)
  const dx = lat2 - lat1
  const dy = lng2 - lng1
  const ctrl = [mx - dy * bend, my + dx * bend]
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = (1 - t) * (1 - t)
    const b = 2 * (1 - t) * t
    const c = t * t
    pts.push([a * lat1 + b * ctrl[0] + c * lat2, a * lng1 + b * ctrl[1] + c * lng2])
  }
  return pts
}

function ArrowMarker({ at, angle, color }) {
  const icon = L.divIcon({
    className: '',
    html: `<div style="transform:rotate(${angle}deg);color:${color};font-size:16px;line-height:1;opacity:0.85;">▲</div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
  return <Marker position={at} icon={icon} interactive={false} />
}

export function RoutePolyline({ steps, getSegment }) {
  if (steps.length < 2) return null
  return (
    <>
      {steps.slice(0, -1).map((from, i) => {
        const to = steps[i + 1]
        const seg = getSegment ? getSegment(from.id, to.id) : { mode: 'plane', visible: true }
        if (!seg.visible) return null
        const mode = seg.mode || 'plane'
        const tm = TRANSPORT_MODES[mode] || TRANSPORT_MODES.plane
        const a = [from.lat, from.lng]
        const b = [to.lat, to.lng]
        const isFlight = mode === 'plane'
        const positions = isFlight ? arcPositions(a, b) : [a, b]

        // Flèche au milieu du tracé, orientée selon la tangente locale
        const mid = isFlight ? positions[20] : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
        const next = isFlight ? positions[21] : b
        const angle = (Math.atan2(next[1] - mid[1], -(next[0] - mid[0])) * 180) / Math.PI + 90

        return (
          <span key={`${from.id}-${to.id}`}>
            <Polyline
              positions={positions}
              pathOptions={{ color: tm.color, weight: 2.5, opacity: 0.65, dashArray: tm.dash || undefined }}
            />
            <ArrowMarker at={mid} angle={angle} color={tm.color} />
          </span>
        )
      })}
    </>
  )
}
