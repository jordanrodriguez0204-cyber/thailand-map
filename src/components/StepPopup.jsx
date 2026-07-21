import { useState, useEffect } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { haversineKm } from '../utils/geo'
import { CATEGORIES } from '../constants'
import { MetroWidget } from './MetroWidget'
import { getNearestStations, fetchWalkingRoute } from '../utils/metroUtils'
import { WeatherBadge } from './WeatherBadge'
import { getTips } from '../data/destinations'

function timeAgo(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

const TABS = ['Info', 'Activités', 'Météo', 'Tips', 'Budget', '🔗']

export function StepPopup({ step, prevStep, onClose, onEdit, getHotels, addHotel, updateHotel, deleteHotel, selectHotel, getActivities, addActivity, toggleActivity, removeActivity, onFlyTo }) {
  const [tab, setTab] = useState('Info')
  const cat = CATEGORIES[step.categorie] || { label: step.categorie, emoji: '📍', color: '#6b7280' }
  const dist = prevStep ? haversineKm(prevStep.lat, prevStep.lng, step.lat, step.lng) : null
  const hotels = getHotels ? getHotels(step.id) : []
  const tips = getTips(step)

  useEffect(() => {
    if (!step.lat || !step.lng) return
    const stations = getNearestStations(step.lat, step.lng, 4)
    stations.forEach(st => fetchWalkingRoute(step.lat, step.lng, st.lat, st.lng))
  }, [step.lat, step.lng])

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: 1, marginBottom: 2 }}>ÉTAPE {step.ordre}</div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>{step.nom}</h2>
          </div>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <Chip bg={cat.color + '22'} color={cat.color}>{cat.emoji} {cat.label}</Chip>
          <Chip bg="#fef3c7" color="#92400e">📅 {step.dates}</Chip>
          {dist && <Chip bg="#ede9fe" color="#5b21b6">📍 {dist} km</Chip>}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 14, gap: 0 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, background: 'none', border: 'none', padding: '7px 4px',
              fontSize: 12, fontWeight: tab === t ? 700 : 400,
              color: tab === t ? '#6366f1' : '#6b7280',
              borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ minHeight: 120 }}>
          {tab === 'Info' && (
            <div>
              {step.notes && (
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>
                  {step.notes}
                </div>
              )}
              {!step.notes && <p style={{ color: '#9ca3af', fontSize: 13 }}>Aucune note pour cette étape.</p>}
            </div>
          )}

          {tab === 'Activités' && (
            <ActivitiesTab
              stepId={step.id}
              activities={getActivities ? getActivities(step.id) : []}
              onAdd={(text) => addActivity && addActivity(step.id, text)}
              onToggle={(id) => toggleActivity && toggleActivity(step.id, id)}
              onRemove={(id) => removeActivity && removeActivity(step.id, id)}
            />
          )}

          {tab === 'Météo' && <WeatherBadge step={step} />}

          {tab === 'Tips' && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {tips.length === 0 && <li style={{ color: '#9ca3af', fontSize: 13 }}>Aucun conseil disponible.</li>}
              {tips.map((tip, i) => (
                <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, background: '#f9fafb', borderRadius: 8, padding: '7px 10px' }}>
                  {tip}
                </li>
              ))}
            </ul>
          )}

          {tab === '🔗' && <ToolsTab step={step} />}

          {tab === 'Budget' && (
            <HotelsTab
              stepId={step.id}
              stepNom={step.nom}
              hotels={hotels}
              onAdd={() => addHotel && addHotel(step.id)}
              onUpdate={(hotelId, changes) => updateHotel && updateHotel(step.id, hotelId, changes)}
              onDelete={(hotelId) => deleteHotel && deleteHotel(step.id, hotelId)}
              onSelect={(hotelId) => selectHotel && selectHotel(step.id, hotelId)}
              onFlyTo={onFlyTo}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: 11, color: '#d1d5db' }}>
            {step.modified_by && <span>✏️ {step.modified_by} · {timeAgo(step.modified_at)}</span>}
          </div>
          <button onClick={() => { onClose(); onEdit(step) }} style={editBtn}>Modifier ✏️</button>
        </div>
      </div>
    </div>
  )
}


