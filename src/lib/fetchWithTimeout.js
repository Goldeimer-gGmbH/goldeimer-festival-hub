/**
 * Wraps a Supabase query promise with a timeout.
 * If the query doesn't resolve within `ms` milliseconds,
 * it returns { data: null, error: new Error('timeout') }.
 */
export async function fetchWithTimeout(queryPromise, ms = 8000) {
  let timer
  const timeout = new Promise(resolve =>
    timer = setTimeout(() => resolve({ data: null, error: new Error('timeout') }), ms)
  )
  try {
    const result = await Promise.race([queryPromise, timeout])
    return result
  } finally {
    clearTimeout(timer)
  }
}
