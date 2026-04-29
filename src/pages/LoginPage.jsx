import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const COOLDOWN_NORMAL    = 60          // Sekunden nach erfolgreichem Senden
const COOLDOWN_RATELIMIT = 10 * 60     // 10 Minuten nach Rate-Limit-Fehler
const STORAGE_KEY        = 'gfh_otp_cooldown_until'

// Verbleibende Sekunden aus gespeichertem Timestamp berechnen
function getStoredCooldown() {
  try {
    const until = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
    return Math.max(0, Math.ceil((until - Date.now()) / 1000))
  } catch { return 0 }
}

function saveCooldown(seconds) {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + seconds * 1000))
  } catch {}
}

function clearCooldown() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [isRateLimit, setIsRateLimit] = useState(false)
  // Beim Laden: noch laufenden Countdown aus localStorage wiederherstellen
  const [cooldown, setCooldown] = useState(() => getStoredCooldown())
  const timerRef = useRef(null)

  // Countdown-Timer — läuft auch nach Seiten-Reload weiter
  useEffect(() => {
    if (cooldown <= 0) { clearCooldown(); return }
    timerRef.current = setTimeout(() => setCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearTimeout(timerRef.current)
  }, [cooldown])

  function startCooldown(seconds) {
    saveCooldown(seconds)
    setCooldown(seconds)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (cooldown > 0) return
    setLoading(true)
    setError('')
    setIsRateLimit(false)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      })
      if (error) {
        if (error.message?.includes('not found') || error.message?.includes('user')) {
          setError('Diese E-Mail ist nicht in unserem System. Wende dich an Goldeimer.')
        } else if (error.message?.includes('rate') || error.status === 429) {
          setIsRateLimit(true)
          setError('Zu viele Versuche. Bitte warte 10 Minuten bevor du es erneut versuchst.')
          startCooldown(COOLDOWN_RATELIMIT)
        } else if (error.message?.includes('network') || error.status >= 500) {
          setError('Server nicht erreichbar. Bitte versuche es gleich nochmal.')
        } else {
          setError(`Fehler: ${error.message || 'Unbekannter Fehler'}`)
        }
      } else {
        setSent(true)
        startCooldown(COOLDOWN_NORMAL)
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
    setIsRateLimit(false)
  }

  // Countdown lesbar formatieren: ab 60s als "X:XX min" anzeigen
  function fmtCooldown(s) {
    if (s >= 60) {
      const m = Math.floor(s / 60)
      const sec = s % 60
      return `${m}:${String(sec).padStart(2, '0')} min`
    }
    return `${s}s`
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
            {cooldown > 0 ? `Nochmal senden (${fmtCooldown(cooldown)})` : 'Nochmal senden'}
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
          <p style={{ color: 'var(--papier)', marginTop: 4, marginBottom: 6, fontSize: 'var(--text-h3)', fontWeight: 700 }}>
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
              Saison 2026
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
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--grau-text)', marginBottom: 'var(--sp-4)', lineHeight: 1.6 }}>
          Gib die E-Mail-Adresse ein, die du bereits bei der Festivalanmeldung genutzt hast. Wir schicken dir per Mail einen Magic Link zu. Kein Passwort nötig.
        </p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--grau-text)', marginBottom: 'var(--sp-6)', lineHeight: 1.6 }}>
          Beachte: In das Goldeimer Festival Hub gelangst du nur, wenn du mindestens eine Festivalzusage in der aktuellen Saison hast.
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
            {loading
              ? 'Wird gesendet...'
              : cooldown > 0
                ? `Bitte warten (${fmtCooldown(cooldown)})`
                : 'Login-Link anfordern →'}
          </button>
        </form>

        {/* Footer – Full-Bleed */}
        <div style={{
          marginTop: 'var(--sp-10)',
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
        }}>
          <svg viewBox="0 0 480 64" preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: 56, marginBottom: -2 }}>
            <path d="M0,36 C80,8 180,56 280,24 C360,4 420,48 480,28 L480,64 L0,64 Z"
              fill="var(--schwarz)" />
          </svg>
          <div style={{
            background: 'var(--schwarz)',
            padding: 'var(--sp-5) var(--sp-4)',
            textAlign: 'center',
          }}>
            <p style={{ color: 'var(--on-dark-sub)', fontSize: 'var(--text-xs)' }}>
              © Goldeimer gGmbH · Kacke für den guten Zweck 💛
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