// ── Multi-hôtels ────────────────────────────────────────────────────────────

function HotelsTab({ stepId, stepNom, hotels, onAdd, onUpdate, onDelete, onSelect, onFlyTo }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {hotels.length === 0 && (
        <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
          Aucun hôtel — ajoutes-en un pour comparer !
        </div>
      )}
      {hotels.map((hotel, idx) => (
        <HotelCard
          key={hotel.id}
          hotel={hotel}
          index={idx}
          stepNom={stepNom}
          isOnly={hotels.length === 1}
          onUpdate={(changes) => onUpdate(hotel.id, changes)}
          onDelete={() => onDelete(hotel.id)}
          onSelect={() => onSelect(hotel.id)}
          onFlyTo={onFlyTo}
        />
      ))}
      <button
        onClick={onAdd}
        style={{
          background: '#f0f4ff', color: '#6366f1', border: '1.5px dashed #c7d2fe',
          borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', width: '100%',
        }}
      >
        + Ajouter un hôtel
      </button>
    </div>
  )
}

const inThailand = (lat, lng) => lat >= 4.5 && lat <= 21.5 && lng >= 97 && lng <= 106

// Supprime les numéros de bâtiment thaïlandais type "403/1", "403-407/1, 409/2"
// et normalise les termes courants
function cleanThaiAddress(raw) {
  let s = raw.trim()
  // Supprime les numéros au début : "403-407/1, 409" ou "403/1"
  s = s.replace(/^[\d][\d\-]*(?:\/\d+)?(?:\s*,\s*[\d][\d\-]*(?:\/\d+)?)*\s*,?\s*/g, '')
  // Koh → Ko (Nominatim)
  s = s.replace(/\bkoh\b/gi, 'ko')
  // Réordonne "Soi X, Sukhumvit" → "Sukhumvit Soi X" (format Nominatim)
  s = s.replace(/\bSoi\s+(\w+)\s*,\s*(Sukhumvit)/gi, '$2 Soi $1')
  // Floor / Level (inutile pour geocoding)
  s = s.replace(/\b(floor|level|fl\.?)\s*\d+\b/gi, '')
  // Nettoie ponctuation résiduelle
  return s.replace(/^[,\s]+|[,\s]+$/g, '').replace(/\s{2,}/g, ' ')
}

// Extrait les composants utiles d'une adresse thaïlandaise
function parseThaiAddress(raw) {
  const ROADS = /\b(Sukhumvit|Silom|Sathorn|Charoenkrung|Charoen Krung|Ratchadamri|Phloenchit|Phetchaburi|Ratchada|Lat Phrao|Rama [IVX\d]+|Yaowarat|Ploenchit|Wireless|Withayu|Asok|Ekkamai|Thonglor|Ari|Siam)\b/gi
  const roads = [...raw.matchAll(ROADS)].map(m => m[0])
  const soiMatch = raw.match(/(?:Sukhumvit\s+)?Soi\s+(\d+\w*)/i)
    || raw.match(/Sukhumvit\s+(\d+\w*)/i)
  const soiNum = soiMatch ? soiMatch[1] : null
  return { road: roads[0] || null, soiNum }
}

const geocodeCache = new Map()

