import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const RESEND_COOLDOWN = 60 // Sekunden zwischen OTP-Anfragen

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef(null)

  // Countdown-Timer nach jedem Senden
  useEffect(() => {
    if (cooldown <= 0) return
    timerRef.current = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [cooldown])

  async function handleSubmit(e) {
    e.preventDefault()
    if (cooldown > 0) return
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      })
      if (error) {
        if (error.message?.includes('not found') || error.message?.includes('user')) {
          setError('Diese E-Mail ist nicht in unserem System. Wende dich an Goldeimer.')
        } else if (error.message?.includes('rate') || error.status === 429) {
          setError('Zu viele Versuche. Bitte warte ein paar Minuten und versuche es dann erneut.')
          setCooldown(RESEND_COOLDOWN)
        } else if (error.message?.includes('network') || error.status >= 500) {
          setError('Server nicht erreichbar. Bitte versuche es gleich nochmal.')
        } else {
          setError(`Fehler: ${error.message || 'Unbekannter Fehler'}`)
        }
      } else {
        setSent(true)
        setCooldown(RESEND_COOLDOWN)
      }
    } catch {
      setError('Verbindungsfehler. Bitte prüfe deine Internetverbindung.')
    }
    setLoading(false)
  }

  function handleResend() {
    if (cooldown > 0) return
    setSent(false)
    setError('')
  }

  /* ── Bestätigung: Magic Link wurde verschickt ── */
  if (sent) {
    return (
      <div>
        {/* Header */}
        <div className="header">
          <img src="/goldeimer-logo.png" alt="Goldeimer" style={{ height: 36 }} />
        </div>

        {/* Schwarzes Banner */}
        <div style={{
          background: 'var(--schwarz)',
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
        }}>
          <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-6) var(--sp-4) 0' }}>
            <div className="statement" style={{ fontSize: 'var(--text-h0)', color: 'var(--gelb)', lineHeight: 1 }}>
              Check deine Mails!
            </div>
            <p style={{ color: 'var(--on-dark-sub)', marginTop: 6, marginBottom: 'var(--sp-6)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
              Dein Login-Link ist unterwegs
            </p>
          </div>
          <svg viewBox="0 0 480 64" preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: 56, marginBottom: -2 }}>
            <path d="M0,32 C80,64 160,8 260,36 C340,58 420,12 480,28 L480,64 L0,64 Z"
              fill="var(--papier)" />
          </svg>
        </div>

        {/* Content */}
        <div className="page" style={{ paddingTop: 'var(--sp-6)' }}>
          {/* Info-Karte */}
          <div style={{
            background: 'var(--weiss)',
            borderRadius: 'var(--rounded)',
            padding: 'var(--sp-6)',
            boxShadow: 'var(--shadow-sm)',
            textAlign: 'center',
            marginBottom: 'var(--sp-4)',
          }}>
            <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 'var(--sp-4)' }}>📬</div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--grau-text)', marginBottom: 4 }}>
              Login-Link geschickt an
            </p>
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--schwarz)', marginBottom: 'var(--sp-4)' }}>
              {email}
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--grau-text)', lineHeight: 1.6 }}>
              Kein Passwort nötig – einfach auf den Link klicken.
              Nichts angekommen? Schau auch im Spam-Ordner. Der Link ist 60 Minuten gültig.
            </p>
          </div>

          <button
            onClick={handleResend}
            disabled={cooldown > 0}
            className="button button--secondary"
            style={{ width: '100%' }}
          >
            {cooldown > 0 ? `Nochmal senden (${cooldown}s)` : 'Nochmal senden'}
          </button>
        </div>
      </div>
    )
  }

  /* ── Login-Formular ── */
  return (
    <div>
      {/* Header */}
      <div className="header">
        <img src="/goldeimer-logo.png" alt="Goldeimer" style={{ height: 36 }} />
      </div>

      {/* Schwarzes Banner */}
      <div style={{
        background: 'var(--schwarz)',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-6) var(--sp-4) 0' }}>
          <div className="statement" style={{ fontSize: 'var(--text-h0)', color: 'var(--gelb)', lineHeight: 1 }}>
            Goldeimer
          </div>
          <p style={{ color: 'var(--on-dark-sub)', marginTop: 4, marginBottom: 6, fontSize: 'var(--text-h3)', fontWeight: 700 }}>
            Festival Hub
          </p>
          {/* Saison-Badge */}
          <div style={{ paddingBottom: 'var(--sp-5)' }}>
            <span style={{
              display: 'inline-block',
              background: 'var(--gelb)', color: 'var(--schwarz)',
              padding: '4px 12px', borderRadius: 'var(--rounded-full)',
              fontSize: 'var(--text-xs)', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              fontFamily: 'var(--font-heading)',
            }}>
              🎪 Saison 2026
            </span>
          </div>
        </div>
        <svg viewBox="0 0 480 64" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 56, marginBottom: -2 }}>
          <path d="M0,32 C80,64 160,8 260,36 C340,58 420,12 480,28 L480,64 L0,64 Z"
            fill="var(--papier)" />
        </svg>
      </div>

      {/* Formular */}
      <div className="page" style={{ paddingTop: 'var(--sp-6)' }}>
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

          <button
            type="submit"
            disabled={loading || !email || cooldown > 0}
            className="button"
            style={{ marginTop: 'var(--sp-2)' }}
          >
            {loading ? 'Wird gesendet...' : cooldown > 0 ? `Bitte warten (${cooldown}s)` : 'Login-Link anfordern →'}
          </button>
        </form>

        <p style={{
          textAlign: 'center', marginTop: 'var(--sp-6)',
          fontSize: 'var(--text-xs)', color: 'var(--grau-text)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Nur für angemeldete Goldeimer-Crew
        </p>
      </div>
    </div>
  )
}
