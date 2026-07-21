// Import d'hôtel depuis un lien Booking.com — via /api/booking (serverless),
// avec extraction du nom depuis l'URL en secours si l'API échoue.

export function isBookingUrl(text) {
  return /booking\.com\/hotel\//i.test(text || '')
}

// https://www.booking.com/hotel/th/eastin-grand-sathorn.fr.html → "Eastin Grand Sathorn"
export function hotelNameFromUrl(url) {
  try {
    const m = new URL(url).pathname.match(/\/hotel\/[a-z]{2}\/([^./]+)/i)
    if (!m) return null
    return m[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  } catch { return null }
}

// Nettoie l'URL (tracking params) pour la stocker proprement
export function cleanBookingUrl(url) {
  try {
    const u = new URL(url)
    return `${u.origin}${u.pathname}`
  } catch { return url }
}

export async function fetchBookingInfo(url) {
  const res = await fetch(`/api/booking?url=${encodeURIComponent(url)}`, {
    signal: AbortSignal.timeout(12000),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `API ${res.status}`)
  return data // { name, lat, lng, address, photo_url, rating }
}
