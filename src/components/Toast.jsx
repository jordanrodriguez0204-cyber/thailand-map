export function Toast({ message, type = 'info' }) {
  if (!message) return null
  const colors = {
    info:    { bg: '#1e1b4b', text: '#e0e7ff' },
    success: { bg: '#14532d', text: '#dcfce7' },
    warning: { bg: '#78350f', text: '#fef3c7' },
    offline: { bg: '#374151', text: '#f9fafb' },
  }
  const c = colors[type] || colors.info
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: c.bg, color: c.text,
      padding: '10px 18px', borderRadius: 20,
      fontSize: 13, fontWeight: 500,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      zIndex: 3000, whiteSpace: 'nowrap',
      animation: 'fadeIn 0.2s ease',
    }}>
      {message}
    </div>
  )
}
