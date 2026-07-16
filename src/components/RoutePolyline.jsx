import { Polyline, Marker } from 'react-leaflet'
import L from 'leaflet'

function ArrowMarker({ from, to, color }) {
  const midLat = (from[0] + to[0]) / 2
  const midLng = (from[1] + to[1]) / 2
  // angle in screen coords: lng is x, lat is y (inverted)
  const angle = (Math.atan2(to[1] - from[1], -(to[0] - from[0])) * 180) / Math.PI + 90
  const icon = L.divIcon({
    className: '',
    html: `<div style="transform:rotate(${angle}deg);color:${color};font-size:16px;line-height:1;opacity:0.85;">▲</div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
  return <Marker position={[midLat, midLng]} icon={icon} interactive={false} />
}

export function RoutePolyline({ steps }) {
  if (steps.length < 2) return null
  const positions = steps.map((s) => [s.lat, s.lng])
  const color = '#6366f1'
  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{ color, weight: 2.5, opacity: 0.55, dashArray: '10 7' }}
      />
      {steps.slice(0, -1).map((_, i) => (
        <ArrowMarker
          key={i}
          from={[steps[i].lat, steps[i].lng]}
          to={[steps[i + 1].lat, steps[i + 1].lng]}
          color={color}
        />
      ))}
    </>
  )
}
