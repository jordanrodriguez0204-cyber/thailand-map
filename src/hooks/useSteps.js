import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { INITIAL_STEPS, } from '../data/initialSteps'
import { STORAGE_KEYS } from '../constants'

const LS_KEY = 'th_steps_local'

function localLoad() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function localSave(steps) {
  localStorage.setItem(LS_KEY, JSON.stringify(steps))
}

function seedSteps() {
  return INITIAL_STEPS.map((s, i) => ({
    ...s,
    id: crypto.randomUUID(),
    modified_by: null,
    modified_at: new Date().toISOString(),
  }))
}

export function useSteps(currentUser) {
  const [steps, setSteps] = useState([])
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(navigator.onLine)
  const [realtimeFlash, setRealtimeFlash] = useState(null) // { id, by }
  const historyRef = useRef([]) // local undo stack

  // Track online status
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Initial load
  useEffect(() => {
    async function init() {
      if (!isSupabaseReady) {
        const local = localLoad()
        setSteps(local ?? seedSteps())
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('steps')
        .select('*')
        .order('ordre', { ascending: true })
      if (error || !data) {
        const local = localLoad()
        setSteps(local ?? seedSteps())
      } else if (data.length === 0) {
        const seed = seedSteps()
        await supabase.from('steps').insert(seed)
        setSteps(seed)
      } else {
        setSteps(data)
        localSave(data)
      }
      setLoading(false)
    }
    init()
  }, [])

  // Realtime subscription
  useEffect(() => {
    if (!isSupabaseReady) return
    const channel = supabase
      .channel('steps-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'steps' }, (payload) => {
        setSteps((prev) => {
          let next
          if (payload.eventType === 'INSERT') {
            next = [...prev, payload.new].sort((a, b) => a.ordre - b.ordre)
          } else if (payload.eventType === 'UPDATE') {
            next = prev.map((s) => s.id === payload.new.id ? payload.new : s)
            if (payload.new.modified_by && payload.new.modified_by !== currentUser) {
              setRealtimeFlash({ id: payload.new.id, by: payload.new.modified_by })
              setTimeout(() => setRealtimeFlash(null), 3000)
            }
          } else if (payload.eventType === 'DELETE') {
            next = prev.filter((s) => s.id !== payload.old.id)
              .map((s, i) => ({ ...s, ordre: i + 1 }))
          } else {
            next = prev
          }
          localSave(next)
          return next
        })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [currentUser])

  function pushHistory(snapshot) {
    historyRef.current = [snapshot, ...historyRef.current].slice(0, 20)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || '[]')
    stored.unshift({ steps: snapshot, at: new Date().toISOString() })
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(stored.slice(0, 10)))
  }

  const meta = useCallback((extra = {}) => ({
    modified_by: currentUser,
    modified_at: new Date().toISOString(),
    ...extra,
  }), [currentUser])

  async function addStep(step) {
    pushHistory(steps)
    const newStep = { ...step, id: crypto.randomUUID(), ordre: steps.length + 1, ...meta() }
    if (isSupabaseReady) {
      await supabase.from('steps').insert(newStep)
    } else {
      const next = [...steps, newStep]
      setSteps(next)
      localSave(next)
    }
  }

  async function updateStep(id, changes) {
    pushHistory(steps)
    const updated = { ...changes, ...meta() }
    if (isSupabaseReady) {
      await supabase.from('steps').update(updated).eq('id', id)
    } else {
      const next = steps.map((s) => s.id === id ? { ...s, ...updated } : s)
      setSteps(next)
      localSave(next)
    }
  }

  async function deleteStep(id) {
    pushHistory(steps)
    if (isSupabaseReady) {
      await supabase.from('steps').delete().eq('id', id)
      const remaining = steps.filter((s) => s.id !== id).map((s, i) => ({ ...s, ordre: i + 1 }))
      for (const s of remaining) {
        await supabase.from('steps').update({ ordre: s.ordre }).eq('id', s.id)
      }
    } else {
      const next = steps.filter((s) => s.id !== id).map((s, i) => ({ ...s, ordre: i + 1 }))
      setSteps(next)
      localSave(next)
    }
  }

  async function reorderSteps(newOrder) {
    pushHistory(steps)
    const reordered = newOrder.map((s, i) => ({ ...s, ordre: i + 1 }))
    setSteps(reordered)
    localSave(reordered)
    if (isSupabaseReady) {
      await Promise.all(
        reordered.map((s) =>
          supabase.from('steps').update({ ordre: s.ordre, ...meta() }).eq('id', s.id)
        )
      )
    }
  }

  async function undo() {
    const prev = historyRef.current.shift()
    if (!prev) return
    setSteps(prev)
    localSave(prev)
    if (isSupabaseReady) {
      await supabase.from('steps').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('steps').insert(prev)
    }
  }

  return { steps, loading, online, realtimeFlash, addStep, updateStep, deleteStep, reorderSteps, undo, canUndo: historyRef.current.length > 0 }
}