async function doGeocode(address, stepNom) {
  const cacheKey = `${address.trim().toLowerCase()}|${stepNom}`
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey)

  const cleaned = cleanThaiAddress(address.trim())
  const { road, soiNum } = parseThaiAddress(address)

  // Nominatim : retourne résultats en Thaïlande
  const nomSearch = async (q, restrict = true) => {
    const cc = restrict ? '&countrycodes=th' : ''
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=8&addressdetails=1${cc}`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'thailand-travel-map/1.0' } }
      )
      return (await res.json()).filter(r => inThailand(+r.lat, +r.lon))
    } catch { return [] }
  }

  // Photon (Komoot) : souvent meilleur sur noms d'hôtels et adresses incomplètes
  const photonSearch = async (q) => {
    try {
      const res = await fetch(
        `https://api.photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&bbox=97,4.5,106,21.5&lang=en`,
        { headers: { 'User-Agent': 'thailand-travel-map/1.0' } }
      )
      const data = await res.json()
      return (data.features || [])
        .map(f => ({ lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], display_name: [f.properties.name, f.properties.city, 'Thailand'].filter(Boolean).join(', '), type: f.properties.osm_value }))
        .filter(r => inThailand(r.lat, r.lon))
    } catch { return [] }
  }

  const pickBest = results =>
    results.find(r => ['hotel','hostel','guest_house','motel'].includes(r.type))
    || results.find(r => ['island','archipelago','bay','beach'].includes(r.type))
    || results.find(r => ['city','town','village','suburb','district'].includes(r.type))
    || results[0]

  // Séquence de tentatives : du plus précis au plus large
  const attempts = [
    // 1. Adresse nettoyée (sans numéros de bâtiment) + pays
    () => nomSearch(cleaned ? `${cleaned}, Thailand` : null),
    // 2. Nom de l'hôtel seul via Photon (si l'adresse contient un nom propre)
    () => photonSearch(`${address.trim()}, Thailand`),
    // 3. Soi reformaté : "Sukhumvit Soi 11, Bangkok, Thailand"
    soiNum && road ? () => nomSearch(`${road} Soi ${soiNum}, Bangkok, Thailand`) : null,
    // 4. Soi sans "Soi" : Nominatim connait parfois "Sukhumvit 11"
    soiNum && road ? () => nomSearch(`${road} ${soiNum}, Bangkok, Thailand`) : null,
    // 5. Rue + étape
    road ? () => nomSearch(`${road}, ${stepNom}, Thailand`) : null,
    // 6. Adresse nettoyée sans restriction géographique
    () => nomSearch(cleaned || address.trim(), false),
    // 7. Étape seule (centre de la ville / zone)
    () => nomSearch(`${stepNom}, Thailand`),
  ].filter(Boolean)

  for (const fn of attempts) {
    if (!fn) continue
    const results = await fn()
    const best = pickBest(results)
    if (best) {
      const result = { lat: +best.lat, lng: +best.lon, label: best.display_name?.split(',').slice(0,3).join(', ') || '' }
      geocodeCache.set(cacheKey, result)
      return result
    }
  }
  geocodeCache.set(cacheKey, null)
  return null
}

