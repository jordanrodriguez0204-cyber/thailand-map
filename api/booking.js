// Vercel serverless — récupère et parse une page Booking.com côté serveur (pas de CORS).
// GET /api/booking?url=https://www.booking.com/hotel/th/xxx.html
// → { name, lat, lng, address, photo_url, rating } (champs null si introuvables)

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

function extractJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const [, raw] of blocks) {
    try {
      const data = JSON.parse(raw.trim())
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (item['@type'] === 'Hotel' || item['@type'] === 'LodgingBusiness') return item
      }
    } catch { /* bloc suivant */ }
  }
  return null
}

function metaContent(html, property) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
  const alt = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i')
  return html.match(re)?.[1] || html.match(alt)?.[1] || null
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const { url } = req.query
  if (!url || !/^https:\/\/(www\.)?booking\.com\/hotel\//i.test(url)) {
    return res.status(400).json({ error: 'URL Booking.com invalide' })
  }

  try {
    const page = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(9000),
    })
    if (!page.ok) return res.status(502).json({ error: `Booking a répondu ${page.status}` })
    const html = await page.text()

    const ld = extractJsonLd(html)
    const name = ld?.name || metaContent(html, 'og:title')?.replace(/\s*[|–-]\s*Booking\.com.*$/i, '') || null
    const lat = ld?.geo?.latitude != null ? +ld.geo.latitude : null
    const lng = ld?.geo?.longitude != null ? +ld.geo.longitude : null
    const address = ld?.address
      ? [ld.address.streetAddress, ld.address.addressLocality].filter(Boolean).join(', ')
      : null
    const photo_url = (Array.isArray(ld?.image) ? ld.image[0] : ld?.image) || metaContent(html, 'og:image') || null
    const rating = ld?.aggregateRating?.ratingValue != null ? +ld.aggregateRating.ratingValue : null

    if (!name && lat == null) return res.status(422).json({ error: 'Page non parsable' })

    res.setHeader('Cache-Control', 's-maxage=86400')
    return res.status(200).json({ name, lat, lng, address, photo_url, rating })
  } catch (e) {
    return res.status(502).json({ error: e.name === 'TimeoutError' ? 'Timeout Booking' : 'Fetch impossible' })
  }
}
