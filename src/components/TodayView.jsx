import { createPortal } from 'react-dom'
import { CategoryIcon, BedIcon, MapIcon, ExternalIcon, TransportIcon, CompassIcon } from './icons'
import { WeatherBadge } from './WeatherBadge'
import { TRANSPORT_MODES } from '../data/destinations'
import { parseStepDates, stepForDate, nextStepAfter, tripWindow } from '../utils/tripDates'

// Vue « Aujourd'hui » — l'écran qui répond tout seul à la question « qu'est-ce qui se passe ? » :
// étape du jour, hôtel (adresse + itinéraire), prochain déplacement, météo. Zéro édition.

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function mapsUrl(hotel) {
  if (hotel.lat && hotel.lng) return `https://www.google.com/maps/search/?api=1&query=${hotel.lat},${hotel.lng}`
  const q = encodeURIComponent([hotel.name, hotel.address].filter(Boolean).join(', '))
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

export function TodayView({ steps, subOf = {}, getSelectedHotel, getSegment, onShowMap, onFly, isMobile, date = new Date() }) {
  const today = stepForDate(steps, date)
  const next = nextStepAfter(steps, date)
  const window_ = tripWindow(steps)
  // Jour d'excursion : on dort à l'étape mère → son hôtel prime si l'excursion n'en a pas
  const excParent = today && subOf[today.id] ? steps.find(s => s.id === subOf[today.id]) : null
  const ownHotel = today ? getSelectedHotel(today.id) : null
  const hotel = ownHotel?.name ? ownHotel : (excParent ? getSelectedHotel(excParent.id) : ownHotel)
  const hotelFromParent = !ownHotel?.name && excParent && hotel?.name
  const seg = today && next ? getSegment(today.id, next.id) : null
  const nextDates = next ? parseStepDates(next.dates) : null
  const tm = seg?.mode ? TRANSPORT_MODES[seg.mode] : null

  const dateLabel = `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`
  const beforeTrip = window_ && date < window_.start
  const daysLeft = beforeTrip ? Math.ceil((window_.start - date) / 86400000) : null

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2500, overflowY: 'auto',
      background: 'linear-gradient(160deg, #0d1f3c 0%, #0a2a52 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 16px calc(24px + env(safe-area-inset-bottom))',
    }}>
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* En-tête date */}
        <div style={{ textAlign: 'center', marginBottom: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 1.2 }}>
            Aujourd'hui
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#e8f4fd', textTransform: 'capitalize' }}>{dateLabel}</div>
        </div>

        {beforeTrip && (
          <Card>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e8f4fd', marginBottom: 4 }}>
                Départ dans {daysLeft} jour{daysLeft > 1 ? 's' : ''} 🇹🇭
              </div>
              <div style={{ fontSize: 12.5, color: '#8fa8c4' }}>
                Le voyage commence le {window_.start.getDate()} {MONTHS[window_.start.getMonth()]}.
                Cette vue s'affichera automatiquement pendant le voyage.
              </div>
            </div>
          </Card>
        )}

        {!beforeTrip && !today && (
          <Card>
            <div style={{ fontSize: 13, color: '#8fa8c4', textAlign: 'center', padding: '8px 0' }}>
              Pas d'étape prévue aujourd'hui.
            </div>
          </Card>
        )}

        {/* Étape du jour */}
        {today && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CategoryIcon category={today.categorie} size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#e8f4fd' }}>{today.nom}</div>
                <div style={{ fontSize: 12, color: '#8fa8c4' }}>
                  {today.dates}
                  {excParent && <span style={{ color: '#fbbf24', fontWeight: 600 }}> · excursion depuis {excParent.nom}</span>}
                </div>
              </div>
            </div>
            {today.notes && (
              <div style={{ fontSize: 12.5, color: '#cfe2f5', marginTop: 8, lineHeight: 1.5 }}>{today.notes}</div>
            )}
          </Card>
        )}

        {/* Hôtel du jour */}
        {today && (
          <Card title={<><BedIcon size={14} style={{ color: '#4ade80' }} /> Hôtel{hotelFromParent ? ` — à ${excParent.nom}` : ''}</>}>
            {hotel?.name ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: '#e8f4fd' }}>{hotel.name}</span>
                  {hotel.rating != null && <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>★ {hotel.rating}</span>}
                  <span style={{ fontSize: 11, fontWeight: 700, color: hotel.booked ? '#4ade80' : '#fbbf24' }}>
                    {hotel.booked ? '✓ réservé' : 'à réserver'}
                  </span>
                </div>
                {(hotel.geocoded_name || hotel.address) && (
                  <div style={{ fontSize: 12, color: '#8fa8c4', marginTop: 4, lineHeight: 1.4 }}>
                    {hotel.address || hotel.geocoded_name}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <LinkBtn href={mapsUrl(hotel)} primary>
                    <MapIcon size={13} /> Itinéraire (Google Maps)
                  </LinkBtn>
                  {hotel.booking_url && (
                    <LinkBtn href={hotel.booking_url}><ExternalIcon size={12} /> Booking</LinkBtn>
                  )}
                  {hotel.lat && hotel.lng && (
                    <button onClick={() => { onFly?.(hotel.lat, hotel.lng); onShowMap() }} style={btnGhost}>
                      <CompassIcon size={13} /> Voir sur la carte
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12.5, color: '#8fa8c4' }}>Aucun hôtel retenu pour cette étape.</div>
            )}
          </Card>
        )}

        {/* Prochain déplacement */}
        {next && (
          <Card title={<><TransportIcon mode={seg?.mode || 'plane'} size={14} style={{ color: tm?.color || '#a78bfa' }} /> Prochain déplacement</>}>
            <div style={{ fontSize: 13.5, color: '#e8f4fd', fontWeight: 600 }}>
              {next.nom}
              <span style={{ color: '#8fa8c4', fontWeight: 500 }}>
                {nextDates ? ` · le ${nextDates.start.getDate()} ${MONTHS[nextDates.start.getMonth()]}` : ` · ${next.dates}`}
                {tm ? ` · ${tm.label.toLowerCase()}` : ''}
                {seg?.price > 0 ? ` · ${seg.price} CHF` : ''}
              </span>
            </div>
          </Card>
        )}

        {/* Météo de l'étape du jour */}
        {today && (
          <Card title="Météo">
            <WeatherBadge step={today} />
          </Card>
        )}

        {/* Accès à l'app complète */}
        <button
          onClick={onShowMap}
          style={{
            marginTop: 4, minHeight: isMobile ? 48 : 42, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: '#38bdf8', color: '#0d1f3c', fontSize: 14.5, fontWeight: 800,
          }}
        >Voir la carte</button>
      </div>
    </div>,
    document.body
  )
}

function Card({ title, children }) {
  return (
    <div style={{
      background: '#0e3468', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 16,
      padding: '14px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    }}>
      {title && (
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#8fa8c4', textTransform: 'uppercase', letterSpacing: 0.8,
          marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
        }}>{title}</div>
      )}
      {children}
    </div>
  )
}

function LinkBtn({ href, primary, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
      background: primary ? '#38bdf8' : 'rgba(255,255,255,0.07)',
      color: primary ? '#0d1f3c' : '#cfe2f5',
      borderRadius: 9, padding: '8px 12px', fontSize: 12.5, fontWeight: 700, minHeight: 20,
    }}>{children}</a>
  )
}

const btnGhost = {
  display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
  background: 'rgba(255,255,255,0.07)', color: '#cfe2f5', border: 'none',
  borderRadius: 9, padding: '8px 12px', fontSize: 12.5, fontWeight: 700,
}
