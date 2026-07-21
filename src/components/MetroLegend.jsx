import { MetroIcon } from './icons'
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
          background: 'rgba(10,42,82,0.96)', backdropFilter: 'blur(8px)', border: '1px solid rgba(56,189,248,0.15)',
          border: 'none', borderRadius: 12, padding: '10px 14px',
          boxShadow: '0 2px 14px rgba(0,0,0,0.15)', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, color: '#e8f4fd',
          display: 'flex', alignItems: 'center', gap: 6, minHeight: 44,
        }}
      >
        Légende <span style={{ color: '#8fa8c4', fontSize: 11 }}>▴</span>
      </button>
    )
  }

  return (
    <div style={{
      position: 'absolute', bottom, right: 12, zIndex: 500,
      background: 'rgba(10,42,82,0.96)', backdropFilter: 'blur(8px)', border: '1px solid rgba(56,189,248,0.15)',
      borderRadius: 12, padding: '10px 14px',
      boxShadow: '0 2px 14px rgba(0,0,0,0.15)',
      fontSize: 12, minWidth: 195,
      userSelect: 'none',
      maxHeight: isMobile ? '45vh' : 'none', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#e8f4fd' }}>Métro Bangkok</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => Object.keys(visibleLines).forEach(id => onToggleLine(id, !allOn))}
            style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
              border: '1px solid rgba(56,189,248,0.15)', background: '#0e3468', color: '#4b5563', fontWeight: 600,
            }}
          >
            {allOn ? 'Tout masquer' : 'Tout afficher'}
          </button>
          <button
            onClick={() => setCollapsed(true)}
            title="Replier"
            style={{
              fontSize: 12, padding: '3px 7px', borderRadius: 6, cursor: 'pointer',
              border: 'none', background: 'rgba(255,255,255,0.06)', color: '#8fa8c4', fontWeight: 700,
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
              background: on ? line.color : '#8fa8c4',
              transition: 'background 0.15s',
            }} />
            <span style={{
              color: on ? '#cfe2f5' : '#8fa8c4', fontSize: 12, flex: 1,
              textDecoration: on ? 'none' : 'line-through',
            }}>
              {line.name}
            </span>
            {/* Toggle pill */}
            <div style={{
              width: 28, height: 15, borderRadius: 10, flexShrink: 0,
              background: on ? line.color : 'rgba(56,189,248,0.18)',
              position: 'relative', transition: 'background 0.15s',
            }}>
              <div style={{
                position: 'absolute', top: 2,
                left: on ? 15 : 2,
                width: 11, height: 11, borderRadius: '50%',
                background: '#0a2a52',
                transition: 'left 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
        )
      })}

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 6, paddingTop: 6, color: '#8fa8c4', fontSize: 11 }}>
        Visible à partir du zoom 11
      </div>
    </div>
  )
}
