import { haversineKm } from '../utils/geo'
import { CATEGORIES } from '../constants'

function timeAgo(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

export function StepPopup({ step, prevStep, onClose, onEdit }) {
  const cat = CATEGORIES[step.categorie] || { label: step.categorie, emoji: '📍', color: '#6b7280' }
  const dist = prevStep ? haversineKm(prevStep.lat, prevStep.lng, step.lat, step.lng) : null

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: 1, marginBottom: 2 }}>ÉTAPE {step.ordre}</div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>{step.nom}</h2>
          </div>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          <Chip bg={cat.color + '22'} color={cat.color}>{cat.emoji} {cat.label}</Chip>
          <Chip bg="#fef3c7" color="#92400e">📅 {step.dates}</Chip>
          {dist && <Chip bg="#ede9fe" color="#5b21b6">✈ {dist} km</Chip>}
        </div>

        {step.notes && (
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: '#374151', lineHeight: 1.6, marginBottom: 14 }}>
            {step.notes}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#d1d5db' }}>
            {step.modified_by && (
              <span>✏️ {step.modified_by} · {timeAgo(step.modified_at)}</span>
            )}
          </div>
          <button onClick={() => { onClose(); onEdit(step) }} style={editBtn}>
            Modifier ✏️
          </button>
        </div>
      </div>
    </div>
  )
}

function Chip({ bg, color, children }) {
  return (
    <span style={{ background: bg, color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>
      {children}
    </span>
  )
}

const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.45)', zIndex: 2000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 16,
}
const card = {
  background: '#fff', borderRadius: 18, padding: 22,
  maxWidth: 380, width: '100%',
  boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
}
const closeBtn = {
  background: '#f3f4f6', border: 'none', width: 32, height: 32,
  borderRadius: '50%', fontSize: 20, cursor: 'pointer', color: '#6b7280',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
const editBtn = {
  background: '#6366f1', color: '#fff', border: 'none',
  borderRadius: 8, padding: '7px 14px', fontSize: 13,
  fontWeight: 600, cursor: 'pointer',
}
