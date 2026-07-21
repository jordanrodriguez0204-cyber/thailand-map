// Sync cloud générique clé/valeur — miroir des clés localStorage `th_*` dans la
// table Supabase `app_data` (key text pk, value jsonb, updated_at).
// Si la table n'existe pas encore, tout no-op silencieusement (localStorage seul).
// SQL de création : voir SUPABASE_SETUP.sql à la racine du repo.

import { supabase, isSupabaseReady } from './supabase'

let available = null            // null = pas encore sondé
let probe = null

async function checkAvailable() {
  if (!isSupabaseReady) return false
  if (available !== null) return available
  if (!probe) {
    probe = supabase.from('app_data').select('key').limit(1).then(({ error }) => {
      available = !error
      return available
    })
  }
  return probe
}

// ── Écriture (débouncée par clé pour absorber les frappes) ──────────────────
const timers = {}
export function cloudSave(key, value) {
  clearTimeout(timers[key])
  timers[key] = setTimeout(async () => {
    if (!(await checkAvailable())) return
    try {
      await supabase.from('app_data').upsert({ key, value, updated_at: new Date().toISOString() })
    } catch { /* hors-ligne — localStorage reste la source */ }
  }, 800)
}

// ── Lecture ─────────────────────────────────────────────────────────────────
export async function cloudLoad(key) {
  if (!(await checkAvailable())) return null
  try {
    const { data, error } = await supabase.from('app_data').select('value').eq('key', key).maybeSingle()
    if (error || !data) return null
    return data.value
  } catch { return null }
}

// ── Temps réel — un seul channel partagé, registre de listeners ─────────────
const listeners = new Set()
let channelStarted = false

function startChannel() {
  if (channelStarted || !isSupabaseReady) return
  channelStarted = true
  supabase
    .channel('app_data_sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_data' }, payload => {
      const row = payload.new
      if (row?.key !== undefined) listeners.forEach(fn => fn(row.key, row.value))
    })
    .subscribe()
}

export function onCloudChange(fn) {
  listeners.add(fn)
  startChannel()
  return () => listeners.delete(fn)
}
