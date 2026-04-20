import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    // Timeout-Fallback: nach 10s auf jeden Fall aufhören
    const timeout = setTimeout(() => { if (!cancelled) setLoading(false) }, 10000)

    // Session sofort beim Start holen
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    // Nur auf echte Änderungen reagieren (nicht INITIAL_SESSION – das macht getSession oben)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return
        if (event === 'INITIAL_SESSION') return
        setUser(session?.user ?? null)
        if (session?.user) await loadProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      }
    )

    return () => {
      cancelled = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', userId)
        .single()
      if (!error && data) setProfile(data)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
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
