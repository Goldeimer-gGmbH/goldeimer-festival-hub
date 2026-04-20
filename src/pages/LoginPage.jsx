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
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false }
    })
    if (error) {
      setError('Diese E-Mail ist nicht registriert. Wende dich an Goldeimer.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          background: 'var(--gelb)',
          borderBottom: '3px solid var(--schwarz)',
          padding: '60px 24px 48px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 64, lineHeight: 1 }}>📬</div>
          <div className="display" style={{ fontSize: 52, marginTop: 16, color: 'var(--schwarz)' }}>
            CHECK DEINE MAILS!
          </div>
        </div>
        <div style={{ padding: '32px 24px', flex: 1, background: 'var(--papier)' }}>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--grau-text)' }}>
            Login-Link an <strong style={{ color: 'var(--schwarz)' }}>{email}</strong> geschickt.
            Kein Passwort nötig – einfach auf den Link klicken.
          </p>
          <button
            onClick={() => setSent(false)}
            className="btn btn-secondary"
            style={{ marginTop: 28 }}
          >
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
        borderBottom: '3px solid var(--schwarz)',
        padding: '52px 24px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative diagonal stripe */}
        <div style={{
          position: 'absolute',
          bottom: -20,
          right: -20,
          width: 140,
          height: 140,
          background: 'var(--schwarz)',
          opacity: 0.06,
          transform: 'rotate(20deg)',
          borderRadius: 8,
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex',
            width: 72,
            height: 72,
            background: 'var(--schwarz)',
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            marginBottom: 18,
            border: '2px solid var(--schwarz)',
          }}>
            🚽
          </div>
          <div className="display" style={{ fontSize: 58, color: 'var(--schwarz)', marginBottom: 6 }}>
            GOLDEIMER
          </div>
          <div className="display" style={{ fontSize: 34, color: 'var(--schwarz)', opacity: 0.6 }}>
            FESTIVAL HUB
          </div>
          <div style={{
            marginTop: 14,
            display: 'inline-block',
            background: 'var(--schwarz)',
            color: 'var(--gelb)',
            padding: '4px 10px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            🎪 Saison 2025
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '32px 20px', flex: 1, background: 'var(--papier)' }}>
        <div className="display" style={{ fontSize: 32, marginBottom: 6 }}>EINLOGGEN</div>
        <p style={{ fontSize: 14, color: 'var(--grau-text)', marginBottom: 28, lineHeight: 1.6 }}>
          Gib deine E-Mail ein – wir schicken dir einen Magic Link. Kein Passwort nötig.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 7,
              color: 'var(--grau-text)',
            }}>
              E-Mail-Adresse
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '13px 14px',
                border: '2px solid var(--schwarz)',
                borderRadius: 'var(--radius)',
                fontSize: 16,
                fontFamily: 'Outfit, sans-serif',
                background: 'var(--weiss)',
                color: 'var(--schwarz)',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#FFF0ED',
              border: '2px solid var(--rot)',
              borderRadius: 'var(--radius)',
              padding: '11px 14px',
              fontSize: 13,
              color: 'var(--rot)',
              fontWeight: 600,
              lineHeight: 1.5,
            }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="btn btn-black"
            style={{ marginTop: 4 }}
          >
            {loading ? 'Wird gesendet...' : 'Login-Link anfordern →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 11, color: 'var(--grau-text)', letterSpacing: '0.05em' }}>
          NUR FÜR ANGEMELDETE GOLDEIMER-CREW
        </p>
      </div>
    </div>
  )
}
