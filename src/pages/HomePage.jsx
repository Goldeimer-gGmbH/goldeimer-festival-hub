import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'

const ROLLE_LABEL = {
  lead: 'Lead',
  operator: 'Operator',
  supporti_plus: 'Supporti Plus',
  supporti: 'Supporti',
  catering: 'Catering'
}

export default function HomePage() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAssignments()
  }, [])

  async function loadAssignments() {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        id,
        role,
        status,
        festival:festivals(id, name, details)
      `)
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
        <span className="header-logo">🚽 Goldeimer</span>
        <Link to="/profil" style={{ textDecoration: 'none', fontSize: 22 }}>👤</Link>
      </div>

      <div className="page">
        {/* Begrüßung */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Hey {vorname}! 👋</h2>
          <p style={{ color: 'var(--grau-dunkel)', marginTop: 4, fontSize: 14 }}>
            Deine Festivals dieser Saison
          </p>
        </div>

        {loading && <div className="loading">Lädt...</div>}

        {!loading && assignments.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎪</div>
            <p className="card-sub">
              Noch keine Festivals zugewiesen. Melde dich bei Goldeimer wenn du denkst, dass hier etwas fehlt.
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
              style={{ textDecoration: 'none' }}
            >
              <div className="card" style={{ cursor: 'pointer', borderLeft: '4px solid var(--gelb)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="card-title">{a.festival.name}</div>
                    <div className="card-sub">
                      {town && <span>📍 {town}</span>}
                      {startDate && <span style={{ marginLeft: town ? 12 : 0 }}>📅 {formatDate(startDate)}</span>}
                    </div>
                  </div>
                  <span className={`badge badge-${a.role}`}>
                    {ROLLE_LABEL[a.role] || a.role}
                  </span>
                </div>
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--grau-dunkel)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Zum Festival-Hub →
                </div>
              </div>
            </Link>
          )
        })}

        {/* Globale Infos */}
        <div className="section-title">Allgemein</div>
        <Link to="/infos" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>📖</span>
              <div>
                <div className="card-title">Anleitungen & Infos</div>
                <div className="card-sub">Trockentoiletten, Abläufe, FAQ</div>
              </div>
            </div>
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
  } catch {
    return dateStr
  }
}
