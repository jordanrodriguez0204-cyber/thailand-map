import { createPortal } from 'react-dom'
import { haversineKm } from '../utils/geo'
import { CATEGORIES } from '../constants'
import { TRANSPORT_MODES, estimateDuration, formatDuration } from '../data/destinations'

function loadItinData(itinId, getAllStepsForCompare) {
  const steps = (getAllStepsForCompare([itinId]) || [])
    .filter(s => (s.itinerary_id || 'default') === itinId)
    .sort((a, b) => a.ordre - b.ordre)

  const segsRaw = (() => {
    try { return JSON.parse(localStorage.getItem(`th_segments_${itinId}`) || '{}') } catch { return {} }
  })()
  const hotelsRaw = (() => {
    try { return JSON.parse(localStorage.getItem(`th_budget_${itinId}`) || '{}') } catch { return {} }
  })()

  const segments = steps.slice(1).map((to, i) => {
    const from = steps[i]
    const seg = segsRaw[`${from.id}→${to.id}`] || {}
    const km = Math.round(haversineKm(from.lat, from.lng, to.lat, to.lng))
    const mode = seg.mode || 'plane'
    const dur = seg.duration_override ?? estimateDuration(km, mode)
    const price = seg.price_chf ?? seg.price ?? null
    return { from, to, km, mode, dur, price, notes: seg.notes || '' }
  })

  const totalKm = segments.reduce((a, s) => a + s.km, 0)
  const totalTransport = segments.reduce((a, s) => a + (s.price || 0), 0)
  const totalHotel = Object.values(hotelsRaw).reduce((a, val) => {
    // Nouveau format : tableau d'hôtels (le sélectionné compte) ; ancien : objet unique
    const h = Array.isArray(val) ? (val.find(x => x.selected) || val[0]) : val
    return a + ((h?.price_per_night || 0) * (h?.nights || 0))
  }, 0)
  const totalDuration = segments.reduce((a, s) => a + s.dur, 0)

  return { steps, segments, totalKm, totalTransport, totalHotel, totalDuration }
}

function StepCard({ step, color }) {
  const cat = CATEGORIES[step.categorie] || { emoji: '📍', color: '#6b7280' }
  return (
    <div style={{
      background: '#fff', border: `1px solid ${color}30`,
      borderLeft: `3px solid ${color}`, borderRadius: 10,
      padding: '9px 11px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16 }}>{cat.emoji}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {step.nom}
          </div>
          {step.dates && (
            <div style={{ fontSize: 10.5, color: '#9ca3af' }}>{step.dates}</div>
          )}
        </div>
      </div>
    </div>
  )
}

function SegmentRow({ seg, color }) {
  const tm = TRANSPORT_MODES[seg.mode] || TRANSPORT_MODES.plane
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '5px 0', gap: 3,
    }}>
      <div style={{ width: 1, height: 6, background: '#e5e7eb' }} />
      <div style={{
        background: tm.color + '15', borderRadius: 20,
        padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span style={{ fontSize: 13 }}>{tm.icon}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: tm.color }}>
          {seg.km} km
        </span>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>·</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#374151' }}>
          {formatDuration(seg.dur)}
        </span>
        {seg.price > 0 && (
          <>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>·</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a' }}>
              {seg.price} CHF
            </span>
          </>
        )}
      </div>
      {seg.notes && (
        <div style={{ fontSize: 9.5, color: '#b0b0b0', fontStyle: 'italic', textAlign: 'center', maxWidth: 120 }}>
          {seg.notes}
        </div>
      )}
      <div style={{ width: 1, height: 6, background: '#e5e7eb' }} />
    </div>
  )
}

