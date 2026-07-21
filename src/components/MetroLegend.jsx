import { METRO_LINES } from '../data/bangkokMetro'

export function MetroLegend({ visible, visibleLines, onToggleLine }) {
  if (!visible) return null

  const allOn = Object.values(visibleLines).every(Boolean)

  return (
    <div style={{
      position: 'absolute', bottom: 28, right: 12, zIndex: 500,
      background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)',
      borderRadius: 12, padding: '10px 14px',
      boxShadow: '0 2px 14px rgba(0,0,0,0.15)',
      fontSize: 11, minWidth: 185,
      userSelect: 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#111827' }}>🚇 Métro Bangkok</div>
        <button
          onClick={() => Object.keys(visibleLines).forEach(id => onToggleLine(id, !allOn))}
          style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 6, cursor: 'pointer',
            border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', fontWeight: 600,
          }}
        >
          {allOn ? 'Tout masquer' : 'Tout afficher'}
        </button>
      </div>

      {Object.entries(METRO_LINES).map(([id, line]) => {
        const on = visibleLines[id] !== false
        return (
          <div
            key={id}
            onClick={() => onToggleLine(id, !on)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
              cursor: 'pointer', opacity: on ? 1 : 0.45,
              transition: 'opacity 0.15s',
            }}
          >
            {/* Ligne colorée */}
            <div style={{
              width: 28, height: 5, borderRadius: 3, flexShrink: 0,
              background: on ? line.color : '#d1d5db',
              transition: 'background 0.15s',
            }} />
            <span style={{
              color: on ? '#374151' : '#9ca3af', fontSize: 11, flex: 1,
              textDecoration: on ? 'none' : 'line-through',
            }}>
              {line.name}
            </span>
            {/* Toggle pill */}
            <div style={{
              width: 28, height: 15, borderRadius: 10, flexShrink: 0,
              background: on ? line.color : '#e5e7eb',
              position: 'relative', transition: 'background 0.15s',
            }}>
              <div style={{
                position: 'absolute', top: 2,
                left: on ? 15 : 2,
                width: 11, height: 11, borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
        )
      })}

      <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 6, paddingTop: 6, color: '#9ca3af', fontSize: 10 }}>
        Visible à partir du zoom 11
      </div>
    </div>
  )
}
