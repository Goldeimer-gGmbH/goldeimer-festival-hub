/**
 * localStorage-Cache mit TTL.
 * localStorage überlebt PWA-Hintergrund-Kills, Browser-Neustarts und Tab-Schließen —
 * im Gegensatz zu sessionStorage, das beim Kill gelöscht wird.
 */

const PREFIX = 'gfh_'

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const { data, expiresAt } = JSON.parse(raw)
    if (Date.now() > expiresAt) {
      localStorage.removeItem(PREFIX + key)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function cacheSet(key, data, ttlMs = 10 * 60 * 1000) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({
      data,
      expiresAt: Date.now() + ttlMs,
    }))
  } catch {
    // localStorage voll → alten Cache leeren und nochmal versuchen
    cacheClearAll()
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify({ data, expiresAt: Date.now() + ttlMs }))
    } catch { /* ignore */ }
  }
}

export function cacheClear(key) {
  try { localStorage.removeItem(PREFIX + key) } catch { /* ignore */ }
}

export function cacheClearAll() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k))
  } catch { /* ignore */ }
}
