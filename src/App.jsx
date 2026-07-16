import { useState, useEffect, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useSteps } from './hooks/useSteps'
import { StepMarker } from './components/StepMarker'
import { RoutePolyline } from './components/RoutePolyline'
import { StepPopup } from './components/StepPopup'
import { StepList } from './components/StepList'
import { AddStepModal } from './components/AddStepModal'
import { EditStepModal } from './components/EditStepModal'
import { PinGate } from './components/PinGate'
import { Toast } from './components/Toast'
import { STORAGE_KEYS, ALL_FILTER } from './constants'
import { isSupabaseReady } from './lib/supabase'

import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

// ── Smooth wheel zoom (Google Maps feel) ───────────────────────────────────
function SmoothWheelZoom() {
  const map = useMap()
  useEffect(() => {
    map.scrollWheelZoom.disable()
    let zoomTarget = map.getZoom()
    let rafId = null

    function onWheel(e) {
      e.preventDefault()
      // normalize delta across browsers/devices
      const delta = e.deltaMode === 1
        ? -e.deltaY * 0.05          // Firefox line mode
        : -e.deltaY * 0.0025        // pixel mode (Chrome, Safari)
      zoomTarget = Math.min(
        Math.max(zoomTarget + delta, map.getMinZoom()),
        map.getMaxZoom()
      )
      if (rafId) cancelAnimationFrame(rafId)
      function animate() {
        const current = map.getZoom()
        const diff = zoomTarget - current
        if (Math.abs(diff) < 0.001) {
          map.setZoom(zoomTarget, { animate: false })
          rafId = null
          return
        }
        map.setZoom(current + diff * 0.18, { animate: false })
        rafId = requestAnimationFrame(animate)
      }
      animate()
    }

    const el = map.getContainer()
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [map])
  return null
}

// ── Fly to step ─────────────────────────────────────────────────────────────
function FlyTo({ step }) {
  const map = useMap()
  useEffect(() => {
    if (step) map.flyTo([step.lat, step.lng], Math.max(map.getZoom(), 9), { duration: 1.1 })
  }, [step, map])
  return null
}

function useAuth() {
  const [authed, setAuthed] = useState(!!localStorage.getItem(STORAGE_KEYS.auth))
  const [user, setUser] = useState(localStorage.getItem(STORAGE_KEYS.user) || '')
  function onAuth(name) { setUser(name); setAuthed(true) }
  return { authed, user, onAuth }
}

export default function App() {
  const { authed, user, onAuth } = useAuth()
  const { steps, loading, online, realtimeFlash, addStep, updateStep, deleteStep, reorderSteps, undo, canUndo } = useSteps(user)

  const [selectedId, setSelectedId]   = useState(null)
  const [popupStep, setPopupStep]     = useState(null)
  const [editStep, setEditStep]       = useState(null)
  const [showAdd, setShowAdd]         = useState(false)
  const [filter, setFilter]           = useState(ALL_FILTER)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 700)
  const [toast, setToast]             = useState(null)
  const [flyStep, setFlyStep]         = useState(null)
  const [showRoute, setShowRoute]     = useState(true)

  const showToast = useCallback((msg, type = 'info', ms = 3000) => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), ms)
  }, [])

  useEffect(() => {
    if (!online) showToast('📡 Hors-ligne — données en cache', 'offline', 5000)
    else if (online && isSupabaseReady) showToast('✅ Connecté', 'success', 2000)
  }, [online])

  useEffect(() => {
    if (realtimeFlash?.by) showToast(`✏️ Mis à jour par ${realtimeFlash.by}`, 'warning')
  }, [realtimeFlash])

  const visible = filter === ALL_FILTER ? steps : steps.filter((s) => s.categorie === filter)

  function handleMarkerClick(step) {
    setSelectedId(step.id); setPopupStep(step); setFlyStep(step)
  }

  function handleSidebarSelect(id) {
    const s = steps.find((x) => x.id === id)
    if (!s) return
    setSelectedId(id); setPopupStep(s); setFlyStep(s)
    if (window.innerWidth < 700) setSidebarOpen(false)
  }

  function handleAdd(step)        { addStep(step);           showToast('✅ Étape ajoutée', 'success') }
  function handleUpdate(id, ch)   { updateStep(id, ch);      showToast('✅ Étape modifiée', 'success') }
  function handleDelete(id)       { deleteStep(id);          showToast('🗑 Étape supprimée', 'info') }
  function handleUndo()           { undo();                  showToast('↩ Action annulée', 'warning') }

  if (!authed) return <PinGate onAuth={onAuth} />

  return (
    <div style={{ display: 'flex', height: '100dvh', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: sidebarOpen ? 300 : 0,
        minWidth: sidebarOpen ? 300 : 0,
        transition: 'all 0.28s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        background: '#fff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex', flexDirection: 'column',
        zIndex: 100, flexShrink: 0,
      }}>
        <div style={{ padding: '10px 14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            {user === 'Jordan' ? '👨‍✈️' : '👩‍✈️'} <strong>{user}</strong>
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: online ? '#22c55e' : '#9ca3af', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{online ? 'en ligne' : 'hors-ligne'}</span>
          </div>
        </div>
        <StepList
          steps={steps}
          selectedId={selectedId}
          onSelect={handleSidebarSelect}
          onEdit={(s) => setEditStep(s)}
          onReorder={reorderSteps}
          filter={filter}
          onFilterChange={setFilter}
          onAdd={() => setShowAdd(true)}
          realtimeFlash={realtimeFlash}
          onUndo={handleUndo}
          canUndo={canUndo}
        />
      </div>

      {/* ── Map ── */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        {/* Controls top-left */}
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 500, display: 'flex', gap: 8 }}>
          <MapBtn onClick={() => setSidebarOpen((v) => !v)} title={sidebarOpen ? 'Masquer le panneau' : 'Afficher le panneau'}>
            {sidebarOpen ? '◀' : '▶'}
          </MapBtn>
          <MapBtn
            onClick={() => setShowRoute((v) => !v)}
            title={showRoute ? 'Masquer le trajet' : 'Afficher le trajet'}
            active={showRoute}
          >
            {showRoute ? '〰️' : '➖'}
          </MapBtn>
        </div>

        {/* Title badge */}
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 500, background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(8px)',
          borderRadius: 22, padding: '8px 18px',
          boxShadow: '0 2px 14px rgba(0,0,0,0.12)',
          fontWeight: 700, fontSize: 14, color: '#111827', whiteSpace: 'nowrap',
        }}>
          🇹🇭 Thaïlande · Août 2026
        </div>

        {loading ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#e8f1f4', fontSize: 15, color: '#6b7280' }}>
            Chargement…
          </div>
        ) : (
          <MapContainer
            center={[13.5, 101.0]}
            zoom={6}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
            zoomSnap={0}
            zoomDelta={0.5}
            wheelPxPerZoomLevel={80}
            preferCanvas={true}
          >
            {/* CARTO Voyager — beaucoup plus nette et colorée qu'OSM standard */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              maxZoom={20}
              subdomains="abcd"
            />
            <SmoothWheelZoom />
            {showRoute && <RoutePolyline steps={visible} />}
            {visible.map((step) => (
              <StepMarker
                key={step.id}
                step={step}
                selected={selectedId === step.id}
                flash={realtimeFlash?.id === step.id}
                onClick={() => handleMarkerClick(step)}
              />
            ))}
            {flyStep && <FlyTo key={flyStep.id + (flyStep.modified_at || '')} step={flyStep} />}
          </MapContainer>
        )}
      </div>

      {/* ── Modals ── */}
      {popupStep && (
        <StepPopup
          step={popupStep}
          prevStep={steps[steps.findIndex((s) => s.id === popupStep.id) - 1]}
          onClose={() => setPopupStep(null)}
          onEdit={(s) => setEditStep(s)}
        />
      )}
      {editStep && (
        <EditStepModal
          step={editStep}
          onSave={(ch) => handleUpdate(editStep.id, ch)}
          onDelete={() => handleDelete(editStep.id)}
          onClose={() => setEditStep(null)}
        />
      )}
      {showAdd && <AddStepModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}

      {toast && <Toast message={toast.msg} type={toast.type} />}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(8px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:4px; }
        .leaflet-container { background:#e8f1f4; }
      `}</style>
    </div>
  )
}

function MapBtn({ onClick, title, active, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active === false ? 'rgba(255,255,255,0.7)' : '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 10, padding: '8px 11px',
        cursor: 'pointer', fontSize: 17, lineHeight: 1,
        boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
        opacity: active === false ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  )
}
