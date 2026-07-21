// Bibliothèque d'icônes UI — même langage que les icônes catégories :
// viewBox 20×20, stroke currentColor 1.8, round caps, fill none.
// Usage : <TargetIcon size={16} /> — hérite la couleur du texte parent.

const PATHS = {
  target: '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="2.5"/><path d="M10 1.5V4M10 16v2.5M1.5 10H4M16 10h2.5"/>',
  bed: '<path d="M2 15.5V6"/><path d="M2 12.5h16V15.5"/><path d="M2 12.5V9.8h6.8v2.7"/><circle cx="5.3" cy="8.2" r="1.4"/><path d="M9.8 9.8h4.7a3.5 3.5 0 0 1 3.5 3.5"/>',
  wallet: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h10A1.5 1.5 0 0 1 16 6.5"/><rect x="3" y="6.5" width="14" height="9" rx="1.5"/><path d="M13 11h1.5"/>',
  dots: '<circle cx="4.5" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="10" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="10" r="1.1" fill="currentColor" stroke="none"/>',
  calendar: '<rect x="3" y="4.5" width="14" height="12.5" rx="2"/><path d="M3 8.5h14M7 2.5v3.5M13 2.5v3.5"/>',
  pin: '<path d="M10 18s6-5.1 6-9.5a6 6 0 1 0-12 0C4 12.9 10 18 10 18Z"/><circle cx="10" cy="8.5" r="2.2"/>',
  pencil: '<path d="m3 17 .8-3.2L13.6 4a1.9 1.9 0 0 1 2.7 2.7l-9.8 9.8L3 17Z"/><path d="m12.5 5.1 2.7 2.7"/>',
  trash: '<path d="M3.5 5.5h13"/><path d="M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5"/><path d="M5 5.5 5.8 16a1.5 1.5 0 0 0 1.5 1.4h5.4a1.5 1.5 0 0 0 1.5-1.4l.8-10.5"/><path d="M8.2 9v5M11.8 9v5"/>',
  scales: '<path d="M10 3v14"/><path d="M6 17h8"/><path d="M4 6h12"/><path d="m4 6-2 5a2.6 2.6 0 0 0 4 0L4 6ZM16 6l-2 5a2.6 2.6 0 0 0 4 0l-2-5Z"/>',
  download: '<path d="M10 3v9.5"/><path d="m6.2 9.2 3.8 3.8 3.8-3.8"/><path d="M3.5 16.5h13"/>',
  upload: '<path d="M10 13V3.5"/><path d="M6.2 7.3 10 3.5l3.8 3.8"/><path d="M3.5 16.5h13"/>',
  metro: '<rect x="4.5" y="3" width="11" height="11" rx="2.5"/><path d="M4.5 9.5h11"/><circle cx="7.6" cy="11.7" r="0.9" fill="currentColor" stroke="none"/><circle cx="12.4" cy="11.7" r="0.9" fill="currentColor" stroke="none"/><path d="m6.5 17 1.3-3M13.5 17l-1.3-3"/>',
  route: '<circle cx="5" cy="15" r="2.2"/><circle cx="15" cy="5" r="2.2"/><path d="M6.8 13.4c2.5-2 4-1.5 5.4-3.2 1-1.2.8-2.3.8-3"/>',
  layers: '<path d="m10 2.8 7.5 4L10 10.8l-7.5-4L10 2.8Z"/><path d="m3.4 10.4 6.6 3.5 6.6-3.5"/><path d="m3.4 13.6 6.6 3.5 6.6-3.5"/>',
  user: '<circle cx="10" cy="6.8" r="3.2"/><path d="M3.8 17.2a6.4 6.4 0 0 1 12.4 0"/>',
  lock: '<rect x="4.5" y="8.5" width="11" height="8.5" rx="2"/><path d="M6.8 8.5V6.3a3.2 3.2 0 0 1 6.4 0v2.2"/><circle cx="10" cy="12.7" r="1.2" fill="currentColor" stroke="none"/>',
  plus: '<path d="M10 4.5v11M4.5 10h11"/>',
  check: '<path d="m3.8 10.5 4 4 8.4-8.5"/>',
  close: '<path d="m5 5 10 10M15 5 5 15"/>',
  external: '<path d="M8.2 5H5.5A1.5 1.5 0 0 0 4 6.5v8A1.5 1.5 0 0 0 5.5 16h8a1.5 1.5 0 0 0 1.5-1.5v-2.7"/><path d="M11.8 4h4.2v4.2"/><path d="M16 4l-6.5 6.5"/>',
  sun: '<circle cx="10" cy="10" r="3.6"/><path d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4"/>',
  moon: '<path d="M17 11.3A7 7 0 0 1 8.7 3a7 7 0 1 0 8.3 8.3Z"/>',
  satellite: '<rect x="7.8" y="7.8" width="4.4" height="4.4" rx="1" transform="rotate(45 10 10)"/><path d="m4.2 8.4 3-3M12.8 17l3-3M2.5 12.2l5.3-5.3M12.2 17.5l5.3-5.3" transform="rotate(0)"/><path d="M13.5 2.7a4 4 0 0 1 3.8 3.8M13.2 5.5a1.6 1.6 0 0 1 1.3 1.3"/>',
  menu: '<path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13"/>',
  undo: '<path d="M7.5 4 3.5 8l4 4"/><path d="M3.5 8h8a5 5 0 0 1 0 10H9"/>',
  grip: '<circle cx="7.4" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="12.6" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="7.4" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="12.6" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="7.4" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="12.6" cy="15" r="1" fill="currentColor" stroke="none"/>',
  eye: '<path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z"/><circle cx="10" cy="10" r="2.4"/>',
  eyeOff: '<path d="M3 3l14 14"/><path d="M8.4 4.7A8.5 8.5 0 0 1 10 4.5c5 0 8 5.5 8 5.5a14.6 14.6 0 0 1-2.2 2.9M5.6 6A13.5 13.5 0 0 0 2 10s3 5.5 8 5.5a8 8 0 0 0 3-.6"/>',
  link: '<path d="M8.5 11.5a3.6 3.6 0 0 0 5.1.3l2.3-2.3a3.6 3.6 0 0 0-5.1-5.1L9.6 5.6"/><path d="M11.5 8.5a3.6 3.6 0 0 0-5.1-.3L4.1 10.5a3.6 3.6 0 0 0 5.1 5.1l1.2-1.2"/>',
  search: '<circle cx="8.8" cy="8.8" r="5.3"/><path d="m13 13 4 4"/>',
  map: '<path d="m7 3.5-4 1.6v11.4l4-1.6 6 1.6 4-1.6V3.5l-4 1.6-6-1.6Z"/><path d="M7 3.5v11.3M13 5.1v11.4"/>',
  wifiOff: '<path d="M3 3l14 14"/><path d="M6.5 8.6a8.5 8.5 0 0 1 2-1.2M2.5 6.5a12 12 0 0 1 3-2M10.6 5.1a12 12 0 0 1 6.9 3.4M9.5 9.2a8.5 8.5 0 0 1 4 2.3M7.2 12.2a5 5 0 0 1 2.8-1.4"/><circle cx="10" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>',
  refresh: '<path d="M16.5 8A6.8 6.8 0 0 0 4.4 6.2L3 8"/><path d="M3 3.5V8h4.5"/><path d="M3.5 12a6.8 6.8 0 0 0 12.1 1.8L17 12"/><path d="M17 16.5V12h-4.5"/>',
  compass: '<circle cx="10" cy="10" r="7.5"/><path d="m13 7-1.8 4.2L7 13l1.8-4.2z" fill="currentColor" stroke="none"/>',
  // Transport
  plane: '<path d="M17.5 10c0 .8-.7 1.5-1.5 1.5h-4.5l-3.5 5H6l1.75-5H4.5l-1.5 1.5H1.5l1-3-1-3H3l1.5 1.5h3.25L6 3.5h2l3.5 5H16c.8 0 1.5.7 1.5 1.5Z"/>',
  train: '<rect x="4.5" y="2.8" width="11" height="11.5" rx="2.5"/><path d="M4.5 9h11"/><circle cx="7.5" cy="11.8" r="0.9" fill="currentColor" stroke="none"/><circle cx="12.5" cy="11.8" r="0.9" fill="currentColor" stroke="none"/><path d="m6.8 17.3 1.2-3M13.2 17.3l-1.2-3M5.5 17.3h9"/>',
  bus: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3h9A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 13.5v-9Z"/><path d="M4 8.5h12"/><circle cx="7" cy="11.7" r="0.9" fill="currentColor" stroke="none"/><circle cx="13" cy="11.7" r="0.9" fill="currentColor" stroke="none"/><path d="M5.5 15v1.8M14.5 15v1.8"/>',
  ferry: '<path d="M4 13.5 3 10l7-1.8L17 10l-1 3.5"/><path d="M5.5 9.6V6A1.5 1.5 0 0 1 7 4.5h6A1.5 1.5 0 0 1 14.5 6v3.6"/><path d="M10 4.5V3"/><path d="M2 16.5q2-1.5 4 0t4 0 4 0 4 0"/>',
  car: '<path d="m4 11 1.3-4A1.8 1.8 0 0 1 7 5.8h6a1.8 1.8 0 0 1 1.7 1.2L16 11"/><rect x="3" y="11" width="14" height="4" rx="1.2"/><circle cx="6.2" cy="15.8" r="1.4"/><circle cx="13.8" cy="15.8" r="1.4"/>',
  // Météo
  wSun: '<circle cx="10" cy="10" r="3.6"/><path d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4"/>',
  wPartly: '<circle cx="7" cy="7.5" r="3"/><path d="M7 2.2v1.3M2.2 7.5h1.3M3.6 4.1l.9.9M11.5 4.5l-.9.9"/><path d="M9 16.5h5.5a3 3 0 0 0 .6-5.9A4 4 0 0 0 7.5 9.8 2.8 2.8 0 0 0 9 16.5Z"/>',
  wCloud: '<path d="M6.5 15.5h7.6a3.2 3.2 0 0 0 .7-6.3 4.5 4.5 0 0 0-8.7-1A3.4 3.4 0 0 0 6.5 15.5Z"/>',
  wRain: '<path d="M6.5 13h7.6a3.2 3.2 0 0 0 .7-6.3 4.5 4.5 0 0 0-8.7-1A3.4 3.4 0 0 0 6.5 13Z"/><path d="M7 15.2 6.3 17M10.4 15.2l-.7 1.8M13.8 15.2l-.7 1.8"/>',
  wStorm: '<path d="M6.5 12.5h7.6a3.2 3.2 0 0 0 .7-6.3 4.5 4.5 0 0 0-8.7-1 3.4 3.4 0 0 0 .4 6.3Z"/><path d="m10.8 12.5-2 3h2.4l-2 3"/>',
  wFog: '<path d="M6.5 11h7.6a3.2 3.2 0 0 0 .7-6.3 4.5 4.5 0 0 0-8.7-1A3.4 3.4 0 0 0 6.5 11Z"/><path d="M4.5 13.8h11M6 16.4h8"/>',
  drop: '<path d="M10 2.8s5 5.4 5 8.7a5 5 0 0 1-10 0c0-3.3 5-8.7 5-8.7Z"/>',
  thermo: '<path d="M8.5 3.5a1.5 1.5 0 0 1 3 0v7.2a3.5 3.5 0 1 1-3 0V3.5Z"/><circle cx="10" cy="14" r="1.4" fill="currentColor" stroke="none"/>',
}

