import { useState, useEffect } from 'react'
import { getNearestStations, fetchWalkingRoute, walkColor } from '../utils/metroUtils'

function walkEmoji(min) {
  if (min <= 5) return '🟢'
  if (min <= 10) return '🟡'
  if (min <= 15) return '🟠'
  return '🔴'
}

function fmtDist(m) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`
}

// compact = true → version réduite pour HotelMarker popup Leaflet
export function MetroWidget({ lat, lng, compact = false }) {
  const count = compact ? 3 : 4
  const candidates = getNearestStations(lat, lng, count)
  const [routes, setRoutes] = useState({})
  const [loading, setLoading] = useState(candidates.length > 0)

  useEffect(() => {
    if (!candidates.length) return
    setLoading(true)
    setRoutes({})
    Promise.all(
      candidates.map(st =>
        fetchWalkingRoute(lat, lng, st.lat, st.lng)
          .then(r => [st.id ?? `${st.name}-${st.line}`, r])
      )
    ).then(pairs => {
      setRoutes(Object.fromEntries(pairs))
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng])

  if (!candidates.length) return null

  const containerStyle = {
    background: '#f8fafc',
    border: '1px solid #e5e7eb',
    borderRadius: compact ? 8 : 10,
    padding: compact ? '8px 10px' : '10px 12px',
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? 6 : 8 }}>
        <div style={{ fontSize: 10.5, color: '#6b7280', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          🚇 Stations à proximité
        </div>
        {loading && (
          <div style={{ fontSize: 10.5, color: '#6366f1' }}>calcul…</div>
        )}
        {!loading && (
          <div style={{ fontSize: 10, color: '#6b7280' }}>via OSM</div>
        )}
      </div>

      {/* Station rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 5 : 7 }}>
        {candidates.map((st, i) => {
          const key = st.id ?? `${st.name}-${st.line}`
          const route = routes[key]
          const distM = route ? route.distM : st.distStraight
          const walkMin = route
            ? route.walkMin
            : Math.max(2, Math.round((st.distStraight * 1.4) / 67) + 2)
          const real = route?.real
          const color = walkColor(walkMin)
          const pct = Math.min(100, (walkMin / 25) * 100)
          const isFirst = i === 0

          return (
            <div key={key} style={{
              background: isFirst ? '#fff' : 'transparent',
              borderRadius: 7,
              padding: isFirst ? (compact ? '5px 7px' : '6px 8px') : 0,
              border: isFirst ? '1px solid #e5e7eb' : 'none',
            }}>
              {/* Line badge + station name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <span style={{
                  background: st.lineData?.color ?? '#6b7280',
                  color: '#fff', borderRadius: 4,
                  padding: compact ? '1px 4px' : '1px 6px',
                  fontSize: compact ? 8.5 : 9.5, fontWeight: 700, flexShrink: 0,
                  letterSpacing: 0.2,
                }}>
                  {st.line.replace('_', ' ')}
                </span>
                <span style={{ fontSize: compact ? 11 : 12, fontWeight: isFirst ? 700 : 500, color: isFirst ? '#111827' : '#374151', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {st.name}
                </span>
                {st.interchange && <span style={{ fontSize: 9, color: '#f59e0b', flexShrink: 0 }}>🔄</span>}
              </div>

              {/* Distance + time + bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#6b7280', flexShrink: 0, minWidth: compact ? 34 : 40 }}>
                  {loading && !route ? '…' : fmtDist(distM)}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>
                  {walkEmoji(walkMin)} {loading && !route ? '…' : `${walkMin} min`}
                </span>
                {!real && !loading && (
                  <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>~</span>
                )}
                <div style={{ flex: 1, height: 3, background: '#e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: color,
                    borderRadius: 10, transition: 'width 0.4s',
                  }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
