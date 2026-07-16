/**
 * Wraps a Supabase query promise with a timeout.
 * Returns { data, error, isAuthError } where isAuthError = true wenn die
 * Session abgelaufen ist (JWT invalid/expired, 401, PGRST301).
 */
export async function fetchWithTimeout(queryPromise, ms = 8000) {
  let timer
  const timeout = new Promise(resolve =>
    timer = setTimeout(() => resolve({ data: null, error: new Error('timeout') }), ms)
  )
  try {
    // Query-Builder-Aufrufe (.from()/.rpc()) resolven bei Fehlern normalerweise
    // mit { error }. supabase.auth.getSession()/refreshSession() können aber
    // werfen (z.B. bei einem gestohlenen Web-Lock) — ohne dieses .catch() würde
    // das hier ungefangen an den Aufrufer durchgereicht statt sauber {error}
    // zurückzugeben.
    const result = await Promise.race([queryPromise, timeout]).catch(err => ({ data: null, error: err }))
    // Auth-Fehler erkennen: abgelaufener JWT oder fehlende Berechtigung
    const isAuthError = !!(
      result.error && (
        result.error.status === 401 ||
        result.error.code === 'PGRST301' ||
        String(result.error.message).toLowerCase().includes('jwt') ||
        String(result.error.message).toLowerCase().includes('not authenticated')
      )
    )
    return { ...result, isAuthError }
  } finally {
    clearTimeout(timer)
  }
}
