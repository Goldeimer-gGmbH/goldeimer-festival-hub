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

    // Hilfsfunktion: Session herstellen. getSession() refresht intern wenn nötig.
    // Schlägt das fehl (abgelaufenes Refresh-Token), explizit refreshSession() versuchen.
    // Liefert null wenn wirklich keine gültige Session herstellbar ist.
    async function resolveSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) return session
      // getSession() hat null geliefert — letzter Versuch mit explizitem Refresh
      if (hasSupabaseRefreshToken()) {
        try {
          const { data } = await supabase.auth.refreshSession()
          if (data?.session?.user) return data.session
        } catch {}
      }
      return null
    }

    resolveSession().then(session => {
      if (cancelled) return
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        // Kein Session herstellbar → ausloggen.
        // Nur Profil-Marker löschen, Daten-Caches bleiben erhalten.
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
        resolveSession().then(session => {
          if (cancelled) return
          if (session?.user) {
            setUser(session.user)
            // Immer loadProfile aufrufen — auch wenn Profil schon gecacht.
            // Das triggert prefetchAll() und hält Festival-Daten frisch.
            loadProfile(session.user.id)
          } else {
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
    const handleOnline = () => {
      if (!profileRef.current) return
      resolveSession().then(session => {
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
      let assignments = cacheGet(`assignments_${profile.id}`)
      if (!assignments) {
        const { data } = await supabase
          .from('assignments')
          .select(`id, role, status, festival:festivals(id, name, details)`)
          .eq('profile_id', profile.id)
          .in('status', ['zugesagt', 'akkreditiert', 'teilgenommen'])
          .order('created_at', { ascending: true })
        if (data) {
          cacheSet(`assignments_${profile.id}`, data, DATA_TTL)
          assignments = data
        }
      }

      // FestivalPage: Daten für alle Festivals des Users vorladen.
      // Verhindert Timeout-Fehler wenn die DB kalt ist und der User direkt eine
      // Festival-Karte öffnet — die Daten sind dann schon im Cache.
      if (assignments?.length) {
        for (const a of assignments) {
          const festivalId = a.festival?.id
          if (!festivalId || cacheGet(`festival_v4_${festivalId}`)) continue
          // fire & forget — kein await, blockiert nicht den Rest des Logins
          supabase.rpc('get_my_festival_info', { p_festival_id: festivalId })
            .then(({ data: rpcData }) => {
              if (rpcData && !rpcData.error) {
                cacheSet(`festival_v4_${festivalId}`, rpcData, DATA_TTL)
              }
            })
            .catch(() => {}) // best-effort, Fehler ignorieren
        }
      }
    } catch { /* Prefetch ist best-effort, Fehler ignorieren */ }
  }

  async function signOut() {
    // Zuerst lokal alles clearen — nicht auf den Server warten.
    // Server-Call kann bei abgelaufener Session hängen und den Button "einfrieren".
    cacheClearAll()
    localStorage.removeItem('gfh_last_profile')
    // Supabase Auth-Tokens direkt aus localStorage löschen (sofort, kein API-Call nötig)
    Object.keys(localStorage)
      .filter(k => k.startsWith('sb-'))
      .forEach(k => localStorage.removeItem(k))
    setUser(null)
    setProfile(null)
    profileRef.current = null
    // Server-seitig revoken — fire & forget, kein await
    supabase.auth.signOut().catch(() => {})
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
