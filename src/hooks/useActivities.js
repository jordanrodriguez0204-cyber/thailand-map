import { useState, useCallback, useEffect } from 'react'

function storageKey(itinId) { return `th_activities_${itinId}` }
function loadFor(itinId) {
  try { return JSON.parse(localStorage.getItem(storageKey(itinId))) || {} } catch { return {} }
}

export function useActivities(itinId = 'default') {
  const [activities, setActivities] = useState(() => loadFor(itinId))

  useEffect(() => { setActivities(loadFor(itinId)) }, [itinId])

  const getActivities = useCallback((stepId) => activities[stepId] || [], [activities])

  const addActivity = useCallback((stepId, text) => {
    if (!text?.trim()) return
    setActivities(prev => {
      const next = { ...prev, [stepId]: [...(prev[stepId] || []), { id: Date.now(), text: text.trim(), done: false }] }
      localStorage.setItem(storageKey(itinId), JSON.stringify(next))
      return next
    })
  }, [itinId])

  const toggleActivity = useCallback((stepId, actId) => {
    setActivities(prev => {
      const next = { ...prev, [stepId]: (prev[stepId] || []).map(a => a.id === actId ? { ...a, done: !a.done } : a) }
      localStorage.setItem(storageKey(itinId), JSON.stringify(next))
      return next
    })
  }, [itinId])

  const removeActivity = useCallback((stepId, actId) => {
    setActivities(prev => {
      const next = { ...prev, [stepId]: (prev[stepId] || []).filter(a => a.id !== actId) }
      localStorage.setItem(storageKey(itinId), JSON.stringify(next))
      return next
    })
  }, [itinId])

  return { getActivities, addActivity, toggleActivity, removeActivity }
}
