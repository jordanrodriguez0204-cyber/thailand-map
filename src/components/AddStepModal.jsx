import { useState } from 'react'
import { geocodeNominatim } from '../utils/geo'
import { CATEGORIES } from '../constants'

export function AddStepModal({ onAdd, onClose }) {
  const [nom, setNom] = useState('')
  const [dates, setDates] = useState('')
  const [notes, setNotes] = useState('')
  const [categorie, setCategorie] = useState('ville')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')

  async function handleSearch() {
    if (!nom.trim()) return
    setSearching(true); setError(''); setResults([])
    try {
      const res = await geocodeNominatim(nom)
      if (res.length > 0) {
        setResults(res)
        setLat(res[0].lat.toFixed(6))
        setLng(res[0].lng.toFixed(6))
      } else {
        setError('Lieu introuvable — entrez les coordonnées manuellement.')
      }
    } catch { setError('Erreur réseau — entrez les coordonnées manuellement.') }
    setSearching(false)
  }

  function selectResult(r) {
    setLat(r.lat.toFixed(6)); setLng(r.lng.toFixed(6)); setResults([])
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!nom.trim() || !lat || !lng) { setError('Nom et coordonnées requis.'); return }
    onAdd({ nom: nom.trim(), lat: parseFloat(lat), lng: parseFloat(lng), dates, notes, categorie })
    onClose()
  }

  return (
    <Modal title="Ajouter une étape" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Nom du lieu *">
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...input, flex: 1 }} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex: Phuket" />
            <button type="button" onClick={handleSearch} disabled={searching} style={searchBtn}>
              {searching ? '…' : '🔍'}
            </button>
          </div>
          {results.length > 1 && (
            <div style={{ marginTop: 4, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              {results.slice(0, 3).map((r, i) => (
                <button key={i} type="button" onClick={() => selectResult(r)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '7px 10px', background: i % 2 ? '#f9fafb' : '#fff',
                  border: 'none', cursor: 'pointer', fontSize: 12, color: '#374151',
                }}>
                  {r.displayName.slice(0, 60)}…
                </button>
              ))}
            </div>
          )}
          {lat && <div style={{ fontSize: 11, color: '#16a34a', marginTop: 3 }}>✓ {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}</div>}
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="Latitude *"><input style={input} value={lat} onChange={(e) => setLat(e.target.value)} placeholder="13.7563" /></Field>
          <Field label="Longitude *"><input style={input} value={lng} onChange={(e) => setLng(e.target.value)} placeholder="100.5018" /></Field>
        </div>

        <Field label="Dates"><input style={input} value={dates} onChange={(e) => setDates(e.target.value)} placeholder="ex: 9-11 août" /></Field>

        <Field label="Catégorie">
          <select style={input} value={categorie} onChange={(e) => setCategorie(e.target.value)}>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
          </select>
        </Field>

        <Field label="Notes">
          <textarea style={{ ...input, resize: 'vertical', minHeight: 64 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Activités, hébergement…" />
        </Field>

        {error && <div style={{ color: '#dc2626', fontSize: 12 }}>{error}</div>}
        <button type="submit" style={submitBtn}>Ajouter l'étape</button>
      </form>
    </Modal>
  )
}

// ── Shared modal shell ──────────────────────────────────────────────────────
export function Modal({ title, onClose, children }) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>{label}</label>
      {children}
    </div>
  )
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
const card = { background: '#fff', borderRadius: 18, padding: 22, maxWidth: 400, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', maxHeight: '90dvh', overflowY: 'auto' }
const input = { width: '100%', padding: '9px 11px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }
const searchBtn = { padding: '9px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 15 }
const submitBtn = { background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 }
