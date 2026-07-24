import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { haversineKm } from '../utils/geo'
import { CATEGORIES } from '../constants'
import { CategoryIcon, CalendarIcon, RouteIcon, PencilIcon, CloseIcon, PinIcon, TrashIcon, ScalesIcon, PlusIcon, ExternalIcon, LinkIcon, Spinner, CheckIcon } from './icons'
import { MetroWidget } from './MetroWidget'
import { getNearestStations, fetchWalkingRoute } from '../utils/metroUtils'
import { isBookingUrl, hotelNameFromUrl, cleanBookingUrl, fetchBookingInfo } from '../utils/bookingImport'
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

const TABS = ['Info', 'Activités', 'Météo', 'Tips', 'Budget', 'Liens']

export function StepPopup({ step, prevStep, onClose, onEdit, getHotels, addHotel, updateHotel, deleteHotel, selectHotel, getActivities, addActivity, toggleActivity, removeActivity, onFlyTo, onToast, onCompareHotels }) {
  const [tab, setTab] = useState('Info')
  const cat = CATEGORIES[step.categorie] || { label: step.categorie, emoji: '📍', color: '#8fa8c4' }
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
            <div style={{ fontSize: 11, color: '#8fa8c4', fontWeight: 600, letterSpacing: 1, marginBottom: 2 }}>ÉTAPE {step.ordre}</div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e8f4fd' }}>{step.nom}</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={closeBtn}><CloseIcon size={15} /></button>
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <Chip bg={cat.color + '22'} color={cat.color}>
            <CategoryIcon category={step.categorie} size={12} color={cat.color} style={{ verticalAlign: -2, marginRight: 4 }} />
            {cat.label}
          </Chip>
          <Chip bg="rgba(251,191,36,0.15)" color="#fbbf24"><CalendarIcon size={12} style={{ display: 'inline-block', verticalAlign: -2, marginRight: 4 }} />{step.dates}</Chip>
          {dist && <Chip bg="rgba(167,139,250,0.15)" color="#a78bfa"><RouteIcon size={12} style={{ display: 'inline-block', verticalAlign: -2, marginRight: 4 }} />{dist} km</Chip>}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.09)', marginBottom: 14, gap: 0 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, background: 'none', border: 'none', padding: '7px 4px',
              fontSize: 12, fontWeight: tab === t ? 700 : 400,
              color: tab === t ? '#38bdf8' : '#8fa8c4',
              borderBottom: tab === t ? '2px solid #38bdf8' : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ minHeight: 120 }}>
          {tab === 'Info' && (
            <div>
              {step.notes && (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: '#cfe2f5', lineHeight: 1.6, marginBottom: 12 }}>
                  {step.notes}
                </div>
              )}
              {!step.notes && <p style={{ color: '#8fa8c4', fontSize: 13 }}>Aucune note pour cette étape.</p>}
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
              {tips.length === 0 && <li style={{ color: '#8fa8c4', fontSize: 13 }}>Aucun conseil disponible.</li>}
              {tips.map((tip, i) => (
                <li key={i} style={{ fontSize: 13, color: '#cfe2f5', lineHeight: 1.5, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '7px 10px' }}>
                  {tip}
                </li>
              ))}
            </ul>
          )}

          {tab === 'Liens' && <ToolsTab step={step} />}

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
              onToast={onToast}
              onCompare={onCompareHotels}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 11, color: '#8fa8c4' }}>
            {step.modified_by && <span>{step.modified_by} · {timeAgo(step.modified_at)}</span>}
          </div>
          <button onClick={() => { onClose(); onEdit(step) }} style={editBtn} ><PencilIcon size={13} style={{ display: 'inline-block', verticalAlign: -2, marginRight: 6 }} />Modifier</button>
        </div>
      </div>
    </div>
  )
}


// ── Multi-hôtels ────────────────────────────────────────────────────────────

function HotelsTab({ stepId, stepNom, hotels, onAdd, onUpdate, onDelete, onSelect, onFlyTo, onToast, onCompare }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {hotels.length === 0 && (
        <div style={{ textAlign: 'center', padding: '14px 0 4px', color: '#8fa8c4', fontSize: 13 }}>
          Aucun hôtel — ajoutes-en un pour comparer.
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
          onToast={onToast}
        />
      ))}
      <button
        onClick={onAdd}
        style={{
          background: 'rgba(56,189,248,0.08)', color: '#38bdf8', border: '1.5px dashed rgba(56,189,248,0.4)',
          borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', width: '100%', minHeight: 44,
        }}
       ><PlusIcon size={14} style={{ display: 'inline-block', verticalAlign: -2, marginRight: 6 }} />Ajouter un hôtel
      </button>
      {onCompare && hotels.filter(h => h.name || h.address).length >= 2 && (
        <button
          onClick={() => onCompare(stepId)}
          style={{
            background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: 'none',
            borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', width: '100%', minHeight: 44,
          }}
         ><ScalesIcon size={14} style={{ display: 'inline-block', verticalAlign: -2, marginRight: 6 }} />Comparer ces hôtels
        </button>
      )}
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

