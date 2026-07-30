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
import { CategoryIcon, TransportIcon, GripIcon, PencilIcon, UndoIcon, PinIcon, MapIcon } from './icons'
import { haversineKm } from '../utils/geo'
import { TRANSPORT_MODES, estimateDuration, formatDuration } from '../data/destinations'
import { fmtCHF } from '../utils/money'

// ── Carte étape épurée ───────────────────────────────────────────────────────
const SortableItem = memo(function SortableItem({ step, displayOrdre, sub, subKm, selected, realtimeFlash, onSelect, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id, disabled: sub })
  const cat = CATEGORIES[step.categorie] || { color: '#8fa8c4', label: step.categorie }
  const isFlashing = realtimeFlash?.id === step.id

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition || 'border-color 0.2s, background 0.2s',
        opacity: isDragging ? 0.5 : 1,
        background: isFlashing ? 'rgba(251,191,36,0.12)' : selected ? 'rgba(56,189,248,0.12)' : sub ? 'rgba(10,42,82,0.6)' : '#0a2a52',
        border: `1.5px solid ${isFlashing ? '#fbbf24' : selected ? '#38bdf8' : 'rgba(56,189,248,0.1)'}`,
        borderLeft: `3px ${sub ? 'dashed' : 'solid'} ${cat.color}`,
        borderRadius: 10,
        padding: sub ? '6px 8px 6px 6px' : '9px 8px 9px 6px',
        marginBottom: 3,
        marginLeft: sub ? 22 : 0,
        cursor: 'pointer',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
      onClick={() => onSelect(step.id)}
    >
      {!sub && (
        <div
          {...attributes} {...listeners}
          style={{ color: '#3a5a8a', fontSize: 14, cursor: 'grab', padding: '0 2px', touchAction: 'none', flexShrink: 0, userSelect: 'none' }}
        ><GripIcon size={14} /></div>
      )}

      <div style={{
        width: sub ? 24 : 30, height: sub ? 24 : 30, borderRadius: 8,
        background: cat.color + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <CategoryIcon category={step.categorie} size={sub ? 13 : 16} color={cat.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          {!sub && <span style={{ fontSize: 10, fontWeight: 700, color: cat.color }}>{displayOrdre}</span>}
          <span style={{ fontWeight: 600, fontSize: sub ? 12.5 : 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e8f4fd' }}>
            {step.nom}
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: '#8fa8c4', marginTop: 1 }}>
          {step.dates}
          {sub && subKm != null && <span style={{ marginLeft: 6, color: cat.color, fontWeight: 600 }}>⇄ {subKm} km A/R</span>}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onEdit(step) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a5a8a', fontSize: 13, padding: '2px 4px', flexShrink: 0 }}
      ><PencilIcon size={14} /></button>
    </div>
  )
}, (prev, next) =>
  prev.selected === next.selected &&
  prev.realtimeFlash?.id === next.realtimeFlash?.id &&
  prev.step.id === next.step.id &&
  prev.step.nom === next.step.nom &&
  prev.displayOrdre === next.displayOrdre &&
  prev.sub === next.sub &&
  prev.subKm === next.subKm &&
  prev.step.dates === next.step.dates &&
  prev.step.categorie === next.step.categorie
)

// ── Connecteur entre étapes ──────────────────────────────────────────────────
function StepConnector({ from, to, segment }) {
  const km = Math.round(haversineKm(from.lat, from.lng, to.lat, to.lng))
  const tm = TRANSPORT_MODES[segment?.mode] || TRANSPORT_MODES.plane
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px 2px 50px', marginBottom: 3 }}>
      <TransportIcon mode={segment?.mode || 'plane'} size={13} style={{ color: tm.color }} />
      <div style={{ flex: 1, borderTop: `1.5px dashed ${tm.color}55` }} />
      <span style={{ fontSize: 11, color: '#8fa8c4', whiteSpace: 'nowrap' }}>{km} km</span>
    </div>
  )
}

