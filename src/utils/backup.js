// Export / import de toutes les données locales de l'app (clés localStorage `th_`).
// Filet de sécurité : Safari iOS purge le localStorage d'une PWA non ouverte 7 jours.

export function exportBackup() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith('th_')) data[k] = localStorage.getItem(k)
  }
  const payload = { app: 'thailand-map', version: 1, exported_at: new Date().toISOString(), data }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `thailand-map-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
  return Object.keys(data).length
}

export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'))
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result)
        if (payload.app !== 'thailand-map' || !payload.data) {
          reject(new Error('Ce fichier n\'est pas une sauvegarde thailand-map'))
          return
        }
        const keys = Object.keys(payload.data)
        for (const k of keys) {
          if (k.startsWith('th_')) localStorage.setItem(k, payload.data[k])
        }
        resolve(keys.length)
      } catch {
        reject(new Error('Fichier JSON invalide'))
      }
    }
    reader.readAsText(file)
  })
}
