import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { INITIAL_STEPS } from '../data/initialSteps'
import { STORAGE_KEYS } from '../constants'

// Default itin always mirrors to 'th_steps_default' so comparison works
const LS_MAIN = 'th_steps_local'
const lsItinKey = (id) => `th_steps_${id}`

function localLoad() {
  try { const r = localStorage.getItem(LS_MAIN); return r ? JSON.parse(r) : null } catch { return null }
}
function localSave(steps) {
  localStorage.setItem(LS_MAIN, JSON.stringify(steps))
  localStorage.setItem(lsItinKey('default'), JSON.stringify(steps))
}
function loadLocalItin(id) {
  try { return JSON.parse(localStorage.getItem(lsItinKey(id)) || '[]') } catch { return [] }
}
function saveLocalItin(id, steps) {
  localStorage.setItem(lsItinKey(id), JSON.stringify(steps))
}

function seedSteps() {
  return INITIAL_STEPS.map((s) => ({
    ...s, id: crypto.randomUUID(), modified_by: null, modified_at: new Date().toISOString(),
  }))
}

export function useSteps(currentUser, itinId = 'default') {
  const isDefault = itinId === 'default'

  // Supabase steps — always loaded (used as default itin + for comparison mirror)
  const [sbSteps, setSbSteps] = useState([])
  // Local steps for non-default itins
  const [localItinSteps, setLocalItinSteps] = useState(() => isDefault ? [] : loadLocalItin(itinId))

  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(navigator.onLine)
  const [realtimeFlash, setRealtimeFlash] = useState(null)
  const historyRef = useRef([])

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Initial load from Supabase
  useEffect(() => {
    async function init() {
      if (!isSupabaseReady) {
        const local = localLoad()
        const s = local ?? seedSteps()
        setSbSteps(s); setLoading(false); return
      }
      const { data, error } = await supabase.from('steps').select('*').order('ordre', { ascending: true })
      if (error || !data) {
        const local = localLoad(); setSbSteps(local ?? seedSteps())
      } else if (data.length === 0) {
        const seed = seedSteps()
        await supabase.from('steps').insert(seed); setSbSteps(seed); localSave(seed)
      } else {
        setSbSteps(data); localSave(data)
      }
      setLoading(false)
    }
    init()
  }, [])

  // Reload local itin steps when itinId changes
  useEffect(() => {
    if (!isDefault) setLocalItinSteps(loadLocalItin(itinId))
  }, [itinId, isDefault])

  // Realtime (only for default/Supabase itin)
  useEffect(() => {
    if (!isSupabaseReady) return
    const channel = supabase.channel('steps-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'steps' }, (payload) => {
        setSbSteps((prev) => {
          let next
          if (payload.eventType === 'INSERT') next = [...prev, payload.new].sort((a, b) => a.ordre - b.ordre)
          else if (payload.eventType === 'UPDATE') {
            next = prev.map((s) => s.id === payload.new.id ? payload.new : s)
            if (payload.new.modified_by && payload.new.modified_by !== currentUser) {
              setRealtimeFlash({ id: payload.new.id, by: payload.new.modified_by })
              setTimeout(() => setRealtimeFlash(null), 3000)
            }
          } else if (payload.eventType === 'DELETE') {
            next = prev.filter((s) => s.id !== payload.old.id).map((s, i) => ({ ...s, ordre: i + 1 }))
          } else { next = prev }
          localSave(next)
          return next
        })
      }).subscribe()
    return () => supabase.removeChannel(channel)
  }, [currentUser])

  // Active steps (what the UI sees)
  const steps = isDefault ? sbSteps : localItinSteps

  function pushHistory(snap) {
    historyRef.current = [snap, ...historyRef.current].slice(0, 20)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || '[]')
    stored.unshift({ steps: snap, at: new Date().toISOString() })
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(stored.slice(0, 10)))
  }

  const meta = useCallback((extra = {}) => ({
    modified_by: currentUser, modified_at: new Date().toISOString(), ...extra,
  }), [currentUser])

  async function addStep(step) {
    pushHistory(steps)
    const newStep = { ...step, id: crypto.randomUUID(), ordre: steps.length + 1, ...meta() }
    if (isDefault) {
      if (isSupabaseReady) await supabase.from('steps').insert(newStep)
      else { const next = [...sbSteps, newStep]; setSbSteps(next); localSave(next) }
    } else {
      const next = [...localItinSteps, newStep]
      setLocalItinSteps(next); saveLocalItin(itinId, next)
    }
    return newStep
  }

  async function updateStep(id, changes) {
    pushHistory(steps)
    const updated = { ...changes, ...meta() }
    if (isDefault) {
      if (isSupabaseReady) await supabase.from('steps').update(updated).eq('id', id)
      else { const next = sbSteps.map(s => s.id === id ? { ...s, ...updated } : s); setSbSteps(next); localSave(next) }
    } else {
      const next = localItinSteps.map(s => s.id === id ? { ...s, ...updated } : s)
      setLocalItinSteps(next); saveLocalItin(itinId, next)
    }
  }

  async function deleteStep(id) {
    pushHistory(steps)
    if (isDefault) {
      if (isSupabaseReady) {
        await supabase.from('steps').delete().eq('id', id)
        const remaining = sbSteps.filter(s => s.id !== id).map((s, i) => ({ ...s, ordre: i + 1 }))
        for (const s of remaining) await supabase.from('steps').update({ ordre: s.ordre }).eq('id', s.id)
      } else {
        const next = sbSteps.filter(s => s.id !== id).map((s, i) => ({ ...s, ordre: i + 1 }))
        setSbSteps(next); localSave(next)
      }
    } else {
      const next = localItinSteps.filter(s => s.id !== id).map((s, i) => ({ ...s, ordre: i + 1 }))
      setLocalItinSteps(next); saveLocalItin(itinId, next)
    }
  }

  async function reorderSteps(newOrder) {
    pushHistory(steps)
    const reordered = newOrder.map((s, i) => ({ ...s, ordre: i + 1 }))
    if (isDefault) {
      setSbSteps(reordered); localSave(reordered)
      if (isSupabaseReady) await Promise.all(reordered.map(s => supabase.from('steps').update({ ordre: s.ordre, ...meta() }).eq('id', s.id)))
    } else {
      setLocalItinSteps(reordered); saveLocalItin(itinId, reordered)
    }
  }

  async function undo() {
    const prev = historyRef.current.shift()
    if (!prev) return
    if (isDefault) {
      setSbSteps(prev); localSave(prev)
      if (isSupabaseReady) {
        await supabase.from('steps').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('steps').insert(prev)
      }
    } else {
      setLocalItinSteps(prev); saveLocalItin(itinId, prev)
    }
  }

  // Copy current steps to another itinerary
  async function copyStepsTo(targetItinId) {
    const copies = steps.map((s, i) => ({ ...s, id: crypto.randomUUID(), ordre: i + 1, ...meta() }))
    if (targetItinId === 'default') {
      if (isSupabaseReady) await supabase.from('steps').insert(copies)
      else { const next = [...sbSteps, ...copies]; setSbSteps(next); localSave(next) }
    } else {
      const existing = loadLocalItin(targetItinId)
      saveLocalItin(targetItinId, [...existing, ...copies])
    }
  }

  // Delete all steps of an itinerary
  async function deleteItinerarySteps(targetItinId) {
    if (targetItinId === 'default') {
      if (isSupabaseReady) await supabase.from('steps').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      setSbSteps([]); localSave([])
    } else {
      saveLocalItin(targetItinId, [])
      if (itinId === targetItinId) setLocalItinSteps([])
    }
  }

  // allSteps for comparison: read all itins from localStorage
  function getAllStepsForCompare(itinIds) {
    return itinIds.flatMap(id => {
      let steps = loadLocalItin(id) // reads th_steps_${id}
      // Fallback: default itin may only exist under the old key 'th_steps_local'
      if (steps.length === 0 && id === 'default') {
        try { steps = JSON.parse(localStorage.getItem(LS_MAIN) || '[]') } catch { steps = [] }
      }
      // Also mirror to th_steps_default so future reads work
      if (id === 'default' && steps.length > 0) {
        localStorage.setItem(lsItinKey('default'), JSON.stringify(steps))
      }
      return steps.map(s => ({ ...s, itinerary_id: id }))
    })
  }

  return {
    steps, loading, online, realtimeFlash,
    addStep, updateStep, deleteStep, reorderSteps, undo,
    canUndo: historyRef.current.length > 0,
    copyStepsTo, deleteItinerarySteps, getAllStepsForCompare,
  }
}
