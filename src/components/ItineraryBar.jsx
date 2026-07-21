import { useState } from 'react'
import { ComparePanel } from './ComparePanel'

export function ItineraryBar({ itineraries, activeItinId, getAllStepsForCompare, onCreate, onSwitch, onRename, onDelete }) {
  const [showCompare, setShowCompare] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  function startRename(itin, e) {
    e.stopPropagation()
    setEditingId(itin.id)
    setEditValue(itin.name)
  }

  function commitRename(id) {
    if (editValue.trim()) onRename(id, editValue.trim())
    setEditingId(null)
  }

  return (
    <>
      <div style={{
        padding: '6px 10px',
        borderBottom: '1px solid #f3f4f6',
        background: '#fafafa',
      }}>
        {/* Tabs row */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', overflowX: 'auto', paddingBottom: 2 }}>
          {itineraries.map(itin => {
            const active = itin.id === activeItinId
            return (
              <div key={itin.id} style={{ flexShrink: 0, position: 'relative' }}>
                {editingId === itin.id ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => commitRename(itin.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename(itin.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    style={{
                      border: `1.5px solid ${itin.color}`, borderRadius: 8,
                      padding: '4px 8px', fontSize: 11, fontWeight: 600,
                      outline: 'none', width: 100,
                    }}
                  />
                ) : (
                  <button
                    onClick={() => onSwitch(itin.id)}
                    onDoubleClick={(e) => startRename(itin, e)}
                    title="Cliquer pour sélectionner · Double-clic pour renommer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 9px', borderRadius: 8, cursor: 'pointer',
                      background: active ? itin.color : '#f3f4f6',
                      border: `1.5px solid ${active ? itin.color : 'transparent'}`,
                      color: active ? '#fff' : '#374151',
                      fontSize: 11, fontWeight: 600,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: active ? 'rgba(255,255,255,0.7)' : itin.color,
                      flexShrink: 0,
                    }} />
                    {itin.name}
                    {!active && itin.id !== 'default' && (
                      <span
                        onClick={e => { e.stopPropagation(); onDelete(itin.id) }}
                        title="Supprimer"
                        style={{ marginLeft: 2, opacity: 0.5, fontSize: 13, lineHeight: 1, cursor: 'pointer' }}
                      >×</span>
                    )}
                  </button>
                )}
              </div>
            )
          })}

          {/* Bouton + */}
          {itineraries.length < 5 && (
            <button
              onClick={() => onCreate()}
              title="Nouvel itinéraire"
              style={{
                flexShrink: 0, width: 26, height: 26, borderRadius: 8,
                border: '1.5px dashed #d1d5db', background: 'transparent',
                cursor: 'pointer', fontSize: 16, color: '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >+</button>
          )}

          {/* Compare */}
          {itineraries.length > 1 && (
            <button
              onClick={() => setShowCompare(true)}
              title="Comparer les itinéraires"
              style={{
                flexShrink: 0, padding: '5px 8px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', background: '#fff',
                cursor: 'pointer', fontSize: 11, color: '#6b7280', fontWeight: 600,
                marginLeft: 2,
              }}
            >⚖️</button>
          )}
        </div>

        {/* Hint rename */}
        {itineraries.length > 1 && (
          <div style={{ fontSize: 9.5, color: '#c0c0c0', marginTop: 2 }}>
            Double-clic pour renommer
          </div>
        )}
      </div>

      {showCompare && (
        <ComparePanel
          itineraries={itineraries}
          getAllStepsForCompare={getAllStepsForCompare}
          onClose={() => setShowCompare(false)}
        />
      )}
    </>
  )
}
