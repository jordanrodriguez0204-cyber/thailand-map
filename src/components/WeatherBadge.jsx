import { useState, useEffect } from 'react'
import { CLIMATE_AUGUST, WMO_ICONS } from '../data/destinations'

export function WeatherBadge({ step }) {
  const [live, setLive] = useState(null)
  const climate = CLIMATE_AUGUST[step.nom]

  useEffect(() => {
    let cancelled = false
    async function fetchWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${step.lat}&longitude=${step.lng}&current=temperature_2m,weathercode,relative_humidity_2m&timezone=auto`
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setLive(data.current)
      } catch {}
    }
    fetchWeather()
    return () => { cancelled = true }
  }, [step.lat, step.lng])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Live weather */}
      {live && (
        <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>{WMO_ICONS[live.weathercode] || '🌤️'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{Math.round(live.temperature_2m)}°C</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Actuellement · {live.relative_humidity_2m}% humidité</div>
          </div>
        </div>
      )}

      {/* August average */}
      {climate && (
        <div style={{ background: '#fffbeb', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>{climate.icon}</span>
            <div>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Août en moyenne</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 12, color: '#374151' }}>
            <span>🌡️ Max : <strong>{climate.max}°C</strong></span>
            <span>❄️ Min : <strong>{climate.min}°C</strong></span>
            <span>💧 Pluie : <strong>{climate.rain} j/mois</strong></span>
            <span>💦 Humidité : <strong>{climate.humid}%</strong></span>
            <span style={{ gridColumn: '1/-1' }}>☀️ UV : <strong>{climate.uv}</strong></span>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>{climate.desc}</div>
        </div>
      )}
    </div>
  )
}
