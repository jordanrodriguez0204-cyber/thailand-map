import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useSteps } from './hooks/useSteps'
import { useSegments } from './hooks/useSegments'
import { useBudget } from './hooks/useBudget'
import { StepMarker } from './components/StepMarker'
import { RoutePolyline } from './components/RoutePolyline'
const StepPopup = lazy(() => import('./components/StepPopup').then(m => ({ default: m.StepPopup })))
import { StepList } from './components/StepList'
import { AddStepModal } from './components/AddStepModal'
import { EditStepModal } from './components/EditStepModal'
import { PinGate } from './components/PinGate'
import { Toast } from './components/Toast'
const BudgetPanel = lazy(() => import('./components/BudgetPanel').then(m => ({ default: m.BudgetPanel })))
import { HotelMarker } from './components/HotelMarker'
import { MetroLayer } from './components/MetroLayer'
import { MetroLegend } from './components/MetroLegend'
import { ZoomControls } from './components/MapControls'
const HotelPanel = lazy(() => import('./components/HotelPanel').then(m => ({ default: m.HotelPanel })))
import { useActivities } from './hooks/useActivities'
import { useItineraries } from './hooks/useItineraries'
import { ItineraryBar } from './components/ItineraryBar'
const ExternalToolsPanel = lazy(() => import('./components/ExternalToolsPanel').then(m => ({ default: m.ExternalToolsPanel })))
import { STORAGE_KEYS, ALL_FILTER, CATEGORIES } from './constants'
import { METRO_LINES } from './data/bangkokMetro'
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

function FlyToCoord({ lat, lng, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], zoom ?? Math.max(map.getZoom(), 15), { duration: 1.2 })
  }, [lat, lng, zoom, map])
  return null
}

function FitBounds({ steps, trigger }) {
  const map = useMap()
  useEffect(() => {
    const valid = steps.filter(s => {
      const lat = Number(s.lat), lng = Number(s.lng)
      return isFinite(lat) && isFinite(lng) && (lat !== 0 || lng !== 0)
    })
    if (!valid.length) return
    const size = map.getSize()
    if (!size || size.x === 0 || size.y === 0) return
    try {
      if (valid.length === 1) {
        map.flyTo([Number(valid[0].lat), Number(valid[0].lng)], 10, { duration: 1.2 })
      } else {
        const bounds = valid.map(s => [Number(s.lat), Number(s.lng)])
        map.flyToBounds(bounds, { paddingTopLeft: [40, 60], paddingBottomRight: [40, 60], duration: 1.2, maxZoom: 10 })
      }
    } catch { /* map not ready */ }
  }, [trigger])
  return null
}

function useAuth() {
  const [authed, setAuthed] = useState(!!localStorage.getItem(STORAGE_KEYS.auth))
  const [user, setUser] = useState(localStorage.getItem(STORAGE_KEYS.user) || '')
  function onAuth(name) { setUser(name); setAuthed(true) }
  return { authed, user, onAuth }
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 700)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

