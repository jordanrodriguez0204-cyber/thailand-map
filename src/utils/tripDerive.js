import { haversineKm } from './geo'
import { estimateDuration } from '../data/destinations'

// Dérivations étapes principales / excursions (sous-destinations).
// La relation subOf vient de useSubDestinations ; ordre du tableau steps préservé.

const ROUTE_FACTOR = { plane: 1.05, train: 1.4, bus: 1.5, ferry: 1.2, car: 1.3 }

export function splitSteps(steps, subOf) {
  const byId = new Map(steps.map(s => [s.id, s]))
  const mainSteps = []
  const excursions = [] // { step, parent }
  for (const s of steps) {
    const parent = subOf[s.id] ? byId.get(subOf[s.id]) : null
    // Garde-fous : parent inexistant ou auto-référence → étape principale
    if (parent && parent.id !== s.id && !subOf[parent.id]) excursions.push({ step: s, parent })
    else mainSteps.push(s)
  }
  return { mainSteps, excursions }
}

// Un leg d'excursion = aller-retour depuis l'étape mère (km et durée ×2, prix tel que saisi)
export function excursionLeg(parent, step, getSegment) {
  const seg = getSegment(parent.id, step.id)
  const mode = seg.mode || 'ferry'
  const oneWayKm = Math.round(haversineKm(parent.lat, parent.lng, step.lat, step.lng) * (ROUTE_FACTOR[mode] ?? 1))
  const km = oneWayKm * 2
  const durMin = seg.duration_override != null ? seg.duration_override * 2 : estimateDuration(oneWayKm, mode) * 2
  return { seg, mode, km, durMin, price: seg.price ?? 0 }
}

// Totaux transport : segments consécutifs entre étapes principales + legs d'excursions
export function transportTotals(mainSteps, excursions, getSegment) {
  let price = 0, km = 0, durMin = 0
  mainSteps.forEach((step, i) => {
    const prev = mainSteps[i - 1]
    if (!prev) return
    const seg = getSegment(prev.id, step.id)
    const rawKm = haversineKm(prev.lat, prev.lng, step.lat, step.lng)
    km += Math.round(rawKm * (ROUTE_FACTOR[seg.mode] ?? 1))
    durMin += seg.duration_override ?? estimateDuration(rawKm, seg.mode)
    price += seg.price ?? 0
  })
  for (const { step, parent } of excursions) {
    const leg = excursionLeg(parent, step, getSegment)
    km += leg.km; durMin += leg.durMin; price += leg.price
  }
  return { price, km, durMin }
}
