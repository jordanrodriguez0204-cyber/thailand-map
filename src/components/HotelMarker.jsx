import { memo, useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { MetroWidget } from './MetroWidget'

function makeIcon(selected) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:#fff;
      border:2.5px solid ${selected ? '#6366f1' : '#d1d5db'};
      border-radius:10px;
      width:34px;height:34px;display:flex;align-items:center;justify-content:center;
      font-size:18px;
      box-shadow:0 3px 12px ${selected ? 'rgba(99,102,241,0.4)' : 'rgba(0,0,0,0.1)'};
      cursor:pointer;
    ">🏨</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -38],
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
            <span style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>
              🏨 {hotel.name || 'Hôtel sans nom'}
            </span>
            {selected && <span style={{ fontSize: 10, background: '#ede9fe', color: '#6366f1', borderRadius: 5, padding: '1px 5px', fontWeight: 700 }}>★ retenu</span>}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>
            📍 {stepNom}
          </div>

          {/* Adresse géocodée */}
          {hotel.geocoded_name && (
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontStyle: 'italic' }}>
              {hotel.geocoded_name}
            </div>
          )}

          {/* Prix */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {hotel.price_per_night && (
              <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', borderRadius: 6, padding: '2px 8px' }}>
                {hotel.price_per_night} CHF/nuit
              </span>
            )}
            {hotel.nights && (
              <span style={{ fontSize: 11, background: '#f0fdf4', color: '#166534', borderRadius: 6, padding: '2px 8px' }}>
                {hotel.nights} nuit{hotel.nights > 1 ? 's' : ''}
              </span>
            )}
            {total && (
              <span style={{ fontSize: 11, background: '#fef9c3', color: '#713f12', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>
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
                  flex: 1, background: '#eef2ff', color: '#4f46e5',
                  border: 'none', borderRadius: 8, padding: '6px 8px',
                  cursor: 'pointer', fontSize: 11, fontWeight: 600,
                }}
              >
                ✏️ Modifier
              </button>
            )}
            {onDelete && !selected && (
              <button
                onClick={onDelete}
                style={{
                  flex: 1, background: '#fee2e2', color: '#dc2626',
                  border: 'none', borderRadius: 8, padding: '6px 8px',
                  cursor: 'pointer', fontSize: 11, fontWeight: 600,
                }}
              >
                🗑 Retirer
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