function ItinColumn({ itin, data }) {
  const { steps, segments } = data
  return (
    <div style={{
      flex: '0 0 240px', minWidth: 0,
      display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      {steps.length === 0 && (
        <div style={{ textAlign: 'center', color: '#d1d5db', fontSize: 12, padding: '20px 0' }}>
          Aucune étape
        </div>
      )}
      {steps.map((step, i) => (
        <div key={step.id}>
          <StepCard step={step} color={itin.color} />
          {segments[i] && <SegmentRow seg={segments[i]} color={itin.color} />}
        </div>
      ))}
    </div>
  )
}

function StatRow({ label, values, itineraries, higherIsBetter = false }) {
  const nums = values.map(v => typeof v === 'number' ? v : null)
  const allNum = nums.every(n => n !== null)
  const minVal = allNum ? Math.min(...nums) : null
  const maxVal = allNum ? Math.max(...nums) : null

  return (
    <tr>
      <td style={{ padding: '7px 10px', fontSize: 11.5, color: '#6b7280', fontWeight: 500, whiteSpace: 'nowrap' }}>
        {label}
      </td>
      {values.map((v, i) => {
        const num = nums[i]
        const isWinner = allNum && num !== null && (higherIsBetter ? num === maxVal : num === minVal) && minVal !== maxVal
        return (
          <td key={i} style={{
            padding: '7px 10px', fontSize: 12, fontWeight: 700, textAlign: 'center',
            color: isWinner ? itineraries[i].color : '#111827',
            background: isWinner ? itineraries[i].color + '10' : 'transparent',
          }}>
            {v}
            {isWinner && <span style={{ marginLeft: 4, fontSize: 10 }}>✓</span>}
          </td>
        )
      })}
    </tr>
  )
}

function advantages(itineraries, datas) {
  const results = itineraries.map((itin, i) => {
    const d = datas[i]
    const others = datas.filter((_, j) => j !== i)
    const wins = []

    if (others.every(o => d.totalTransport + d.totalHotel < o.totalTransport + o.totalHotel))
      wins.push('💶 Budget total le plus bas')
    if (others.every(o => d.totalKm < o.totalKm))
      wins.push('🌍 Moins de kilomètres')
    if (others.every(o => d.totalDuration < o.totalDuration))
      wins.push('⏱ Moins de temps en transit')
    if (others.every(o => d.steps.length > o.steps.length))
      wins.push('📍 Plus de destinations')
    if (others.every(o => d.totalTransport < o.totalTransport))
      wins.push('✈️ Transports moins chers')
    if (others.every(o => d.totalHotel < o.totalHotel))
      wins.push('🏨 Hôtels moins chers')

    return { itin, wins }
  })
  return results
}

export function ComparePanel({ itineraries, getAllStepsForCompare, onClose }) {
  const datas = itineraries.map(itin => loadItinData(itin.id, getAllStepsForCompare))
  const advs = advantages(itineraries, datas)

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 3000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
    }} onClick={onClose}>
      <div style={{
        background: '#f8f9fb', borderRadius: 20, width: '100%', maxWidth: 760,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid #e5e7eb', flexShrink: 0,
          background: '#fff', borderRadius: '20px 20px 0 0',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>🔀 Comparaison des itinéraires</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
              {itineraries.map(i => i.name).join(' vs ')}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: '#f3f4f6', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#6b7280',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Columns — scrollable */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 16px 0' }}>

          {/* Itin name headers */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 0, flexShrink: 0 }} /> {/* spacer */}
            {itineraries.map((itin, i) => (
              <div key={itin.id} style={{
                flex: '0 0 240px', background: itin.color, borderRadius: 10,
                padding: '8px 12px', color: '#fff', fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
                {itin.name}
                <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.8 }}>
                  {datas[i].steps.length} étape{datas[i].steps.length > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>

          {/* Side-by-side columns */}
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
            {itineraries.map((itin, i) => (
              <ItinColumn key={itin.id} itin={itin} data={datas[i]} />
            ))}
          </div>
        </div>

        {/* Summary table + avantages */}
        <div style={{
          flexShrink: 0, borderTop: '1px solid #e5e7eb',
          background: '#fff', borderRadius: '0 0 20px 20px',
          padding: '14px 16px',
        }}>
          {/* Stats table */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Récapitulatif
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, color: '#9ca3af', fontWeight: 500 }}></th>
                  {itineraries.map(itin => (
                    <th key={itin.id} style={{
                      padding: '6px 10px', textAlign: 'center', fontSize: 12,
                      fontWeight: 700, color: itin.color,
                    }}>{itin.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <StatRow label="📍 Étapes"
                  values={datas.map(d => d.steps.length)}
                  itineraries={itineraries} higherIsBetter={true} />
                <StatRow label="🗺️ Distance totale"
                  values={datas.map(d => `${d.totalKm.toLocaleString()} km`)}
                  itineraries={itineraries} />
                <StatRow label="⏱ Temps de trajet"
                  values={datas.map(d => formatDuration(d.totalDuration))}
                  itineraries={itineraries} />
                <StatRow label="✈️ Budget transport"
                  values={datas.map(d => d.totalTransport > 0 ? `${d.totalTransport} CHF` : '—')}
                  itineraries={itineraries} />
                <StatRow label="🏨 Budget hôtels"
                  values={datas.map(d => d.totalHotel > 0 ? `${d.totalHotel} CHF` : '—')}
                  itineraries={itineraries} />
                <StatRow label="💶 Total budget"
                  values={datas.map(d => {
                    const t = d.totalTransport + d.totalHotel
                    return t > 0 ? `${t.toLocaleString()} CHF` : '—'
                  })}
                  itineraries={itineraries} />
              </tbody>
            </table>
          </div>

          {/* Avantages */}
          {advs.some(a => a.wins.length > 0) && (
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              {advs.map(({ itin, wins }) => wins.length > 0 && (
                <div key={itin.id} style={{
                  flex: 1, minWidth: 160,
                  background: itin.color + '10', borderRadius: 10,
                  border: `1px solid ${itin.color}30`, padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: itin.color, marginBottom: 6 }}>
                    Avantages — {itin.name}
                  </div>
                  {wins.map((w, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#374151', marginBottom: 3 }}>{w}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
