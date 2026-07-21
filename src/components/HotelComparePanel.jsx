import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { haversineKm } from '../utils/geo'
import { CloseIcon, ScalesIcon, MapIcon } from './icons'

// Comparaison d'hôtels — au sein d'une étape, et entre itinéraires pour la même destination.
// Reprend le langage visuel de ComparePanel : colonnes, ✓ vert sur le meilleur critère.

const norm = s => (s || '').trim().toLowerCase()

function loadHotelsForItin(itinId, stepId) {
  try {
    const raw = JSON.parse(localStorage.getItem(`th_budget_${itinId}`) || '{}')
    const val = raw[stepId]
    if (Array.isArray(val)) return val
    if (val && typeof val === 'object') return [{ ...val, id: `${itinId}-${stepId}`, selected: true }]
    return []
  } catch { return [] }
}

function gatherCandidates(step, activeItin, getHotels, itineraries, getAllStepsForCompare) {
  const list = []
  // Hôtels de l'itinéraire actif
  for (const h of getHotels(step.id) || []) {
    if (h.name || h.address) list.push({ ...h, itin: activeItin, isActive: true })
  }
  // Même destination dans les autres itinéraires (match sur le nom d'étape)
  for (const itin of itineraries) {
    if (itin.id === activeItin.id) continue
    const otherSteps = getAllStepsForCompare([itin.id]) || []
    const match = otherSteps.find(s => norm(s.nom) === norm(step.nom))
    if (!match) continue
    for (const h of loadHotelsForItin(itin.id, match.id)) {
      if (h.name || h.address) list.push({ ...h, itin, isActive: false })
    }
  }
  return list
}

function Thumb({ hotel }) {
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
      {hotel.photo_url ? (
        <img src={hotel.photo_url} alt={hotel.name} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.style.display = 'none' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(56,189,248,0.35)' }}><svg width="30" height="30" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M2 15.5V6"/><path d="M2 12.5h16V15.5"/><path d="M2 12.5V9.8h6.8v2.7"/><circle cx="5.3" cy="8.2" r="1.4"/><path d="M9.8 9.8h4.7a3.5 3.5 0 0 1 3.5 3.5"/></svg></div>
      )}
      {hotel.rating != null && (
        <span style={{
          position: 'absolute', top: 6, right: 6,
          background: '#fbbf24', color: '#78350f', fontWeight: 800, fontSize: 11,
          borderRadius: 8, padding: '2px 7px', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }}>★ {hotel.rating}</span>
      )}
      {hotel.selected && hotel.isActive && (
        <span style={{
          position: 'absolute', top: 6, left: 6,
          background: '#38bdf8', color: '#fff', fontWeight: 700, fontSize: 10,
          borderRadius: 8, padding: '2px 7px',
        }}>★ retenu</span>
      )}
    </div>
  )
}

function StatLine({ label, value, winner }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '5px 8px', borderRadius: 8,
      background: winner ? 'rgba(74,222,128,0.12)' : 'transparent',
    }}>
      <span style={{ fontSize: 11, color: '#8fa8c4' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: winner ? '#4ade80' : '#e8f4fd', display: 'flex', alignItems: 'center', gap: 4 }}>
        {value ?? '—'}
        {winner && <span style={{ fontSize: 10 }}>✓</span>}
      </span>
    </div>
  )
}

