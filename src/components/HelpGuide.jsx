import { createPortal } from 'react-dom'
import { TargetIcon, BedIcon, WalletIcon, DotsIcon, ScalesIcon, CalendarIcon, CloseIcon, Avatar } from './icons'

// Guide « 30 secondes » — les 4 boutons + les 3 symboles à connaître.
// S'ouvre tout seul à la première connexion d'Abbey (voir App), puis via Plus → Système.

const ROWS = [
  { icon: <TargetIcon size={18} />, title: 'Recentrer', text: 'Revient sur l\'itinéraire complet si tu es perdue sur la carte.' },
  { icon: <BedIcon size={18} />, title: 'Hôtels', text: 'Tous les hôtels ajoutés, étape par étape.' },
  { icon: <WalletIcon size={18} />, title: 'Budget', text: 'Le total du voyage : hôtels retenus + transports, la jauge et ce qui reste à réserver.' },
  { icon: <DotsIcon size={18} />, title: 'Plus', text: 'Le reste : vue Aujourd\'hui, comparateur, style de carte, options.' },
  { icon: <CalendarIcon size={18} />, title: 'Aujourd\'hui', text: 'Pendant le voyage, l\'app s\'ouvre sur le programme du jour : hôtel, prochain trajet, météo.' },
  { icon: <ScalesIcon size={18} />, title: 'Comparateur', text: 'Les hôtels de chaque étape côte à côte. Chacun vote avec sa pastille, puis ★ = celui qu\'on retient pour le budget.' },
]

export function HelpGuide({ isMobile, onClose }) {
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 3200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#0d1f3c', borderRadius: 20, width: '100%', maxWidth: 440,
        maxHeight: '92vh', overflowY: 'auto', padding: '22px 22px 18px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)', animation: 'modalIn 0.18s ease',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#e8f4fd' }}>L'appli en 30 secondes</div>
            <div style={{ fontSize: 12, color: '#8fa8c4', marginTop: 2 }}>Tout ce qu'il faut savoir, promis.</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%',
            width: isMobile ? 44 : 32, height: isMobile ? 44 : 32, cursor: 'pointer', color: '#8fa8c4',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><CloseIcon size={15} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 12 }}>
          {ROWS.map(r => (
            <div key={r.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '9px 4px' }}>
              <span style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'rgba(56,189,248,0.12)', color: '#38bdf8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{r.icon}</span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#e8f4fd' }}>{r.title}</div>
                <div style={{ fontSize: 12, color: '#8fa8c4', lineHeight: 1.45 }}>{r.text}</div>
              </div>
            </div>
          ))}

          {/* Les pastilles J/A */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '9px 4px' }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Avatar name="Jordan" size={15} /><Avatar name="Abbey" size={15} />
            </span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#e8f4fd' }}>Vos deux pastilles</div>
              <div style={{ fontSize: 12, color: '#8fa8c4', lineHeight: 1.45 }}>
                Dans le comparateur, tape ta pastille sur ton hôtel préféré — l'app vous dit sous chaque étape si vous êtes d'accord ou s'il faut en discuter.
              </div>
            </div>
          </div>
        </div>

        <button onClick={onClose} style={{
          marginTop: 14, width: '100%', minHeight: isMobile ? 48 : 42, borderRadius: 12, border: 'none',
          background: '#38bdf8', color: '#0d1f3c', fontSize: 14, fontWeight: 800, cursor: 'pointer',
        }}>C'est parti</button>
      </div>
    </div>,
    document.body
  )
}
