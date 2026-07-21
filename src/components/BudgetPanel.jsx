import { haversineKm } from '../utils/geo'
import { TRANSPORT_MODES, estimateDuration, formatDuration } from '../data/destinations'

const ROUTE_FACTOR = { plane: 1.05, train: 1.4, bus: 1.5, ferry: 1.2, car: 1.3 }

export function BudgetPanel({ steps, getSegment, getHotel, onClose }) {
  const rows = steps.map((step, i) => {
    const prev = steps[i - 1]
    const hotel = getHotel(step.id) || {}
    const hotelTotal = (hotel.price_per_night && hotel.nights) ? hotel.price_per_night * hotel.nights : 0

    let km = 0, durMin = 0, transportPrice = 0, mode = null
    if (prev) {
      const seg = getSegment(prev.id, step.id)
      mode = seg.mode
      const rawKm = haversineKm(prev.lat, prev.lng, step.lat, step.lng)
      km = Math.round(rawKm * (ROUTE_FACTOR[seg.mode] ?? 1))
      durMin = seg.duration_override ?? estimateDuration(rawKm, seg.mode)
      transportPrice = seg.price ?? 0
    }

    return { step, hotel, hotelTotal, km, durMin, transportPrice, mode }
  })

  const totalKm = rows.reduce((a, r) => a + r.km, 0)
  const totalDurMin = rows.reduce((a, r) => a + r.durMin, 0)
  const totalHotel = rows.reduce((a, r) => a + r.hotelTotal, 0)
  const totalTransport = rows.reduce((a, r) => a + r.transportPrice, 0)
  const grandTotal = totalHotel + totalTransport

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>💰 Récapitulatif du voyage</h2>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontSize: 11, textTransform: 'uppercase' }}>
                <th style={th}>Étape</th>
                <th style={th}>Transport</th>
                <th style={th}>Km</th>
                <th style={th}>Durée</th>
                <th style={th}>Trajet CHF</th>
                <th style={th}>Hôtel CHF</th>
                <th style={th}>Total étape</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ step, hotel, hotelTotal, km, durMin, transportPrice, mode }, i) => {
                const tm = mode ? TRANSPORT_MODES[mode] : null
                const rowTotal = hotelTotal + (i > 0 ? transportPrice : 0)
                return (
                  <tr key={step.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{step.nom}</div>
                      {hotel.name && <div style={{ fontSize: 11, color: '#9ca3af' }}>{hotel.name}{hotel.nights ? ` · ${hotel.nights}n` : ''}</div>}
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      {tm ? <span title={tm.label}>{tm.icon}</span> : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: '#6b7280' }}>{i > 0 ? km : '—'}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#6b7280' }}>{i > 0 ? formatDuration(durMin) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{i > 0 && transportPrice > 0 ? `${transportPrice} CHF` : '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{hotelTotal > 0 ? `${hotelTotal} CHF` : '—'}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: rowTotal > 0 ? '#111827' : '#d1d5db' }}>
                      {rowTotal > 0 ? `${rowTotal} CHF` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f9fafb', fontWeight: 700 }}>
                <td style={{ ...td, fontWeight: 700 }}>TOTAL</td>
                <td style={td} />
                <td style={{ ...td, textAlign: 'right' }}>{totalKm} km</td>
                <td style={{ ...td, textAlign: 'right' }}>{formatDuration(totalDurMin)}</td>
                <td style={{ ...td, textAlign: 'right', color: '#ef4444' }}>{totalTransport > 0 ? `${totalTransport} CHF` : '—'}</td>
                <td style={{ ...td, textAlign: 'right', color: '#0891b2' }}>{totalHotel > 0 ? `${totalHotel} CHF` : '—'}</td>
                <td style={{ ...td, textAlign: 'right', fontSize: 15, color: '#6366f1' }}>{grandTotal > 0 ? `${grandTotal} CHF` : '—'}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {grandTotal > 0 && (
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatCard label="Total transport" value={`${totalTransport} CHF`} color="#ef4444" />
            <StatCard label="Total hébergement" value={`${totalHotel} CHF`} color="#0891b2" />
            <StatCard label="Budget total" value={`${grandTotal} CHF`} color="#6366f1" bold />
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, bold }) {
  return (
    <div style={{ flex: 1, minWidth: 130, background: color + '11', borderRadius: 10, padding: '10px 14px', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: bold ? 20 : 16, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.5)', zIndex: 3000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 16,
}
const panel = {
  background: '#fff', borderRadius: 18, padding: 24,
  maxWidth: 700, width: '100%',
  boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
  maxHeight: '90vh', overflowY: 'auto',
}
const closeBtn = {
  background: '#f3f4f6', border: 'none', width: 32, height: 32,
  borderRadius: '50%', fontSize: 20, cursor: 'pointer', color: '#6b7280',
}
const th = { padding: '6px 8px', textAlign: 'left', fontWeight: 600 }
const td = { padding: '8px 8px', verticalAlign: 'top' }