export function HotelComparePanel({ steps, activeItin, itineraries, getAllStepsForCompare, getHotels, initialStepId, isMobile, onClose, onFly }) {
  const stepOptions = steps
  const defaultStep = useMemo(() => {
    if (initialStepId) {
      const s = steps.find(x => x.id === initialStepId)
      if (s) return s
    }
    // Première étape avec ≥2 hôtels, sinon ≥1, sinon la première
    const with2 = steps.find(s => (getHotels(s.id) || []).filter(h => h.name || h.address).length >= 2)
    const with1 = steps.find(s => (getHotels(s.id) || []).filter(h => h.name || h.address).length >= 1)
    return with2 || with1 || steps[0] || null
  }, [initialStepId, steps])

  const [stepId, setStepId] = useState(defaultStep?.id || null)
  const step = steps.find(s => s.id === stepId) || defaultStep

  const candidates = useMemo(() =>
    step ? gatherCandidates(step, activeItin, getHotels, itineraries, getAllStepsForCompare) : [],
    [step?.id, activeItin.id, getHotels]
  )

  // Meilleurs critères (au moins 2 candidats pour qu'un "gagnant" ait un sens)
  const many = candidates.length >= 2
  const prices = candidates.map(h => h.price_per_night).filter(v => v > 0)
  const totals = candidates.map(h => (h.price_per_night && h.nights) ? h.price_per_night * h.nights : null).filter(v => v > 0)
  const ratings = candidates.map(h => h.rating).filter(v => v != null)
  const dists = candidates.map(h => (h.lat && h.lng && step) ? haversineKm(step.lat, step.lng, h.lat, h.lng) : null).filter(v => v != null)
  const best = {
    price: many && prices.length >= 2 ? Math.min(...prices) : null,
    total: many && totals.length >= 2 ? Math.min(...totals) : null,
    rating: many && ratings.length >= 2 ? Math.max(...ratings) : null,
    dist: many && dists.length >= 2 ? Math.min(...dists) : null,
  }

  const cardW = isMobile ? 200 : 224

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 3000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
    }} onClick={onClose}>
      <div style={{
        background: '#0d1f3c', borderRadius: 20, width: '100%', maxWidth: 760,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
        animation: 'modalIn 0.18s ease',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.09)', flexShrink: 0,
          background: '#0a2a52', borderRadius: '20px 20px 0 0',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#e8f4fd', display: 'flex', alignItems: 'center', gap: 8 }}><ScalesIcon size={17} style={{ color: '#38bdf8' }} />Comparaison des hôtels</div>
            <div style={{ fontSize: 11, color: '#8fa8c4', marginTop: 2 }}>
              {candidates.length} hôtel{candidates.length > 1 ? 's' : ''} · prix, note, distance au centre
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%',
            width: isMobile ? 44 : 32, height: isMobile ? 44 : 32, cursor: 'pointer', fontSize: 18, color: '#8fa8c4',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><CloseIcon size={15} /></button>
        </div>

        {/* Sélecteur de destination */}
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <select
            value={step?.id || ''}
            onChange={e => setStepId(e.target.value)}
            style={{
              width: '100%', minHeight: isMobile ? 44 : 36,
              borderRadius: 10, border: '1.5px solid rgba(56,189,248,0.15)', background: '#0a2a52',
              fontSize: 13, fontWeight: 600, color: '#e8f4fd', padding: '0 10px',
            }}
          >
            {stepOptions.map(s => {
              const n = (getHotels(s.id) || []).filter(h => h.name || h.address).length
              return <option key={s.id} value={s.id}>{s.nom}{n > 0 ? ` (${n} hôtel${n > 1 ? 's' : ''})` : ''}</option>
            })}
          </select>
        </div>

        {/* Cartes hôtels */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '14px 20px 20px' }}>
          {candidates.length === 0 && (
            <div style={{ textAlign: 'center', color: '#8fa8c4', fontSize: 13, padding: '32px 12px' }}>
              Aucun hôtel pour cette destination.<br />
              <span style={{ fontSize: 12 }}>Ouvre l'étape → onglet Budget → ajoute un hôtel ou colle un lien Booking.</span>
            </div>
          )}
          {candidates.length === 1 && (
            <div style={{
              background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10,
              padding: '8px 12px', fontSize: 12, color: '#fbbf24', marginBottom: 12,
            }}>
              Un seul hôtel pour l'instant — ajoutes-en un deuxième pour comparer.
            </div>
          )}
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto', WebkitOverflowScrolling: 'touch',
            paddingBottom: 6,
          }}>
            {candidates.map(hotel => {
              const total = (hotel.price_per_night && hotel.nights) ? hotel.price_per_night * hotel.nights : null
              const dist = (hotel.lat && hotel.lng && step) ? haversineKm(step.lat, step.lng, hotel.lat, hotel.lng) : null
              return (
                <div key={`${hotel.itin.id}-${hotel.id}`} style={{
                  flex: `0 0 ${cardW}px`, background: '#0a2a52', borderRadius: 12,
                  border: hotel.selected && hotel.isActive ? '2px solid #6366f1' : '1.5px solid #e5e7eb',
                  padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <Thumb hotel={hotel} />
                  <div style={{ minHeight: 34 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e8f4fd', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {hotel.name || <span style={{ color: '#8fa8c4', fontStyle: 'italic' }}>Sans nom</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
                      {!hotel.isActive && (
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#fff', background: hotel.itin.color || '#8fa8c4', borderRadius: 5, padding: '1px 6px' }}>
                          {hotel.itin.name}
                        </span>
                      )}
                      {hotel.source === 'booking' && (
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.15)', borderRadius: 5, padding: '1px 6px' }}>via Booking</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid #f3f4f6', paddingTop: 6 }}>
                    <StatLine label="CHF / nuit"
                      value={hotel.price_per_night > 0 ? `${hotel.price_per_night}` : null}
                      winner={best.price != null && hotel.price_per_night === best.price} />
                    <StatLine label="Total séjour"
                      value={total ? `${total.toLocaleString('fr-FR')} CHF` : null}
                      winner={best.total != null && total === best.total} />
                    <StatLine label="Note"
                      value={hotel.rating != null ? `★ ${hotel.rating}` : null}
                      winner={best.rating != null && hotel.rating === best.rating} />
                    <StatLine label="Dist. centre"
                      value={dist != null ? `${dist < 10 ? dist.toFixed(1) : Math.round(dist)} km` : null}
                      winner={best.dist != null && dist === best.dist} />
                  </div>

                  {hotel.lat && hotel.lng && hotel.isActive && (
                    <button
                      onClick={() => { onFly?.(hotel.lat, hotel.lng); onClose() }}
                      style={{
                        background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: 'none', borderRadius: 8,
                        minHeight: isMobile ? 44 : 32, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}
                     ><MapIcon size={13} style={{ display: 'inline-block', verticalAlign: -2, marginRight: 5 }} />Voir sur la carte</button>
                  )}
                  {hotel.booking_url && (
                    <a href={hotel.booking_url} target="_blank" rel="noreferrer" style={{
                      textAlign: 'center', background: 'rgba(255,255,255,0.06)', color: '#cfe2f5', borderRadius: 8,
                      minHeight: isMobile ? 44 : 32, lineHeight: isMobile ? '44px' : '32px',
                      fontSize: 12, fontWeight: 700, textDecoration: 'none',
                    }}>Ouvrir sur Booking</a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
