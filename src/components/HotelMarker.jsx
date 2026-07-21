import { memo, useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { MetroWidget } from './MetroWidget'

const BED_SVG = `<svg width="12" height="12" viewBox="0 0 20 20" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2 15V6"/><path d="M2 12h16v3"/><path d="M2 12V9.5h6.5V12"/><circle cx="5.2" cy="8" r="1.3" fill="#fff" stroke="none"/><path d="M9.5 9.5H15A3 3 0 0 1 18 12"/></svg>`

function makeIcon(selected) {
  return L.divIcon({
    className: '',
    html: `<div class="pin-drop" style="
      background:#4ade80;
      border:2px solid ${selected ? '#fff' : 'rgba(255,255,255,0.8)'};
      border-radius:50%;
      width:24px;height:24px;display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 0 3px rgba(74,222,128,${selected ? 0.5 : 0.3}),0 3px 10px rgba(0,0,0,0.4);
      cursor:pointer;
    ">${BED_SVG}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -28],
  })
}

function HotelMarkerInner({ stepNom, hotel, selected, onDelete, onOpenStep }) {
  if (!hotel.lat || !hotel.lng) return null

  const total = hotel.price_per_night && hotel.nights
    ? hotel.price_per_night * hotel.nights : null

  const icon = useMemo(() => makeIcon(selected), [selected])

  return (
    <Marker position={[hotel.lat, hotel.lng]} icon={icon}>
      <Popup closeButton={false} minWidth={230} maxWidth={270}>
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '2px 0' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 13.5, color: '#e8f4fd' }}>
              {hotel.name || 'Hôtel sans nom'}
            </span>
            {selected && <span style={{ fontSize: 10, background: 'rgba(56,189,248,0.15)', color: '#38bdf8', borderRadius: 5, padding: '1px 5px', fontWeight: 700 }}>★ retenu</span>}
          </div>
          <div style={{ fontSize: 11, color: '#8fa8c4', marginBottom: 8 }}>
            {stepNom}
          </div>

          {/* Adresse géocodée */}
          {hotel.geocoded_name && (
            <div style={{ fontSize: 11, color: '#8fa8c4', marginBottom: 6, fontStyle: 'italic' }}>
              {hotel.geocoded_name}
            </div>
          )}

          {/* Prix */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {hotel.price_per_night && (
              <span style={{ fontSize: 11, background: 'rgba(56,189,248,0.12)', color: '#7dd3fc', borderRadius: 6, padding: '2px 8px' }}>
                {hotel.price_per_night} CHF/nuit
              </span>
            )}
            {hotel.nights && (
              <span style={{ fontSize: 11, background: 'rgba(74,222,128,0.12)', color: '#4ade80', borderRadius: 6, padding: '2px 8px' }}>
                {hotel.nights} nuit{hotel.nights > 1 ? 's' : ''}
              </span>
            )}
            {total && (
              <span style={{ fontSize: 11, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>
                = {total} CHF
              </span>
            )}
          </div>

          {/* Métro — 3 stations les plus proches via OSRM */}
          <div style={{ marginBottom: 8 }}>
            <MetroWidget lat={hotel.lat} lng={hotel.lng} compact={true} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6 }}>
            {onOpenStep && (
              <button
                onClick={onOpenStep}
                style={{
                  flex: 1, background: 'rgba(56,189,248,0.15)', color: '#38bdf8',
                  border: 'none', borderRadius: 8, padding: '6px 8px',
                  cursor: 'pointer', fontSize: 11, fontWeight: 600,
                }}
              >
                Modifier
              </button>
            )}
            {onDelete && !selected && (
              <button
                onClick={onDelete}
                style={{
                  flex: 1, background: 'rgba(248,113,113,0.12)', color: '#f87171',
                  border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '6px 8px',
                  cursor: 'pointer', fontSize: 11, fontWeight: 600,
                }}
              >
                Retirer
              </button>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

export const HotelMarker = memo(HotelMarkerInner, (prev, next) =>
  prev.selected === next.selected &&
  prev.stepNom === next.stepNom &&
  prev.hotel.id === next.hotel.id &&
  prev.hotel.lat === next.hotel.lat &&
  prev.hotel.lng === next.hotel.lng &&
  prev.hotel.name === next.hotel.name &&
  prev.hotel.price_per_night === next.hotel.price_per_night &&
  prev.hotel.nights === next.hotel.nights &&
  prev.hotel.geocoded_name === next.hotel.geocoded_name
)
