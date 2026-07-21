import { useState, useCallback, useEffect } from 'react'

const EMPTY = {
  name: '', price_per_night: null, nights: null, address: '',
  lat: null, lng: null, geocoded_name: '',
  booking_url: null, photo_url: null, rating: null, source: 'manual',
}

function key(itinId) { return `th_budget_${itinId}` }

function loadFor(itinId) {
  try {
    const raw = JSON.parse(localStorage.getItem(key(itinId)) || '{}')
    const out = {}
    for (const [stepId, val] of Object.entries(raw)) {
      if (Array.isArray(val)) {
        // Migration douce : complète les champs manquants (booking_url, rating…)
        out[stepId] = val.map(h => ({ ...EMPTY, ...h }))
      } else if (val && typeof val === 'object') {
        // Migration: ancien format objet unique → tableau
        out[stepId] = [{ ...EMPTY, ...val, id: crypto.randomUUID(), selected: true }]
      }
    }
    return out
  } catch { return {} }
}

export function useBudget(itinId = 'default') {
  const [data, setData] = useState(() => loadFor(itinId))

  useEffect(() => { setData(loadFor(itinId)) }, [itinId])

  function persist(next) {
    localStorage.setItem(key(itinId), JSON.stringify(next))
    return next
  }

  const getHotels = useCallback((stepId) => data[stepId] || [], [data])

  const getSelectedHotel = useCallback((stepId) => {
    const list = data[stepId] || []
    return list.find(h => h.selected) || list[0] || null
  }, [data])

  const addHotel = useCallback((stepId, initial = {}) => {
    setData(prev => {
      const existing = prev[stepId] || []
      const hotel = { ...EMPTY, ...initial, id: crypto.randomUUID(), selected: existing.length === 0 }
      return persist({ ...prev, [stepId]: [...existing, hotel] })
    })
  }, [itinId])

  const updateHotel = useCallback((stepId, hotelId, changes) => {
    setData(prev => {
      const list = (prev[stepId] || []).map(h => h.id === hotelId ? { ...h, ...changes } : h)
      return persist({ ...prev, [stepId]: list })
    })
  }, [itinId])

  const deleteHotel = useCallback((stepId, hotelId) => {
    setData(prev => {
      let list = (prev[stepId] || []).filter(h => h.id !== hotelId)
      if (list.length > 0 && !list.some(h => h.selected)) list = list.map((h, i) => ({ ...h, selected: i === 0 }))
      return persist({ ...prev, [stepId]: list })
    })
  }, [itinId])

  const selectHotel = useCallback((stepId, hotelId) => {
    setData(prev => {
      const list = (prev[stepId] || []).map(h => ({ ...h, selected: h.id === hotelId }))
      return persist({ ...prev, [stepId]: list })
    })
  }, [itinId])

  return { getHotels, getSelectedHotel, addHotel, updateHotel, deleteHotel, selectHotel }
}
