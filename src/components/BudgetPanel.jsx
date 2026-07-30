import { useState } from 'react'
import { WalletIcon, CloseIcon, TransportIcon, ScalesIcon, PencilIcon } from './icons'
import { haversineKm } from '../utils/geo'
import { TRANSPORT_MODES, estimateDuration, formatDuration } from '../data/destinations'
import { useBudgetTarget } from '../hooks/useBudgetTarget'
import { excursionLeg, ROUTE_FACTOR } from '../utils/tripDerive'
import { fmtCHF, fmtNum } from '../utils/money'

export function BudgetPanel({ steps, excursions = [], itinId, getSegment, getHotel, onClose, onOpenCompare }) {
  const { target, setTarget } = useBudgetTarget(itinId)
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

  // Excursions à la journée : trajet aller-retour depuis l'étape mère
  const excRows = excursions.map(({ step, parent }) => {
    const leg = excursionLeg(parent, step, getSegment)
    const hotel = getHotel(step.id) || {}
    const hotelTotal = (hotel.price_per_night && hotel.nights) ? hotel.price_per_night * hotel.nights : 0
    return { step, parent, hotel, hotelTotal, km: leg.km, durMin: leg.durMin, transportPrice: leg.price, mode: leg.mode }
  })

  const all = [...rows, ...excRows]
  const totalKm = all.reduce((a, r) => a + r.km, 0)
  const totalDurMin = all.reduce((a, r) => a + r.durMin, 0)
  const totalHotel = all.reduce((a, r) => a + r.hotelTotal, 0)
  const totalTransport = all.reduce((a, r) => a + r.transportPrice, 0)
  const grandTotal = totalHotel + totalTransport

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><WalletIcon size={18} style={{ color: '#38bdf8' }} />Budget du voyage</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {onOpenCompare && (
              <button onClick={onOpenCompare} style={{
                background: 'rgba(56,189,248,0.12)', color: '#7dd3fc', border: 'none', borderRadius: 8,
                padding: '7px 11px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}><ScalesIcon size={13} />Comparateur</button>
            )}
            <button onClick={onClose} style={closeBtn}><CloseIcon size={15} /></button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.12)', color: '#8fa8c4', fontSize: 11, textTransform: 'uppercase' }}>
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
              {rows.flatMap(({ step, hotel, hotelTotal, km, durMin, transportPrice, mode }, i) => {
                const mine = excRows.filter(e => e.parent.id === step.id)
                const orphansTail = i === rows.length - 1 ? excRows.filter(e => !rows.some(r => r.step.id === e.parent.id)) : []
                return [
                  { key: step.id, step, hotel, hotelTotal, km, durMin, transportPrice, mode, showTransport: i > 0, exc: false },
                  ...mine.map(e => ({ key: e.step.id, ...e, showTransport: true, exc: true })),
                  ...orphansTail.map(e => ({ key: e.step.id, ...e, showTransport: true, exc: true })),
                ]
              }).map(({ key, step, hotel, hotelTotal, km, durMin, transportPrice, mode, showTransport, exc }) => {
                const tm = mode ? TRANSPORT_MODES[mode] : null
                const rowTotal = hotelTotal + (showTransport ? transportPrice : 0)
                return (
                  <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={td}>
                      <div style={{ fontWeight: 600, paddingLeft: exc ? 14 : 0, color: exc ? '#cfe2f5' : undefined }}>
                        {exc ? '⇄ ' : ''}{step.nom}
                        {exc && <span style={{ fontSize: 10, color: '#8fa8c4', fontWeight: 500, marginLeft: 5 }}>excursion A/R</span>}
                      </div>
                      {hotel.name && (
                        <div style={{ fontSize: 11, color: '#8fa8c4', paddingLeft: exc ? 14 : 0 }}>
                          {hotel.name}{hotel.nights ? ` · ${hotel.nights}n` : ''}
                          <span style={{ marginLeft: 6, fontWeight: 700, color: hotel.booked ? '#4ade80' : '#fbbf24' }}>
                            {hotel.booked ? '✓ réservé' : 'à réserver'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      {tm ? <span title={tm.label} style={{ display: 'inline-flex', color: tm.color }}><TransportIcon mode={mode} size={14} /></span> : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: '#8fa8c4' }}>{showTransport ? km : '—'}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#8fa8c4' }}>{showTransport ? formatDuration(durMin) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{showTransport ? fmtCHF(transportPrice) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmtCHF(hotelTotal)}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: rowTotal > 0 ? '#e8f4fd' : '#8fa8c4' }}>
                      {fmtCHF(rowTotal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid rgba(255,255,255,0.12)', background: '#0e3468', fontWeight: 700 }}>
                <td style={{ ...td, fontWeight: 700 }}>TOTAL</td>
                <td style={td} />
                <td style={{ ...td, textAlign: 'right' }}>{totalKm} km</td>
                <td style={{ ...td, textAlign: 'right' }}>{formatDuration(totalDurMin)}</td>
                <td style={{ ...td, textAlign: 'right', color: '#f87171' }}>{fmtCHF(totalTransport)}</td>
                <td style={{ ...td, textAlign: 'right', color: '#7dd3fc' }}>{fmtCHF(totalHotel)}</td>
                <td style={{ ...td, textAlign: 'right', fontSize: 15, color: '#38bdf8' }}>{fmtCHF(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {grandTotal > 0 && (
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatCard label="Total transport" value={fmtCHF(totalTransport)} color="#f87171" />
            <StatCard label="Total hébergement" value={fmtCHF(totalHotel)} color="#7dd3fc" />
            <StatCard label="Budget total" value={fmtCHF(grandTotal)} color="#38bdf8" bold />
          </div>
        )}

        {/* Budget cible + jauge engagé/restant */}
        <BudgetGauge engaged={grandTotal} target={target} onSetTarget={setTarget} />

        {/* Reste à réserver — les hôtels retenus pas encore réservés */}
        {(() => {
          const pending = all.filter(r => r.hotel.name && !r.hotel.booked)
          if (pending.length === 0) return null
          return (
            <div style={{
              marginTop: 14, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
              borderRadius: 10, padding: '10px 14px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>
                Reste à réserver ({pending.length})
              </div>
              <div style={{ fontSize: 12, color: '#cfe2f5', lineHeight: 1.7 }}>
                {pending.map(r => (
                  <div key={r.step.id}>
                    {r.step.nom} — {r.hotel.name}{r.hotelTotal > 0 ? ` (${fmtCHF(r.hotelTotal)})` : ''}
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

function BudgetGauge({ engaged, target, onSetTarget }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(target ?? '')

  function commit() {
    onSetTarget(draft ? +draft : null)
    setEditing(false)
  }

  if (!target && !editing) return (
    <button onClick={() => { setDraft(''); setEditing(true) }} style={{
      marginTop: 14, width: '100%', background: 'rgba(56,189,248,0.08)', border: '1px dashed rgba(56,189,248,0.35)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12.5, fontWeight: 600, color: '#7dd3fc', cursor: 'pointer',
    }}>+ Définir un budget cible (enveloppe max du voyage)</button>
  )

  if (editing) return (
    <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="number" min="0" autoFocus placeholder="Ex: 3500"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        style={{
          flex: 1, minHeight: 38, borderRadius: 10, border: '1.5px solid rgba(56,189,248,0.3)',
          background: '#061528', color: '#e8f4fd', fontSize: 14, fontWeight: 600, padding: '0 12px',
        }}
      />
      <span style={{ fontSize: 13, color: '#8fa8c4', fontWeight: 600 }}>CHF</span>
      <button onClick={commit} style={{
        background: '#38bdf8', color: '#0d1f3c', border: 'none', borderRadius: 10,
        padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
      }}>OK</button>
    </div>
  )

  const ratio = target > 0 ? engaged / target : 0
  const pct = Math.min(100, Math.round(ratio * 100))
  const color = ratio < 0.75 ? '#4ade80' : ratio <= 0.95 ? '#fbbf24' : '#f87171'
  const remaining = target - engaged

  return (
    <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#e8f4fd' }}>
          {fmtNum(engaged)} / {fmtNum(target)} CHF engagés
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color }}>
            {remaining >= 0 ? `reste ${fmtNum(remaining)} CHF` : `dépassé de ${fmtNum(Math.abs(remaining))} CHF`}
          </span>
          <button onClick={() => { setDraft(target); setEditing(true) }} title="Modifier le budget cible" style={{
            background: 'none', border: 'none', color: '#8fa8c4', cursor: 'pointer', padding: 2, display: 'flex',
          }}><PencilIcon size={12} /></button>
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: color, transition: 'width 0.4s ease, background 0.4s ease' }} />
      </div>
    </div>
  )
}

function StatCard({ label, value, color, bold }) {
  return (
    <div style={{ flex: 1, minWidth: 130, background: color + '11', borderRadius: 10, padding: '10px 14px', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color: '#8fa8c4', marginBottom: 2 }}>{label}</div>
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
  background: '#0a2a52', borderRadius: 18, padding: 24,
  maxWidth: 700, width: '100%',
  boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
  maxHeight: '90vh', overflowY: 'auto',
  animation: 'modalIn 0.18s ease',
}
const closeBtn = {
  background: 'rgba(255,255,255,0.06)', border: 'none', width: 32, height: 32,
  borderRadius: '50%', fontSize: 20, cursor: 'pointer', color: '#8fa8c4',
}
const th = { padding: '6px 8px', textAlign: 'left', fontWeight: 600 }
const td = { padding: '8px 8px', verticalAlign: 'top' }
