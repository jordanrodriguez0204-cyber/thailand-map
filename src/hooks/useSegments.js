import { useState, useCallback, useEffect } from 'react'
import { cloudSave, cloudLoad, onCloudChange } from '../lib/cloudStore'

const EMPTY_SEG = { mode: 'plane', price: null, duration_override: null, visible: true }

function segKey(fromId, toId) { return `${fromId}→${toId}` }
function storageKey(itinId) { return `th_segments_${itinId}` }
function loadFor(itinId) {
  try { return JSON.parse(localStorage.getItem(storageKey(itinId)) || '{}') } catch { return {} }
}

export function useSegments(itinId = 'default') {
  const [segments, setSegments] = useState(() => loadFor(itinId))

  useEffect(() => { setSegments(loadFor(itinId)) }, [itinId])

  // Sync cloud
  useEffect(() => {
    let stale = false
    cloudLoad(storageKey(itinId)).then(remote => {
      if (remote && !stale) {
        localStorage.setItem(storageKey(itinId), JSON.stringify(remote))
        setSegments(remote)
      }
    })
    const off = onCloudChange((k, value) => {
      if (k === storageKey(itinId)) {
        localStorage.setItem(k, JSON.stringify(value))
        setSegments(value)
      }
    })
    return () => { stale = true; off() }
  }, [itinId])

  const getSegment = useCallback((fromId, toId) => {
    return segments[segKey(fromId, toId)] || { ...EMPTY_SEG }
  }, [segments])

  const updateSegment = useCallback((fromId, toId, changes) => {
    setSegments(prev => {
      const k = segKey(fromId, toId)
      const next = { ...prev, [k]: { ...(prev[k] || EMPTY_SEG), ...changes } }
      localStorage.setItem(storageKey(itinId), JSON.stringify(next))
      cloudSave(storageKey(itinId), next)
      return next
    })
  }, [itinId])

  return { getSegment, updateSegment }
}
