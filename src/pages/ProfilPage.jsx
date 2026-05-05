import { Link } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import { IconStar, IconBrief } from '../components/Icons'

export default function ProfilPage() {
  const { profile, signOut } = useAuth()

  return (
    <div>
      <div className="header">
        <Link to="/" style={{ textDecoration: 'none', fontSize: 20, color: 'var(--schwarz)', fontWeight: 700 }}>←</Link>
        <span className="header-logo" style={{ fontSize: '0.9rem' }}>Mein Profil</span>
        <span style={{ width: 20 }} />
      </div>

      {/* Banner – nur Name */}
      <div style={{
        background: 'var(--schwarz)',
        borderBottom: '1px solid var(--on-dark-border)',
        padding: 'var(--sp-6) var(--sp-5) var(--sp-6)',
      }}>
        <div className="statement" style={{ fontSize: 'var(--text-h1)', color: 'var(--gelb)', lineHeight: 1.1 }}>
          {profile?.full_name || 'Kein Name'}
        </div>
      </div>

      <div className="page" style={{ paddingTop: 'var(--sp-5)' }}>
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

        <p style={{ textAlign: 'center', marginTop: 'var(--sp-6)', fontSize: 'var(--text-xs)', color: 'var(--grau-text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Goldeimer Festival Hub · Vol. 1
        </p>
      </div>
    </div>
  )
}
