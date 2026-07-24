import { useState, useEffect, useCallback } from 'react'
import { cloudSave, cloudLoad, onCloudChange } from '../lib/cloudStore'

// Enveloppe budget cible du voyage (CHF), par itinéraire.
// Même modèle que useBudget : write-through localStorage + cloud, realtime entre appareils.

function key(itinId) { return `th_budget_target_${itinId}` }

function loadFor(itinId) {
  const raw = localStorage.getItem(key(itinId))
  const n = raw ? +raw : null
  return n > 0 ? n : null
}

export function useBudgetTarget(itinId = 'default') {
  const [target, setTargetState] = useState(() => loadFor(itinId))

  useEffect(() => { setTargetState(loadFor(itinId)) }, [itinId])

  useEffect(() => {
    let stale = false
    cloudLoad(key(itinId)).then(remote => {
      if (remote != null && !stale) {
        localStorage.setItem(key(itinId), String(remote))
        setTargetState(+remote > 0 ? +remote : null)
      }
    })
    const off = onCloudChange((k, value) => {
      if (k === key(itinId)) {
        localStorage.setItem(k, String(value))
        setTargetState(+value > 0 ? +value : null)
      }
    })
    return () => { stale = true; off() }
  }, [itinId])

  const setTarget = useCallback((value) => {
    const n = value > 0 ? value : null
    if (n == null) localStorage.removeItem(key(itinId))
    else localStorage.setItem(key(itinId), String(n))
    cloudSave(key(itinId), n)
    setTargetState(n)
  }, [itinId])

  return { target, setTarget }
}
