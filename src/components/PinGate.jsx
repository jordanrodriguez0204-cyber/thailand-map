import { useState } from 'react'
import { USERS, STORAGE_KEYS } from '../constants'

const PIN = import.meta.env.VITE_APP_PIN || '1234'

export function PinGate({ onAuth }) {
  const [digits, setDigits] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const [step, setStep] = useState('pin') // 'pin' | 'who'

  function handleDigit(d) {
    if (digits.length >= 4) return
    const next = digits + d
    setDigits(next)
    setError(false)
    if (next.length === 4) {
      if (next === PIN) {
        setTimeout(() => setStep('who'), 200)
      } else {
        setShake(true)
        setError(true)
        setTimeout(() => { setShake(false); setDigits('') }, 600)
      }
    }
  }

  function handleWho(name) {
    localStorage.setItem(STORAGE_KEYS.auth, '1')
    localStorage.setItem(STORAGE_KEYS.user, name)
    onAuth(name)
  }

  const btnStyle = (d) => ({
    width: 70, height: 70, borderRadius: '50%',
    border: '1.5px solid #e5e7eb',
    background: '#fff',
    fontSize: 22, fontWeight: 600, cursor: 'pointer',
    color: '#1f2937',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    transition: 'background 0.1s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'inherit',
  })

  if (step === 'who') return (
    <div style={overlay}>
      <div style={card}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🇹🇭</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Bienvenue !</h1>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 28px' }}>Qui utilise l'application ?</p>
        <div style={{ display: 'flex', gap: 12 }}>
          {USERS.map((u) => (
            <button key={u} onClick={() => handleWho(u)} style={{
              flex: 1, padding: '14px 0', borderRadius: 12,
              border: '2px solid #6366f1', background: '#6366f1',
              color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            }}>
              {u === 'Jordan' ? '👨‍✈️' : '👩‍✈️'}<br />{u}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div style={overlay}>
      <div style={{ ...card, animation: shake ? 'shake 0.5s' : 'none' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🔐</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Thaïlande · Août 2026</h1>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 24px' }}>Entre le code PIN pour accéder</p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, justifyContent: 'center' }}>
          {[0,1,2,3].map((i) => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: '50%',
              background: digits.length > i ? (error ? '#ef4444' : '#6366f1') : '#e5e7eb',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 70px)', gap: 12, justifyContent: 'center' }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button
              key={i}
              onClick={() => d === '⌫' ? setDigits(digits.slice(0,-1)) : d ? handleDigit(d) : null}
              style={{ ...btnStyle(d), opacity: d === '' ? 0 : 1, pointerEvents: d === '' ? 'none' : 'auto' }}
            >
              {d}
            </button>
          ))}
        </div>
        {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 16 }}>Code incorrect</p>}
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: 16,
}
const card = {
  background: '#fff', borderRadius: 24, padding: '32px 28px',
  maxWidth: 340, width: '100%',
  boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
  textAlign: 'center',
  fontFamily: 'Inter, system-ui, sans-serif',
}