// Cache persistant (localStorage) — évite de re-frapper Nominatim (limite 1 req/s)
const GEOCODE_CACHE_KEY = 'th_geocode_cache'
const geocodeCache = new Map(
  (() => { try { return JSON.parse(localStorage.getItem(GEOCODE_CACHE_KEY) || '[]') } catch { return [] } })()
)
function persistGeocodeCache() {
  try {
    // Cap à 200 entrées (les plus récentes)
    const entries = [...geocodeCache.entries()].slice(-200)
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(entries))
  } catch { /* quota plein — tant pis, cache RAM seul */ }
}

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
      persistGeocodeCache()
      return result
    }
  }
  geocodeCache.set(cacheKey, null)
  return null
}

function HotelCard({ hotel, index, stepNom, isOnly, onUpdate, onDelete, onSelect, onFlyTo, onToast }) {
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeErr, setGeocodeErr] = useState(null)
  const [localName, setLocalName] = useState(hotel.name || '')
  const [localAddress, setLocalAddress] = useState(hotel.address || '')
  const [bookingInput, setBookingInput] = useState('')
  const [importing, setImporting] = useState(false)
  const [importErr, setImportErr] = useState(null)
  const debouncedName = useDebounce(localName)
  const debouncedAddress = useDebounce(localAddress)

  // Prix total du séjour — champ éditable, synchronisé avec price_per_night × nights.
  // On garde price_per_night + nights comme champs canoniques (budget, comparaisons).
  const [totalStr, setTotalStr] = useState(
    hotel.price_per_night && hotel.nights ? String(Math.round(hotel.price_per_night * hotel.nights * 100) / 100) : ''
  )
  const editingTotalRef = useRef(false)  // évite que l'effet écrase la saisie en cours
  const lastEditRef = useRef('pernight') // 'pernight' | 'total' — quel champ est "sticky" si les nuits changent

  // Recalcule le total affiché quand prix/nuit ou nuits changent depuis l'extérieur
  // (édition prix/nuit, import Booking, sync cloud…). Ignoré pendant la frappe du total.
  useEffect(() => {
    if (editingTotalRef.current) return
    const t = hotel.price_per_night && hotel.nights ? hotel.price_per_night * hotel.nights : null
    setTotalStr(t != null ? String(Math.round(t * 100) / 100) : '')
  }, [hotel.price_per_night, hotel.nights])

  const totalNum = totalStr ? +totalStr : (hotel.price_per_night && hotel.nights ? hotel.price_per_night * hotel.nights : null)

  function handleNightsChange(e) {
    const n = e.target.value ? +e.target.value : null
    // Si l'utilisateur a saisi un total, on le garde fixe et on recalcule le prix/nuit
    if (lastEditRef.current === 'total' && totalStr && n) {
      onUpdate({ nights: n, price_per_night: Math.round((+totalStr / n) * 100) / 100 })
    } else {
      onUpdate({ nights: n })
    }
  }

  function handlePerNightChange(e) {
    lastEditRef.current = 'pernight'
    onUpdate({ price_per_night: e.target.value ? +e.target.value : null })
  }

  function handleTotalChange(e) {
    const v = e.target.value
    lastEditRef.current = 'total'
    editingTotalRef.current = true
    setTotalStr(v)
    const t = v ? +v : null
    if (t == null) {
      onUpdate({ price_per_night: null })
    } else if (hotel.nights) {
      onUpdate({ price_per_night: Math.round((t / hotel.nights) * 100) / 100 })
    }
    // Pas encore de nuits : on garde le total, le prix/nuit sera calculé
    // dès que le nombre de nuits sera renseigné (voir handleNightsChange).
  }

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

  async function handleBookingImport(rawUrl) {
    const url = (rawUrl || bookingInput).trim()
    if (!isBookingUrl(url) || importing) return
    setImporting(true); setImportErr(null)
    const stored = cleanBookingUrl(url)
    try {
      const info = await fetchBookingInfo(url)
      const changes = {
        booking_url: stored, source: 'booking',
        ...(info.name ? { name: info.name } : {}),
        ...(info.address ? { address: info.address } : {}),
        ...(info.photo_url ? { photo_url: info.photo_url } : {}),
        ...(info.rating != null ? { rating: info.rating } : {}),
      }
      if (info.lat != null && info.lng != null) {
        changes.lat = info.lat; changes.lng = info.lng
        changes.geocoded_name = info.address || info.name || ''
      }
      onUpdate(changes)
      if (info.name) setLocalName(info.name)
      if (info.address) setLocalAddress(info.address)
      if (changes.lat != null) {
        onFlyTo?.(changes.lat, changes.lng)
        onToast?.('Hôtel importé depuis Booking', 'success')
      } else if (info.name) {
        // Coordonnées absentes → géocode sur le nom
        const geo = await doGeocode(info.address || info.name, stepNom)
        if (geo) {
          onUpdate({ lat: geo.lat, lng: geo.lng, geocoded_name: geo.label })
          onFlyTo?.(geo.lat, geo.lng)
          onToast?.('Hôtel importé depuis Booking', 'success')
        } else {
          setImportErr('Nom récupéré, mais localisation introuvable — vérifie l\'adresse puis utilise le bouton de localisation')
        }
      }
      setBookingInput('')
    } catch {
      // API indisponible (dev local, blocage Booking…) → nom depuis l'URL + géocodage
      const guessed = hotelNameFromUrl(url)
      if (guessed) {
        onUpdate({ name: guessed, booking_url: stored, source: 'booking' })
        setLocalName(guessed)
        const geo = await doGeocode(`${guessed} hotel`, stepNom).catch(() => null)
        if (geo) {
          onUpdate({ lat: geo.lat, lng: geo.lng, geocoded_name: geo.label })
          onFlyTo?.(geo.lat, geo.lng)
          onToast?.('Hôtel localisé (infos partielles)', 'success')
        } else {
          setImportErr('Impossible de récupérer les infos — remplis l\'adresse manuellement puis localise-la')
        }
        setBookingInput('')
      } else {
        setImportErr('Impossible de récupérer les infos — remplis manuellement')
      }
    }
    setImporting(false)
  }

  return (
    <div style={{
      border: hotel.selected ? '2px solid #38bdf8' : '1.5px solid rgba(56,189,248,0.15)',
      borderRadius: 12, overflow: 'hidden',
      background: hotel.selected ? 'rgba(56,189,248,0.08)' : '#0e3468',
    }}>
      {/* En-tête de la card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: hotel.selected ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)' }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: hotel.selected ? '#38bdf8' : '#8fa8c4', flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {hotel.selected ? '★ Sélectionné (budget)' : `Option ${index + 1}`}
          {hotel.source === 'booking' && (
            <span style={{ fontSize: 9.5, background: 'rgba(56,189,248,0.15)', color: '#38bdf8', borderRadius: 5, padding: '2px 6px', fontWeight: 700, letterSpacing: 0.3 }}>via Booking</span>
          )}
          {hotel.rating != null && (
            <span style={{ fontSize: 10, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', borderRadius: 5, padding: '2px 6px', fontWeight: 700 }}>★ {hotel.rating}</span>
          )}
        </span>
        {!hotel.selected && (
          <button onClick={e => { e.stopPropagation(); onSelect() }} style={{ fontSize: 11, background: '#38bdf8', color: '#0d1f3c', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 600 }}>
            Choisir
          </button>
        )}
        {!isOnly && (
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            style={{ background: 'rgba(248,113,113,0.12)', border: 'none', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '3px 8px', borderRadius: 6, lineHeight: 1 }}
            title="Supprimer cet hôtel"
          ><TrashIcon size={13} /></button>
        )}
      </div>

      {/* Formulaire */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px' }}>

        {/* Import Booking.com */}
        {hotel.booking_url ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(56,189,248,0.08)', borderRadius: 8, padding: '6px 10px' }}>
            <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              Lié à Booking.com
            </span>
            <a href={hotel.booking_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
              Ouvrir
            </a>
            <button
              onClick={e => { e.stopPropagation(); onUpdate({ booking_url: null, source: 'manual' }) }}
              title="Détacher le lien"
              style={{ background: 'none', border: 'none', color: '#8fa8c4', fontSize: 13, cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}
            ><CloseIcon size={12} /></button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              style={{
                ...inputStyle, flex: 1,
                opacity: importing ? 0.55 : 1,
                background: importing ? 'rgba(255,255,255,0.06)' : inputStyle.background,
              }}
              placeholder="Colle un lien Booking.com ici"
              value={bookingInput}
              disabled={importing}
              onChange={e => {
                const v = e.target.value
                setBookingInput(v)
                if (isBookingUrl(v)) handleBookingImport(v)
              }}
              onKeyDown={e => e.key === 'Enter' && handleBookingImport()}
            />
            {importing && (
              <Spinner size={15} style={{ color: '#38bdf8' }} />
            )}
          </div>
        )}
        {importErr && <span style={{ fontSize: 11, color: '#f87171' }}>{importErr}</span>}

        <label style={labelStyle}>
          <span>Nom</span>
          <input style={inputStyle} placeholder="Ex: Mandarin Oriental…" value={localName} onChange={e => setLocalName(e.target.value)} />
        </label>

        <label style={labelStyle}>
          <span>Adresse</span>
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
                background: hotel.lat ? 'rgba(74,222,128,0.15)' : '#38bdf8', color: hotel.lat ? '#4ade80' : '#0d1f3c',
                border: 'none', borderRadius: 8, padding: '0 10px', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, flexShrink: 0,
                opacity: (!hotel.address?.trim() || geocoding) ? 0.5 : 1,
              }}
            >
              {geocoding ? '…' : hotel.lat ? <CheckIcon size={14} /> : <PinIcon size={14} />}
            </button>
          </div>
          {geocodeErr && <span style={{ fontSize: 11, color: '#f87171' }}>{geocodeErr}</span>}
          {hotel.lat && <span style={{ fontSize: 11, color: '#4ade80' }}>Placé sur la carte ✓</span>}
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <label style={labelStyle}>
            <span>Nuits</span>
            <input style={inputStyle} type="number" min="0" placeholder="0" value={hotel.nights ?? ''} onChange={handleNightsChange} />
          </label>
          <label style={labelStyle}>
            <span>CHF / nuit</span>
            <input style={inputStyle} type="number" min="0" placeholder="0" value={hotel.price_per_night ?? ''} onChange={handlePerNightChange} />
          </label>
          <label style={labelStyle}>
            <span>Total CHF</span>
            <input
              style={inputStyle}
              type="number"
              min="0"
              placeholder="0"
              value={totalStr}
              onChange={handleTotalChange}
              onBlur={() => { editingTotalRef.current = false }}
            />
          </label>
        </div>
        <div style={{ fontSize: 10.5, color: '#8fa8c4', marginTop: -2 }}>
          Saisis le total du séjour (comme sur Booking) ou le prix par nuit — l'autre se calcule automatiquement.
          {totalStr && !hotel.nights && <span style={{ color: '#fbbf24' }}> Indique le nombre de nuits pour répartir le prix.</span>}
        </div>

        {totalNum != null && (
          <div style={{ background: hotel.selected ? 'rgba(74,222,128,0.2)' : 'rgba(74,222,128,0.12)', borderRadius: 8, padding: '7px 11px', fontSize: 13, color: '#4ade80', fontWeight: 700 }}>
            Total : {totalNum.toLocaleString('fr-FR')} CHF{hotel.nights ? ` · ${hotel.nights} nuit${hotel.nights > 1 ? 's' : ''}` : ''}
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
          background: '#38bdf8', color: '#0d1f3c', border: 'none',
          borderRadius: 8, padding: '0 12px', cursor: 'pointer',
          fontSize: 16, opacity: input.trim() ? 1 : 0.4,
        }}>+</button>
      </div>

      {/* Progression */}
      {activities.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8fa8c4', marginBottom: 4 }}>
            <span>{done}/{activities.length} activités</span>
            <span>{activities.length > 0 ? Math.round(done / activities.length * 100) : 0}%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${activities.length > 0 ? (done / activities.length * 100) : 0}%`, background: '#38bdf8', borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* Liste */}
      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '22px 0', color: '#8fa8c4' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: 'rgba(56,189,248,0.4)' }}>
            <CheckIcon size={26} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4fd', marginBottom: 2 }}>Rien de prévu ici</div>
          <div style={{ fontSize: 11 }}>Ex : Wat Pho, cours de cuisine, marché flottant…</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {activities.map(act => (
            <div key={act.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: act.done ? 'rgba(255,255,255,0.03)' : '#0e3468',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 10px',
            }}>
              <button onClick={() => onToggle(act.id)} style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                border: `2px solid ${act.done ? '#38bdf8' : '#8fa8c4'}`,
                background: act.done ? '#38bdf8' : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 11, fontWeight: 700,
              }}>
                {act.done ? '✓' : ''}
              </button>
              <span style={{ flex: 1, fontSize: 13, color: act.done ? '#8fa8c4' : '#e8f4fd', textDecoration: act.done ? 'line-through' : 'none' }}>
                {act.text}
              </span>
              <button onClick={() => onRemove(act.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(56,189,248,0.18)', fontSize: 14, padding: '0 2px', lineHeight: 1 }}>×</button>
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
  background: 'rgba(0,0,0,0.55)', zIndex: 2000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 16,
}
const card = {
  background: '#0a2a52', borderRadius: 18, padding: 22,
  maxWidth: 400, width: '100%',
  border: '1px solid rgba(56,189,248,0.12)',
  boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
  animation: 'modalIn 0.18s ease',
  maxHeight: '90vh', overflowY: 'auto',
}
const closeBtn = {
  background: 'rgba(255,255,255,0.06)', border: 'none', width: 32, height: 32,
  borderRadius: '50%', fontSize: 20, cursor: 'pointer', color: '#8fa8c4',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
const editBtn = {
  background: '#38bdf8', color: '#0d1f3c', border: 'none',
  borderRadius: 8, padding: '7px 14px', fontSize: 13,
  fontWeight: 600, cursor: 'pointer',
}
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#7dd3fc', fontWeight: 600 }
const inputStyle = { background: '#061528', color: '#e8f4fd', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', width: '100%' }

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
    label: 'Mer d\'Andaman', color: '#38bdf8',
    note: 'Côte ouest : en pleine mousson en août. Vagues et vent importants. Windguru indispensable avant de réserver.',
    noteColor: 'rgba(251,191,36,0.12)', noteText: '#fbbf24',
  },
  gulf: {
    label: 'Golfe de Thaïlande', color: '#4ade80',
    note: 'Côte est : bien meilleure en août que la côte ouest. Généralement calme et ensoleillé — c\'est le bon choix cet été.',
    noteColor: 'rgba(74,222,128,0.12)', noteText: '#4ade80',
  },
  north: {
    label: 'Nord de la Thaïlande', color: '#a78bfa',
    note: 'Saison des pluies mais souvent des matinées dégagées. Températures plus fraîches qu\'au sud (25-30°C).',
    noteColor: 'rgba(167,139,250,0.12)', noteText: '#a78bfa',
  },
  central: {
    label: 'Thaïlande centrale / Bangkok', color: '#fbbf24',
    note: 'Août = pluies fréquentes l\'après-midi mais courtes. Matinées souvent dégagées. Humidité très élevée.',
    noteColor: 'rgba(251,191,36,0.1)', noteText: '#fbbf24',
  },
  general: { label: '', color: '#8fa8c4', note: null },
}

function ToolsTab({ step }) {
  const region = getRegionType(step.lat, step.lng)
  const info = REGION_INFO[region]
  const lat = step.lat || 13.0
  const lng = step.lng || 100.5

  const tools = [
    {
      group: 'Météo',
      items: [
        {
          name: 'Windy — carte en direct',
          url: `https://www.windy.com/?rain,${lat},${lng},10`,
          desc: 'Pluie, nuages, vent en temps réel centré sur cette étape',
          tag: 'Recommandé', tagColor: '#38bdf8',
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
          tag: 'Historique', tagColor: '#fbbf24',
        },
      ],
    },
    ...(region === 'andaman' || region === 'gulf' ? [{
      group: 'Mer & houle',
      items: [
        {
          name: 'Windguru',
          url: 'https://www.windguru.cz/',
          desc: 'Vent & houle · référence voile / plongée',
          tag: 'Côtes', tagColor: '#38bdf8',
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
          <div style={{ fontSize: 11, fontWeight: 700, color: '#cfe2f5', marginBottom: 6, letterSpacing: 0.2 }}>
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
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  textDecoration: 'none',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1.5 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#e8f4fd' }}>{tool.name}</span>
                    {tool.tag && (
                      <span style={{
                        fontSize: 9, fontWeight: 700,
                        background: tool.tagColor + '18', color: tool.tagColor,
                        borderRadius: 4, padding: '1px 5px',
                      }}>{tool.tag}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#8fa8c4', lineHeight: 1.4 }}>{tool.desc}</div>
                </div>
                <ExternalIcon size={12} style={{ color: '#8fa8c4', flexShrink: 0, marginTop: 2 }} />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
