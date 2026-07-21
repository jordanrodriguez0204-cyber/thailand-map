import { useState, memo } from 'react'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CATEGORIES, ALL_FILTER } from '../constants'
import { haversineKm } from '../utils/geo'
import { TRANSPORT_MODES, estimateDuration, formatDuration } from '../data/destinations'

// ── Carte étape épurée ───────────────────────────────────────────────────────
const SortableItem = memo(function SortableItem({ step, selected, realtimeFlash, onSelect, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id })
  const cat = CATEGORIES[step.categorie] || { color: '#6b7280', emoji: '📍', label: step.categorie }
  const isFlashing = realtimeFlash?.id === step.id

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition || 'border-color 0.2s, background 0.2s',
        opacity: isDragging ? 0.5 : 1,
        background: isFlashing ? '#fef9c3' : selected ? '#eef2ff' : '#fff',
        border: `1.5px solid ${isFlashing ? '#fbbf24' : selected ? '#6366f1' : '#f0f0f0'}`,
        borderLeft: `3px solid ${cat.color}`,
        borderRadius: 10,
        padding: '9px 8px 9px 6px',
        marginBottom: 3,
        cursor: 'pointer',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
      onClick={() => onSelect(step.id)}
    >
      <div
        {...attributes} {...listeners}
        style={{ color: '#d1d5db', fontSize: 14, cursor: 'grab', padding: '0 2px', touchAction: 'none', flexShrink: 0, userSelect: 'none' }}
      >⠿</div>

      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: cat.color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0,
      }}>
        {cat.emoji}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: cat.color }}>{step.ordre}</span>
          <span style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111827' }}>
            {step.nom}
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 1 }}>{step.dates}</div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onEdit(step) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: 13, padding: '2px 4px', flexShrink: 0 }}
      >✏️</button>
    </div>
  )
}, (prev, next) =>
  prev.selected === next.selected &&
  prev.realtimeFlash?.id === next.realtimeFlash?.id &&
  prev.step.id === next.step.id &&
  prev.step.nom === next.step.nom &&
  prev.step.ordre === next.step.ordre &&
  prev.step.dates === next.step.dates &&
  prev.step.categorie === next.step.categorie
)

// ── Connecteur entre étapes ──────────────────────────────────────────────────
function StepConnector({ from, to, segment }) {
  const km = Math.round(haversineKm(from.lat, from.lng, to.lat, to.lng))
  const tm = TRANSPORT_MODES[segment?.mode] || TRANSPORT_MODES.plane
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px 2px 50px', marginBottom: 3 }}>
      <span style={{ fontSize: 11 }}>{tm.icon}</span>
      <div style={{ flex: 1, borderTop: `1.5px dashed ${tm.color}55` }} />
      <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>{km} km</span>
    </div>
  )
}

const MODES_LIST = [
  { key: 'plane', icon: '✈️', label: 'Avion' },
  { key: 'train', icon: '🚂', label: 'Train' },
  { key: 'bus',   icon: '🚌', label: 'Bus' },
  { key: 'ferry', icon: '⛴️', label: 'Ferry' },
  { key: 'car',   icon: '🚗', label: 'Voiture' },
]