function HotelCard({ hotel, index, stepNom, isOnly, onUpdate, onDelete, onSelect, onFlyTo }) {
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeErr, setGeocodeErr] = useState(null)
  const [localName, setLocalName] = useState(hotel.name || '')
  const [localAddress, setLocalAddress] = useState(hotel.address || '')
  const debouncedName = useDebounce(localName)
  const debouncedAddress = useDebounce(localAddress)
  const total = hotel.price_per_night && hotel.nights ? hotel.price_per_night * hotel.nights : null

  useEffect(() => { onUpdate({ name: debouncedName }) }, [debouncedName])
  useEffect(() => {
    if (debouncedAddress !== (hotel.address || '')) {
      onUpdate({ address: debouncedAddress, lat: null, lng: null, geocoded_name: '' })
    }
  }, [debouncedAddress])

  async function handleGeocode() {
    if (!hotel.address?.trim()) return
    setGeocoding(true); setGeocodeErr(null)
    try {
      const result = await doGeocode(hotel.address, stepNom)
      if (result) {
        onUpdate({ lat: result.lat, lng: result.lng, geocoded_name: result.label })
        onFlyTo?.(result.lat, result.lng)
      } else {
        setGeocodeErr('Introuvable — essaie en anglais (ex: Ko Samui, Sukhumvit Soi 11…)')
      }
    } catch { setGeocodeErr('Erreur réseau') }
    setGeocoding(false)
  }

  return (
    <div style={{
      border: hotel.selected ? '2px solid #6366f1' : '1.5px solid #e5e7eb',
      borderRadius: 12, overflow: 'hidden',
      background: hotel.selected ? '#f5f3ff' : '#fafafa',
    }}>
      {/* En-tête de la card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #f3f4f6', background: hotel.selected ? '#ede9fe' : '#f3f4f6' }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: hotel.selected ? '#6366f1' : '#6b7280', flex: 1 }}>
          {hotel.selected ? '★ Sélectionné (budget)' : `Option ${index + 1}`}
        </span>
        {!hotel.selected && (
          <button onClick={e => { e.stopPropagation(); onSelect() }} style={{ fontSize: 11, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 600 }}>
            Choisir
          </button>
        )}
        {!isOnly && (
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            style={{ background: '#fee2e2', border: 'none', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '3px 8px', borderRadius: 6, lineHeight: 1 }}
            title="Supprimer cet hôtel"
          >🗑</button>
        )}
      </div>

      {/* Formulaire */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px' }}>
        <label style={labelStyle}>
          <span>🏨 Nom</span>
          <input style={inputStyle} placeholder="Ex: Mandarin Oriental…" value={localName} onChange={e => setLocalName(e.target.value)} />
        </label>

        <label style={labelStyle}>
          <span>📍 Adresse</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="48 Oriental Ave, Bangkok…"
              value={localAddress}
              onChange={e => setLocalAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGeocode()}
            />
            <button
              onClick={handleGeocode}
              disabled={geocoding || !hotel.address?.trim()}
              title="Localiser sur la carte"
              style={{
                background: hotel.lat ? '#f0fdf4' : '#6366f1', color: hotel.lat ? '#166534' : '#fff',
                border: 'none', borderRadius: 8, padding: '0 10px', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, flexShrink: 0,
                opacity: (!hotel.address?.trim() || geocoding) ? 0.5 : 1,
              }}
            >
              {geocoding ? '…' : hotel.lat ? '✓' : '📌'}
            </button>
          </div>
          {geocodeErr && <span style={{ fontSize: 11, color: '#ef4444' }}>{geocodeErr}</span>}
          {hotel.lat && <span style={{ fontSize: 11, color: '#16a34a' }}>✓ Placé sur la carte</span>}
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={labelStyle}>
            <span>💶 CHF / nuit</span>
            <input style={inputStyle} type="number" min="0" placeholder="0" value={hotel.price_per_night ?? ''} onChange={e => onUpdate({ price_per_night: e.target.value ? +e.target.value : null })} />
          </label>
          <label style={labelStyle}>
            <span>🌙 Nuits</span>
            <input style={inputStyle} type="number" min="0" placeholder="0" value={hotel.nights ?? ''} onChange={e => onUpdate({ nights: e.target.value ? +e.target.value : null })} />
          </label>
        </div>

        {total && (
          <div style={{ background: hotel.selected ? '#d1fae5' : '#f0fdf4', borderRadius: 8, padding: '7px 11px', fontSize: 13, color: '#166534', fontWeight: 700 }}>
            Total : {total.toLocaleString('fr-FR')} CHF
          </div>
        )}
        {hotel.lat && <MetroWidget lat={hotel.lat} lng={hotel.lng} compact />}
      </div>
    </div>
  )
}

