import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon, RefreshIcon, WalletIcon } from './icons'

// Convertisseur CHF ⇄ THB — taux quotidien via open.er-api.com (sans clé),
// cache localStorage 12h pour rester utilisable hors-ligne sur place.

const CACHE_KEY = 'th_fx_chf_thb'
const CACHE_TTL = 12 * 3600 * 1000
const FALLBACK_RATE = 40 // ordre de grandeur si jamais aucun taux n'a pu être chargé

function loadCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    return c && c.rate > 0 ? c : null
  } catch { return null }
}

export function CurrencyConverter({ isMobile, onClose }) {
  const cached = loadCache()
  const [rate, setRate] = useState(cached?.rate ?? null)
  const [rateDate, setRateDate] = useState(cached?.date ?? null)
  const [stale, setStale] = useState(!cached || Date.now() - cached.at > CACHE_TTL)
  const [chf, setChf] = useState('100')
  const [thb, setThb] = useState('')
  const [lastEdit, setLastEdit] = useState('chf')

  useEffect(() => {
    if (!stale) return
    let cancelled = false
    fetch('https://open.er-api.com/v6/latest/CHF')
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (cancelled || !(j?.rates?.THB > 0)) return
        const entry = { rate: j.rates.THB, date: (j.time_last_update_utc || '').slice(0, 16), at: Date.now() }
        localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
        setRate(entry.rate); setRateDate(entry.date); setStale(false)
      })
      .catch(() => {}) // hors-ligne : on garde le cache (ou le fallback)
    return () => { cancelled = true }
  }, [stale])

  const effective = rate ?? FALLBACK_RATE

  // Recalcule le champ opposé à chaque frappe
  useEffect(() => {
    if (lastEdit === 'chf') setThb(chf === '' ? '' : String(Math.round(+chf * effective)))
    else setChf(thb === '' ? '' : String(Math.round((+thb / effective) * 100) / 100))
  }, [chf, thb, lastEdit, effective])

  const quick = [10, 20, 50, 100, 500]

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 3200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#0d1f3c', borderRadius: 20, width: '100%', maxWidth: 380,
        padding: '20px 20px 18px', boxShadow: '0 32px 80px rgba(0,0,0,0.4)', animation: 'modalIn 0.18s ease',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#e8f4fd', display: 'flex', alignItems: 'center', gap: 8 }}>
            <WalletIcon size={16} style={{ color: '#38bdf8' }} />CHF ⇄ THB
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%',
            width: isMobile ? 44 : 32, height: isMobile ? 44 : 32, cursor: 'pointer', color: '#8fa8c4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><CloseIcon size={15} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field
            label="Francs suisses" suffix="CHF" value={chf}
            onChange={v => { setLastEdit('chf'); setChf(v) }}
          />
          <Field
            label="Bahts thaïlandais" suffix="THB" value={thb}
            onChange={v => { setLastEdit('thb'); setThb(v) }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {quick.map(v => (
            <button key={v} onClick={() => { setLastEdit('chf'); setChf(String(v)) }} style={{
              background: 'rgba(56,189,248,0.1)', color: '#7dd3fc', border: 'none', borderRadius: 8,
              padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>{v} CHF</button>
          ))}
        </div>

        <div style={{ marginTop: 14, fontSize: 11, color: '#8fa8c4', display: 'flex', alignItems: 'center', gap: 6 }}>
          {rate
            ? <>1 CHF = {effective.toFixed(2)} THB · taux du {rateDate}</>
            : <>Taux indisponible — estimation 1 CHF ≈ {FALLBACK_RATE} THB</>}
          <button onClick={() => setStale(true)} title="Actualiser le taux" style={{
            background: 'none', border: 'none', color: '#8fa8c4', cursor: 'pointer', padding: 2, display: 'flex',
          }}><RefreshIcon size={12} /></button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function Field({ label, suffix, value, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#8fa8c4', textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number" min="0" inputMode="decimal" value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, minHeight: 44, borderRadius: 10, border: '1.5px solid rgba(56,189,248,0.2)',
            background: '#061528', color: '#e8f4fd', fontSize: 17, fontWeight: 700, padding: '0 12px',
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 800, color: '#7dd3fc', width: 36 }}>{suffix}</span>
      </div>
    </label>
  )
}
