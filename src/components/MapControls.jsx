import { useMap } from 'react-leaflet'
import { CATEGORIES } from '../constants'

// ── Boutons zoom +/- ────────────────────────────────────────────────────────
export function ZoomControls({ isMobile }) {
  const map = useMap()
  return (
    <div style={{
      position: 'absolute', bottom: isMobile ? 90 : 40, left: 12, zIndex: 500,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <ZBtn onClick={() => map.zoomIn(1)} title="Zoomer">+</ZBtn>
      <ZBtn onClick={() => map.zoomOut(1)} title="Dézoomer">−</ZBtn>
    </div>
  )
}

function ZBtn({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 36, height: 36, background: '#fff',
      border: '1px solid #e5e7eb', borderRadius: 10,
      fontSize: 20, fontWeight: 700, cursor: 'pointer',
      boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#374151', lineHeight: 1,
    }}>
      {children}
    </button>
  )
}

// ── Raccourcis villes / étapes ───────────────────────────────────────────────
export function CityShortcuts({ steps }) {
  const map = useMap()
  if (!steps || steps.length === 0) return null

  // Dédupliquer par nom (garder la première occurrence)
  const seen = new Set()
  const unique = steps.filter(s => {
    if (seen.has(s.nom)) return false
    seen.add(s.nom)
    return true
  })

  return (
    <div style={{
      position: 'absolute', top: 12, right: 12, zIndex: 500,
      display: 'flex', flexDirection: 'column', gap: 5,
      maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
    }}>
      {unique.map(step => {
        const cat = CATEGORIES[step.categorie] || { emoji: '📍', color: '#6b7280' }
        return (
          <button
            key={step.id}
            onClick={() => map.flyTo([step.lat, step.lng], 13, { duration: 1.1 })}
            title={`Aller à ${step.nom}`}
            style={{
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${cat.color}44`,
              borderLeft: `3px solid ${cat.color}`,
              borderRadius: 10,
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: '#111827',
              textAlign: 'left',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ fontSize: 14 }}>{cat.emoji}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.nom}</span>
          </button>
        )
      })}
    </div>
  )
}
