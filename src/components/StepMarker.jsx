import { useMemo } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { CATEGORIES } from '../constants'

export function StepMarker({ step, selected, flash, onClick }) {
  const cat = CATEGORIES[step.categorie] || CATEGORIES.ville
  const icon = useMemo(() => {
    const size = selected ? 40 : 32
    const ring = flash ? `box-shadow:0 0 0 4px #fbbf24,0 0 0 8px rgba(251,191,36,0.3),0 4px 12px rgba(0,0,0,0.3);` : selected ? `box-shadow:0 0 0 3px #fff,0 0 0 6px ${cat.color},0 4px 16px rgba(0,0,0,0.4);` : `box-shadow:0 2px 8px rgba(0,0,0,0.3);`
    return L.divIcon({
      className: '',
      html: `<div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${cat.color};
        border:2px solid rgba(255,255,255,0.9);
        ${ring}
        display:flex;align-items:center;justify-content:center;
        font-size:${selected ? 16 : 13}px;font-weight:700;color:#fff;
        cursor:pointer;transition:all 0.25s;
        position:relative;
      ">
        ${step.ordre}
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
  }, [step.ordre, cat.color, selected, flash])

  return (
    <Marker position={[step.lat, step.lng]} icon={icon} eventHandlers={{ click: onClick }}>
      <Tooltip direction="top" offset={[0, -8]} opacity={0.97} permanent={false}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{step.nom}</div>
        <div style={{ fontSize: 11, color: '#666', marginTop: 1 }}>{cat.emoji} {step.dates}</div>
      </Tooltip>
    </Marker>
  )
}
