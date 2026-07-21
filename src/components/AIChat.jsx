import { useState, useRef, useEffect } from 'react'
import { askGemini, executeActions } from '../lib/gemini'

const SUGGESTIONS = [
  'Bangkok → Chiang Mai train de nuit 40 CHF',
  'Hôtel à Koh Samui 80 CHF/nuit 3 nuits',
  'Quels transports me conseilles-tu ?',
  'Résume le budget transport total',
]

export function AIChat({ steps, getSegment, getHotel, updateSegment, updateHotel, updateStep, addStep }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'ai', text: '👋 Salut ! Je suis ton assistant voyage. Dis-moi par exemple "Bangkok → Chiang Mai train de nuit 40 CHF" et je mets tout à jour automatiquement.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)
    try {
      let result
      try {
        result = await askGemini(text, steps, getSegment, getHotel)
      } catch (err) {
        if (err.message === 'RATE_LIMIT') {
          setMessages(prev => [...prev, { role: 'ai', text: '⏳ Limite atteinte — nouvelle tentative dans 5 s…', retry: true }])
          await new Promise(r => setTimeout(r, 5000))
          result = await askGemini(text, steps, getSegment, getHotel)
          setMessages(prev => prev.filter(m => !m.retry))
        } else {
          throw err
        }
      }
      const appliedActions = result.actions?.length
        ? executeActions(result.actions, steps, updateSegment, updateHotel, updateStep, addStep)
        : []
      setMessages(prev => [...prev, {
        role: 'ai',
        text: result.message || '…',
        actions: appliedActions,
      }])
    } catch (err) {
      const msg = err.message === 'RATE_LIMIT'
        ? '⏳ Limite de requêtes atteinte — attends 1 minute et réessaie.'
        : err.message === 'API_KEY_INVALID'
        ? '🔑 Clé API invalide — génères-en une nouvelle sur aistudio.google.com/app/apikey (elle doit commencer par AIza…)'
        : `❌ Erreur : ${err.message}`
      setMessages(prev => [...prev, { role: 'ai', text: msg, error: true }])
    }
    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Assistant IA"
        style={{
          position: 'fixed',
          bottom: open ? 'calc(min(520px, 90vh) + 12px)' : 20,
          right: 16,
          zIndex: 2500,
          width: 52, height: 52,
          borderRadius: '50%',
          background: open ? '#4f46e5' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
          fontSize: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'bottom 0.25s ease, background 0.2s',
          color: '#fff',
        }}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: 20, right: 16,
          width: 'min(380px, calc(100vw - 32px))',
          height: 'min(520px, 90vh)',
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
          zIndex: 2400,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUpChat 0.22s ease',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            padding: '14px 16px',
            color: '#fff',
            flexShrink: 0,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>💬 Assistant Voyage IA</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>Powered by Gemini · Thaïlande Août 2026</div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 0' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 10,
              }}>
                <div style={{
                  maxWidth: '82%',
                  background: msg.role === 'user' ? '#6366f1' : msg.error ? '#fef2f2' : '#f3f4f6',
                  color: msg.role === 'user' ? '#fff' : msg.error ? '#dc2626' : '#111827',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '10px 13px',
                  fontSize: 13.5,
                  lineHeight: 1.5,
                }}>
                  {msg.text}
                  {msg.actions?.length > 0 && (
                    <div style={{ marginTop: 8, borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 6 }}>
                      {msg.actions.map((a, j) => (
                        <div key={j} style={{ fontSize: 11.5, color: '#059669', fontWeight: 500 }}>{a}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                <div style={{ background: '#f3f4f6', borderRadius: '18px 18px 18px 4px', padding: '10px 16px' }}>
                  <LoadingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (show only if 1 message = initial) */}
          {messages.length === 1 && (
            <div style={{ padding: '8px 14px', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => { setInput(s); inputRef.current?.focus() }} style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 20,
                  background: '#ede9fe', color: '#4f46e5', border: 'none',
                  cursor: 'pointer', fontWeight: 500,
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid #f3f4f6',
            display: 'flex', gap: 8, flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ex: Bangkok → Chiang Mai train 40 CHF…"
              disabled={loading}
              style={{
                flex: 1, border: '1px solid #e5e7eb', borderRadius: 12,
                padding: '9px 13px', fontSize: 13, outline: 'none',
                background: loading ? '#f9fafb' : '#fff',
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: input.trim() && !loading ? '#6366f1' : '#e5e7eb',
                border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: input.trim() && !loading ? '#fff' : '#9ca3af',
                transition: 'background 0.15s',
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUpChat {
          from { opacity:0; transform:translateY(16px) }
          to   { opacity:1; transform:translateY(0) }
        }
      `}</style>
    </>
  )
}

function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 18 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#9ca3af',
          animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes dotBounce {
          0%,80%,100% { transform:scale(0.7); opacity:0.5 }
          40% { transform:scale(1); opacity:1 }
        }
      `}</style>
    </div>
  )
}
