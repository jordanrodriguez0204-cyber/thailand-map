import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
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
const HotelComparePanel = lazy(() => import('./components/HotelComparePanel').then(m => ({ default: m.HotelComparePanel })))
import { useActivities } from './hooks/useActivities'
import { useItineraries } from './hooks/useItineraries'
import { ItineraryBar } from './components/ItineraryBar'
const ExternalToolsPanel = lazy(() => import('./components/ExternalToolsPanel').then(m => ({ default: m.ExternalToolsPanel })))
import { STORAGE_KEYS, ALL_FILTER, CATEGORIES } from './constants'
import { CategoryIcon, TargetIcon, BedIcon, WalletIcon, DotsIcon, MenuIcon, CloseIcon,
  CityIcon, RouteIcon, MetroIcon, MapIcon, LinkIcon, MoonIcon, SatelliteIcon, SunIcon,
  DownloadIcon, UploadIcon, WifiOffIcon, Avatar, Spinner } from './components/icons'
import { exportBackup, importBackup } from './utils/backup'
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

// ── Échelle km (bas gauche, stylée via CSS) ─────────────────────────────────
function ScaleControl() {
  const map = useMap()
  useEffect(() => {
    const ctl = L.control.scale({ metric: true, imperial: false, position: 'bottomleft', maxWidth: 90 })
    ctl.addTo(map)
    return () => ctl.remove()
  }, [map])
  return null
}

