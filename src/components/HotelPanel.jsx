import { BedIcon, ScalesIcon, CloseIcon, MapIcon, PinIcon } from './icons'
import { fmtCHF } from '../utils/money'
export function HotelPanel({ steps, getHotels, onClose, onFly, onCompare }) {
  const entries = steps.flatMap(s => {
    const hotels = getHotels ? getHotels(s.id) : []
    return hotels.map(h => ({ step: s, hotel: h }))
  }).filter(({ hotel }) => hotel.name || hotel.address)

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><BedIcon size={18} style={{ color: '#38bdf8' }} />Hôtels</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {onCompare && entries.length >= 2 && (
              <button onClick={() => onCompare(null)} style={{
                background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: 'none', borderRadius: 8,
                padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 36,
              }} ><ScalesIcon size={13} style={{ display: 'inline-block', verticalAlign: -2, marginRight: 5 }} />Comparer</button>
            )}
            <button onClick={onClose} aria-label="Fermer" style={closeBtn}><CloseIcon size={15} /></button>
          </div>
        </div>

        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: '#8fa8c4' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, color: 'rgba(56,189,248,0.4)' }}>
              <BedIcon size={32} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4fd', marginBottom: 3 }}>Aucun hôtel pour l'instant</div>
            <div style={{ fontSize: 12 }}>Ouvre une étape, onglet Budget, et ajoute ton premier hôtel.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.map(step => {
              const hotels = (getHotels ? getHotels(step.id) : []).filter(h => h.name || h.address)
              if (!hotels.length) return null
              return (
                <div key={step.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8fa8c4', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Étape {step.ordre} — {step.nom}
                    </span>
                    {onCompare && hotels.length >= 2 && (
                      <button onClick={() => onCompare(step.id)} title="Comparer les hôtels de cette étape"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#38bdf8', padding: '2px 4px' }}><ScalesIcon size={13} /></button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {hotels.map(hotel => {
                      const total = hotel.price_per_night && hotel.nights ? hotel.price_per_night * hotel.nights : null
                      const hasPin = hotel.lat && hotel.lng
                      return (
                        <div key={hotel.id} style={{
                          background: hotel.selected ? 'rgba(56,189,248,0.1)' : '#0e3468',
                          borderRadius: 10, padding: '10px 12px',
                          borderLeft: `4px solid ${hotel.selected ? '#38bdf8' : hasPin ? '#4ade80' : 'rgba(56,189,248,0.15)'}`,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                            {hotel.photo_url && (
                              <img
                                src={hotel.photo_url} alt={hotel.name} loading="lazy"
                                onError={e => { e.target.style.display = 'none' }}
                                style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                              />
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#e8f4fd' }}>
                                  {hotel.name || <span style={{ color: '#8fa8c4', fontStyle: 'italic' }}>Sans nom</span>}
                                </div>
                                {hotel.selected && (
                                  <span style={{ fontSize: 10, background: 'rgba(56,189,248,0.15)', color: '#38bdf8', borderRadius: 5, padding: '1px 6px', fontWeight: 700 }}>★ sélectionné</span>
                                )}
                                {hotel.rating != null && (
                                  <span style={{ fontSize: 10, background: '#fbbf24', color: '#78350f', borderRadius: 5, padding: '1px 6px', fontWeight: 800 }}>★ {hotel.rating}</span>
                                )}
                              </div>
                              {hotel.address && <div style={{ fontSize: 12, color: '#8fa8c4' }}>{hotel.address}</div>}
                              <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                                {hotel.price_per_night && (
                                  <span style={{ fontSize: 11, background: 'rgba(56,189,248,0.12)', color: '#7dd3fc', borderRadius: 5, padding: '2px 7px' }}>
                                    {fmtCHF(hotel.price_per_night)}/nuit
                                  </span>
                                )}
                                {hotel.nights && (
                                  <span style={{ fontSize: 11, background: 'rgba(74,222,128,0.12)', color: '#4ade80', borderRadius: 5, padding: '2px 7px' }}>
                                    {hotel.nights} nuit{hotel.nights > 1 ? 's' : ''}
                                  </span>
                                )}
                                {total && (
                                  <span style={{ fontSize: 11, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', borderRadius: 5, padding: '2px 7px', fontWeight: 700 }}>
                                    = {fmtCHF(total)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {hasPin && (
                              <button
                                onClick={() => { onFly(hotel.lat, hotel.lng); onClose() }}
                                style={{ background: '#38bdf8', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', flexShrink: 0, fontWeight: 600 }}
                                title="Voir sur la carte"
                              >
                                <MapIcon size={15} />
                              </button>
                            )}
                          </div>
                          {!hasPin && hotel.address && (
                            <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 5 }}>
                              Non géolocalisé — ouvre l'étape pour le placer sur la carte
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.45)', zIndex: 3000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
}
const panel = {
  background: '#0a2a52', borderRadius: 18, padding: 22,
  maxWidth: 440, width: '100%',
  boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
  maxHeight: '85vh', overflowY: 'auto',
  animation: 'modalIn 0.18s ease',
}
const closeBtn = {
  background: 'rgba(255,255,255,0.06)', border: 'none', width: 32, height: 32,
  borderRadius: '50%', fontSize: 20, cursor: 'pointer', color: '#8fa8c4',
}