function SegmentEditor({ seg, from, to, onUpdate }) {
  const [hLocal, setHLocal] = useState(() => seg.duration_override != null ? Math.floor(seg.duration_override / 60) : '')
  const [mLocal, setMLocal] = useState(() => seg.duration_override != null ? seg.duration_override % 60 : '')

  function applyDuration() {
    const h = parseInt(hLocal) || 0
    const m = parseInt(mLocal) || 0
    const total = h * 60 + m
    onUpdate({ duration_override: total > 0 ? total : null })
  }

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #e5e7eb' }}>
      {/* Mode transport */}
      <div style={{ fontSize: 10.5, color: '#6b7280', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>Mode de transport</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {MODES_LIST.map(m => (
          <button key={m.key} onClick={() => onUpdate({ mode: m.key, duration_override: null })}
            title={m.label}
            style={{
              padding: '5px 9px', borderRadius: 8, cursor: 'pointer', fontSize: 15,
              background: seg.mode === m.key ? TRANSPORT_MODES[m.key].color : '#f3f4f6',
              border: `2px solid ${seg.mode === m.key ? TRANSPORT_MODES[m.key].color : 'transparent'}`,
              color: seg.mode === m.key ? '#fff' : '#374151',
            }}
          >{m.icon}</button>
        ))}
      </div>

      {/* Prix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <label style={{ fontSize: 10.5, color: '#6b7280', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Prix (CHF)
          <input
            type="number" min="0" placeholder="0"
            value={seg.price_chf ?? seg.price ?? ''}
            onChange={e => onUpdate({ price_chf: e.target.value ? +e.target.value : null, price: null })}
            style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: '6px 8px', fontSize: 12, outline: 'none', fontWeight: 600 }}
          />
        </label>
        <label style={{ fontSize: 10.5, color: '#6b7280', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Durée (h / min)
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input type="number" min="0" max="48" placeholder="h"
              value={hLocal}
              onChange={e => setHLocal(e.target.value)}
              onBlur={applyDuration}
              style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: '6px 6px', fontSize: 12, outline: 'none', width: '100%' }}
            />
            <span style={{ color: '#d1d5db', fontSize: 11 }}>:</span>
            <input type="number" min="0" max="59" placeholder="min"
              value={mLocal}
              onChange={e => setMLocal(e.target.value)}
              onBlur={applyDuration}
              style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: '6px 6px', fontSize: 12, outline: 'none', width: '100%' }}
            />
          </div>
        </label>
      </div>

      {/* Notes */}
      <label style={{ fontSize: 10.5, color: '#6b7280', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        Notes (horaires, compagnie…)
        <input
          placeholder="Ex: Train de nuit 21h → 06h30, Thai Railways"
          value={seg.notes || ''}
          onChange={e => onUpdate({ notes: e.target.value })}
          style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: '6px 8px', fontSize: 12, outline: 'none' }}
        />
      </label>
    </div>
  )
}

// ── Vue Trajets ──────────────────────────────────────────────────────────────
function JourneyView({ steps, getSegment, updateSegment }) {
  const [openIdx, setOpenIdx] = useState(null)

  if (steps.length < 2) return (
    <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '32px 16px' }}>
      Ajoute au moins 2 étapes pour voir les trajets.
    </div>
  )

  const segments = steps.slice(1).map((to, i) => {
    const from = steps[i]
    const seg = getSegment ? getSegment(from.id, to.id) : {}
    const km = Math.round(haversineKm(from.lat, from.lng, to.lat, to.lng))
    const tm = TRANSPORT_MODES[seg.mode] || TRANSPORT_MODES.plane
    const dur = seg.duration_override ?? estimateDuration(km, seg.mode || 'plane')
    return { from, to, seg, km, tm, dur }
  })

  const totalKm = segments.reduce((a, s) => a + s.km, 0)
  const totalPrice = segments.reduce((a, s) => a + (s.seg.price_chf || s.seg.price || 0), 0)
  const totalMinutes = segments.reduce((a, s) => a + (s.seg.duration_override ?? s.dur), 0)

  return (
    <div style={{ padding: '10px 10px 16px' }}>
      {/* Résumé rapide */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <StatChip label="Distance" value={`${totalKm.toLocaleString()} km`} color="#6366f1" />
        <StatChip label="Temps" value={formatDuration(totalMinutes)} color="#0891b2" />
        {totalPrice > 0 && <StatChip label="Budget" value={`${totalPrice} CHF`} color="#16a34a" />}
      </div>

      {/* Liste segments */}
      {segments.map((s, i) => {
        const isOpen = openIdx === i
        return (
        <div key={i} style={{
          background: isOpen ? '#fff' : '#f9fafb',
          borderRadius: 10, padding: '10px 12px',
          marginBottom: 7,
          border: isOpen ? `1.5px solid ${s.tm.color}` : `1px solid transparent`,
          borderLeft: `3px solid ${s.tm.color}`,
          transition: 'background 0.15s',
        }}>
          {/* En-tête cliquable */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}
            onClick={() => setOpenIdx(isOpen ? null : i)}>
            <span style={{ fontSize: 18 }}>{s.tm.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.from.nom} → {s.to.nom}
              </div>
              <div style={{ fontSize: 11.5, color: '#6b7280' }}>{s.tm.label} · {s.km} km · {formatDuration(s.dur)}</div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
              {(s.seg.price_chf || s.seg.price) > 0 && (
                <span style={{ fontSize: 10.5, background: '#f0fdf4', color: '#16a34a', borderRadius: 5, padding: '1px 6px', fontWeight: 700 }}>
                  {s.seg.price_chf || s.seg.price} CHF
                </span>
              )}
              <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 2 }}>{isOpen ? '▲' : '✏️'}</span>
            </div>
          </div>

          {/* Notes résumées */}
          {!isOpen && s.seg.notes && (
            <div style={{ fontSize: 11.5, color: '#6b7280', fontStyle: 'italic', marginTop: 4, paddingLeft: 26 }}>
              {s.seg.notes}
            </div>
          )}

          {/* Éditeur */}
          {isOpen && updateSegment && (
            <SegmentEditor
              seg={s.seg}
              from={s.from}
              to={s.to}
              onUpdate={(ch) => updateSegment(s.from.id, s.to.id, ch)}
            />
          )}
        </div>
        )
      })}

      {/* Total */}
      <div style={{ background: '#eef2ff', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total voyage</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Distance</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{totalKm.toLocaleString()} km</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Temps de trajet</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{formatDuration(totalMinutes)}</div>
          </div>
          {totalPrice > 0 && (
            <div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Budget transport</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{totalPrice} CHF</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Étapes</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{steps.length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ background: color + '14', borderRadius: 8, padding: '5px 10px', flex: 1, minWidth: 70 }}>
      <div style={{ fontSize: 10.5, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{value}</div>
    </div>
  )
}

function Badge({ children, color = '#f3f4f6', textColor = '#374151' }) {
  return (
    <span style={{ fontSize: 11, background: color, color: textColor, borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>
      {children}
    </span>
  )
}

// ── Composant principal ──────────────────────────────────────────────────────
export function StepList({ steps, selectedId, onSelect, onEdit, onReorder, filter, onFilterChange, onAdd, realtimeFlash, onUndo, canUndo, getSegment, updateSegment }) {
  const [view, setView] = useState('steps') // 'steps' | 'journey'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  )

  const categories = [ALL_FILTER, ...new Set(steps.map((s) => s.categorie))]
  const visible = filter === ALL_FILTER ? steps : steps.filter((s) => s.categorie === filter)

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const from = steps.findIndex((s) => s.id === active.id)
    const to = steps.findIndex((s) => s.id === over.id)
    onReorder(arrayMove(steps, from, to))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── En-tête ── */}
      <div style={{ padding: '12px 12px 0', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>🇹🇭 Thaïlande · Août 2026</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {canUndo && (
              <button onClick={onUndo} title="Annuler" style={{ ...headerBtn, background: '#fef3c7', color: '#92400e' }}>↩</button>
            )}
            <button onClick={onAdd} style={{ ...headerBtn, background: '#6366f1', color: '#fff' }}>+ Étape</button>
          </div>
        </div>

        {/* Tabs Étapes / Trajets */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
          {[['steps', '📍 Étapes'], ['journey', '🗺️ Trajets']].map(([key, label]) => (
            <button key={key} onClick={() => setView(key)} style={{
              flex: 1, background: 'none', border: 'none', borderBottom: `2px solid ${view === key ? '#6366f1' : 'transparent'}`,
              padding: '7px 4px', fontSize: 12, fontWeight: view === key ? 700 : 400,
              color: view === key ? '#6366f1' : '#9ca3af',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── Vue Étapes ── */}
      {view === 'steps' && (
        <>
          {/* Filtres catégorie */}
          {categories.length > 2 && (
            <div style={{ padding: '8px 12px 4px', display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid #f3f4f6' }}>
              {categories.map((cat) => (
                <button key={cat} onClick={() => onFilterChange(cat)} style={{
                  background: filter === cat ? '#6366f1' : '#f3f4f6',
                  color: filter === cat ? '#fff' : '#374151',
                  border: 'none', borderRadius: 20,
                  padding: '3px 9px', fontSize: 11, cursor: 'pointer',
                  fontWeight: filter === cat ? 600 : 400, transition: 'all 0.15s',
                }}>
                  {cat === ALL_FILTER ? 'Tous' : `${CATEGORIES[cat]?.emoji || ''} ${cat}`}
                </button>
              ))}
            </div>
          )}

          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 10px' }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={visible.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {visible.map((step, i) => (
                  <div key={step.id}>
                    {i > 0 && getSegment && (
                      <StepConnector
                        from={visible[i - 1]}
                        to={step}
                        segment={getSegment(visible[i - 1].id, step.id)}
                      />
                    )}
                    <SortableItem
                      step={step}
                      selected={selectedId === step.id}
                      realtimeFlash={realtimeFlash}
                      onSelect={onSelect}
                      onEdit={onEdit}
                    />
                  </div>
                ))}
              </SortableContext>
            </DndContext>
            {visible.length === 0 && (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 32 }}>
                Aucune étape dans cette catégorie
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '7px 12px', borderTop: '1px solid #f3f4f6', fontSize: 11, color: '#c0c0c0', display: 'flex', justifyContent: 'space-between' }}>
            <span>{visible.length} étape{visible.length > 1 ? 's' : ''}</span>
            <span>{steps.length > 1 ? `${steps.slice(1).reduce((a, s, i) => a + Math.round(haversineKm(steps[i].lat, steps[i].lng, s.lat, s.lng)), 0).toLocaleString()} km` : ''}</span>
          </div>
        </>
      )}

      {/* ── Vue Trajets ── */}
      {view === 'journey' && (
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <JourneyView steps={steps} getSegment={getSegment} updateSegment={updateSegment} />
        </div>
      )}
    </div>
  )
}

const headerBtn = { border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }
