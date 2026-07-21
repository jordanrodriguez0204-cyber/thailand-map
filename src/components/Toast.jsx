const ICONS = {
  info: '<path d="M10 9v5M10 6.2v.1"/><circle cx="10" cy="10" r="7.5"/>',
  success: '<path d="m5.5 10.5 3 3 6-6.5"/><circle cx="10" cy="10" r="7.5"/>',
  warning: '<path d="M10 7.5v4M10 14.4v.1"/><path d="M8.6 3.4 2.3 14.6a1.6 1.6 0 0 0 1.4 2.4h12.6a1.6 1.6 0 0 0 1.4-2.4L11.4 3.4a1.6 1.6 0 0 0-2.8 0Z"/>',
  offline: '<path d="M3 3l14 14"/><path d="M6.5 8.6a8.5 8.5 0 0 1 2-1.2M2.5 6.5a12 12 0 0 1 3-2M10.6 5.1a12 12 0 0 1 6.9 3.4M9.5 9.2a8.5 8.5 0 0 1 4 2.3"/><circle cx="10" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>',
}

export function Toast({ message, type = 'info' }) {
  if (!message) return null
  const colors = {
    info:    { bg: '#0e3468', accent: '#38bdf8', text: '#e8f4fd' },
    success: { bg: 'rgba(20,60,45,0.97)', accent: '#4ade80', text: '#dcfce7' },
    warning: { bg: 'rgba(70,52,12,0.97)', accent: '#fbbf24', text: '#fef3c7' },
    offline: { bg: 'rgba(30,41,59,0.97)', accent: '#8fa8c4', text: '#e8f4fd' },
  }
  const c = colors[type] || colors.info
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: c.bg, color: c.text,
      borderLeft: `3px solid ${c.accent}`,
      padding: '10px 18px', borderRadius: 12,
      fontSize: 13, fontWeight: 500,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      zIndex: 3000, whiteSpace: 'nowrap',
      animation: 'fadeIn 0.2s ease',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <svg width="15" height="15" viewBox="0 0 20 20" stroke={c.accent} strokeWidth="1.8" fill="none"
        strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}
        dangerouslySetInnerHTML={{ __html: ICONS[type] || ICONS.info }} />
      {message}
    </div>
  )
}
