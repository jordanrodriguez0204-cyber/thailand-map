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

function timeAgo(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60) return 'maintenant'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

function SortableItem({ step, prevStep, selected, realtimeFlash, onSelect, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id })
  const cat = CATEGORIES[step.categorie] || { color: '#6b7280', emoji: '📍' }
  const dist = prevStep ? haversineKm(prevStep.lat, prevStep.lng, step.lat, step.lng) : null
  const isFlashing = realtimeFlash?.id === step.id

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        background: isFlashing ? '#fef9c3' : selected ? '#eef2ff' : '#fff',
        border: `2px solid ${isFlashing ? '#fbbf24' : selected ? '#6366f1' : '#f3f4f6'}`,
        borderRadius: 11,
        padding: '10px 10px 10px 4px',
        marginBottom: 6,
        cursor: 'pointer',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        transition: 'border-color 0.3s, background 0.3s',
      }}
      onClick={() => onSelect(step.id)}
    >
      {/* drag handle */}
      <div
        {...attributes} {...listeners}
        style={{ color: '#d1d5db', fontSize: 18, cursor: 'grab', padding: '2px 4px', touchAction: 'none', flexShrink: 0, userSelect: 'none' }}
      >
        ⠿
      </div>
      {/* number badge */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: cat.color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
      }}>
        {step.ordre}
      </div>
      {/* content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111827' }}>
          {step.nom}
        </div>
        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>{step.dates}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
          {dist && <span style={{ fontSize: 10.5, color: '#a78bfa' }}>✈ {dist} km</span>}
          {isFlashing && realtimeFlash?.by && (
            <span style={{ fontSize: 10.5, color: '#d97706', fontWeight: 600 }}>← mis à jour par {realtimeFlash.by}</span>
          )}
          {!isFlashing && step.modified_by && (
            <span style={{ fontSize: 10, color: '#d1d5db' }}>{step.modified_by} · {timeAgo(step.modified_at)}</span>
          )}
        </div>
      </div>
      {/* edit button */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(step) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 15, padding: '2px 4px', flexShrink: 0 }}
      >
        ✏️
      </button>
    </div>
  )
}

export function StepList({ steps, selectedId, onSelect, onEdit, onReorder, filter, onFilterChange, onAdd, realtimeFlash, onUndo, canUndo }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  )
  const categories = [ALL_FILTER, ...new Set(steps.map((s) => s.categorie))]
  const visible = filter === ALL_FILTER ? steps : steps.filter((s) => s.categorie === filter)
  const totalDist = visible.length > 1
    ? visible.slice(1).reduce((acc, s, i) => acc + haversineKm(visible[i].lat, visible[i].lng, s.lat, s.lng), 0)
    : 0

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const from = steps.findIndex((s) => s.id === active.id)
    const to = steps.findIndex((s) => s.id === over.id)
    onReorder(arrayMove(steps, from, to))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* header */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>🗺️ Itinéraire</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {canUndo && (
              <button onClick={onUndo} title="Annuler la dernière action" style={{ ...headerBtn, background: '#fef3c7', color: '#92400e' }}>↩ Annuler</button>
            )}
            <button onClick={onAdd} style={{ ...headerBtn, background: '#6366f1', color: '#fff' }}>+ Étape</button>
          </div>
        </div>
        {/* filter chips */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onFilterChange(cat)}
              style={{
                background: filter === cat ? '#6366f1' : '#f3f4f6',
                color: filter === cat ? '#fff' : '#374151',
                border: 'none', borderRadius: 20,
                padding: '3px 10px', fontSize: 11.5, cursor: 'pointer',
                fontWeight: filter === cat ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {cat === ALL_FILTER ? 'Tous' : `${CATEGORIES[cat]?.emoji || ''} ${cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* list */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '8px 10px' }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visible.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {visible.map((step, i) => (
              <SortableItem
                key={step.id}
                step={step}
                prevStep={i > 0 ? visible[i - 1] : null}
                selected={selectedId === step.id}
                realtimeFlash={realtimeFlash}
                onSelect={onSelect}
                onEdit={onEdit}
              />
            ))}
          </SortableContext>
        </DndContext>
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 32 }}>
            Aucune étape dans cette catégorie
          </div>
        )}
      </div>

      {/* footer stats */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid #f3f4f6', fontSize: 11, color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
        <span>{visible.length} étape{visible.length > 1 ? 's' : ''}</span>
        {totalDist > 0 && <span>≈ {totalDist.toLocaleString()} km total</span>}
      </div>
    </div>
  )
}

const headerBtn = { border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }
