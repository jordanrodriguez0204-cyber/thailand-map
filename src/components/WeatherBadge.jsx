import { useState, useEffect } from 'react'
import { CLIMATE_AUGUST, WMO_ICONS } from '../data/destinations'

const DAY_LABELS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']

export function WeatherBadge({ step }) {
  const [live, setLive] = useState(null)
  const [daily, setDaily] = useState(null)
  const climate = CLIMATE_AUGUST[step.nom]

  useEffect(() => {
    let cancelled = false
    async function fetchWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${step.lat}&longitude=${step.lng}`
          + `&current=temperature_2m,weathercode,relative_humidity_2m`
          + `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode`
          + `&forecast_days=16&timezone=auto`
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setLive(data.current)
          setDaily(data.daily)
        }
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

      {/* Prévisions 16 jours (couvre le début du voyage dès fin juillet) */}
      {daily?.time?.length > 0 && (
        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            📅 Prévisions {daily.time.length} jours
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
            {daily.time.map((iso, i) => {
              const d = new Date(iso)
              const isTrip = iso >= '2026-08-08' && iso <= '2026-08-31'
              return (
                <div key={iso} style={{
                  flex: '0 0 52px', textAlign: 'center',
                  background: isTrip ? '#ede9fe' : '#fff',
                  border: isTrip ? '1px solid #c7d2fe' : '1px solid #f3f4f6',
                  borderRadius: 8, padding: '6px 2px',
                }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: isTrip ? '#6366f1' : '#6b7280' }}>
                    {DAY_LABELS[d.getDay()]} {d.getDate()}
                  </div>
                  <div style={{ fontSize: 17, margin: '2px 0' }}>{WMO_ICONS[daily.weathercode[i]] || '🌤️'}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{Math.round(daily.temperature_2m_max[i])}°</div>
                  <div style={{ fontSize: 10.5, color: '#6b7280' }}>{Math.round(daily.temperature_2m_min[i])}°</div>
                  {daily.precipitation_probability_max?.[i] != null && (
                    <div style={{ fontSize: 10, color: daily.precipitation_probability_max[i] >= 60 ? '#0891b2' : '#9ca3af', fontWeight: 600 }}>
                      💧{daily.precipitation_probability_max[i]}%
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 4, fontSize: 10.5, color: '#9ca3af' }}>
            Les jours du voyage apparaissent en violet dès qu'ils entrent dans la fenêtre de prévision.
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