function make(name) {
  const inner = PATHS[name]
  const Icon = ({ size = 16, style, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.8}
      fill="none" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block', ...style }}
      dangerouslySetInnerHTML={{ __html: inner }} {...props} />
  )
  Icon.displayName = name
  return Icon
}

export const TargetIcon = make('target')
export const BedIcon = make('bed')
export const WalletIcon = make('wallet')
export const DotsIcon = make('dots')
export const CalendarIcon = make('calendar')
export const PinIcon = make('pin')
export const PencilIcon = make('pencil')
export const TrashIcon = make('trash')
export const ScalesIcon = make('scales')
export const DownloadIcon = make('download')
export const UploadIcon = make('upload')
export const MetroIcon = make('metro')
export const RouteIcon = make('route')
export const LayersIcon = make('layers')
export const UserIcon = make('user')
export const LockIcon = make('lock')
export const PlusIcon = make('plus')
export const CheckIcon = make('check')
export const CloseIcon = make('close')
export const ExternalIcon = make('external')
export const SunIcon = make('sun')
export const MoonIcon = make('moon')
export const SatelliteIcon = make('satellite')
export const MenuIcon = make('menu')
export const UndoIcon = make('undo')
export const GripIcon = make('grip')
export const EyeIcon = make('eye')
export const EyeOffIcon = make('eyeOff')
export const LinkIcon = make('link')
export const SearchIcon = make('search')
export const MapIcon = make('map')
export const WifiOffIcon = make('wifiOff')
export const RefreshIcon = make('refresh')
export const CompassIcon = make('compass')
export const PlaneIcon = make('plane')
export const TrainIcon = make('train')
export const BusIcon = make('bus')
export const FerryIcon = make('ferry')
export const CarIcon = make('car')
export const WSunIcon = make('wSun')
export const WPartlyIcon = make('wPartly')
export const WCloudIcon = make('wCloud')
export const WRainIcon = make('wRain')
export const WStormIcon = make('wStorm')
export const WFogIcon = make('wFog')
export const DropIcon = make('drop')
export const ThermoIcon = make('thermo')

