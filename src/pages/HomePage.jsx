import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'

const ROLLE_LABEL = {
  lead: 'Lead', operator: 'Operator',
  supporti_plus: 'Supporti+', supporti: 'Supporti', catering: 'Catering'
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
        <img src="/goldeimer-logo.png" alt="Goldeimer" style={{ height: 36 }} />
        <Link to="/profil" style={{ textDecoration: 'none', fontSize: 22 }}>👤</Link>
      </div>

      {/* Greeting Banner */}
      <div style={{
        background: 'var(--schwarz)',
        padding: 'var(--sp-6) var(--sp-4) var(--sp-5)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div className="statement" style={{ fontSize: 'var(--text-h0)', color: 'var(--gelb)', lineHeight: 1 }}>
          Hey {vorname}! 👋
        </div>
        <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 6, fontSize: 'var(--text-sm)', fontWeight: 500 }}>
          Deine Festivals dieser Saison
        </p>
      </div>

      <div className="page" style={{ paddingTop: 'var(--sp-5)' }}>
        {loading && (
          <>
            {[1, 2].map(i => (
              <div key={i} style={{
                background: 'var(--schwarz)', borderRadius: 'var(--rounded-lg)',
                padding: 'var(--sp-5) var(--sp-4)', marginBottom: 'var(--sp-4)',
                opacity: 0.15 + i * 0.1,
              }}>
                <div style={{ height: 28, width: '60%', background: 'var(--gelb)', borderRadius: 'var(--rounded-xs)', marginBottom: 10 }} />
                <div style={{ height: 12, width: '40%', background: 'rgba(255,255,255,0.3)', borderRadius: 'var(--rounded-xs)' }} />
              </div>
            ))}
          </>
        )}

        {!loading && assignments.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎪</div>
            <p className="card-sub">Noch keine Festivals zugewiesen. Melde dich bei Goldeimer.</p>
          </div>
        )}

        {assignments.map(a => {
          const details = a.festival?.details || {}
          const startDate = details.start_official || details.start_supp || ''
          const town = details.festival_town || ''

          return (
            <Link key={a.id} to={`/festival/${a.festival.id}`} className="festival-card">
              <div className="festival-card-badge">
                <span className={`badge badge-${a.role}`}>{ROLLE_LABEL[a.role] || a.role}</span>
              </div>
              <div className="festival-card-name">{a.festival.name}</div>
              <div className="festival-card-meta">
                {town && <span>📍 {town}</span>}
                {startDate && <span>📅 {formatDate(startDate)}</span>}
                <span style={{ marginLeft: 'auto', color: 'var(--gelb)', fontWeight: 700, fontSize: 'var(--text-xs)' }}>Details →</span>
              </div>
            </Link>
          )
        })}

        <div className="section-title">Allgemein</div>
        <Link to="/infos" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
            <div style={{
              width: 48, height: 48, background: 'var(--gelb)',
              borderRadius: 'var(--rounded)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>📖</div>
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
