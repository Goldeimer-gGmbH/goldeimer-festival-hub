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

function IconBrief({ size = 64 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"
      width={size} height={size} style={{ display: 'block' }}
      fill="var(--schwarz)">
      <path d="M25.3,11.37l-.18-4.08s-.01-.01,0-.02c.02-.14.01-.29-.05-.43-.12-.28-.36-.44-.71-.46l-13.14.29h-.04l-7.46-.29c-.32,0-.61.18-.72.48-.04.11-.06.22-.04.32t0,.02s-.01.1-.01.16l.21,4.66-.22,4.94v3.9c0,.2.09.4.23.54s.33.21.52.21h.02l7.56-.14,8.05.14h5.06c.2,0,.39-.08.53-.23.14-.14.22-.34.21-.54l-.17-5.19.35-4.28ZM4.44,16.99l.22-4.98-.15-3.2,2.42,2.04,2.21,2.5.92.88-5.62,5.34v-2.58ZM19.34,20.11l-8.07-.14-6.14.12,5.55-5.28,2.84,2.7c.14.13.33.2.51.2.19,0,.37-.06.51-.2l2.88-2.67,5.54,5.27h-3.62ZM23.81,11.34l-.35,4.27.12,3.92-5.53-5.27,2.62-2.43,3.03-2.98.11,2.49ZM12.93,8.23l5.18-.16h4.24l-2.72,2.68-2.67,2.48-.63.58-2.29,2.12-2.27-2.16-.62-.58-.93-.89-2.2-2.48s-.05-.05-.08-.08l-1.97-1.67h2.38l2.75.1h.11l1.72.06Z"/>
    </svg>
  )
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

  // PWA-Fix: Wenn Bildschirm wieder aktiv wird, Restzeit neu aus localStorage lesen.
  // setTimeout wird auf Mobile im Hintergrund gedrosselt — dadurch läuft der
  // angezeigte Countdown langsamer als die echte Zeit. Beim Zurückkehren
  // sofort korrigieren statt den falschen Wert weiterlaufen zu lassen.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setCooldown(getStoredCooldown())
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

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

  // Gemeinsame Struktur: schwarzer Außenrahmen füllt immer den ganzen Screen
  const PageShell = ({ bannerHeadline, bannerSubtitle, bannerSub, bannerExtra, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--schwarz)' }}>
      {/* Header */}
      <div className="header">
        <img src="/goldeimer-logo.png" alt="Goldeimer" style={{ height: 36 }} />
      </div>

      {/* Schwarzes Banner */}
      <div style={{ background: 'var(--schwarz)', width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-6) var(--sp-4) 0' }}>
          <div className="statement" style={{ fontSize: 'var(--text-h0)', color: 'var(--gelb)', lineHeight: 1 }}>
            {bannerHeadline}
          </div>
          {bannerSubtitle && (
            <p style={{ color: 'var(--papier)', marginTop: 4, marginBottom: 0, fontSize: 'var(--text-h3)', fontWeight: 700 }}>
              {bannerSubtitle}
            </p>
          )}
          {bannerSub && (
            <p style={{ color: 'var(--on-dark-sub)', marginTop: 6, marginBottom: 6, fontSize: 'var(--text-sm)', fontWeight: 500 }}>
              {bannerSub}
            </p>
          )}
          {bannerExtra}
        </div>
        {/* Welle: Schwarz → Papier. SVG-Background ist Papier damit die Wellenform sichtbar ist. */}
        <svg viewBox="0 0 480 64" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 56, marginBottom: -2, background: 'var(--papier)' }}>
          <path d="M0,0 L480,0 L480,32 C400,64 320,8 220,36 C140,58 60,12 0,28 Z"
            fill="var(--schwarz)" />
        </svg>
      </div>

      {/* Inhalt – wächst um verbleibenden Platz zu füllen */}
      <div style={{ flex: 1, background: 'var(--papier)', padding: 'var(--sp-6) var(--sp-4) var(--sp-10)' }}>
        {children}
      </div>

      {/* Footer – Welle Papier→Schwarz. SVG-Background ist Papier. Danach nur noch Schwarz. */}
      <div style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
        <svg viewBox="0 0 480 64" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 56, marginBottom: -2, background: 'var(--papier)' }}>
          <path d="M0,36 C80,8 180,56 280,24 C360,4 420,48 480,28 L480,64 L0,64 Z"
            fill="var(--schwarz)" />
        </svg>
        <div style={{ background: 'var(--schwarz)', padding: 'var(--sp-5) var(--sp-4)', textAlign: 'center' }}>
          <p style={{ color: 'var(--on-dark-sub)', fontSize: 'var(--text-xs)' }}>© Goldeimer gGmbH</p>
        </div>
      </div>
    </div>
  )

  /* ── Bestätigung: Magic Link wurde verschickt ── */
  if (sent) {
    return (
      <PageShell bannerHeadline="Check deine Mails!">
        <div style={{
          background: 'var(--weiss)', borderRadius: 'var(--rounded)',
          padding: 'var(--sp-6)', boxShadow: 'var(--shadow-sm)',
          textAlign: 'center', marginBottom: 'var(--sp-4)',
        }}>
          <div style={{ marginBottom: 'var(--sp-4)', display: 'flex', justifyContent: 'center' }}>
            <IconBrief size={64} />
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--grau-text)', marginBottom: 4 }}>
            Login-Link geschickt an
          </p>
          <p style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--schwarz)', marginBottom: 'var(--sp-4)' }}>
            {email}
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--grau-text)', lineHeight: 1.6 }}>
            Einfach auf den Link klicken – kein Passwort nötig.
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
      </PageShell>
    )
  }

  /* ── Login-Formular ── */
  return (
    <PageShell
      bannerHeadline="Goldeimer"
      bannerSubtitle="Festival Hub"
      bannerExtra={
        <div style={{ paddingBottom: 'var(--sp-5)', marginTop: 'var(--sp-3)' }}>
          <span style={{
            display: 'inline-block',
            background: 'var(--rot)', color: 'var(--weiss)',
            padding: '4px 12px', borderRadius: 'var(--rounded-full)',
            fontSize: 'var(--text-xs)', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            fontFamily: 'var(--font-heading)',
          }}>
            Saison 2026
          </span>
        </div>
      }
    >
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
    </PageShell>
  )
}
