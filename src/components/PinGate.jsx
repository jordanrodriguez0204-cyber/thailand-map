import { useState } from 'react'
import { USERS, STORAGE_KEYS } from '../constants'
import { LockIcon, Avatar } from './icons'

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

  const btnStyle = {
    width: 70, height: 70, borderRadius: '50%',
    border: '1px solid rgba(56,189,248,0.2)',
    background: '#0a2a52',
    fontSize: 22, fontWeight: 600, cursor: 'pointer',
    color: '#e8f4fd',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    transition: 'background 0.1s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'inherit',
  }

  if (step === 'who') return (
    <div style={overlay}>
      <div style={card}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🇹🇭</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#e8f4fd' }}>Bienvenue !</h1>
        <p style={{ color: '#8fa8c4', fontSize: 14, margin: '0 0 28px' }}>Qui utilise l'application ?</p>
        <div style={{ display: 'flex', gap: 12 }}>
          {USERS.map((u) => (
            <button key={u} onClick={() => handleWho(u)} style={{
              flex: 1, padding: '14px 0', borderRadius: 12,
              border: 'none', background: '#38bdf8',
              color: '#0d1f3c', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <Avatar name={u} size={26} style={{ marginBottom: 6, background: 'rgba(13,31,60,0.25)', borderColor: '#0d1f3c', color: '#0d1f3c' }} />{u}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div style={overlay}>
      <div style={{ ...card, animation: shake ? 'shake 0.5s' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <span style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
            <LockIcon size={26} />
          </span>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#e8f4fd' }}>Thaïlande · Août 2026</h1>
        <p style={{ color: '#8fa8c4', fontSize: 14, margin: '0 0 24px' }}>Entre le code PIN pour accéder</p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, justifyContent: 'center' }}>
          {[0,1,2,3].map((i) => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: '50%',
              background: digits.length > i ? (error ? '#f87171' : '#38bdf8') : '#1a3a6e',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 70px)', gap: 12, justifyContent: 'center' }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button
              key={i}
              onClick={() => d === '⌫' ? setDigits(digits.slice(0,-1)) : d ? handleDigit(d) : null}
              style={{ ...btnStyle, opacity: d === '' ? 0 : 1, pointerEvents: d === '' ? 'none' : 'auto' }}
            >
              {d}
            </button>
          ))}
        </div>
        {error && <p style={{ color: '#f87171', fontSize: 13, marginTop: 16 }}>Code incorrect</p>}
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0,
  background: 'linear-gradient(135deg, #0d1f3c 0%, #0a2a52 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: 16,
}
const card = {
  background: '#0e3468', borderRadius: 24, padding: '32px 28px',
  maxWidth: 340, width: '100%',
  border: '1px solid rgba(56,189,248,0.2)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  textAlign: 'center',
  fontFamily: 'Inter, system-ui, sans-serif',
}