export default function App() {
  const { authed, user, onAuth } = useAuth()
  const isMobile = useIsMobile()
  const { itineraries, activeItinId, activeItin, create: createItin, switchTo: switchItin, rename: renameItin, remove: removeItin } = useItineraries()
  const { steps, loading, online, realtimeFlash, addStep, updateStep, deleteStep, reorderSteps, undo, canUndo, copyStepsTo, deleteItinerarySteps, getAllStepsForCompare } = useSteps(user, activeItinId)
  const { getSegment, updateSegment } = useSegments(activeItinId)
  const { getHotels, getSelectedHotel, addHotel, updateHotel, deleteHotel, selectHotel } = useBudget(activeItinId)
  const { getActivities, addActivity, toggleActivity, removeActivity } = useActivities(activeItinId)

  const [selectedId, setSelectedId]   = useState(null)
  const [popupStep, setPopupStep]     = useState(null)
  const [editStep, setEditStep]       = useState(null)
  const [showAdd, setShowAdd]         = useState(false)
  const [filter, setFilter]           = useState(ALL_FILTER)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [toast, setToast]             = useState(null)
  const [flyStep, setFlyStep]         = useState(null)
  const [showRoute, setShowRoute]     = useState(true)
  const [showBudget, setShowBudget]   = useState(false)
  const [showHotels, setShowHotels]   = useState(false)
  const [showTransit, setShowTransit] = useState(true)
  const [visibleLines, setVisibleLines] = useState(() =>
    Object.fromEntries(Object.keys(METRO_LINES).map(k => [k, true]))
  )
  const [flyTarget, setFlyTarget]     = useState(null)
  const [fitTrigger, setFitTrigger]   = useState(0)
  const [showCityMenu, setShowCityMenu] = useState(false)
  const [showTools, setShowTools]       = useState(false)

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

  async function handleCreateItin() {
    const copy = window.confirm('Copier les étapes actuelles dans le nouvel itinéraire ?\n\n(Annuler = démarrer vide)')
    const result = createItin()
    if (!result) { showToast('Maximum 5 itinéraires', 'info'); return }
    if (copy && result.id) await copyStepsTo(result.id)
    setSelectedId(null); setPopupStep(null)
    showToast(`✅ ${copy ? 'Itinéraire dupliqué' : 'Nouvel itinéraire créé'}`, 'success')
  }

  async function handleDeleteItin(id) {
    if (!window.confirm('Supprimer cet itinéraire et toutes ses étapes ?')) return
    await deleteItinerarySteps(id)
    removeItin(id)
    showToast('🗑 Itinéraire supprimé', 'info')
  }

  if (!authed) return <PinGate onAuth={onAuth} />

  const flyBangkok = () => setFlyTarget({ lat: 13.745, lng: 100.515, zoom: 13, t: Date.now() })

  return (
    <div style={{ display: 'flex', height: '100dvh', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>

      {/* ── Sidebar backdrop mobile ── */}
      {isMobile && sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }} onClick={() => setSidebarOpen(false)} />
      )}
      <div style={{
        position: isMobile ? 'fixed' : 'relative',
        top: 0, left: 0, bottom: 0,
        width: sidebarOpen ? (isMobile ? '85vw' : 300) : 0,
        minWidth: 0,
        maxWidth: isMobile ? '85vw' : 300,
        transition: 'width 0.28s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        background: '#fff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex', flexDirection: 'column',
        zIndex: isMobile ? 210 : 100, flexShrink: 0,
        boxShadow: isMobile && sidebarOpen ? '4px 0 24px rgba(0,0,0,0.18)' : 'none',
      }}>
        <div style={{ padding: '10px 14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            {user === 'Jordan' ? '👨‍✈️' : '👩‍✈️'} <strong>{user}</strong>
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: online ? '#22c55e' : '#9ca3af', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{online ? 'en ligne' : 'hors-ligne'}</span>
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', padding: '0 4px' }}>✕</button>
            )}
          </div>
        </div>
        <ItineraryBar
          itineraries={itineraries}
          activeItinId={activeItinId}
          getAllStepsForCompare={getAllStepsForCompare}
          onCreate={handleCreateItin}
          onSwitch={(id) => { switchItin(id); setSelectedId(null); setPopupStep(null) }}
          onRename={renameItin}
          onDelete={handleDeleteItin}
        />
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
          getSegment={getSegment}
          updateSegment={updateSegment}
        />
      </div>

      {/* ── Map ── */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>

        {/* ── DESKTOP top-left controls ── */}
        {!isMobile && (
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 500, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <MapBtn onClick={() => setSidebarOpen(v => !v)} title="Panneau">{sidebarOpen ? '◀' : '▶'}</MapBtn>
            <MapBtn onClick={() => setFitTrigger(n => n + 1)} title="Recentrer">🎯</MapBtn>
            <MapBtn onClick={flyBangkok} title="Bangkok BTS/MRT">🏙️</MapBtn>
            <MapBtn onClick={() => setShowRoute(v => !v)} active={showRoute} title="Trajet">{showRoute ? '〰️' : '➖'}</MapBtn>
            <MapBtn onClick={() => setShowTransit(v => !v)} active={showTransit} title="Métro">🚇</MapBtn>
            <MapBtn onClick={() => setShowHotels(true)} title="Hôtels">🏨</MapBtn>
            <MapBtn onClick={() => setShowBudget(true)} title="Budget">💰</MapBtn>
            <MapBtn onClick={() => setShowCityMenu(v => !v)} active={showCityMenu} title="Villes">☰</MapBtn>
            <MapBtn onClick={() => setShowTools(v => !v)} active={showTools} title="Outils utiles">🔗</MapBtn>
          </div>
        )}

        {/* ── MOBILE top bar ── */}
        {isMobile && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 500,
            background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 10,
          }}>
            <button onClick={() => setSidebarOpen(v => !v)} style={mobileTopBtn}>☰</button>
            <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#111827' }}>
              🇹🇭 Thaïlande · Août 2026
            </div>
            <button onClick={() => setShowCityMenu(v => !v)} style={{ ...mobileTopBtn, background: showCityMenu ? '#6366f1' : '#f3f4f6', color: showCityMenu ? '#fff' : '#374151' }}>
              🗺️
            </button>
          </div>
        )}

        {/* ── Hamburger city menu ── */}
        {showCityMenu && (
          <CityMenu steps={visible} isMobile={isMobile} onClose={() => setShowCityMenu(false)}
            onSelect={(step) => {
              setFlyTarget({ lat: step.lat, lng: step.lng, zoom: 13, t: Date.now() })
              setShowCityMenu(false)
            }}
          />
        )}

        {/* ── Desktop title badge (centré) ── */}
        {!isMobile && (
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            zIndex: 490, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)',
            borderRadius: 22, padding: '8px 18px',
            boxShadow: '0 2px 14px rgba(0,0,0,0.12)',
            fontWeight: 700, fontSize: 14, color: '#111827', whiteSpace: 'nowrap',
          }}>
            🇹🇭 Thaïlande · Août 2026
          </div>
        )}

        <MetroLegend
          visible={showTransit}
          visibleLines={visibleLines}
          onToggleLine={(id, val) => setVisibleLines(prev => ({ ...prev, [id]: val }))}
        />

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
            <TileLayer
              attribution='<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>'
              url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
              maxZoom={20}
              tileSize={256}
            />
            {showTransit && <MetroLayer visibleLines={visibleLines} />}
            <SmoothWheelZoom />
            <ZoomControls isMobile={isMobile} />
            {showRoute && <RoutePolyline steps={visible} getSegment={getSegment} />}
            {visible.map((step) => (
              <StepMarker
                key={step.id}
                step={step}
                selected={selectedId === step.id}
                flash={realtimeFlash?.id === step.id}
                onClick={() => handleMarkerClick(step)}
              />
            ))}
            {steps.flatMap(s =>
              (getHotels(s.id) || []).filter(h => h.lat && h.lng).map(h => (
                <HotelMarker
                  key={h.id}
                  stepNom={s.nom}
                  hotel={h}
                  selected={h.selected}
                  onDelete={() => deleteHotel(s.id, h.id)}
                  onOpenStep={() => { setPopupStep(s); setFlyStep(s) }}
                />
              ))
            )}
            {flyStep && <FlyTo key={flyStep.id + (flyStep.modified_at || '')} step={flyStep} />}
            {flyTarget && <FlyToCoord key={flyTarget.t ?? `${flyTarget.lat},${flyTarget.lng}`} lat={flyTarget.lat} lng={flyTarget.lng} zoom={flyTarget.zoom} />}
            <FitBounds steps={visible} trigger={fitTrigger} />
          </MapContainer>
        )}

        {/* ── MOBILE bottom action bar ── */}
        {isMobile && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 500,
            background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)',
            borderTop: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
            padding: '8px 4px 12px',
          }}>
            <BottomBtn onClick={() => setFitTrigger(n => n + 1)} label="Recentrer">🎯</BottomBtn>
            <BottomBtn onClick={flyBangkok} label="Bangkok">🏙️</BottomBtn>
            <BottomBtn onClick={() => setShowRoute(v => !v)} label="Trajet" active={showRoute}>{showRoute ? '〰️' : '➖'}</BottomBtn>
            <BottomBtn onClick={() => setShowTransit(v => !v)} label="Métro" active={showTransit}>🚇</BottomBtn>
            <BottomBtn onClick={() => setShowHotels(true)} label="Hôtels">🏨</BottomBtn>
            <BottomBtn onClick={() => setShowBudget(true)} label="Budget">💰</BottomBtn>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <Suspense fallback={null}>
        {popupStep && (
          <StepPopup
            step={popupStep}
            prevStep={steps[steps.findIndex((s) => s.id === popupStep.id) - 1]}
            onClose={() => setPopupStep(null)}
            onEdit={(s) => setEditStep(s)}
            getHotels={getHotels}
            addHotel={addHotel}
            updateHotel={updateHotel}
            deleteHotel={deleteHotel}
            selectHotel={selectHotel}
            getActivities={getActivities}
            addActivity={addActivity}
            toggleActivity={toggleActivity}
            removeActivity={removeActivity}
            onFlyTo={(lat, lng) => setFlyTarget({ lat, lng, zoom: 16, t: Date.now() })}
          />
        )}
        {showBudget && (
          <BudgetPanel steps={steps} getSegment={getSegment} getHotel={getSelectedHotel} onClose={() => setShowBudget(false)} />
        )}
        {showHotels && (
          <HotelPanel steps={steps} getHotels={getHotels} onClose={() => setShowHotels(false)}
            onFly={(lat, lng) => setFlyTarget({ lat, lng, t: Date.now() })} />
        )}
        {showTools && <ExternalToolsPanel onClose={() => setShowTools(false)} />}
      </Suspense>
      {editStep && (
        <EditStepModal step={editStep} onSave={(ch) => handleUpdate(editStep.id, ch)}
          onDelete={() => handleDelete(editStep.id)} onClose={() => setEditStep(null)} />
      )}
      {showAdd && <AddStepModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
      {toast && <Toast message={toast.msg} type={toast.type} />}


      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(8px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:4px; }
        .leaflet-container { background:#e8f1f4; }
      `}</style>
    </div>
  )
}

// ── City hamburger menu ──────────────────────────────────────────────────────
function CityMenu({ steps, isMobile, onClose, onSelect }) {
  const seen = new Set()
  const unique = steps.filter(s => { if (seen.has(s.nom)) return false; seen.add(s.nom); return true })
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 490 }} onClick={onClose} />
      <div style={{
        position: 'absolute',
        top: isMobile ? 58 : 12,
        right: 12,
        zIndex: 500,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(12px)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        padding: '10px 8px',
        minWidth: 200,
        maxWidth: 240,
        maxHeight: isMobile ? '70vh' : '80vh',
        overflowY: 'auto',
        animation: 'slideUp 0.18s ease',
      }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, padding: '2px 8px 8px' }}>
          Destinations
        </div>
        {unique.map(step => {
          const cat = CATEGORIES[step.categorie] || { emoji: '📍', color: '#6b7280' }
          return (
            <button key={step.id} onClick={() => onSelect(step)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', textAlign: 'left',
              background: 'none', border: 'none', borderRadius: 10,
              padding: '10px 12px', cursor: 'pointer', fontSize: 13, color: '#111827',
              borderLeft: `3px solid ${cat.color}`,
              marginBottom: 4,
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ fontSize: 18 }}>{cat.emoji}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{step.nom}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{step.dates}</div>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}

// ── Bottom action button (mobile) ────────────────────────────────────────────
function BottomBtn({ onClick, label, active, children }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      background: 'none', border: 'none', cursor: 'pointer',
      padding: '4px 8px', borderRadius: 10, minWidth: 44,
      opacity: active === false ? 0.4 : 1,
    }}>
      <span style={{ fontSize: 22 }}>{children}</span>
      <span style={{ fontSize: 9, color: active ? '#6366f1' : '#6b7280', fontWeight: active ? 700 : 400 }}>{label}</span>
    </button>
  )
}

const mobileTopBtn = {
  background: '#f3f4f6', border: 'none', borderRadius: 10,
  width: 38, height: 38, fontSize: 18, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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
