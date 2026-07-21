import { useState } from 'react'

const STORAGE_KEY = 'th_itineraries'
const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']
const DEFAULT_ITIN = { id: 'default', name: 'Itinéraire 1', color: '#6366f1' }

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (d?.list?.length) return d
  } catch {}
  return { active: 'default', list: [DEFAULT_ITIN] }
}

function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function useItineraries() {
  const [state, setState] = useState(load)

  function set(next) { setState(next); persist(next) }

  const create = (name, copyFrom = null) => {
    if (state.list.length >= 5) return null
    const id = `itin_${Date.now()}`
    const color = COLORS[state.list.length % COLORS.length]
    const itin = { id, name: name || `Itinéraire ${state.list.length + 1}`, color }
    set({ active: id, list: [...state.list, itin] })
    return { id, copyFrom }
  }

  const switchTo = (id) => set({ ...state, active: id })

  const rename = (id, name) => set({
    ...state,
    list: state.list.map(i => i.id === id ? { ...i, name } : i),
  })

  const remove = (id) => {
    if (id === 'default' || state.list.length <= 1) return
    const list = state.list.filter(i => i.id !== id)
    const active = state.active === id ? list[0].id : state.active
    set({ active, list })
  }

  const activeItin = state.list.find(i => i.id === state.active) || DEFAULT_ITIN

  return {
    itineraries: state.list,
    activeItinId: state.active,
    activeItin,
    create,
    switchTo,
    rename,
    remove,
  }
}