// ── Activités ────────────────────────────────────────────────────────────────
function ActivitiesTab({ stepId, activities, onAdd, onToggle, onRemove }) {
  const [input, setInput] = useState('')
  function submit() {
    if (!input.trim()) return
    onAdd(input.trim())
    setInput('')
  }
  const done = activities.filter(a => a.done).length

  return (
    <div>
      {/* Input ajout */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Ajouter une activité…"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={submit} disabled={!input.trim()} style={{
          background: '#6366f1', color: '#fff', border: 'none',
          borderRadius: 8, padding: '0 12px', cursor: 'pointer',
          fontSize: 16, opacity: input.trim() ? 1 : 0.4,
        }}>+</button>
      </div>

      {/* Progression */}
      {activities.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
            <span>{done}/{activities.length} activités</span>
            <span>{activities.length > 0 ? Math.round(done / activities.length * 100) : 0}%</span>
          </div>
          <div style={{ height: 4, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${activities.length > 0 ? (done / activities.length * 100) : 0}%`, background: '#6366f1', borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* Liste */}
      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#d1d5db', fontSize: 13, padding: '20px 0' }}>
          Aucune activité — ajoutes-en une !<br />
          <span style={{ fontSize: 11 }}>Ex : Wat Pho, cours de cuisine, marché flottant…</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {activities.map(act => (
            <div key={act.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: act.done ? '#f9fafb' : '#fff',
              border: '1px solid #f3f4f6', borderRadius: 8, padding: '8px 10px',
            }}>
              <button onClick={() => onToggle(act.id)} style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                border: `2px solid ${act.done ? '#6366f1' : '#d1d5db'}`,
                background: act.done ? '#6366f1' : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 11, fontWeight: 700,
              }}>
                {act.done ? '✓' : ''}
              </button>
              <span style={{ flex: 1, fontSize: 13, color: act.done ? '#9ca3af' : '#111827', textDecoration: act.done ? 'line-through' : 'none' }}>
                {act.text}
              </span>
              <button onClick={() => onRemove(act.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e5e7eb', fontSize: 14, padding: '0 2px', lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({ bg, color, children }) {
  return (
    <span style={{ background: bg, color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>
      {children}
    </span>
  )
}

const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.45)', zIndex: 2000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 16,
}
const card = {
  background: '#fff', borderRadius: 18, padding: 22,
  maxWidth: 400, width: '100%',
  boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
  maxHeight: '90vh', overflowY: 'auto',
}
const closeBtn = {
  background: '#f3f4f6', border: 'none', width: 32, height: 32,
  borderRadius: '50%', fontSize: 20, cursor: 'pointer', color: '#6b7280',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
const editBtn = {
  background: '#6366f1', color: '#fff', border: 'none',
  borderRadius: 8, padding: '7px 14px', fontSize: 13,
  fontWeight: 600, cursor: 'pointer',
}
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#374151', fontWeight: 500 }
const inputStyle = { border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', width: '100%' }

// ── Détection région pour liens contextuels ─────────────────────────────
function getRegionType(lat, lng) {
  if (!lat || !lng) return 'general'
  if (lat > 16) return 'north'
  if (lng < 99.5 && lat < 13) return 'andaman'
  if (lat < 11.5 || (lat < 13.5 && lng > 100.5)) return 'gulf'
  return 'central'
}

const REGION_INFO = {
  andaman: {
    label: 'Mer d\'Andaman 🌊', color: '#0891b2',
    note: 'Côte ouest : en pleine mousson en août. Vagues et vent importants. Windguru indispensable avant de réserver.',
    noteColor: '#fef3c7', noteText: '#92400e',
  },
  gulf: {
    label: 'Golfe de Thaïlande 🐚', color: '#0d9488',
    note: 'Côte est : bien meilleure en août que la côte ouest. Généralement calme et ensoleillé — c\'est le bon choix cet été.',
    noteColor: '#f0fdf4', noteText: '#166534',
  },
  north: {
    label: 'Nord de la Thaïlande 🏔️', color: '#7c3aed',
    note: 'Saison des pluies mais souvent des matinées dégagées. Températures plus fraîches qu\'au sud (25-30°C).',
    noteColor: '#faf5ff', noteText: '#6b21a8',
  },
  central: {
    label: 'Thaïlande centrale / Bangkok 🏙️', color: '#d97706',
    note: 'Août = pluies fréquentes l\'après-midi mais courtes. Matinées souvent dégagées. Humidité très élevée.',
    noteColor: '#fffbeb', noteText: '#92400e',
  },
  general: { label: '', color: '#6b7280', note: null },
}

function ToolsTab({ step }) {
  const region = getRegionType(step.lat, step.lng)
  const info = REGION_INFO[region]
  const lat = step.lat || 13.0
  const lng = step.lng || 100.5

  const tools = [
    {
      group: '🌤️ Météo',
      items: [
        {
          name: 'Windy — carte en direct',
          url: `https://www.windy.com/?rain,${lat},${lng},10`,
          desc: 'Pluie, nuages, vent en temps réel centré sur cette étape',
          tag: 'Recommandé', tagColor: '#6366f1',
        },
        {
          name: 'Meteoblue 14 jours',
          url: `https://www.meteoblue.com/en/weather/maps/precipitation/#map=precipitation~daily~auto~${lng}~${lat}~10~auto`,
          desc: 'Prévisions multi-modèles ECMWF + GFS',
          tag: 'Précis', tagColor: '#0ea5e9',
        },
        {
          name: 'AccuWeather',
          url: `https://www.accuweather.com/en/search-locations?query=${encodeURIComponent((step.nom || '') + ' Thailand')}`,
          desc: 'Real Feel · alertes tropicales · 15 jours',
        },
        {
          name: 'Climatestotravel — Thaïlande',
          url: 'https://www.climatestotravel.com/climate/thailand',
          desc: 'Moyennes historiques mois par mois · comparatif côte est vs ouest',
          tag: '📅 Historique', tagColor: '#d97706',
        },
      ],
    },
    ...(region === 'andaman' || region === 'gulf' ? [{
      group: '🏄 Mer & Houle',
      items: [
        {
          name: 'Windguru',
          url: 'https://www.windguru.cz/',
          desc: 'Vent & houle · référence voile / plongée',
          tag: 'Côtes', tagColor: '#0891b2',
        },
        {
          name: 'Surf-forecast Thailand',
          url: 'https://www.surf-forecast.com/regions/Thailand',
          desc: 'Hauteur et direction des vagues heure par heure',
        },
        {
          name: region === 'andaman'
            ? 'Windy — mer d\'Andaman (vagues)'
            : 'Windy — Golfe de Thaïlande (vagues)',
          url: region === 'andaman'
            ? `https://www.windy.com/?waves,${lat},${lng},10`
            : `https://www.windy.com/?waves,${lat},${lng},10`,
          desc: 'Hauteur de houle et direction centrée sur cette étape',
        },
      ],
    }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Badge région */}
      {info.label && (
        <div style={{
          background: info.color + '12', border: `1px solid ${info.color}30`,
          borderRadius: 9, padding: '8px 11px',
          fontSize: 12, fontWeight: 700, color: info.color,
        }}>
          {info.label}
        </div>
      )}
      {/* Note contextuelle */}
      {info.note && (
        <div style={{
          background: info.noteColor, borderRadius: 9,
          padding: '9px 11px', fontSize: 12, color: info.noteText, lineHeight: 1.5,
        }}>
          {info.note}
        </div>
      )}

      {/* Liens par groupe */}
      {tools.map(group => (
        <div key={group.group}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: 0.2 }}>
            {group.group}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {group.items.map(tool => (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '8px 10px', borderRadius: 8,
                  background: '#f9fafb', border: '1px solid #f3f4f6',
                  textDecoration: 'none',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1.5 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>{tool.name}</span>
                    {tool.tag && (
                      <span style={{
                        fontSize: 9, fontWeight: 700,
                        background: tool.tagColor + '18', color: tool.tagColor,
                        borderRadius: 4, padding: '1px 5px',
                      }}>{tool.tag}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>{tool.desc}</div>
                </div>
                <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginTop: 2 }}>↗</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
