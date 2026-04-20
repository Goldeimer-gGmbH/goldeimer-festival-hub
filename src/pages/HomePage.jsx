import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'

const ROLLE_LABEL = {
  lead: 'Lead',
  operator: 'Operator',
  supporti_plus: 'Supporti+',
  supporti: 'Supporti',
  catering: 'Catering'
}

export default function HomePage() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAssignments() }, [])

  async function loadAssignments() {
    const { data, error } = await supabase
      .from('assignments')
      .select(`id, role, status, festival:festivals(id, name, details)`)
      .eq('profile_id', profile.id)
      .in('status', ['zugesagt', 'akkreditiert', 'teilgenommen'])
      .order('created_at', { ascending: true })
    if (!error && data) setAssignments(data)
    setLoading(false)
  }

  const vorname = profile?.full_name?.split(' ')[0] || 'Hey'

  return (
    <div>
      <div className="header">
        <span className="header-logo">🚽 GOLDEIMER</span>
        <Link to="/profil" style={{ textDecoration: 'none', fontSize: 22 }}>👤</Link>
      </div>

      {/* Greeting Banner */}
      <div style={{
        background: 'var(--schwarz)',
        padding: '20px 16px 18px',
        borderBottom: '3px solid var(--schwarz)',
      }}>
        <div className="display" style={{ fontSize: 40, color: 'var(--gelb)', lineHeight: 1 }}>
          HEY {vorname.toUpperCase()}! 👋
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 6, fontSize: 13, fontWeight: 500 }}>
          Deine Festivals dieser Saison
        </p>
      </div>

      <div className="page" style={{ paddingTop: 20 }}>
        {loading && (
          <>
            {[1, 2].map(i => (
              <div key={i} style={{
                background: 'var(--schwarz)', borderRadius: 'var(--radius)',
                padding: '18px 16px', border: '2px solid var(--schwarz)',
                boxShadow: 'var(--shadow)', marginBottom: 14, opacity: 0.15 + i * 0.1,
              }}>
                <div style={{ height: 28, width: '60%', background: 'var(--gelb)', borderRadius: 4, marginBottom: 10 }} />
                <div style={{ height: 12, width: '40%', background: 'rgba(255,255,255,0.3)', borderRadius: 4 }} />
              </div>
            ))}
          </>
        )}

        {!loading && assignments.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎪</div>
            <p className="card-sub">
              Noch keine Festivals zugewiesen. Melde dich bei Goldeimer.
            </p>
          </div>
        )}

        {assignments.map(a => {
          const details = a.festival?.details || {}
          const startDate = details.start_official || details.start_supp || ''
          const town = details.festival_town || ''

          return (
            <Link
              key={a.id}
              to={`/festival/${a.festival.id}`}
              className="festival-card"
            >
              {/* Role Badge */}
              <div className="festival-card-badge">
                <span className={`badge badge-${a.role}`}>
                  {ROLLE_LABEL[a.role] || a.role}
                </span>
              </div>

              {/* Name */}
              <div className="festival-card-name">{a.festival.name}</div>

              {/* Meta */}
              <div className="festival-card-meta">
                {town && <span>📍 {town}</span>}
                {startDate && <span>📅 {formatDate(startDate)}</span>}
                <span style={{ marginLeft: 'auto', color: 'var(--gelb)', fontWeight: 700, fontSize: 11 }}>
                  Details →
                </span>
              </div>
            </Link>
          )
        })}

        {/* Allgemein */}
        <div className="section-title">Allgemein</div>
        <Link to="/infos" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, background: 'var(--gelb)',
              borderRadius: 6, border: '2px solid var(--schwarz)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0,
            }}>
              📖
            </div>
            <div>
              <div className="card-title">Anleitungen & Infos</div>
              <div className="card-sub">Trockentoiletten, Abläufe, FAQ</div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 18, color: 'var(--grau-text)' }}>→</span>
          </div>
        </Link>
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d)) return dateStr
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return dateStr }
}
