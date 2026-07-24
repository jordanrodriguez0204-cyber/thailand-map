import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatDuration } from '../data/destinations'
import { transportTotals } from '../utils/tripDerive'
import { ScalesIcon, CloseIcon, CheckIcon, TransportIcon, ExternalIcon, Avatar } from './icons'
import { USERS } from '../constants'

const USER_COLOR = { Jordan: '#38bdf8', Abbey: '#4ade80' }

// Comparateur global du voyage : tous les hôtels de toutes les étapes, avec cases à cocher
// pour composer le panier à comparer. Totaux = hôtels (retenus / moins chers / plus chers
// parmi les cochés) + transports. Le ★ "retenu" est le même que dans Budget/HotelPanel.

function exclKey(itinId) { return `th_trip_compare_excl_${itinId}` }

function loadExcluded(itinId) {
  try { return new Set(JSON.parse(localStorage.getItem(exclKey(itinId)) || '[]')) }
  catch { return new Set() }
}

export function TripComparePanel({ steps, mainSteps, excursions = [], itinId, getHotels, selectHotel, setUserPick, currentUser, getSegment, initialStepId, isMobile, onClose }) {
  const [excluded, setExcluded] = useState(() => loadExcluded(itinId))

  // Ouverture depuis une étape précise : scroll + mise en avant temporaire de sa section
  const sectionRefs = useRef({})
  const [highlightId, setHighlightId] = useState(initialStepId || null)
  useEffect(() => {
    if (!initialStepId) return
    sectionRefs.current[initialStepId]?.scrollIntoView({ block: 'start' })
    const t = setTimeout(() => setHighlightId(null), 1800)
    return () => clearTimeout(t)
  }, [initialStepId])

  function toggle(hotelId) {
    setExcluded(prev => {
      const next = new Set(prev)
      if (next.has(hotelId)) next.delete(hotelId)
      else next.add(hotelId)
      localStorage.setItem(exclKey(itinId), JSON.stringify([...next]))
      return next
    })
  }

  function setAll(included) {
    const next = new Set()
    if (!included) for (const s of steps) for (const h of getHotels(s.id) || []) next.add(h.id)
    localStorage.setItem(exclKey(itinId), JSON.stringify([...next]))
    setExcluded(next)
  }

  // Sections par étape (ordre de l'itinéraire), avec stats par étape
  const sections = useMemo(() => steps.map(step => {
    const hotels = (getHotels(step.id) || []).filter(h => h.name || h.address)
    const rows = hotels.map(h => ({
      ...h,
      total: (h.price_per_night > 0 && h.nights > 0) ? h.price_per_night * h.nights : null,
      included: !excluded.has(h.id),
    }))
    const pool = rows.filter(r => r.included && r.total != null)
    const minTotal = pool.length ? Math.min(...pool.map(r => r.total)) : null
    const maxTotal = pool.length ? Math.max(...pool.map(r => r.total)) : null
    const chosen = rows.find(r => r.selected) || null
    return { step, rows, minTotal, maxTotal, chosenTotal: chosen?.total ?? null }
  }), [steps, getHotels, excluded])

  const withHotels = sections.filter(s => s.rows.length > 0)

  // Transports : étapes principales consécutives + aller-retours d'excursions
  const transport = useMemo(
    () => transportTotals(mainSteps ?? steps, excursions, getSegment),
    [mainSteps, steps, excursions, getSegment]
  )

  const sumChosen = withHotels.reduce((a, s) => a + (s.chosenTotal ?? 0), 0)
  const sumMin = withHotels.reduce((a, s) => a + (s.minTotal ?? 0), 0)
  const sumMax = withHotels.reduce((a, s) => a + (s.maxTotal ?? 0), 0)
  const noPrice = withHotels.filter(s => s.minTotal == null).length
  const noHotel = sections.length - withHotels.length

  // Scénarios par personne : son choix perso, sinon le ★ retenu de l'étape
  const scenarios = USERS.map(u => {
    let total = 0, picks = 0
    for (const s of withHotels) {
      const pick = s.rows.find(r => r.favs?.[u])
      if (pick) { picks++; total += pick.total ?? 0 }
      else total += s.chosenTotal ?? 0
    }
    return { user: u, total, picks }
  })
  const agree = withHotels.filter(s => {
    const picks = USERS.map(u => s.rows.find(r => r.favs?.[u])?.id)
    return picks.every(Boolean) && new Set(picks).size === 1
  }).length
  const disagree = withHotels.filter(s => {
    const picks = USERS.map(u => s.rows.find(r => r.favs?.[u])?.id)
    return picks.every(Boolean) && new Set(picks).size > 1
  }).length

  const fmt = v => v > 0 ? `${Math.round(v).toLocaleString('fr-FR')} CHF` : '—'

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
              Coche les hôtels à comparer · ★ = retenu pour le budget · J/A = le choix de chacun
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => setAll(true)} style={smallBtn}>Tout cocher</button>
            <button onClick={() => setAll(false)} style={smallBtn}>Tout décocher</button>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%',
              width: isMobile ? 44 : 32, height: isMobile ? 44 : 32, cursor: 'pointer', color: '#8fa8c4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><CloseIcon size={15} /></button>
          </div>
        </div>

        {/* Corps : étapes + hôtels */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '10px 20px 14px' }}>
          {withHotels.length === 0 && (
            <div style={{ textAlign: 'center', color: '#8fa8c4', fontSize: 13, padding: '32px 12px' }}>
              Aucun hôtel enregistré pour l'instant.<br />
              <span style={{ fontSize: 12 }}>Ouvre une étape → onglet Budget → ajoute des hôtels ou colle des liens Booking.</span>
            </div>
          )}
          {withHotels.map(({ step, rows, minTotal }) => (
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
                <span style={{ fontSize: 11, color: '#8fa8c4', marginLeft: 'auto' }}>
                  {rows.filter(r => r.included).length}/{rows.length} coché{rows.length > 1 ? 's' : ''}
                </span>
              </div>
              {rows.map(h => {
                const winner = h.included && h.total != null && h.total === minTotal && rows.filter(r => r.included && r.total != null).length >= 2
                return (
                  <div key={h.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: isMobile ? '8px 6px' : '5px 6px', borderRadius: 8,
                    background: winner ? 'rgba(74,222,128,0.08)' : 'transparent',
                    opacity: h.included ? 1 : 0.45,
                  }}>
                    <input
                      type="checkbox" checked={h.included} onChange={() => toggle(h.id)}
                      style={{ width: 16, height: 16, accentColor: '#38bdf8', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#e8f4fd' }}>
                        {h.name || <span style={{ color: '#8fa8c4', fontStyle: 'italic' }}>Sans nom</span>}
                      </span>
                      <span style={{ fontSize: 11, color: '#8fa8c4', marginLeft: 6 }}>
                        {h.booked && <span style={{ color: '#4ade80', fontWeight: 700 }}>✓ réservé&nbsp;&nbsp;</span>}
                        {h.rating != null && <span style={{ color: '#fbbf24', fontWeight: 700 }}>★ {h.rating}&nbsp;&nbsp;</span>}
                        {h.price_per_night > 0 ? `${h.price_per_night} CHF/n` : 'prix ?'}
                        {h.nights > 0 ? ` · ${h.nights}n` : ''}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 12.5, fontWeight: 700, minWidth: 76, textAlign: 'right', flexShrink: 0,
                      color: winner ? '#4ade80' : h.total != null ? '#e8f4fd' : '#8fa8c4',
                    }}>
                      {h.total != null ? fmt(h.total) : '—'}
                      {winner && <CheckIcon size={11} style={{ marginLeft: 4, verticalAlign: -1 }} />}
                    </span>
                    {USERS.map(u => {
                      const active = !!h.favs?.[u]
                      const c = USER_COLOR[u] || '#8fa8c4'
                      return (
                        <button
                          key={u}
                          onClick={() => setUserPick(step.id, h.id, u)}
                          title={`Choix de ${u}${u === currentUser ? ' (toi)' : ''}`}
                          style={{
                            border: active ? `1.5px solid ${c}` : '1.5px solid transparent',
                            borderRadius: 7, cursor: 'pointer', flexShrink: 0, padding: 0,
                            width: isMobile ? 40 : 30, height: isMobile ? 40 : 26,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: active ? c + '22' : 'rgba(255,255,255,0.04)',
                            opacity: active ? 1 : 0.55,
                          }}
                        ><Avatar name={u} size={16} /></button>
                      )
                    })}
                    <button
                      onClick={() => selectHotel(step.id, h.id)}
                      title={h.selected ? 'Retenu pour le budget' : 'Retenir pour le budget'}
                      style={{
                        border: 'none', borderRadius: 7, cursor: 'pointer', flexShrink: 0,
                        width: isMobile ? 40 : 30, height: isMobile ? 40 : 26, fontSize: 13, fontWeight: 700,
                        background: h.selected ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                        color: h.selected ? '#0d1f3c' : '#8fa8c4',
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

        {/* Récap budget */}
        {withHotels.length > 0 && (
          <div style={{
            flexShrink: 0, padding: '12px 20px 16px', borderTop: '1px solid rgba(255,255,255,0.09)',
            background: '#0e3468', borderRadius: '0 0 20px 20px',
          }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Stat label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><TransportIcon mode="plane" size={12} />Transports</span>}
                value={fmt(transport.price)}
                sub={`${transport.km.toLocaleString('fr-FR')} km · ${formatDuration(transport.durMin)}`}
                color="#f87171" />
              <Stat label="Hôtels retenus (★)" value={fmt(sumChosen)}
                sub={`Total voyage ${fmt(sumChosen + transport.price)}`} color="#38bdf8" bold />
              {scenarios.map(({ user, total, picks }) => (
                <Stat
                  key={user}
                  label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Avatar name={user} size={13} />Sélection {user}</span>}
                  value={fmt(total)}
                  sub={picks > 0 ? `${picks} choix perso · reste = ★` : 'aucun choix perso (= ★)'}
                  color={USER_COLOR[user] || '#8fa8c4'}
                />
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#8fa8c4', marginTop: 8 }}>
              Fourchette des cochés : {fmt(sumMin)} – {fmt(sumMax)}
              {sumChosen > 0 && sumMin > 0 && sumChosen > sumMin && ` · économie possible ${fmt(sumChosen - sumMin)}`}
              {(agree > 0 || disagree > 0) && ` · vous êtes d'accord sur ${agree} étape${agree > 1 ? 's' : ''}${disagree > 0 ? `, à départager sur ${disagree}` : ''}`}
              {noPrice > 0 && ` · ${noPrice} étape${noPrice > 1 ? 's' : ''} sans prix`}
              {noHotel > 0 && ` · ${noHotel} étape${noHotel > 1 ? 's' : ''} sans hôtel`}
            </div>
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
const smallBtn = {
  background: 'rgba(56,189,248,0.12)', color: '#7dd3fc', border: 'none', borderRadius: 8,
  padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
}
