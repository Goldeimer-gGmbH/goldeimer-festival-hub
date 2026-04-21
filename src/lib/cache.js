/**
 * Einfaches sessionStorage-Cache mit TTL.
 * Daten werden pro Browser-Tab gespeichert und nach `ttlMs` als veraltet markiert.
 *
 * Nutzung:
 *   const cached = cacheGet('my-key')          // null wenn nicht vorhanden / abgelaufen
 *   cacheSet('my-key', data, 10 * 60 * 1000)   // 10 Minuten TTL
 *   cacheClear('my-key')                        // explizit löschen (z.B. nach Mutation)
 *   cacheClearAll()                             // alles löschen (z.B. beim Logout)
 */

const PREFIX = 'gfh_'   // goldeimer festival hub

export function cacheGet(key) {
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (!raw) return null
    const { data, expiresAt } = JSON.parse(raw)
    if (Date.now() > expiresAt) {
      sessionStorage.removeItem(PREFIX + key)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function cacheSet(key, data, ttlMs = 10 * 60 * 1000) {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({
      data,
      expiresAt: Date.now() + ttlMs,
    }))
  } catch {
    // sessionStorage voll oder nicht verfügbar – still ignorieren
  }
}

export function cacheClear(key) {
  try { sessionStorage.removeItem(PREFIX + key) } catch { /* ignore */ }
}

export function cacheClearAll() {
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => sessionStorage.removeItem(k))
  } catch { /* ignore */ }
}
