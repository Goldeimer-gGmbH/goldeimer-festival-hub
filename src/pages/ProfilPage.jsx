import { Link } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import { IconStar, IconBrief } from '../components/Icons'

export default function ProfilPage() {
  const { profile, signOut } = useAuth()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--schwarz)' }}>
      {/* Header */}
      <div className="header">
        <Link to="/" style={{ textDecoration: 'none', fontSize: 20, color: 'var(--schwarz)', fontWeight: 700 }}>←</Link>
        <span className="header-logo" style={{ fontSize: '0.9rem' }}>Mein Profil</span>
        <span style={{ width: 20 }} />
      </div>

      {/* Schwarzes Banner mit Name */}
      <div style={{ background: 'var(--schwarz)', width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-6) var(--sp-4) 0' }}>
          <div className="statement" style={{ fontSize: 'var(--text-h0)', color: 'var(--gelb)', lineHeight: 1 }}>
            {profile?.full_name || 'Kein Name'}
          </div>
          <div style={{ paddingBottom: 'var(--sp-5)' }} />
        </div>
        {/* Welle: Schwarz → Papier */}
        <svg viewBox="0 0 480 64" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 56, marginBottom: -2, background: 'var(--papier)' }}>
          <path d="M0,0 L480,0 L480,32 C400,64 320,8 220,36 C140,58 60,12 0,28 Z"
            fill="var(--schwarz)" />
        </svg>
      </div>

      {/* Inhalt */}
      <div style={{ flex: 1, background: 'var(--papier)', padding: 'var(--sp-6) var(--sp-4) var(--sp-10)' }}>
        <div className="section-title">Meine Daten</div>
        <div className="card">
          <ul className="info-list">
            <li>
              <span className="info-icon"><IconBrief size={22}/></span>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grau-text)', marginBottom: 3 }}>E-Mail</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{profile?.email}</div>
              </div>
            </li>
            {profile?.experience_bucket && (
              <li>
                <span className="info-icon"><IconStar size={22}/></span>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grau-text)', marginBottom: 3 }}>Festival-Erfahrung</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{profile.experience_bucket} Festivals</div>
                </div>
              </li>
            )}
          </ul>
        </div>

        <div style={{ marginTop: 'var(--sp-8)' }}>
          <button
            onClick={signOut}
            style={{
              width: '100%',
              padding: '14px var(--sp-6)',
              background: 'var(--rot)',
              color: 'var(--weiss)',
              border: 'none',
              borderRadius: 'var(--rounded-button)',
              fontSize: 'var(--text-base)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              letterSpacing: '0.04em',
              cursor: 'pointer',
            }}
          >
            Ausloggen
          </button>
        </div>
      </div>

      {/* Footer: Welle Papier → Schwarz */}
      <div style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
        <svg viewBox="0 0 480 64" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 56, marginBottom: -2, background: 'var(--papier)' }}>
          <path d="M0,36 C80,8 180,56 280,24 C360,4 420,48 480,28 L480,64 L0,64 Z"
            fill="var(--schwarz)" />
        </svg>
        <div style={{ background: 'var(--schwarz)', padding: 'var(--sp-5) var(--sp-4)', textAlign: 'center' }}>
          <p style={{ color: 'var(--on-dark-sub)', fontSize: 'var(--text-xs)' }}>
            Goldeimer Festival Hub · Vol. 1
          </p>
        </div>
      </div>
    </div>
  )
}
