// ── Exécute les actions retournées par Gemini sur l'état de l'app ────────────
import { haversineKm } from '../utils/geo'

export function useAIActions({ steps, addStep, updateStep, updateSegment, updateHotel }) {

  async function geocode(nom, hint = '') {
    try {
      const q = encodeURIComponent(`${nom} ${hint} Thailand`)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=th`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'thailand-travel-map/1.0' } }
      )
      const data = await res.json()
      if (data[0]) return { lat: +data[0].lat, lng: +data[0].lon }
    } catch {}
    return null
  }

  async function execute(actions) {
    const results = []
    for (const action of actions) {
      try {
        switch (action.type) {

          case 'update_segment': {
            const from = steps.find(s => s.nom.toLowerCase().includes(action.from_nom?.toLowerCase()))
            const to   = steps.find(s => s.nom.toLowerCase().includes(action.to_nom?.toLowerCase()))
            if (from && to) {
              updateSegment(from.id, to.id, {
                mode: action.mode || 'plane',
                price: action.price_chf ?? null,
                duration_override: action.duration_minutes ?? null,
              })
              if (action.notes) {
                const existing = to.notes || ''
                updateStep(to.id, { notes: action.notes + (existing ? '\n' + existing : '') })
              }
              results.push(`✅ Segment ${from.nom} → ${to.nom} mis à jour`)
            } else {
              results.push(`⚠️ Étapes introuvables : ${action.from_nom} → ${action.to_nom}`)
            }
            break
          }

          case 'update_hotel': {
            const step = steps.find(s => s.nom.toLowerCase().includes(action.step_nom?.toLowerCase()))
            if (step) {
              updateHotel(step.id, {
                name: action.hotel_name || '',
                price_per_night: action.price_per_night_chf ?? null,
                nights: action.nights ?? null,
                address: action.address || '',
              })
              // Géocoder l'adresse si fournie
              if (action.address) {
                geocode(action.address).then(coords => {
                  if (coords) updateHotel(step.id, coords)
                })
              }
              results.push(`✅ Hôtel de ${step.nom} mis à jour`)
            } else {
              results.push(`⚠️ Étape introuvable : ${action.step_nom}`)
            }
            break
          }

          case 'update_notes': {
            const step = steps.find(s => s.nom.toLowerCase().includes(action.step_nom?.toLowerCase()))
            if (step) {
              updateStep(step.id, { notes: action.notes })
              results.push(`✅ Notes de ${step.nom} mises à jour`)
            }
            break
          }

          case 'update_dates': {
            const step = steps.find(s => s.nom.toLowerCase().includes(action.step_nom?.toLowerCase()))
            if (step) {
              updateStep(step.id, { dates: action.dates })
              results.push(`✅ Dates de ${step.nom} mises à jour`)
            }
            break
          }

          case 'add_step': {
            const coords = await geocode(action.nom, action.notes || '')
            if (!coords) { results.push(`⚠️ Impossible de géocoder : ${action.nom}`); break }

            // Trouver l'ordre d'insertion
            const afterStep = action.apres_nom
              ? steps.find(s => s.nom.toLowerCase().includes(action.apres_nom.toLowerCase()))
              : null
            const ordre = afterStep ? afterStep.ordre + 0.5 : steps.length + 1

            addStep({
              nom: action.nom,
              lat: coords.lat,
              lng: coords.lng,
              dates: action.dates || '',
              categorie: action.categorie || 'ville',
              notes: action.notes || '',
              ordre,
            })
            results.push(`✅ Étape ${action.nom} ajoutée`)
            break
          }

          default:
            results.push(`⚠️ Action inconnue : ${action.type}`)
        }
      } catch (e) {
        results.push(`❌ Erreur : ${e.message}`)
      }
    }
    return results
  }

  return { execute }
}