// Icône transport par mode — remplace les emojis de TRANSPORT_MODES côté UI
const TRANSPORT = { plane: PlaneIcon, train: TrainIcon, bus: BusIcon, ferry: FerryIcon, car: CarIcon }
export function TransportIcon({ mode, size = 16, ...props }) {
  const Icon = TRANSPORT[mode] || PlaneIcon
  return <Icon size={size} {...props} />
}

// Spinner de chargement (remplace ◌)
export function Spinner({ size = 16, style, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      style={{ animation: 'spin 0.9s linear infinite', flexShrink: 0, display: 'block', ...style }} {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.2" />
      <path d="M17 10a7 7 0 0 0-7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

// Avatar initiale (remplace les emojis pilotes Jordan/Abbey)
export function Avatar({ name, size = 22, style }) {
  const color = name === 'Abbey' ? '#4ade80' : '#38bdf8'
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: color + '26', border: `1.5px solid ${color}`,
      color, fontWeight: 800, fontSize: size * 0.48, lineHeight: 1,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>{(name || '?')[0]}</span>
  )
}

// Chaînes SVG brutes pour les L.divIcon Leaflet (html string)
export function uiIconSvg(name, size = 16, color = '#fff') {
  const inner = PATHS[name] || ''
  return `<svg width="${size}" height="${size}" viewBox="0 0 20 20" stroke="${color}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color:${color};display:block">${inner}</svg>`
}
