import { useState, useCallback, useEffect } from 'react'

const EMPTY_SEG = { mode: 'plane', price: null, duration_override: null, visible: true }

function segKey(fromId, toId) { return `${fromId}→${toId}` }
function storageKey(itinId) { return `th_segments_${itinId}` }
function loadFor(itinId) {
  try { return JSON.parse(localStorage.getItem(storageKey(itinId)) || '{}') } catch { return {} }
}

export function useSegments(itinId = 'default') {
  const [segments, setSegments] = useState(() => loadFor(itinId))

  useEffect(() => { setSegments(loadFor(itinId)) }, [itinId])

  const getSegment = useCallback((fromId, toId) => {
    return segments[segKey(fromId, toId)] || { ...EMPTY_SEG }
  }, [segments])

  const updateSegment = useCallback((fromId, toId, changes) => {
    setSegments(prev => {
      const k = segKey(fromId, toId)
      const next = { ...prev, [k]: { ...(prev[k] || EMPTY_SEG), ...changes } }
      localStorage.setItem(storageKey(itinId), JSON.stringify(next))
      return next
    })
  }, [itinId])

  return { getSegment, updateSegment }
}
