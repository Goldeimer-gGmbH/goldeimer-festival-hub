import { Link } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'

const ROLLE_LABEL = {
  lead: 'Lead',
  operator: 'Operator',
  supporti_plus: 'Supporti Plus',
  supporti: 'Supporti',
  catering: 'Catering'
}

export default function ProfilPage() {
  const { profile, signOut } = useAuth()

  return (
    <div>
      <div className="header">
        <Link to="/" style={{ textDecoration: 'none', fontSize: 20, color: 'var(--schwarz)' }}>←</Link>
        <h1>Mein Profil</h1>
        <span style={{ width: 20 }} />
      </div>

      <div className="page" style={{ paddingTop: 16 }}>
        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--gelb)', margin: '0 auto 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, fontWeight: 700
          }}>
            {(profile?.full_name || profile?.email || '?')[0].toUpperCase()}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{profile?.full_name || 'Kein Name'}</h2>
          <p style={{ color: 'var(--grau-dunkel)', marginTop: 4 }}>{profile?.email}</p>
          {profile?.role && (
            <span className={`badge badge-${profile.role}`} style={{ marginTop: 8, display: 'inline-block' }}>
              {ROLLE_LABEL[profile.role] || profile.role}
            </span>
          )}
        </div>

        {/* Infos */}
        <div className="card">
          <div className="section-title" style={{ margin: '0 0 12px' }}>Meine Daten</div>
          <ul className="info-list">
            <li>
              <span className="info-icon">📧</span>
              <div>
                <div style={{ fontSize: 12, color: 'var(--grau-dunkel)' }}>E-Mail</div>
                <div style={{ fontSize: 14 }}>{profile?.email}</div>
              </div>
            </li>
            {profile?.experience_bucket && (
              <li>
                <span className="info-icon">⭐</span>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--grau-dunkel)' }}>Festival-Erfahrung</div>
                  <div style={{ fontSize: 14 }}>{profile.experience_bucket} Festivals</div>
                </div>
              </li>
            )}
            <li>
              <span className="info-icon">📝</span>
              <div>
                <div style={{ fontSize: 12, color: 'var(--grau-dunkel)' }}>Vertragsstatus</div>
                <div style={{ fontSize: 14 }}>
                  {profile?.contract_status === 'unterschrieben'
                    ? <span className="status-ok">✓ Unterschrieben</span>
                    : <span className="status-warn">⚠ Noch ausstehend</span>
                  }
                </div>
              </div>
            </li>
          </ul>
        </div>

        {/* Abmelden */}
        <div style={{ marginTop: 32 }}>
          <button className="btn btn-secondary" onClick={signOut}>
            Ausloggen
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--grau-dunkel)' }}>
          Goldeimer Festival Hub v0.1
        </p>
      </div>
    </div>
  )
}
