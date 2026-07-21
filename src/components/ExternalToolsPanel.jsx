import { createPortal } from 'react-dom'

const SECTIONS = [
  {
    title: '🌤️ Météo & Climat',
    tools: [
      {
        name: 'Windy',
        url: 'https://www.windy.com/?rain,13.0,100.5,7',
        desc: 'Carte temps réel · pluie, nuages, vent · le meilleur visuellement',
        tag: 'Recommandé',
        tagColor: '#6366f1',
      },
      {
        name: 'Meteoblue',
        url: 'https://www.meteoblue.com/en/weather/maps/temperature/#map=precipitation~daily~auto~100.5~13~7~auto',
        desc: 'Prévisions 14 jours · multi-modèles ECMWF + GFS',
        tag: 'Précis',
        tagColor: '#0ea5e9',
      },
      {
        name: 'AccuWeather',
        url: 'https://www.accuweather.com/en/search-locations?query=Thailand',
        desc: 'Real Feel · alertes tropicales · prévisions 15 jours',
      },
      {
        name: 'Climatestotravel',
        url: 'https://www.climatestotravel.com/climate/thailand',
        desc: 'Moyennes historiques mois par mois · côte ouest vs est',
        tag: '📅 Historique',
        tagColor: '#d97706',
      },
    ],
  },
  {
    title: '🏄 Mer & Côtes',
    tools: [
      {
        name: 'Windguru',
        url: 'https://www.windguru.cz/',
        desc: 'Vent & houle · référence voile / kitesurf / plongée',
        tag: 'Côtes',
        tagColor: '#0891b2',
      },
      {
        name: 'Surf-forecast',
        url: 'https://www.surf-forecast.com/regions/Thailand',
        desc: 'Conditions vagues · hauteur, période, direction',
        tag: 'Vagues',
        tagColor: '#0891b2',
      },
      {
        name: 'Windy (mer d\'Andaman)',
        url: 'https://www.windy.com/?waves,8.0,98.5,9',
        desc: 'Houle côte ouest · Phuket, Krabi, Ko Lanta',
      },
      {
        name: 'Windy (Golfe de Thaïlande)',
        url: 'https://www.windy.com/?waves,9.5,100.0,9',
        desc: 'Houle côte est · Ko Samui, Ko Phangan, Ko Tao',
      },
    ],
  },
  {
    title: '🚌 Transport & Réservations',
    tools: [
      {
        name: '12Go Asia',
        url: 'https://12go.asia/en',
        desc: 'Trains, ferries, bus, vols intérieurs · Thaïlande',
        tag: 'Essentiel',
        tagColor: '#16a34a',
      },
      {
        name: 'Grab',
        url: 'https://www.grab.com/th/',
        desc: 'Taxis / motos Bangkok · alternative au tuk-tuk avec prix fixe',
      },
      {
        name: 'Bangkok MRT/BTS',
        url: 'https://transitapp.com/',
        desc: 'Plans et horaires métro Bangkok en temps réel',
      },
    ],
  },
  {
    title: '🏨 Hébergement',
    tools: [
      {
        name: 'Booking.com',
        url: 'https://www.booking.com/country/th.html',
        desc: 'Large choix · annulation gratuite souvent disponible',
      },
      {
        name: 'Agoda',
        url: 'https://www.agoda.com/en-gb/country/thailand.html',
        desc: 'Spécialisé Asie · souvent moins cher que Booking',
        tag: '💡 Moins cher',
        tagColor: '#ea580c',
      },
      {
        name: 'Airbnb',
        url: 'https://www.airbnb.com/s/Thailand',
        desc: 'Appartements & villas · bon pour les séjours longs',
      },
    ],
  },
  {
    title: '💱 Pratique',
    tools: [
      {
        name: 'XE.com',
        url: 'https://www.xe.com/currencyconverter/convert/?Amount=1&From=CHF&To=THB',
        desc: 'Taux CHF → Baht en direct · le plus fiable',
      },
      {
        name: 'Tourism Authority of Thailand',
        url: 'https://www.tourismthailand.org/home',
        desc: 'Site officiel · visa, événements, régions',
      },
    ],
  },
]

function ToolLink({ tool }) {
  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '9px 11px',
        borderRadius: 9,
        background: '#f9fafb',
        border: '1px solid #f3f4f6',
        textDecoration: 'none',
        transition: 'background 0.12s, border-color 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f0f5ff'; e.currentTarget.style.borderColor = '#c7d2fe' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#f3f4f6' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{tool.name}</span>
          {tool.tag && (
            <span style={{
              fontSize: 9.5, fontWeight: 700, letterSpacing: 0.3,
              background: tool.tagColor + '18', color: tool.tagColor,
              borderRadius: 5, padding: '1px 6px',
            }}>{tool.tag}</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>{tool.desc}</div>
      </div>
      <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0, marginTop: 2 }}>↗</span>
    </a>
  )
}

export function ExternalToolsPanel({ onClose }) {
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 340, maxWidth: '95vw',
          height: '100dvh',
          background: '#fff',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 28px rgba(0,0,0,0.18)',
          animation: 'slideIn 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#111827' }}>🔗 Outils utiles</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>Sites pour préparer le voyage</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
        </div>

        {/* Sections */}
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {SECTIONS.map(section => (
            <div key={section.title}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: 0.2 }}>
                {section.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {section.tools.map(tool => <ToolLink key={tool.name} tool={tool} />)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 14px 20px', borderTop: '1px solid #f3f4f6', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
          Tous les liens s'ouvrent dans un nouvel onglet
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  )
}
