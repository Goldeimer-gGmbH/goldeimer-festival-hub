import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false }
      })
      if (error) {
        // Spezifische Fehlermeldungen je nach Ursache
        if (error.message?.includes('not found') || error.message?.includes('user')) {
          setError('Diese E-Mail ist nicht in unserem System. Wende dich an Goldeimer.')
        } else if (error.message?.includes('rate') || error.status === 429) {
          setError('Zu viele Versuche. Bitte warte ein paar Minuten.')
        } else if (error.message?.includes('network') || error.status >= 500) {
          setError('Server nicht erreichbar. Bitte versuche es gleich nochmal.')
        } else {
          setError(`Fehler: ${error.message || 'Unbekannter Fehler'}`)
        }
      } else {
        setSent(true)
      }
    } catch (e) {
      setError('Verbindungsfehler. Bitte prüfe deine Internetverbindung.')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          background: 'var(--gelb)',
          padding: '60px 24px 48px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(29,29,27,0.15)',
        }}>
          <div style={{ fontSize: 64, lineHeight: 1 }}>📬</div>
          <div className="statement" style={{ fontSize: 'var(--text-h0)', marginTop: 16, color: 'var(--schwarz)' }}>
            Check deine Mails!
          </div>
        </div>
        <div style={{ padding: 'var(--sp-8) var(--sp-6)', flex: 1 }}>
          <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.6, color: 'var(--grau-text)' }}>
            Login-Link an <strong style={{ color: 'var(--schwarz)' }}>{email}</strong> geschickt.
            Kein Passwort nötig – einfach auf den Link klicken.
          </p>
          <button onClick={() => setSent(false)} className="button button--secondary" style={{ marginTop: 28 }}>
            Nochmal versuchen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Hero */}
      <div style={{
        background: 'var(--gelb)',
        padding: '52px 24px 40px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(29,29,27,0.15)',
      }}>
        <div style={{
          position: 'absolute', bottom: -20, right: -20,
          width: 140, height: 140,
          background: 'var(--schwarz)', opacity: 0.05,
          transform: 'rotate(20deg)', borderRadius: 'var(--rounded-lg)',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', width: 72, height: 72,
            background: 'var(--schwarz)', borderRadius: 'var(--rounded)',
            alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 18,
          }}>
            🚽
          </div>
          <div className="statement" style={{ fontSize: 'var(--text-h0)', color: 'var(--schwarz)', lineHeight: 1, marginBottom: 4 }}>
            Goldeimer
          </div>
          <div style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700,
            fontSize: 'var(--text-h3)', color: 'var(--schwarz)',
            letterSpacing: 'var(--heading-ls)', opacity: 0.65, marginBottom: 16,
          }}>
            Festival Hub
          </div>
          <div style={{
            display: 'inline-block',
            background: 'var(--schwarz)', color: 'var(--gelb)',
            padding: '4px 12px', borderRadius: 'var(--rounded-full)',
            fontSize: 'var(--text-xs)', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            fontFamily: 'var(--font-heading)',
          }}>
            🎪 Saison 2025
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: 'var(--sp-8) var(--sp-5)', flex: 1 }}>
        <h1 style={{ fontSize: 'var(--text-h2)', marginBottom: 'var(--sp-2)' }}>Einloggen</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--grau-text)', marginBottom: 'var(--sp-6)', lineHeight: 1.6 }}>
          Gib deine E-Mail ein – wir schicken dir einen Magic Link. Kein Passwort nötig.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>E-Mail-Adresse</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
              autoFocus
            />
          </div>

          {error && (
            <div style={{
              background: '#FFF0ED', border: '1px solid var(--rot)',
              borderRadius: 'var(--rounded-input)',
              padding: 'var(--sp-3) var(--sp-4)',
              fontSize: 'var(--text-sm)', color: 'var(--rot)', lineHeight: 1.5,
            }}>
              ⚠ {error}
            </div>
          )}

          <button type="submit" disabled={loading || !email} className="button" style={{ marginTop: 'var(--sp-2)' }}>
            {loading ? 'Wird gesendet...' : 'Login-Link anfordern →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'var(--sp-6)', fontSize: 'var(--text-xs)', color: 'var(--grau-text)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Nur für angemeldete Goldeimer-Crew
        </p>
      </div>
    </div>
  )
}
