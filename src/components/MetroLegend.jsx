import { useState } from 'react'
import { METRO_LINES } from '../data/bangkokMetro'

export function MetroLegend({ visible, visibleLines, onToggleLine, isMobile = false }) {
  // Repliée par défaut sur mobile (sinon elle masque un tiers de la carte)
  const [collapsed, setCollapsed] = useState(isMobile)

  if (!visible) return null

  const allOn = Object.values(visibleLines).every(Boolean)
  // Au-dessus de la barre d'actions sur mobile, coin bas-droit sur desktop
  const bottom = isMobile ? 'calc(86px + env(safe-area-inset-bottom))' : 28

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: 'absolute', bottom, right: 12, zIndex: 500,
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)',
          border: 'none', borderRadius: 12, padding: '10px 14px',
          boxShadow: '0 2px 14px rgba(0,0,0,0.15)', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, color: '#111827',
          display: 'flex', alignItems: 'center', gap: 6, minHeight: 44,
        }}
      >
        🚇 Légende <span style={{ color: '#6b7280', fontSize: 11 }}>▴</span>
      </button>
    )
  }

  return (
    <div style={{
      position: 'absolute', bottom, right: 12, zIndex: 500,
      background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)',
      borderRadius: 12, padding: '10px 14px',
      boxShadow: '0 2px 14px rgba(0,0,0,0.15)',
      fontSize: 12, minWidth: 195,
      userSelect: 'none',
      maxHeight: isMobile ? '45vh' : 'none', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>🚇 Métro Bangkok</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => Object.keys(visibleLines).forEach(id => onToggleLine(id, !allOn))}
            style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
              border: '1px solid #e5e7eb', background: '#f9fafb', color: '#4b5563', fontWeight: 600,
            }}
          >
            {allOn ? 'Tout masquer' : 'Tout afficher'}
          </button>
          <button
            onClick={() => setCollapsed(true)}
            title="Replier"
            style={{
              fontSize: 12, padding: '3px 7px', borderRadius: 6, cursor: 'pointer',
              border: 'none', background: '#f3f4f6', color: '#6b7280', fontWeight: 700,
            }}
          >▾</button>
        </div>
      </div>

      {Object.entries(METRO_LINES).map(([id, line]) => {
        const on = visibleLines[id] !== false
        return (
          <div
            key={id}
            onClick={() => onToggleLine(id, !on)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', opacity: on ? 1 : 0.45,
              transition: 'opacity 0.15s',
              minHeight: isMobile ? 36 : 26,
            }}
          >
            {/* Ligne colorée */}
            <div style={{
              width: 28, height: 5, borderRadius: 3, flexShrink: 0,
              background: on ? line.color : '#d1d5db',
              transition: 'background 0.15s',
            }} />
            <span style={{
              color: on ? '#374151' : '#9ca3af', fontSize: 12, flex: 1,
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

      <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 6, paddingTop: 6, color: '#6b7280', fontSize: 11 }}>
        Visible à partir du zoom 11
      </div>
    </div>
  )
}
