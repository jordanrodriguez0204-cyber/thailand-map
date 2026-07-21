import { TrashIcon } from './icons'
import { useState } from 'react'
import { CATEGORIES } from '../constants'
import { Modal } from './AddStepModal'

const input = { width: '100%', padding: '9px 11px', background: '#061528', color: '#e8f4fd', border: '1.5px solid rgba(56,189,248,0.2)', borderRadius: 9, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' }

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#cfe2f5', marginBottom: 4, display: 'block' }}>{label}</label>
      {children}
    </div>
  )
}

export function EditStepModal({ step, onSave, onDelete, onClose }) {
  const [nom, setNom] = useState(step.nom)
  const [dates, setDates] = useState(step.dates || '')
  const [notes, setNotes] = useState(step.notes || '')
  const [categorie, setCategorie] = useState(step.categorie)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    onSave({ nom, dates, notes, categorie })
    onClose()
  }

  return (
    <Modal title={`Modifier — ${step.nom}`} onClose={onClose}>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Nom"><input style={input} value={nom} onChange={(e) => setNom(e.target.value)} /></Field>
        <Field label="Dates"><input style={input} value={dates} onChange={(e) => setDates(e.target.value)} placeholder="ex: 9-11 août" /></Field>
        <Field label="Catégorie">
          <select style={input} value={categorie} onChange={(e) => setCategorie(e.target.value)}>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
          </select>
        </Field>
        <Field label="Notes">
          <textarea style={{ ...input, resize: 'vertical', minHeight: 80 }} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button type="submit" style={{ flex: 1, background: '#38bdf8', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Enregistrer
          </button>
          {!confirmDelete ? (
            <button type="button" onClick={() => setConfirmDelete(true)} style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: 'none', borderRadius: 10, padding: '11px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}><TrashIcon size={15} /></button>
          ) : (
            <button type="button" onClick={() => { onDelete(); onClose() }} style={{ background: '#f87171', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Confirmer
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
