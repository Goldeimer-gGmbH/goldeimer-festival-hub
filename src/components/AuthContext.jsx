import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { cacheGet, cacheSet, cacheClearAll } from '../lib/cache'

const AuthContext = createContext(null)

const PROFILE_TTL = 48 * 60 * 60 * 1000  // 48 Stunden
const DATA_TTL    = 48 * 60 * 60 * 1000  // 48 Stunden für prefetched Daten

// Supabase Project Ref für direkten localStorage-Zugriff
const SUPABASE_REF = 'wsdkmglkqxszyvomrfim'

// Prüft ob Supabase einen Refresh-Token im localStorage hat.
// Supabase speichert den Key je nach Version unterschiedlich
// (sb-[ref]-auth-token ODER sb-[hostname]-auth-token) — daher
// alle Keys nach dem Muster durchsuchen statt hart zu kodieren.
function hasSupabaseRefreshToken() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const parsed = JSON.parse(localStorage.getItem(key) || 'null')
        if (parsed?.refresh_token) return true
      }
    }
    return false
  } catch { return false }
}

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

  // Ref für aktuelle profile-Wert — löst das Stale-Closure-Problem im
  // visibilitychange-Handler, der nur einmal registriert wird.
  const profileRef = useRef(storedProfile)

  // DB-Keepalive läuft jetzt serverseitig via pg_cron (alle 5 Min in Supabase).
  // Browser-seitiger Keepalive ist auf Mobile unzuverlässig (Timer-Throttling).

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => { if (!cancelled) setLoading(false) }, 10000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        // getSession() null ≠ ausgeloggt. Auf Mobile schlägt der Token-Refresh
        // regelmäßig fehl (schlechtes Netz, Timer-Throttling im Hintergrund).
        // Wenn Supabase noch einen Refresh-Token hat, ist der User wahrscheinlich
        // noch eingeloggt — gecachte Daten weiter zeigen, nicht löschen.
        if (profileRef.current && hasSupabaseRefreshToken()) {
          setLoading(false)
          return
        }
        // Nur das Profil-Marker löschen — Daten-Caches bleiben erhalten.
        // cacheClearAll() hier würde gfh_last_profile löschen und den
        // nächsten App-Start ohne Sofort-Rendering starten (sichtbarer Ladescreen).
        localStorage.removeItem('gfh_last_profile')
        setProfile(null)
        profileRef.current = null
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return
        if (event === 'INITIAL_SESSION') return
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          if (profileRef.current && hasSupabaseRefreshToken()) {
            setLoading(false)
            return
          }
          // Nur Profil-Marker entfernen, keine Daten-Caches löschen.
          // Vollständiges Löschen nur bei explizitem signOut().
          localStorage.removeItem('gfh_last_profile')
          setProfile(null)
          profileRef.current = null
          setLoading(false)
        }
      }
    )

    // PWA-Fix: Wenn die App nach längerem Hintergrund wieder sichtbar wird,
    // Session sofort auffrischen. Mobil throttelt Timer-basierte Token-Refresh,
    // daher explizit beim App-Fokus triggern.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (cancelled) return
          if (session?.user) {
            setUser(session.user)
            // profileRef.current statt profile — verhindert Stale-Closure-Bug
            // (dieser Handler wird nur einmal registriert, daher muss der
            // aktuelle Wert immer aus dem Ref gelesen werden)
            if (!profileRef.current) loadProfile(session.user.id)
          } else {
            if (profileRef.current && hasSupabaseRefreshToken()) return
            // Session wirklich abgelaufen (kein Refresh-Token mehr) → ausloggen.
            // Nur Profil-Marker entfernen, Daten-Caches bleiben erhalten.
            localStorage.removeItem('gfh_last_profile')
            setProfile(null)
            profileRef.current = null
            setUser(null)
          }
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Wenn das Gerät wieder online geht: Session-Refresh nachholen.
    // Wichtig für den Fall dass der Token-Refresh vorher wegen fehlenden Netzes
    // still übergangen wurde — jetzt nachholen ohne den User zu stören.
    const handleOnline = () => {
      if (!profileRef.current) return
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled || !session?.user) return
        setUser(session.user)
        loadProfile(session.user.id)
      })
    }
    window.addEventListener('online', handleOnline)

    return () => {
      cancelled = true
      clearTimeout(timeout)
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('online', handleOnline)
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
        profileRef.current = data
        cacheSet(`profile_${userId}`, data, PROFILE_TTL)
        localStorage.setItem('gfh_last_profile', JSON.stringify(data))
        // Alle Seiten im Hintergrund vorladen → kein Kaltstart beim Navigieren
        prefetchAll(data)
      }
    } finally {
      setLoading(false)
    }
  }

  // Lädt alle Seiteninhalte still im Hintergrund und schreibt sie in den Cache.
  // So ist jede Seite sofort verfügbar, egal wann der User darauf klickt.
  async function prefetchAll(profile) {
    try {
      // InfosPage: globale Inhalte
      if (!cacheGet('infos_content')) {
        const { data } = await supabase
          .from('content').select('*')
          .is('festival_id', null).eq('visibility', 'all').order('sort_order')
        if (data) cacheSet('infos_content', data, DATA_TTL)
      }

      // HomePage: Assignments des Users
      if (!cacheGet(`assignments_${profile.id}`)) {
        const { data } = await supabase
          .from('assignments')
          .select(`id, role, status, festival:festivals(id, name, details)`)
          .eq('profile_id', profile.id)
          .in('status', ['zugesagt', 'akkreditiert', 'teilgenommen'])
          .order('created_at', { ascending: true })
        if (data) cacheSet(`assignments_${profile.id}`, data, DATA_TTL)
      }
    } catch { /* Prefetch ist best-effort, Fehler ignorieren */ }
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
