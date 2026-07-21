// ── Gemini Flash — assistant voyage ──────────────────────────────────────────
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'

export const CHF_TO_THB = 42

export function formatPrice(chf) {
  return `${chf} CHF (≈ ${(chf * CHF_TO_THB).toLocaleString()} THB)`
}

function buildSystemPrompt(steps, getSegment, getHotel) {
  const itinerary = steps.map((s, i) => {
    const prev = steps[i - 1]
    const seg = prev ? getSegment(prev.id, s.id) : null
    const hotel = getHotel ? getHotel(s.id) : null
    const lines = [`Étape ${s.ordre}: ${s.nom} (${s.categorie}) — ${s.dates}`]
    if (s.notes) lines.push(`  Notes: ${s.notes}`)
    if (seg && (seg.mode || seg.price_chf)) {
      lines.push(`  Transport depuis ${prev.nom}: mode=${seg.mode || '?'}, prix=${seg.price_chf ? seg.price_chf + ' CHF' : 'non renseigné'}${seg.notes ? ', ' + seg.notes : ''}`)
    }
    if (hotel && (hotel.name || hotel.price_per_night)) {
      lines.push(`  Hôtel: ${hotel.name || '?'} — ${hotel.price_per_night ? hotel.price_per_night + ' CHF/nuit × ' + (hotel.nights || '?') + ' nuits' : 'prix non renseigné'}`)
    }
    return lines.join('\n')
  }).join('\n\n')

  return `INSTRUCTIONS CRITIQUES : Tu dois répondre UNIQUEMENT avec du JSON brut. Aucun texte avant ou après. Aucun bloc markdown. Aucune explication hors du JSON. Commence ta réponse directement par { et termine par }.

Tu es l'assistant voyage de Jordan et Abbey, trip Thaïlande août 2026. Réponds en français dans le champ "message".

TAUX : 1 CHF = ${CHF_TO_THB} THB. Toujours afficher "X CHF (≈ Y THB)". THB reçu → divise par ${CHF_TO_THB}. EUR → ×1.05. USD → ×0.88.

ITINÉRAIRE (${steps.length} étapes) :
${itinerary || 'Aucune étape.'}

FORMAT DE RÉPONSE (JSON uniquement) :
{"message":"texte en français","actions":[]}

ACTIONS DISPONIBLES dans le tableau "actions" :
{"type":"update_segment","from_nom":"Bangkok","to_nom":"Chiang Mai","mode":"train","price_chf":40,"notes":"Train de nuit"}
{"type":"update_hotel","step_nom":"Koh Samui","hotel_name":"Hôtel X","price_per_night_chf":85,"nights":2}
{"type":"update_notes","step_nom":"Chiang Mai","notes":"Arrivée 07h matin"}
{"type":"update_dates","step_nom":"Bangkok","dates":"9-13 août"}
{"type":"add_step","nom":"Ayutthaya","dates":"13 août","categorie":"ville","notes":"","apres_nom":"Bangkok"}

MODES : plane, train, bus, ferry, car, taxi, scooter
CATÉGORIES : ville, plage, montagne, temple, nature, ile
- Ne pas inventer de prix. Utiliser les noms d'étapes tels quels dans l'itinéraire ci-dessus.`
}

export async function askGemini(userMessage, steps, getSegment, getHotel) {
  const key = import.meta.env.VITE_GEMINI_KEY
  if (!key) throw new Error('Clé Gemini manquante (VITE_GEMINI_KEY)')

  const systemPrompt = buildSystemPrompt(steps, getSegment || (() => ({})), getHotel || (() => ({})))

  const body = {
    contents: [{
      role: 'user',
      parts: [{ text: systemPrompt + '\n\nMessage de l\'utilisateur : ' + userMessage }],
    }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
  }

  const res = await fetch(`${API_BASE}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (res.status === 429) {
    throw new Error('RATE_LIMIT')
  }
  if (res.status === 400 || res.status === 401 || res.status === 403) {
    throw new Error('API_KEY_INVALID')
  }
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Strip markdown fences if present
  let cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()

  // If Gemini added text before/after the JSON, extract the first { ... } block
  if (!cleaned.startsWith('{')) {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) cleaned = match[0]
  }

  try {
    return JSON.parse(cleaned)
  } catch {
    return { message: text.slice(0, 300) || 'Réponse invalide', actions: [] }
  }
}

export function executeActions(actions, steps, updateSegment, updateHotel, updateStep, addStep) {
  const results = []
  for (const action of actions) {
    if (action.type === 'update_segment') {
      const from = steps.find(s => s.nom.toLowerCase().includes((action.from_nom || '').toLowerCase()))
      const to = steps.find(s => s.nom.toLowerCase().includes((action.to_nom || '').toLowerCase()))
      if (from && to) {
        const ch = {}
        if (action.mode) ch.mode = action.mode
        if (action.price_chf != null) ch.price_chf = action.price_chf
        if (action.notes) ch.notes = action.notes
        if (action.duration_minutes != null) ch.duration_minutes = action.duration_minutes
        updateSegment(from.id, to.id, ch)
        results.push(`✓ Transport ${action.from_nom} → ${action.to_nom} mis à jour`)
      } else {
        results.push(`⚠️ Étapes introuvables: ${action.from_nom} → ${action.to_nom}`)
      }
    } else if (action.type === 'update_hotel') {
      const step = steps.find(s => s.nom.toLowerCase().includes((action.step_nom || '').toLowerCase()))
      if (step) {
        const ch = {}
        if (action.hotel_name) ch.name = action.hotel_name
        if (action.price_per_night_chf != null) ch.price_per_night = action.price_per_night_chf
        if (action.nights != null) ch.nights = action.nights
        if (action.address) ch.address = action.address
        updateHotel(step.id, ch)
        results.push(`✓ Hôtel à ${action.step_nom} mis à jour`)
      } else {
        results.push(`⚠️ Étape introuvable: ${action.step_nom}`)
      }
    } else if (action.type === 'update_notes') {
      const step = steps.find(s => s.nom.toLowerCase().includes((action.step_nom || '').toLowerCase()))
      if (step) {
        updateStep(step.id, { notes: action.notes })
        results.push(`✓ Notes de ${action.step_nom} mises à jour`)
      } else {
        results.push(`⚠️ Étape introuvable: ${action.step_nom}`)
      }
    } else if (action.type === 'update_dates') {
      const step = steps.find(s => s.nom.toLowerCase().includes((action.step_nom || '').toLowerCase()))
      if (step) {
        updateStep(step.id, { dates: action.dates })
        results.push(`✓ Dates de ${action.step_nom} mises à jour`)
      } else {
        results.push(`⚠️ Étape introuvable: ${action.step_nom}`)
      }
    } else if (action.type === 'add_step' && addStep) {
      addStep({
        nom: action.nom,
        dates: action.dates || '',
        categorie: action.categorie || 'ville',
        notes: action.notes || '',
      })
      results.push(`✓ Étape "${action.nom}" ajoutée`)
    }
  }
  return results
}
