import { memo, useMemo } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { CATEGORIES } from '../constants'
import { CategoryIcon, categoryIconSvg } from './icons'

function hexToRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

function StepMarkerInner({ step, selected, flash, compact, hotelName, onClick }) {
  const cat = CATEGORIES[step.categorie] || CATEGORIES.ville
  const icon = useMemo(() => {
    // compact : zoom faible → cercles réduits sans badge, les îles du sud respirent
    const size = selected ? 40 : compact ? 22 : 32
    const iconSize = selected ? 19 : compact ? 12 : 16
    const halo = hexToRgba(cat.color, 0.2)
    const ring = flash
      ? `box-shadow:0 0 0 4px #fbbf24,0 0 0 8px rgba(251,191,36,0.3),0 4px 14px rgba(0,0,0,0.5);`
      : selected
        ? `box-shadow:0 0 0 4px ${hexToRgba(cat.color, 0.35)},0 0 18px ${hexToRgba(cat.color, 0.6)},0 4px 16px rgba(0,0,0,0.55);`
        : `box-shadow:0 0 0 4px ${halo},0 4px 14px rgba(0,0,0,0.5);`
    return L.divIcon({
      className: '',
      html: `<div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${cat.color};
        border:${selected ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.35)'};
        ${ring}
        display:flex;align-items:center;justify-content:center;
        cursor:pointer;transition:all 0.25s;
        position:relative;
      ">
        ${categoryIconSvg(step.categorie, iconSize, '#fff')}
        ${compact ? '' : `<div style="
          position:absolute;top:-6px;right:-6px;
          min-width:15px;height:15px;border-radius:8px;padding:0 3px;
          background:#0d1f3c;border:1.5px solid ${cat.color};
          display:flex;align-items:center;justify-content:center;
          font-size:9px;font-weight:800;color:#e8f4fd;line-height:1;
        ">${step.ordre}</div>`}
        <div style="
          position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);
          width:0;height:0;
          border-left:5px solid transparent;border-right:5px solid transparent;
          border-top:7px solid ${cat.color};
        "></div>
      </div>`,
      iconSize: [size, size + 7],
      iconAnchor: [size / 2, size + 7],
    })
  }, [step.ordre, step.categorie, cat.color, selected, flash, compact])

  return (
    <Marker position={[step.lat, step.lng]} icon={icon} eventHandlers={{ click: onClick }}>
      <Tooltip direction="top" offset={[0, -8]} opacity={0.97} permanent={false}>
        <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
          <CategoryIcon category={step.categorie} size={13} color={cat.color} />
          {step.nom}
        </div>
        <div style={{ fontSize: 11, color: '#8fa8c4', marginTop: 1 }}>{step.dates}</div>
        {hotelName && (
          <div style={{ fontSize: 11, color: '#7dd3fc', fontStyle: 'italic', marginTop: 1, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {hotelName}
          </div>
        )}
      </Tooltip>
    </Marker>
  )
}

export const StepMarker = memo(StepMarkerInner, (prev, next) =>
  prev.selected === next.selected &&
  prev.flash === next.flash &&
  prev.compact === next.compact &&
  prev.hotelName === next.hotelName &&
  prev.step.id === next.step.id &&
  prev.step.ordre === next.step.ordre &&
  prev.step.lat === next.step.lat &&
  prev.step.lng === next.step.lng &&
  prev.step.nom === next.step.nom &&
  prev.step.dates === next.step.dates &&
  prev.step.categorie === next.step.categorie
)
