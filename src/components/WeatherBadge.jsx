import { useState, useEffect } from 'react'
import { CLIMATE_AUGUST } from '../data/destinations'
import { WSunIcon, WPartlyIcon, WCloudIcon, WRainIcon, WStormIcon, WFogIcon, DropIcon, ThermoIcon, CalendarIcon } from './icons'

// Codes WMO → icônes SVG (mapping UI, la data reste intacte)
function WmoIcon({ code, size = 18, style }) {
  const Icon =
    code === 0 ? WSunIcon
    : code <= 2 ? WPartlyIcon
    : code === 3 ? WCloudIcon
    : code <= 48 ? WFogIcon
    : code <= 81 ? WRainIcon
    : WStormIcon
  const color =
    code === 0 ? '#fbbf24'
    : code <= 2 ? '#fbbf24'
    : code === 3 ? '#8fa8c4'
    : code <= 48 ? '#8fa8c4'
    : code <= 81 ? '#7dd3fc'
    : '#a78bfa'
  return <Icon size={size} style={{ color, margin: '0 auto', ...style }} />
}

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
        <div style={{ background: 'rgba(56,189,248,0.1)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <WmoIcon code={live.weathercode} size={30} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{Math.round(live.temperature_2m)}°C</div>
            <div style={{ fontSize: 11, color: '#8fa8c4' }}>Actuellement · {live.relative_humidity_2m}% humidité</div>
          </div>
        </div>
      )}

      {/* Prévisions 16 jours (couvre le début du voyage dès fin juillet) */}
      {daily?.time?.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8fa8c4', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Prévisions {daily.time.length} jours
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
            {daily.time.map((iso, i) => {
              const d = new Date(iso)
              const isTrip = iso >= '2026-08-08' && iso <= '2026-08-31'
              return (
                <div key={iso} style={{
                  flex: '0 0 52px', textAlign: 'center',
                  background: isTrip ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
                  border: isTrip ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '6px 2px',
                }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: isTrip ? '#38bdf8' : '#8fa8c4' }}>
                    {DAY_LABELS[d.getDay()]} {d.getDate()}
                  </div>
                  <div style={{ margin: '3px 0', display: 'flex', justifyContent: 'center' }}><WmoIcon code={daily.weathercode[i]} size={16} /></div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#e8f4fd' }}>{Math.round(daily.temperature_2m_max[i])}°</div>
                  <div style={{ fontSize: 10.5, color: '#8fa8c4' }}>{Math.round(daily.temperature_2m_min[i])}°</div>
                  {daily.precipitation_probability_max?.[i] != null && (
                    <div style={{ fontSize: 10, color: daily.precipitation_probability_max[i] >= 60 ? '#7dd3fc' : '#8fa8c4', fontWeight: 600 }}>
                      {daily.precipitation_probability_max[i]}%
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 4, fontSize: 10.5, color: '#8fa8c4' }}>
            Les jours du voyage apparaissent en violet dès qu'ils entrent dans la fenêtre de prévision.
          </div>
        </div>
      )}

      {/* August average */}
      {climate && (
        <div style={{ background: 'rgba(251,191,36,0.1)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <ThermoIcon size={18} style={{ color: '#fbbf24' }} />
            <div>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Août en moyenne</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 12, color: '#cfe2f5' }}>
            <span>Max : <strong>{climate.max}°C</strong></span>
            <span>Min : <strong>{climate.min}°C</strong></span>
            <span>Pluie : <strong>{climate.rain} j/mois</strong></span>
            <span>Humidité : <strong>{climate.humid}%</strong></span>
            <span style={{ gridColumn: '1/-1' }}>UV : <strong>{climate.uv}</strong></span>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: '#8fa8c4', fontStyle: 'italic' }}>{climate.desc}</div>
        </div>
      )}
    </div>
  )
}
