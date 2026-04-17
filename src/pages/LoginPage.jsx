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
      options: {
        shouldCreateUser: false // Nur bestehende Crew-Mitglieder können sich einloggen
      }
    })

    if (error) {
      setError('Diese E-Mail-Adresse ist nicht registriert. Bitte wende dich an Goldeimer.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 24 }}>📬</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Check deine E-Mails!</h2>
        <p style={{ color: 'var(--grau-dunkel)', fontSize: 15, lineHeight: 1.6, maxWidth: 300 }}>
          Wir haben dir einen Login-Link an <strong>{email}</strong> geschickt. Klick auf den Link um dich einzuloggen.
        </p>
        <p style={{ marginTop: 24, fontSize: 13, color: 'var(--grau-dunkel)' }}>
          Kein Link angekommen?{' '}
          <button
            onClick={() => setSent(false)}
            style={{ background: 'none', border: 'none', color: 'var(--schwarz)', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}
          >
            Nochmal versuchen
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 80,
          height: 80,
          background: 'var(--gelb)',
          borderRadius: 20,
          fontSize: 40,
          marginBottom: 16
        }}>
          🚽
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>Goldeimer Hub</h1>
        <p style={{ color: 'var(--grau-dunkel)', marginTop: 6, fontSize: 15 }}>
          Dein Festival-Begleiter
        </p>
      </div>

      {/* Login Form */}
      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Einloggen</h2>
        <p style={{ fontSize: 14, color: 'var(--grau-dunkel)', marginBottom: 20, lineHeight: 1.5 }}>
          Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link zum Einloggen – kein Passwort nötig.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
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
            <p style={{ color: 'var(--rot)', fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
              {error}
            </p>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading || !email}>
            {loading ? 'Wird gesendet...' : 'Login-Link anfordern'}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--grau-dunkel)' }}>
        Nur für angemeldete Goldeimer-Crew
      </p>
    </div>
  )
}
