import { CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet'
import { useState, useEffect } from 'react'
import { METRO_STATIONS, METRO_LINES } from '../data/bangkokMetro'

function getLineSegments() {
  const groups = {}
  for (const st of METRO_STATIONS) {
    if (!groups[st.line]) groups[st.line] = []
    groups[st.line].push([st.lat, st.lng])
  }
  return groups
}

const LINE_SEGMENTS = getLineSegments()

export function MetroLayer({ visibleLines }) {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())

  useEffect(() => {
    function onZoom() { setZoom(map.getZoom()) }
    map.on('zoomend', onZoom)
    return () => map.off('zoomend', onZoom)
  }, [map])

  if (zoom < 11) return null

  return (
    <>
      {Object.entries(LINE_SEGMENTS).map(([lineId, positions]) => {
        if (visibleLines && !visibleLines[lineId]) return null
        const line = METRO_LINES[lineId]
        return (
          <Polyline
            key={lineId}
            positions={positions}
            pathOptions={{ color: line.color, weight: zoom >= 13 ? 5 : 3, opacity: 0.85 }}
          />
        )
      })}

      {METRO_STATIONS.map(st => {
        if (visibleLines && !visibleLines[st.line]) return null
        const line = METRO_LINES[st.line]
        const radius = st.interchange
          ? (zoom >= 14 ? 9 : zoom >= 12 ? 7 : 5)
          : (zoom >= 14 ? 6 : zoom >= 12 ? 4 : 3)
        return (
          <CircleMarker
            key={st.id}
            center={[st.lat, st.lng]}
            radius={radius}
            pathOptions={{ color: '#fff', weight: st.interchange ? 2.5 : 1.5, fillColor: line.color, fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -radius - 2]} opacity={1}>
              <div style={{ fontSize: 12, fontWeight: 700, color: line.color }}>{st.name}</div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>{line.name}</div>
              {st.interchange && <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>🔄 Correspondance</div>}
            </Tooltip>
          </CircleMarker>
        )
      })}
    </>
  )
}
