import { useState, useCallback, useEffect } from 'react'
import { cloudSave, cloudLoad, onCloudChange } from '../lib/cloudStore'

// Sous-destinations : excursions à la journée rattachées à une étape mère.
// Relation { [stepId]: parentStepId } stockée hors de la table steps
// (localStorage + cloud, même pattern que useSegments) → aucune migration Supabase.

function storageKey(itinId) { return `th_subdest_${itinId}` }
function loadFor(itinId) {
  try { return JSON.parse(localStorage.getItem(storageKey(itinId)) || '{}') } catch { return {} }
}

export function useSubDestinations(itinId = 'default') {
  const [subOf, setSubOf] = useState(() => loadFor(itinId))

  useEffect(() => { setSubOf(loadFor(itinId)) }, [itinId])

  useEffect(() => {
    let stale = false
    cloudLoad(storageKey(itinId)).then(remote => {
      if (remote && !stale) {
        localStorage.setItem(storageKey(itinId), JSON.stringify(remote))
        setSubOf(remote)
      }
    })
    const off = onCloudChange((k, value) => {
      if (k === storageKey(itinId)) {
        localStorage.setItem(k, JSON.stringify(value))
        setSubOf(value)
      }
    })
    return () => { stale = true; off() }
  }, [itinId])

  // parentId = null → redevient une étape principale
  const setParent = useCallback((stepId, parentId) => {
    setSubOf(prev => {
      const next = { ...prev }
      if (parentId) next[stepId] = parentId
      else delete next[stepId]
      localStorage.setItem(storageKey(itinId), JSON.stringify(next))
      cloudSave(storageKey(itinId), next)
      return next
    })
  }, [itinId])

  const getParentId = useCallback((stepId) => subOf[stepId] || null, [subOf])

  return { subOf, getParentId, setParent }
}
