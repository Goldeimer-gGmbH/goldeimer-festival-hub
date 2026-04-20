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
        <span className="header-logo" style={{ fontSize: 17 }}>MEIN PROFIL</span>
        <span style={{ width: 20 }} />
      </div>

      {/* ID Card Hero */}
      <div style={{
        background: 'var(--schwarz)',
        borderBottom: '3px solid var(--schwarz)',
        padding: '28px 20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* Avatar */}
          <div style={{
            width: 70, height: 70, borderRadius: 8,
            background: 'var(--gelb)',
            border: '3px solid var(--gelb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 36, color: 'var(--schwarz)',
            flexShrink: 0,
          }}>
            {initial}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="display" style={{ fontSize: 26, color: 'var(--gelb)', lineHeight: 1.1 }}>
              {(profile?.full_name || 'Kein Name').toUpperCase()}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.email}
            </div>
            {profile?.role && (
              <span className={`badge badge-${profile.role}`} style={{ marginTop: 8, display: 'inline-block' }}>
                {ROLLE_LABEL[profile.role] || profile.role}
              </span>
            )}
          </div>
        </div>

        {/* Crew Badge */}
        <div style={{
          marginTop: 18,
          background: 'rgba(255,229,0,0.08)',
          border: '1px solid rgba(255,229,0,0.2)',
          borderRadius: 6,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>🎪</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Goldeimer Crew — Saison 2025
          </span>
        </div>
      </div>

      <div className="page" style={{ paddingTop: 20 }}>

        {/* Daten */}
        <div className="section-title">Meine Daten</div>
        <div className="card">
          <ul className="info-list">
            <li>
              <span className="info-icon">📧</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grau-text)', marginBottom: 3 }}>E-Mail</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{profile?.email}</div>
              </div>
            </li>
            {profile?.experience_bucket && (
              <li>
                <span className="info-icon">⭐</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grau-text)', marginBottom: 3 }}>Festival-Erfahrung</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{profile.experience_bucket} Festivals</div>
                </div>
              </li>
            )}
            <li>
              <span className="info-icon">📝</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grau-text)', marginBottom: 3 }}>Vertragsstatus</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {profile?.contract_status === 'unterschrieben'
                    ? <span className="status-ok">✓ Unterschrieben</span>
                    : <span className="status-warn">⚠ Noch ausstehend</span>
                  }
                </div>
              </div>
            </li>
          </ul>
        </div>

        {/* Logout */}
        <div style={{ marginTop: 32 }}>
          <button className="btn btn-secondary" onClick={signOut}>
            Ausloggen
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 10, color: 'var(--grau-text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Goldeimer Festival Hub · v0.1
        </p>
      </div>
    </div>
  )
}