// ── Suivi du zoom : markers compacts à faible zoom (dédoublonne le sud) ─────
function ZoomWatcher({ onZoom }) {
  const map = useMap()
  useEffect(() => {
    const fn = () => onZoom(map.getZoom())
    map.on('zoomend', fn)
    fn()
    return () => map.off('zoomend', fn)
  }, [map, onZoom])
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
  const [hotelCompare, setHotelCompare] = useState(null) // null | { stepId: string|null }
  const [showMore, setShowMore]       = useState(false)
  const [mapStyle, setMapStyle]       = useState(() => {
    const saved = localStorage.getItem('th_map_style')
    if (saved === 'light' || saved === 'dark' || saved === 'satellite') return saved
    return localStorage.getItem('th_dark_map') === '1' ? 'dark' : 'light' // migration ancien réglage
  })
  const [showTransit, setShowTransit] = useState(true)
  const [visibleLines, setVisibleLines] = useState(() =>
    Object.fromEntries(Object.keys(METRO_LINES).map(k => [k, true]))
  )
  const [flyTarget, setFlyTarget]     = useState(null)
  const [mapZoom, setMapZoom]         = useState(6)
  const [fitTrigger, setFitTrigger]   = useState(0)
  const [showCityMenu, setShowCityMenu] = useState(false)
  const [showTools, setShowTools]       = useState(false)

  // File d'attente : deux toasts rapprochés s'affichent l'un après l'autre
  const toastQueue = useRef({ queue: [], running: false })
  const showToast = useCallback((msg, type = 'info', ms = 3000) => {
    const q = toastQueue.current
    q.queue.push({ msg, type, ms })
    if (q.running) return
    q.running = true
    const next = () => {
      const item = q.queue.shift()
      if (!item) { q.running = false; setToast(null); return }
      setToast({ msg: item.msg, type: item.type })
      setTimeout(() => { setToast(null); setTimeout(next, 180) }, item.ms)
    }
    next()
  }, [])

  useEffect(() => {
    if (!online) showToast('Hors-ligne — données en cache', 'offline', 5000)
    else if (online && isSupabaseReady) showToast('Connecté', 'success', 2000)
  }, [online])

  useEffect(() => {
    if (realtimeFlash?.by) showToast(`Mis à jour par ${realtimeFlash.by}`, 'warning')
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

  function handleAdd(step)        { addStep(step);           showToast('Étape ajoutée', 'success') }
  function handleUpdate(id, ch)   { updateStep(id, ch);      showToast('Étape modifiée', 'success') }
  function handleDelete(id)       { deleteStep(id);          showToast('Étape supprimée', 'info') }
  function handleUndo()           { undo();                  showToast('Action annulée', 'warning') }

  async function handleCreateItin() {
    const copy = window.confirm('Copier les étapes actuelles dans le nouvel itinéraire ?\n\n(Annuler = démarrer vide)')
    const result = createItin()
    if (!result) { showToast('Maximum 5 itinéraires', 'info'); return }
    if (copy && result.id) await copyStepsTo(result.id)
    setSelectedId(null); setPopupStep(null)
    showToast(copy ? 'Itinéraire dupliqué' : 'Nouvel itinéraire créé', 'success')
  }

  async function handleDeleteItin(id) {
    if (!window.confirm('Supprimer cet itinéraire et toutes ses étapes ?')) return
    await deleteItinerarySteps(id)
    removeItin(id)
    showToast('Itinéraire supprimé', 'info')
  }

  if (!authed) return <PinGate onAuth={onAuth} />

  const flyBangkok = () => setFlyTarget({ lat: 13.745, lng: 100.515, zoom: 13, t: Date.now() })

  // Actions secondaires regroupées derrière "Plus" (desktop + mobile)
  const moreItems = [
    { icon: <CityIcon size={17} />, label: 'Bangkok BTS/MRT', onClick: () => { flyBangkok(); setShowTransit(true) } },
    { icon: <RouteIcon size={17} />, label: 'Trajet', toggle: true, active: showRoute, onClick: () => setShowRoute(v => !v) },
    { icon: <MetroIcon size={17} />, label: 'Métro Bangkok', toggle: true, active: showTransit, onClick: () => setShowTransit(v => !v) },
    { icon: <MapIcon size={17} />, label: 'Villes', onClick: () => setShowCityMenu(true) },
    { icon: <LinkIcon size={17} />, label: 'Outils utiles', onClick: () => setShowTools(true) },
    {
      // Sélecteur 3 états — les trois styles visibles d'un coup d'œil
      custom: (
        <MapStyleSelector
          value={mapStyle}
          onChange={(next) => { localStorage.setItem('th_map_style', next); setMapStyle(next) }}
        />
      ),
    },
    {
      icon: <DownloadIcon size={17} />, label: 'Exporter la sauvegarde',
      onClick: () => {
        const n = exportBackup()
        showToast(`Sauvegarde exportée (${n} éléments)`, 'success')
      },
    },
    {
      icon: <UploadIcon size={17} />, label: 'Importer une sauvegarde',
      onClick: () => document.getElementById('backup-file-input')?.click(),
    },
  ]

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
        background: '#0d1f3c',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        zIndex: isMobile ? 210 : 100, flexShrink: 0,
        boxShadow: isMobile && sidebarOpen ? '4px 0 24px rgba(0,0,0,0.5)' : 'none',
      }}>
        <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0e3468' }}>
          <span style={{ fontSize: 12, color: '#8fa8c4' }}>
            <Avatar name={user} size={20} style={{ verticalAlign: -5, marginRight: 6 }} /><strong style={{ color: '#e8f4fd' }}>{user}</strong>
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: online ? '#4ade80' : '#8fa8c4', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#8fa8c4' }}>{online ? 'en ligne' : 'hors-ligne'}</span>
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8fa8c4', padding: '0 4px' }}><CloseIcon size={16} /></button>
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
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 500 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <MapBtn onClick={() => setSidebarOpen(v => !v)} title={sidebarOpen ? 'Masquer le panneau' : 'Afficher le panneau'}>{sidebarOpen ? '◀' : '▶'}</MapBtn>
              <MapBtn label="Recentrer" onClick={() => setFitTrigger(n => n + 1)}><TargetIcon size={16} /></MapBtn>
              <MapBtn label="Hôtels" onClick={() => setShowHotels(true)}><BedIcon size={16} /></MapBtn>
              <MapBtn label="Budget" onClick={() => setShowBudget(true)}><WalletIcon size={16} /></MapBtn>
              <MapBtn label="Plus" active={showMore} onClick={() => setShowMore(v => !v)}><DotsIcon size={16} /></MapBtn>
            </div>
            {showMore && (
              <MoreMenu
                isMobile={false}
                items={moreItems}
                onClose={() => setShowMore(false)}
              />
            )}
          </div>
        )}

        {/* ── MOBILE top bar ── */}
        {isMobile && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 500,
            background: 'rgba(13,31,60,0.95)', backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 10,
          }}>
            <button onClick={() => setSidebarOpen(v => !v)} style={mobileTopBtn}><MenuIcon size={18} /></button>
            <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#e8f4fd' }}>
              🇹🇭 Thaïlande · Août 2026
            </div>
            <div style={{ width: 44, display: 'flex', justifyContent: 'flex-end' }}>
              {!online && <OfflinePill />}
            </div>
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
            position: 'absolute', top: 12, right: 12,
            zIndex: 480, background: 'rgba(13,31,60,0.94)', backdropFilter: 'blur(8px)',
            borderRadius: 22, padding: '8px 18px',
            border: '1px solid rgba(56,189,248,0.15)',
            boxShadow: '0 2px 14px rgba(0,0,0,0.35)',
            fontWeight: 700, fontSize: 14, color: '#e8f4fd', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            🇹🇭 Thaïlande · Août 2026
            {!online && <OfflinePill />}
          </div>
        )}

        <MetroLegend
          visible={showTransit}
          visibleLines={visibleLines}
          onToggleLine={(id, val) => setVisibleLines(prev => ({ ...prev, [id]: val }))}
          isMobile={isMobile}
        />

        {loading ? (
          <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            alignItems: 'center', justifyContent: 'center', gap: 14,
            background: 'linear-gradient(160deg, #0d1f3c 0%, #0a2a52 100%)',
          }}>
            <div style={{ fontSize: 44 }}>🇹🇭</div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#e8f4fd' }}>Thaïlande · Août 2026</div>
            <Spinner size={22} style={{ color: '#38bdf8' }} />
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
            {mapStyle === 'satellite' ? (
              <TileLayer
                key="satellite"
                attribution='<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>'
                url={`https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${import.meta.env.VITE_MAPTILER_KEY}`}
                maxZoom={19}
                tileSize={512}
                zoomOffset={-1}
              />
            ) : (
              <TileLayer
                key={mapStyle}
                attribution='<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>'
                url={`https://api.maptiler.com/maps/${mapStyle === 'dark' ? '019f8656-f0dd-7192-9db3-2f9435c134e8' : '019f8657-e8bc-7c21-9f71-8034cab3c3bc'}/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
                maxZoom={20}
                tileSize={512}
                zoomOffset={-1}
              />
            )}
            {showTransit && <MetroLayer visibleLines={visibleLines} />}
            <SmoothWheelZoom />
            <ScaleControl />
            <ZoomWatcher onZoom={setMapZoom} />
            <ZoomControls isMobile={isMobile} />
            {showRoute && <RoutePolyline steps={visible} getSegment={getSegment} />}
            {visible.map((step) => (
              <StepMarker
                key={step.id}
                step={step}
                selected={selectedId === step.id}
                flash={realtimeFlash?.id === step.id}
                compact={mapZoom < 7.2 && selectedId !== step.id}
                hotelName={getSelectedHotel(step.id)?.name || null}
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
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1100,
            background: 'rgba(13,31,60,0.95)', backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
            padding: '6px 4px calc(8px + env(safe-area-inset-bottom))',
          }}>
            <BottomBtn onClick={() => setFitTrigger(n => n + 1)} label="Recentrer"><TargetIcon size={20} /></BottomBtn>
            <BottomBtn onClick={() => setShowHotels(true)} label="Hôtels"><BedIcon size={20} /></BottomBtn>
            <BottomBtn onClick={() => setShowBudget(true)} label="Budget"><WalletIcon size={20} /></BottomBtn>
            <BottomBtn onClick={() => setShowMore(v => !v)} label="Plus" active={showMore}><DotsIcon size={20} /></BottomBtn>
          </div>
        )}
        {isMobile && showMore && (
          <MoreMenu isMobile items={moreItems} onClose={() => setShowMore(false)} />
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
            onToast={showToast}
            onCompareHotels={(stepId) => { setPopupStep(null); setHotelCompare({ stepId }) }}
          />
        )}
        {showBudget && (
          <BudgetPanel steps={steps} getSegment={getSegment} getHotel={getSelectedHotel} onClose={() => setShowBudget(false)} />
        )}
        {showHotels && (
          <HotelPanel steps={steps} getHotels={getHotels} onClose={() => setShowHotels(false)}
            onFly={(lat, lng) => setFlyTarget({ lat, lng, t: Date.now() })}
            onCompare={(stepId) => { setShowHotels(false); setHotelCompare({ stepId: stepId ?? null }) }} />
        )}
        {hotelCompare && (
          <HotelComparePanel
            steps={steps}
            activeItin={activeItin || { id: activeItinId, name: 'Itinéraire', color: '#38bdf8' }}
            itineraries={itineraries}
            getAllStepsForCompare={getAllStepsForCompare}
            getHotels={getHotels}
            initialStepId={hotelCompare.stepId}
            isMobile={isMobile}
            onClose={() => setHotelCompare(null)}
            onFly={(lat, lng) => setFlyTarget({ lat, lng, zoom: 15, t: Date.now() })}
          />
        )}
        {showTools && <ExternalToolsPanel onClose={() => setShowTools(false)} />}
      </Suspense>
      {editStep && (
        <EditStepModal step={editStep} onSave={(ch) => handleUpdate(editStep.id, ch)}
          onDelete={() => handleDelete(editStep.id)} onClose={() => setEditStep(null)} />
      )}
      {showAdd && <AddStepModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <input
        id="backup-file-input"
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          try {
            const n = await importBackup(file)
            showToast(`${n} éléments restaurés — rechargement…`, 'success')
            setTimeout(() => window.location.reload(), 1200)
          } catch (err) {
            showToast(err.message, 'warning', 4000)
          }
        }}
      />


      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(8px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(56,189,248,0.35); border-radius:4px; }
        .leaflet-container { background:#12141a; }
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
        background: 'rgba(10,42,82,0.97)',
        backdropFilter: 'blur(12px)',
        borderRadius: 16,
        border: '1px solid rgba(56,189,248,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        padding: '10px 8px',
        minWidth: 200,
        maxWidth: 240,
        maxHeight: isMobile ? '70vh' : '80vh',
        overflowY: 'auto',
        animation: 'slideUp 0.18s ease',
      }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#8fa8c4', textTransform: 'uppercase', letterSpacing: 1, padding: '2px 8px 8px' }}>
          Destinations
        </div>
        {unique.map(step => {
          const cat = CATEGORIES[step.categorie] || { color: '#8fa8c4' }
          return (
            <button key={step.id} onClick={() => onSelect(step)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', textAlign: 'left',
              background: 'none', border: 'none', borderRadius: 10,
              padding: '10px 12px', cursor: 'pointer', fontSize: 13, color: '#e8f4fd',
              borderLeft: `3px solid ${cat.color}`,
              marginBottom: 4,
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <CategoryIcon category={step.categorie} size={18} color={cat.color} />
              <div>
                <div style={{ fontWeight: 600 }}>{step.nom}</div>
                <div style={{ fontSize: 11, color: '#8fa8c4' }}>{step.dates}</div>
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
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      background: active ? 'rgba(56,189,248,0.12)' : 'none', border: 'none', cursor: 'pointer',
      padding: '4px 10px', borderRadius: 12, minWidth: 60, minHeight: 48, flex: 1, maxWidth: 96,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 22, color: active ? '#38bdf8' : '#8fa8c4' }}>{children}</span>
      <span style={{ fontSize: 10, color: active ? '#38bdf8' : '#8fa8c4', fontWeight: active ? 700 : 500 }}>{label}</span>
    </button>
  )
}

function OfflinePill() {
  return (
    <span style={{
      fontSize: 10, background: 'rgba(255,255,255,0.1)', color: '#e8f4fd', borderRadius: 8,
      padding: '3px 8px', fontWeight: 600, whiteSpace: 'nowrap',
    }} ><svg width="11" height="11" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" style={{ verticalAlign: -1.5, marginRight: 4 }}><path d="M3 3l14 14M6.5 8.6a8.5 8.5 0 0 1 2-1.2M2.5 6.5a12 12 0 0 1 3-2M10.6 5.1a12 12 0 0 1 6.9 3.4M9.5 9.2a8.5 8.5 0 0 1 4 2.3M7.2 12.2a5 5 0 0 1 2.8-1.4"/><circle cx="10" cy="15.5" r="1.2" fill="currentColor" stroke="none"/></svg>hors-ligne</span>
  )
}

// Sélecteur de style de carte — 3 états visibles, l'actif en aqua
function MapStyleSelector({ value, onChange }) {
  const options = [
    { key: 'light', label: 'Clair', icon: <SunIcon size={15} /> },
    { key: 'dark', label: 'Sombre', icon: <MoonIcon size={15} /> },
    { key: 'satellite', label: 'Satellite', icon: <SatelliteIcon size={15} /> },
  ]
  return (
    <div style={{ padding: '6px 12px 8px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#8fa8c4', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
        Style de carte
      </div>
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3 }}>
        {options.map(o => {
          const active = value === o.key
          return (
            <button
              key={o.key}
              onClick={() => onChange(o.key)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                background: active ? 'rgba(56,189,248,0.18)' : 'none',
                border: active ? '1px solid rgba(56,189,248,0.5)' : '1px solid transparent',
                borderRadius: 8, padding: '7px 4px', minHeight: 44, cursor: 'pointer',
                color: active ? '#38bdf8' : '#8fa8c4',
              }}
            >
              {o.icon}
              <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{o.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Menu "Plus" — dropdown sur desktop, bottom sheet sur mobile
function MoreMenu({ isMobile, items, onClose }) {
  const row = (item, i) => item.custom ? (
    <div key={`custom-${i}`}>{item.custom}</div>
  ) : (
    <button
      key={item.label}
      onClick={() => { item.onClick(); if (!item.toggle) onClose() }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        background: item.active ? 'rgba(56,189,248,0.12)' : 'none', border: 'none',
        borderRadius: 10, padding: isMobile ? '12px 14px' : '9px 12px',
        minHeight: isMobile ? 48 : 38, cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', color: item.active ? '#38bdf8' : '#8fa8c4' }}>{item.icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: item.active ? '#38bdf8' : '#e8f4fd', flex: 1 }}>
        {item.label}
      </span>
      {item.toggle && (
        <span style={{
          fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 8px',
          background: item.active ? '#38bdf8' : 'rgba(255,255,255,0.08)',
          color: item.active ? '#0d1f3c' : '#8fa8c4',
        }}>{item.active ? 'ON' : 'OFF'}</span>
      )}
    </button>
  )

  if (isMobile) {
    return (
      <>
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 1105, background: 'rgba(0,0,0,0.35)' }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1110,
          background: '#0a2a52', borderRadius: '18px 18px 0 0',
          border: '1px solid rgba(56,189,248,0.15)', borderBottom: 'none',
          padding: '10px 10px calc(14px + env(safe-area-inset-bottom))',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
        }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 8px' }} />
          {items.map(row)}
        </div>
      </>
    )
  }
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 505 }} />
      <div style={{
        position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 510,
        background: '#0a2a52', borderRadius: 12, padding: 6, minWidth: 200,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid rgba(56,189,248,0.15)',
      }}>
        {items.map(row)}
      </div>
    </>
  )
}

const mobileTopBtn = {
  background: 'rgba(56,189,248,0.12)', border: 'none', borderRadius: 10,
  width: 38, height: 38, fontSize: 18, cursor: 'pointer', color: '#e8f4fd',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}

function MapBtn({ onClick, title, label, active, children }) {
  return (
    <button
      onClick={onClick}
      title={title || label}
      style={{
        background: active ? 'rgba(56,189,248,0.18)' : '#0e3468',
        border: active ? '1px solid rgba(56,189,248,0.5)' : '1px solid rgba(56,189,248,0.2)',
        borderRadius: 10, padding: label ? '8px 13px' : '8px 11px',
        cursor: 'pointer', fontSize: 17, lineHeight: 1, color: '#e8f4fd',
        boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', gap: 7,
      }}
    >
      {children}
      {label && (
        <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#38bdf8' : '#e8f4fd' }}>{label}</span>
      )}
    </button>
  )
}
