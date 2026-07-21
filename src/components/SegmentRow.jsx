import { haversineKm } from '../utils/geo'
import { TRANSPORT_MODES, estimateDuration, formatDuration } from '../data/destinations'
import { TransportIcon, EyeIcon, EyeOffIcon } from './icons'

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
      borderLeft: `3px solid ${visible ? tm.color : 'rgba(255,255,255,0.12)'}`,
      margin: '0 0 0 20px',
      opacity: visible ? 1 : 0.45,
      fontSize: 12,
    }}>
      {/* Mode toggle */}
      <button onClick={cycleMode} title="Changer le mode de transport" style={{
        background: tm.color + '22', border: 'none', borderRadius: 6,
        padding: '3px 7px', cursor: 'pointer', lineHeight: 1, color: tm.color,
      }}>
        <TransportIcon mode={mode} size={14} />
      </button>

      {/* Distance */}
      <span style={{ color: '#8fa8c4', minWidth: 46 }}>{km} km</span>

      {/* Duration */}
      <span style={{ color: '#cfe2f5', fontWeight: 500, minWidth: 48 }}>{formatDuration(durMin)}</span>

      {/* Price input */}
      <input
        type="number" min="0" placeholder="€ trajet"
        value={price ?? ''}
        onChange={e => onUpdate({ price: e.target.value ? +e.target.value : null })}
        style={{
          border: '1px solid rgba(56,189,248,0.2)', background: '#061528', color: '#e8f4fd',
          borderRadius: 6, padding: '3px 6px', fontSize: 11, width: 72, outline: 'none',
        }}
      />

      {/* Visibility toggle */}
      <button onClick={() => onUpdate({ visible: !visible })} title={visible ? 'Masquer ce segment' : 'Afficher ce segment'} style={{
        background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
        color: visible ? '#38bdf8' : '#3a5a8a', padding: '2px 4px', marginLeft: 'auto',
      }}>
        {visible ? <EyeIcon size={15} /> : <EyeOffIcon size={15} />}
      </button>
    </div>
  )
}
