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

// Branche excursion : aller-retour pointillé depuis l'étape mère (pas de flèche,
// lecture "on part et on revient" — distincte du flux principal du voyage)
function ExcursionBranch({ parent, step, getSegment }) {
  const seg = getSegment ? getSegment(parent.id, step.id) : { mode: 'ferry', visible: true }
  if (seg.visible === false) return null
  const tm = TRANSPORT_MODES[seg.mode || 'ferry'] || TRANSPORT_MODES.ferry
  return (
    <Polyline
      positions={[[parent.lat, parent.lng], [step.lat, step.lng]]}
      pathOptions={{ color: tm.color, weight: 2, opacity: 0.5, dashArray: '3 7' }}
    />
  )
}

export function RoutePolyline({ steps, excursions = [], getSegment }) {
  return (
    <>
      {excursions.map(({ step, parent }) => (
        <ExcursionBranch key={`exc-${step.id}`} parent={parent} step={step} getSegment={getSegment} />
      ))}
      {steps.length >= 2 && steps.slice(0, -1).map((from, i) => {
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