const MODES_LIST = [
  { key: 'plane', label: 'Avion' },
  { key: 'train', label: 'Train' },
  { key: 'bus',   label: 'Bus' },
  { key: 'ferry', label: 'Ferry' },
  { key: 'car',   label: 'Voiture' },
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
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Mode transport */}
      <div style={{ fontSize: 10.5, color: '#8fa8c4', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>Mode de transport</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {MODES_LIST.map(m => (
          <button key={m.key} onClick={() => onUpdate({ mode: m.key, duration_override: null })}
            title={m.label}
            style={{
              padding: '5px 9px', borderRadius: 8, cursor: 'pointer', fontSize: 15,
              background: seg.mode === m.key ? TRANSPORT_MODES[m.key].color : 'rgba(255,255,255,0.06)',
              border: `2px solid ${seg.mode === m.key ? TRANSPORT_MODES[m.key].color : 'transparent'}`,
              color: seg.mode === m.key ? '#fff' : '#e8f4fd',
            }}
          ><TransportIcon mode={m.key} size={16} /></button>
        ))}
      </div>

      {/* Prix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <label style={{ fontSize: 10.5, color: '#8fa8c4', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Prix (CHF)
          <input
            type="number" min="0" placeholder="0"
            value={seg.price_chf ?? seg.price ?? ''}
            onChange={e => onUpdate({ price_chf: e.target.value ? +e.target.value : null, price: null })}
            style={{ background: '#061528', color: '#e8f4fd', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 7, padding: '6px 8px', fontSize: 12, outline: 'none', fontWeight: 600 }}
          />
        </label>
        <label style={{ fontSize: 10.5, color: '#8fa8c4', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Durée (h / min)
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input type="number" min="0" max="48" placeholder="h"
              value={hLocal}
              onChange={e => setHLocal(e.target.value)}
              onBlur={applyDuration}
              style={{ background: '#061528', color: '#e8f4fd', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 7, padding: '6px 6px', fontSize: 12, outline: 'none', width: '100%' }}
            />
            <span style={{ color: '#d1d5db', fontSize: 11 }}>:</span>
            <input type="number" min="0" max="59" placeholder="min"
              value={mLocal}
              onChange={e => setMLocal(e.target.value)}
              onBlur={applyDuration}
              style={{ background: '#061528', color: '#e8f4fd', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 7, padding: '6px 6px', fontSize: 12, outline: 'none', width: '100%' }}
            />
          </div>
        </label>
      </div>

      {/* Notes */}
      <label style={{ fontSize: 10.5, color: '#8fa8c4', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        Notes (horaires, compagnie…)
        <input
          placeholder="Ex: Train de nuit 21h → 06h30, Thai Railways"
          value={seg.notes || ''}
          onChange={e => onUpdate({ notes: e.target.value })}
          style={{ background: '#061528', color: '#e8f4fd', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 7, padding: '6px 8px', fontSize: 12, outline: 'none' }}
        />
      </label>
    </div>
  )
}

// ── Vue Trajets ──────────────────────────────────────────────────────────────
function JourneyView({ steps, excursions = [], getSegment, updateSegment }) {
  const [openIdx, setOpenIdx] = useState(null)

  if (steps.length < 2 && excursions.length === 0) return (
    <div style={{ textAlign: 'center', color: '#8fa8c4', fontSize: 13, padding: '32px 16px' }}>
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

  // Legs d'excursion : aller-retour depuis l'étape mère (km et durée ×2)
  for (const { step, parent } of excursions) {
    const seg = getSegment ? getSegment(parent.id, step.id) : {}
    const oneWay = Math.round(haversineKm(parent.lat, parent.lng, step.lat, step.lng))
    const tm = TRANSPORT_MODES[seg.mode || 'ferry'] || TRANSPORT_MODES.ferry
    const dur = (seg.duration_override ?? estimateDuration(oneWay, seg.mode || 'ferry')) * 2
    segments.push({ from: parent, to: step, seg, km: oneWay * 2, tm, dur, roundTrip: true })
  }

  const totalKm = segments.reduce((a, s) => a + s.km, 0)
  const totalPrice = segments.reduce((a, s) => a + (s.seg.price_chf || s.seg.price || 0), 0)
  const totalMinutes = segments.reduce((a, s) => a + (s.seg.duration_override ?? s.dur), 0)

  return (
    <div style={{ padding: '10px 10px 16px' }}>
      {/* Résumé rapide */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <StatChip label="Distance" value={`${totalKm.toLocaleString()} km`} color="#38bdf8" />
        <StatChip label="Temps" value={formatDuration(totalMinutes)} color="#7dd3fc" />
        {totalPrice > 0 && <StatChip label="Budget" value={fmtCHF(totalPrice)} color="#4ade80" />}
      </div>

      {/* Liste segments */}
      {segments.map((s, i) => {
        const isOpen = openIdx === i
        return (
        <div key={i} style={{
          background: isOpen ? '#0e3468' : '#0a2a52',
          borderRadius: 10, padding: '10px 12px',
          marginBottom: 7,
          border: isOpen ? `1.5px solid ${s.tm.color}` : `1px solid rgba(56,189,248,0.08)`,
          borderLeft: `3px solid ${s.tm.color}`,
          transition: 'background 0.15s',
        }}>
          {/* En-tête cliquable */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}
            onClick={() => setOpenIdx(isOpen ? null : i)}>
            <TransportIcon mode={s.seg.mode || 'plane'} size={17} style={{ color: s.tm.color }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e8f4fd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.from.nom} {s.roundTrip ? '⇄' : '→'} {s.to.nom}
              </div>
              <div style={{ fontSize: 11.5, color: '#8fa8c4' }}>
                {s.tm.label} · {s.km} km · {formatDuration(s.dur)}{s.roundTrip ? ' · excursion A/R' : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
              {(s.seg.price_chf || s.seg.price) > 0 && (
                <span style={{ fontSize: 10.5, background: 'rgba(74,222,128,0.15)', color: '#4ade80', borderRadius: 5, padding: '1px 6px', fontWeight: 700 }}>
                  {fmtCHF(s.seg.price_chf || s.seg.price)}
                </span>
              )}
              <span style={{ fontSize: 12, color: '#8fa8c4', marginLeft: 2, display: 'inline-flex' }}>{isOpen ? '▲' : <PencilIcon size={12} />}</span>
            </div>
          </div>

          {/* Notes résumées */}
          {!isOpen && s.seg.notes && (
            <div style={{ fontSize: 11.5, color: '#8fa8c4', fontStyle: 'italic', marginTop: 4, paddingLeft: 26 }}>
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
      <div style={{ background: 'rgba(56,189,248,0.1)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(56,189,248,0.15)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total voyage</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div>
            <div style={{ fontSize: 11, color: '#8fa8c4' }}>Distance</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e8f4fd' }}>{totalKm.toLocaleString()} km</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#8fa8c4' }}>Temps de trajet</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e8f4fd' }}>{formatDuration(totalMinutes)}</div>
          </div>
          {totalPrice > 0 && (
            <div>
              <div style={{ fontSize: 11, color: '#8fa8c4' }}>Budget transport</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{fmtCHF(totalPrice)}</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 11, color: '#8fa8c4' }}>Étapes</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e8f4fd' }}>{steps.length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ background: color + '1c', borderRadius: 8, padding: '5px 10px', flex: 1, minWidth: 70 }}>
      <div style={{ fontSize: 10.5, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#e8f4fd' }}>{value}</div>
    </div>
  )
}

function Badge({ children, color = 'rgba(255,255,255,0.06)', textColor = '#cfe2f5' }) {
  return (
    <span style={{ fontSize: 11, background: color, color: textColor, borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>
      {children}
    </span>
  )
}

// ── Composant principal ──────────────────────────────────────────────────────
export function StepList({ steps, subOf = {}, selectedId, onSelect, onEdit, onReorder, filter, onFilterChange, onAdd, realtimeFlash, onUndo, canUndo, getSegment, updateSegment }) {
  const [view, setView] = useState('steps') // 'steps' | 'journey'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  )

  const categories = [ALL_FILTER, ...new Set(steps.map((s) => s.categorie))]
  const visible = filter === ALL_FILTER ? steps : steps.filter((s) => s.categorie === filter)

  // Structure principale/excursions : les excursions s'affichent indentées sous
  // leur étape mère et suivent son numéro ; le drag ne concerne que les principales.
  const byId = new Map(steps.map(s => [s.id, s]))
  const isSub = (s) => { const p = subOf[s.id] && byId.get(subOf[s.id]); return !!(p && p.id !== s.id && !subOf[p.id]) }
  const mainVisible = visible.filter(s => !isSub(s))
  const childrenOf = (id) => visible.filter(s => isSub(s) && subOf[s.id] === id)
  // Les excursions dont le parent est filtré hors vue restent visibles, en fin de liste
  const orphans = visible.filter(s => isSub(s) && !mainVisible.some(m => m.id === subOf[s.id]))

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const mains = steps.filter(s => !isSub(s))
    const from = mains.findIndex((s) => s.id === active.id)
    const to = mains.findIndex((s) => s.id === over.id)
    if (from < 0 || to < 0) return
    // Réordonne les principales puis réinsère chaque excursion après son étape mère
    const newMains = arrayMove(mains, from, to)
    const full = []
    for (const m of newMains) {
      full.push(m)
      full.push(...steps.filter(s => isSub(s) && subOf[s.id] === m.id))
    }
    for (const s of steps) if (!full.includes(s)) full.push(s)
    onReorder(full)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── En-tête ── */}
      <div style={{ padding: '12px 12px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#e8f4fd' }}>🇹🇭 Thaïlande · Août 2026</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {canUndo && (
              <button onClick={onUndo} title="Annuler" style={{ ...headerBtn, background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}><UndoIcon size={14} /></button>
            )}
            <button onClick={onAdd} style={{ ...headerBtn, background: '#38bdf8', color: '#0d1f3c' }}>+ Étape</button>
          </div>
        </div>

        {/* Tabs Étapes / Trajets */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
          {[['steps', 'Étapes'], ['journey', 'Trajets']].map(([key, label]) => (
            <button key={key} onClick={() => setView(key)} style={{
              flex: 1, background: 'none', border: 'none', borderBottom: `2px solid ${view === key ? '#38bdf8' : 'transparent'}`,
              padding: '7px 4px', fontSize: 12, fontWeight: view === key ? 700 : 400,
              color: view === key ? '#38bdf8' : '#8fa8c4',
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
            <div style={{ padding: '8px 12px 4px', display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {categories.map((cat) => (
                <button key={cat} onClick={() => onFilterChange(cat)} style={{
                  background: filter === cat ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                  color: filter === cat ? '#0d1f3c' : '#e8f4fd',
                  border: 'none', borderRadius: 20,
                  padding: '3px 9px', fontSize: 11, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontWeight: filter === cat ? 700 : 400, transition: 'all 0.15s',
                }}>
                  {cat !== ALL_FILTER && CATEGORIES[cat] && (
                    <CategoryIcon category={cat} size={12} color={filter === cat ? '#0d1f3c' : CATEGORIES[cat].color} />
                  )}
                  {cat === ALL_FILTER ? 'Tous' : cat}
                </button>
              ))}
            </div>
          )}

          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 10px' }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={mainVisible.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {mainVisible.map((step, i) => (
                  <div key={step.id}>
                    {i > 0 && getSegment && (
                      <StepConnector
                        from={mainVisible[i - 1]}
                        to={step}
                        segment={getSegment(mainVisible[i - 1].id, step.id)}
                      />
                    )}
                    <SortableItem
                      step={step}
                      displayOrdre={i + 1}
                      selected={selectedId === step.id}
                      realtimeFlash={realtimeFlash}
                      onSelect={onSelect}
                      onEdit={onEdit}
                    />
                    {childrenOf(step.id).map(exc => (
                      <SortableItem
                        key={exc.id}
                        step={exc}
                        sub
                        subKm={Math.round(haversineKm(step.lat, step.lng, exc.lat, exc.lng) * 2)}
                        selected={selectedId === exc.id}
                        realtimeFlash={realtimeFlash}
                        onSelect={onSelect}
                        onEdit={onEdit}
                      />
                    ))}
                  </div>
                ))}
                {orphans.map(exc => (
                  <SortableItem
                    key={exc.id}
                    step={exc}
                    sub
                    selected={selectedId === exc.id}
                    realtimeFlash={realtimeFlash}
                    onSelect={onSelect}
                    onEdit={onEdit}
                  />
                ))}
              </SortableContext>
            </DndContext>
            {visible.length === 0 && (
              <div style={{ textAlign: 'center', color: '#8fa8c4', fontSize: 13, marginTop: 32 }}>
                Aucune étape dans cette catégorie
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '7px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 11, color: '#8fa8c4', display: 'flex', justifyContent: 'space-between' }}>
            <span>{visible.length} étape{visible.length > 1 ? 's' : ''}</span>
            <span>{steps.length > 1 ? `${steps.slice(1).reduce((a, s, i) => a + Math.round(haversineKm(steps[i].lat, steps[i].lng, s.lat, s.lng)), 0).toLocaleString()} km` : ''}</span>
          </div>
        </>
      )}

      {/* ── Vue Trajets ── */}
      {view === 'journey' && (
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <JourneyView
            steps={steps.filter(s => !isSub(s))}
            excursions={steps.filter(isSub).map(s => ({ step: s, parent: byId.get(subOf[s.id]) }))}
            getSegment={getSegment}
            updateSegment={updateSegment}
          />
        </div>
      )}
    </div>
  )
}

const headerBtn = { border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }
