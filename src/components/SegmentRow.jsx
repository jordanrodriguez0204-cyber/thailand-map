import { haversineKm } from '../utils/geo'
import { TRANSPORT_MODES, estimateDuration, formatDuration } from '../data/destinations'

const MODES = Object.keys(TRANSPORT_MODES)

export function SegmentRow({ from, to, segment, onUpdate }) {
  const { mode, price, duration_override, visible } = segment
  const tm = TRANSPORT_MODES[mode]
  const km = Math.round(haversineKm(from.lat, from.lng, to.lat, to.lng))
  const durMin = duration_override ?? estimateDuration(km, mode)

  function cycleMode() {
    const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length]
    onUpdate({ mode: next, duration_override: null })
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 10px 4px 34px',
      borderLeft: `3px solid ${visible ? tm.color : '#e5e7eb'}`,
      margin: '0 0 0 20px',
      opacity: visible ? 1 : 0.45,
      fontSize: 12,
    }}>
      {/* Mode toggle */}
      <button onClick={cycleMode} title="Changer le mode de transport" style={{
        background: tm.color + '22', border: 'none', borderRadius: 6,
        padding: '3px 7px', cursor: 'pointer', fontSize: 14, lineHeight: 1,
      }}>
        {tm.icon}
      </button>

      {/* Distance */}
      <span style={{ color: '#6b7280', minWidth: 46 }}>{km} km</span>

      {/* Duration */}
      <span style={{ color: '#374151', fontWeight: 500, minWidth: 48 }}>{formatDuration(durMin)}</span>

      {/* Price input */}
      <input
        type="number" min="0" placeholder="€ trajet"
        value={price ?? ''}
        onChange={e => onUpdate({ price: e.target.value ? +e.target.value : null })}
        style={{
          border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 6px',
          fontSize: 11, width: 72, color: '#374151', outline: 'none',
        }}
      />

      {/* Visibility toggle */}
      <button onClick={() => onUpdate({ visible: !visible })} title={visible ? 'Masquer ce segment' : 'Afficher ce segment'} style={{
        background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
        color: visible ? '#6366f1' : '#d1d5db', padding: '2px 4px', marginLeft: 'auto',
      }}>
        {visible ? '👁' : '🚫'}
      </button>
    </div>
  )
}
