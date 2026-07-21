export function HotelPanel({ steps, getHotels, onClose, onFly }) {
  const entries = steps.flatMap(s => {
    const hotels = getHotels ? getHotels(s.id) : []
    return hotels.map(h => ({ step: s, hotel: h }))
  }).filter(({ hotel }) => hotel.name || hotel.address)

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>🏨 Hébergements</h2>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        {entries.length === 0 ? (
          <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
            Aucun hôtel renseigné.<br />
            <span style={{ fontSize: 12 }}>Clique sur une étape → onglet Budget → ajoute un hôtel</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.map(step => {
              const hotels = (getHotels ? getHotels(step.id) : []).filter(h => h.name || h.address)
              if (!hotels.length) return null
              return (
                <div key={step.id}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
                    Étape {step.ordre} — {step.nom}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {hotels.map(hotel => {
                      const total = hotel.price_per_night && hotel.nights ? hotel.price_per_night * hotel.nights : null
                      const hasPin = hotel.lat && hotel.lng
                      return (
                        <div key={hotel.id} style={{
                          background: hotel.selected ? '#f5f3ff' : '#f9fafb',
                          borderRadius: 10, padding: '10px 12px',
                          borderLeft: `4px solid ${hotel.selected ? '#6366f1' : hasPin ? '#22c55e' : '#e5e7eb'}`,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>
                                  {hotel.name || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sans nom</span>}
                                </div>
                                {hotel.selected && (
                                  <span style={{ fontSize: 10, background: '#ede9fe', color: '#6366f1', borderRadius: 5, padding: '1px 6px', fontWeight: 700 }}>★ sélectionné</span>
                                )}
                              </div>
                              {hotel.address && <div style={{ fontSize: 12, color: '#6b7280' }}>📍 {hotel.address}</div>}
                              <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                                {hotel.price_per_night && (
                                  <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', borderRadius: 5, padding: '2px 7px' }}>
                                    {hotel.price_per_night} CHF/nuit
                                  </span>
                                )}
                                {hotel.nights && (
                                  <span style={{ fontSize: 11, background: '#f0fdf4', color: '#166534', borderRadius: 5, padding: '2px 7px' }}>
                                    {hotel.nights} nuit{hotel.nights > 1 ? 's' : ''}
                                  </span>
                                )}
                                {total && (
                                  <span style={{ fontSize: 11, background: '#fef9c3', color: '#713f12', borderRadius: 5, padding: '2px 7px', fontWeight: 700 }}>
                                    = {total} CHF
                                  </span>
                                )}
                              </div>
                            </div>
                            {hasPin && (
                              <button
                                onClick={() => { onFly(hotel.lat, hotel.lng); onClose() }}
                                style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', flexShrink: 0, fontWeight: 600 }}
                                title="Voir sur la carte"
                              >
                                🗺️
                              </button>
                            )}
                          </div>
                          {!hasPin && hotel.address && (
                            <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 5 }}>
                              ⚠️ Non géolocalisé — ouvre l'étape et clique 📌
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
  background: '#fff', borderRadius: 18, padding: 22,
  maxWidth: 440, width: '100%',
  boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
  maxHeight: '85vh', overflowY: 'auto',
}
const closeBtn = {
  background: '#f3f4f6', border: 'none', width: 32, height: 32,
  borderRadius: '50%', fontSize: 20, cursor: 'pointer', color: '#6b7280',
}
