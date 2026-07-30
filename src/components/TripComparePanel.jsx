import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatDuration } from '../data/destinations'
import { transportTotals } from '../utils/tripDerive'
import { fmtCHF } from '../utils/money'
import { ScalesIcon, CloseIcon, CheckIcon, TransportIcon, ExternalIcon, Avatar } from './icons'
import { USERS } from '../constants'

const USER_COLOR = { Jordan: '#38bdf8', Abbey: '#4ade80' }

// Comparateur du voyage, version simple : par étape, les hôtels avec leur total,
// le moins cher surligné automatiquement. ★ = retenu pour le budget (même que
// Budget/HotelPanel), J/A = le choix de chacun. Totaux Transports + Hôtels + Voyage en pied.

export function TripComparePanel({ steps, mainSteps, excursions = [], getHotels, selectHotel, setUserPick, currentUser, getSegment, initialStepId, isMobile, onToast, onClose }) {
  // Ouverture depuis une étape précise : scroll + mise en avant temporaire de sa section
  const sectionRefs = useRef({})
  const [highlightId, setHighlightId] = useState(initialStepId || null)
  useEffect(() => {
    if (!initialStepId) return
    sectionRefs.current[initialStepId]?.scrollIntoView({ block: 'start' })
    const t = setTimeout(() => setHighlightId(null), 1800)
    return () => clearTimeout(t)
  }, [initialStepId])

  // Animation "pop" sur le bouton qu'on vient de valider (remount via key pour rejouer)
  const [pop, setPop] = useState(null) // { id: `${hotelId}:${quoi}`, t }

  function validateStar(step, h) {
    selectHotel(step.id, h.id)
    setPop({ id: `${h.id}:star`, t: Date.now() })
    if (!h.selected) onToast?.('Hôtel retenu pour le budget', 'success', 2000)
  }

  function validatePick(step, h, u) {
    const wasActive = !!h.favs?.[u]
    setUserPick(step.id, h.id, u)
    setPop({ id: `${h.id}:${u}`, t: Date.now() })
    if (wasActive) onToast?.(`Choix de ${u} retiré`, 'info', 1600)
    else onToast?.(u === currentUser ? 'Ton choix est enregistré' : `Choix de ${u} enregistré`, 'success', 2000)
  }

  // Sections par étape (ordre de l'itinéraire)
  const sections = useMemo(() => steps.map(step => {
    const hotels = (getHotels(step.id) || []).filter(h => h.name || h.address)
    const rows = hotels.map(h => ({
      ...h,
      total: (h.price_per_night > 0 && h.nights > 0) ? h.price_per_night * h.nights : null,
    }))
    const priced = rows.filter(r => r.total != null)
    const minTotal = priced.length ? Math.min(...priced.map(r => r.total)) : null
    const chosen = rows.find(r => r.selected) || null
    return { step, rows, minTotal, pricedCount: priced.length, chosenTotal: chosen?.total ?? null }
  }), [steps, getHotels])

  const withHotels = sections.filter(s => s.rows.length > 0)

  // Transports : étapes principales consécutives + aller-retours d'excursions
  const transport = useMemo(
    () => transportTotals(mainSteps ?? steps, excursions, getSegment),
    [mainSteps, steps, excursions, getSegment]
  )

  const sumChosen = withHotels.reduce((a, s) => a + (s.chosenTotal ?? 0), 0)

  // Accord / désaccord J-A par étape
  const agree = withHotels.filter(s => {
    const picks = USERS.map(u => s.rows.find(r => r.favs?.[u])?.id)
    return picks.every(Boolean) && new Set(picks).size === 1
  }).length
  const disagree = withHotels.filter(s => {
    const picks = USERS.map(u => s.rows.find(r => r.favs?.[u])?.id)
    return picks.every(Boolean) && new Set(picks).size > 1
  }).length

  const notes = []
  if (agree > 0) notes.push(`vous êtes d'accord sur ${agree} étape${agree > 1 ? 's' : ''}`)
  if (disagree > 0) notes.push(`à départager sur ${disagree}`)
  const noPrice = withHotels.filter(s => s.pricedCount === 0).length
  if (noPrice > 0) notes.push(`${noPrice} étape${noPrice > 1 ? 's' : ''} sans prix`)

  const popStyle = id => pop?.id === id ? { animation: 'popValidate 0.35s ease' } : null
  const popKey = id => pop?.id === id ? pop.t : undefined

  return createPortal(
    <div style={overlay} onClick={onClose}>
      <div style={{ ...panel, maxWidth: 860 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.09)', flexShrink: 0,
          background: '#0a2a52', borderRadius: '20px 20px 0 0',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#e8f4fd', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ScalesIcon size={17} style={{ color: '#38bdf8' }} />Comparateur du voyage
            </div>
            <div style={{ fontSize: 11, color: '#8fa8c4', marginTop: 2 }}>
              ★ = retenu pour le budget · J/A = le choix de chacun
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%',
            width: isMobile ? 44 : 32, height: isMobile ? 44 : 32, cursor: 'pointer', color: '#8fa8c4',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><CloseIcon size={15} /></button>
        </div>

        {/* Corps : étapes + hôtels */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '10px 20px 14px' }}>
          {withHotels.length === 0 && (
            <div style={{ textAlign: 'center', color: '#8fa8c4', fontSize: 13, padding: '32px 12px' }}>
              Aucun hôtel enregistré pour l'instant.<br />
              <span style={{ fontSize: 12 }}>Ouvre une étape → onglet Budget → ajoute des hôtels ou colle des liens Booking.</span>
            </div>
          )}
          {withHotels.map(({ step, rows, minTotal, pricedCount }) => (
            <div
              key={step.id}
              ref={el => { sectionRefs.current[step.id] = el }}
              style={{
                marginBottom: 14, borderRadius: 10, scrollMarginTop: 8,
                background: highlightId === step.id ? 'rgba(56,189,248,0.08)' : 'transparent',
                transition: 'background 0.6s ease',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 8, padding: '6px 2px 4px',
                borderBottom: '1px solid rgba(56,189,248,0.15)', marginBottom: 6,
              }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#e8f4fd' }}>{step.nom}</span>
                <span style={{ fontSize: 11, color: '#8fa8c4' }}>{step.dates}</span>
              </div>
              {rows.map(h => {
                const winner = h.total != null && h.total === minTotal && pricedCount >= 2
                return (
                  <div key={h.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: isMobile ? '8px 6px' : '5px 6px', borderRadius: 8,
                    background: winner ? 'rgba(74,222,128,0.08)' : 'transparent',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#e8f4fd' }}>
                        {h.name || <span style={{ color: '#8fa8c4', fontStyle: 'italic' }}>Sans nom</span>}
                      </span>
                      <span style={{ fontSize: 11, color: '#8fa8c4', marginLeft: 6 }}>
                        {h.booked && <span style={{ color: '#4ade80', fontWeight: 700 }}>✓ réservé&nbsp;&nbsp;</span>}
                        {h.rating != null && <span style={{ color: '#fbbf24', fontWeight: 700 }}>★ {h.rating}&nbsp;&nbsp;</span>}
                        {h.price_per_night > 0 ? `${fmtCHF(h.price_per_night)}/nuit` : 'prix ?'}
                        {h.nights > 0 ? ` · ${h.nights}n` : ''}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 12.5, fontWeight: 700, minWidth: 76, textAlign: 'right', flexShrink: 0,
                      color: winner ? '#4ade80' : h.total != null ? '#e8f4fd' : '#8fa8c4',
                    }}>
                      {h.total != null ? fmtCHF(h.total) : '—'}
                      {winner && <CheckIcon size={11} style={{ marginLeft: 4, verticalAlign: -1 }} />}
                    </span>
                    {USERS.map(u => {
                      const active = !!h.favs?.[u]
                      const c = USER_COLOR[u] || '#8fa8c4'
                      return (
                        <button
                          key={popKey(`${h.id}:${u}`) ?? u}
                          onClick={() => validatePick(step, h, u)}
                          title={`Choix de ${u}${u === currentUser ? ' (toi)' : ''}`}
                          style={{
                            border: active ? `1.5px solid ${c}` : '1.5px solid transparent',
                            borderRadius: 7, cursor: 'pointer', flexShrink: 0, padding: 0,
                            width: isMobile ? 40 : 30, height: isMobile ? 40 : 26,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: active ? c + '22' : 'rgba(255,255,255,0.04)',
                            opacity: active ? 1 : 0.55,
                            ...popStyle(`${h.id}:${u}`),
                          }}
                        ><Avatar name={u} size={16} /></button>
                      )
                    })}
                    <button
                      key={popKey(`${h.id}:star`) ?? 'star'}
                      onClick={() => validateStar(step, h)}
                      title={h.selected ? 'Retenu pour le budget' : 'Retenir pour le budget'}
                      style={{
                        border: 'none', borderRadius: 7, cursor: 'pointer', flexShrink: 0,
                        width: isMobile ? 40 : 30, height: isMobile ? 40 : 26, fontSize: 13, fontWeight: 700,
                        background: h.selected ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                        color: h.selected ? '#0d1f3c' : '#8fa8c4',
                        ...popStyle(`${h.id}:star`),
                      }}
                    >★</button>
                    {h.booking_url ? (
                      <a href={h.booking_url} target="_blank" rel="noreferrer" title="Ouvrir sur Booking" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        width: isMobile ? 40 : 30, height: isMobile ? 40 : 26, borderRadius: 7,
                        background: 'rgba(255,255,255,0.06)', color: '#7dd3fc',
                      }}><ExternalIcon size={12} /></a>
                    ) : (
                      <span style={{ width: isMobile ? 40 : 30, flexShrink: 0 }} />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Récap budget : 3 chiffres, c'est tout */}
        {withHotels.length > 0 && (
          <div style={{
            flexShrink: 0, padding: '12px 20px 16px', borderTop: '1px solid rgba(255,255,255,0.09)',
            background: '#0e3468', borderRadius: '0 0 20px 20px',
          }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Stat label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><TransportIcon mode="plane" size={12} />Transports</span>}
                value={fmtCHF(transport.price)}
                sub={`${transport.km.toLocaleString('fr-FR')} km · ${formatDuration(transport.durMin)}`}
                color="#f87171" />
              <Stat label="Hôtels retenus (★)" value={fmtCHF(sumChosen)}
                sub={`${withHotels.length} étape${withHotels.length > 1 ? 's' : ''}`} color="#4ade80" />
              <Stat label="Total voyage" value={fmtCHF(sumChosen + transport.price)}
                sub="transports + hôtels ★" color="#38bdf8" bold />
            </div>
            {notes.length > 0 && (
              <div style={{ fontSize: 11, color: '#8fa8c4', marginTop: 8 }}>
                {notes.join(' · ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

function Stat({ label, value, sub, color, bold }) {
  return (
    <div style={{ flex: 1, minWidth: 150, background: color + '11', borderRadius: 10, padding: '8px 12px', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 10.5, color: '#8fa8c4', marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: bold ? 18 : 15, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: '#8fa8c4', marginTop: 1, minHeight: 13 }}>{sub}</div>}
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 3000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
}
const panel = {
  background: '#0d1f3c', borderRadius: 20, width: '100%',
  maxHeight: '92vh', display: 'flex', flexDirection: 'column',
  boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
  animation: 'modalIn 0.18s ease',
}
