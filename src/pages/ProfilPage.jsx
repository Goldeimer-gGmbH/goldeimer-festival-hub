import { Link } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'

const ROLLE_LABEL = {
  lead: 'Lead', operator: 'Operator',
  supporti_plus: 'Supporti+', supporti: 'Supporti', catering: 'Catering'
}

export default function ProfilPage() {
  const { profile, signOut } = useAuth()
  const initial = (profile?.full_name || profile?.email || '?')[0].toUpperCase()

  return (
    <div>
      <div className="header">
        <Link to="/" style={{ textDecoration: 'none', fontSize: 20, color: 'var(--schwarz)', fontWeight: 700 }}>←</Link>
        <span className="header-logo" style={{ fontSize: '0.9rem' }}>Mein Profil</span>
        <span style={{ width: 20 }} />
      </div>

      {/* ID Card Hero */}
      <div style={{
        background: 'var(--schwarz)',
        borderBottom: '1px solid var(--on-dark-border)',
        padding: 'var(--sp-6) var(--sp-5) var(--sp-5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-5)' }}>
          <div style={{
            width: 70, height: 70, borderRadius: 'var(--rounded)',
            background: 'var(--gelb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-statement)', fontSize: 36, color: 'var(--schwarz)', flexShrink: 0,
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="statement" style={{ fontSize: 'var(--text-h2)', color: 'var(--gelb)', lineHeight: 1.1 }}>
              {(profile?.full_name || 'Kein Name')}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--on-dark-sub)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.email}
            </div>
            {profile?.role && (
              <span className={`badge badge-${profile.role}`} style={{ marginTop: 8, display: 'inline-block' }}>
                {ROLLE_LABEL[profile.role] || profile.role}
              </span>
            )}
          </div>
        </div>

        <div style={{
          marginTop: 'var(--sp-5)',
          background: 'rgba(255,229,0,0.06)',
          border: '1px solid rgba(255,229,0,0.15)',
          borderRadius: 'var(--rounded-input)',
          padding: 'var(--sp-3) var(--sp-4)',
          display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
        }}>
          <span style={{ fontSize: 14 }}>🎪</span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--on-dark-sub)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            Goldeimer Crew — Saison 2025
          </span>
        </div>
      </div>

      <div className="page" style={{ paddingTop: 'var(--sp-5)' }}>
        <div className="section-title">Meine Daten</div>
        <div className="card">
          <ul className="info-list">
            <li>
              <span className="info-icon">📧</span>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grau-text)', marginBottom: 3 }}>E-Mail</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{profile?.email}</div>
              </div>
            </li>
            {profile?.experience_bucket && (
              <li>
                <span className="info-icon">⭐</span>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grau-text)', marginBottom: 3 }}>Festival-Erfahrung</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{profile.experience_bucket} Festivals</div>
                </div>
              </li>
            )}
            <li>
              <span className="info-icon">📝</span>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grau-text)', marginBottom: 3 }}>Vertragsstatus</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {profile?.contract_status === 'unterschrieben'
                    ? <span className="status-ok">✓ Unterschrieben</span>
                    : <span className="status-warn">⚠ Noch ausstehend</span>
                  }
                </div>
              </div>
            </li>
          </ul>
        </div>

        <div style={{ marginTop: 'var(--sp-8)' }}>
          <button className="button button--secondary" onClick={signOut}>Ausloggen</button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--sp-6)', fontSize: 'var(--text-xs)', color: 'var(--grau-text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Goldeimer Festival Hub · v0.1
        </p>
      </div>
    </div>
  )
}
