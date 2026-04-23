import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { cacheGet, cacheSet, cacheClearAll } from '../lib/cache'

const AuthContext = createContext(null)

const PROFILE_TTL  = 30 * 60 * 1000  // 30 Minuten
const KEEPALIVE_MS =  4 * 60 * 1000  //  4 Minuten — hält den Supabase-DB-Prozess warm

// Gecachtes Profil synchron lesen — noch bevor Auth bestätigt ist.
// Ermöglicht sofortiges Rendern ohne Ladescreen bei Wiederkehrenden.
function getStoredProfile() {
  try {
    const stored = localStorage.getItem('gfh_last_profile')
    return stored ? JSON.parse(stored) : null
  } catch { return null }
}

export function AuthProvider({ children }) {
  const storedProfile = getStoredProfile()

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(storedProfile)
  // Kein Ladescreen wenn wir schon ein gecachtes Profil haben
  const [loading, setLoading] = useState(!storedProfile)

  // Hält den Supabase-Datenbankprozess warm solange die App offen ist.
  // UptimeRobot allein reicht nicht — der /health-Ping weckt nur die API-Schicht,
  // nicht den eigentlichen PostgreSQL-Prozess. Eine echte DB-Abfrage ist nötig.
  useEffect(() => {
    const keepalive = setInterval(async () => {
      try { await supabase.from('profiles').select('id').limit(1) } catch { /* ignore */ }
    }, KEEPALIVE_MS)
    return () => clearInterval(keepalive)
  }, [])

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => { if (!cancelled) setLoading(false) }, 10000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else {
        // Kein aktiver User → Cache leeren und Login zeigen
        localStorage.removeItem('gfh_last_profile')
        setProfile(null)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return
        if (event === 'INITIAL_SESSION') return
        setUser(session?.user ?? null)
        if (session?.user) await loadProfile(session.user.id)
        else {
          localStorage.removeItem('gfh_last_profile')
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      cancelled = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId) {
    // Profil aus Cache → sofort anzeigen, kein Spinner
    const cached = cacheGet(`profile_${userId}`)
    if (cached) {
      setProfile(cached)
      setLoading(false)
    }

    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', userId)
        .single()

      // Fallback: per E-Mail suchen (für Profile die per Google Sheets angelegt wurden,
      // bei denen auth_id noch null ist)
      if (error || !data) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          const { data: byEmail, error: emailError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', user.email)
            .single()
          if (!emailError && byEmail) {
            // auth_id nachträglich setzen — einmalig, self-healing für alle Google-Sheets-Profile
            await supabase
              .from('profiles')
              .update({ auth_id: userId })
              .eq('email', user.email)
            data = { ...byEmail, auth_id: userId }
            error = null
          }
        }
      }

      if (!error && data) {
        setProfile(data)
        cacheSet(`profile_${userId}`, data, PROFILE_TTL)
        // Auch im localStorage als "letztes bekanntes Profil" speichern
        localStorage.setItem('gfh_last_profile', JSON.stringify(data))
      }
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    cacheClearAll()
    localStorage.removeItem('gfh_last_profile')
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
