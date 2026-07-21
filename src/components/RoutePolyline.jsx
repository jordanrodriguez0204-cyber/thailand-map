import { Polyline, Marker } from 'react-leaflet'
import L from 'leaflet'
import { TRANSPORT_MODES } from '../data/destinations'

function ArrowMarker({ from, to, color }) {
  const midLat = (from[0] + to[0]) / 2
  const midLng = (from[1] + to[1]) / 2
  const angle = (Math.atan2(to[1] - from[1], -(to[0] - from[0])) * 180) / Math.PI + 90
  const icon = L.divIcon({
    className: '',
    html: `<div style="transform:rotate(${angle}deg);color:${color};font-size:16px;line-height:1;opacity:0.85;">▲</div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
  return <Marker position={[midLat, midLng]} icon={icon} interactive={false} />
}

export function RoutePolyline({ steps, getSegment }) {
  if (steps.length < 2) return null
  return (
    <>
      {steps.slice(0, -1).map((from, i) => {
        const to = steps[i + 1]
        const seg = getSegment ? getSegment(from.id, to.id) : { mode: 'plane', visible: true }
        if (!seg.visible) return null
        const tm = TRANSPORT_MODES[seg.mode] || TRANSPORT_MODES.plane
        const positions = [[from.lat, from.lng], [to.lat, to.lng]]
        return (
          <span key={`${from.id}-${to.id}`}>
            <Polyline
              positions={positions}
              pathOptions={{ color: tm.color, weight: 2.5, opacity: 0.65, dashArray: tm.dash || undefined }}
            />
            <ArrowMarker from={positions[0]} to={positions[1]} color={tm.color} />
          </span>
        )
      })}
    </>
  )
}
