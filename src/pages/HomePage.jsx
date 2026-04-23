import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import { cacheGet, cacheSet } from '../lib/cache'

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
    const cacheKey = `assignments_${profile.id}`

    // Gecachte Daten sofort anzeigen → keine Ladespinner beim Navigieren
    const cached = cacheGet(cacheKey)
    if (cached) {
      setAssignments(cached)
      setLoading(false)
    }

    const { data, error } = await supabase
      .from('assignments')
      .select(`id, role, status, festival:festivals(id, name, details)`)
      .eq('profile_id', profile.id)
      .in('status', ['zugesagt', 'akkreditiert', 'teilgenommen'])
      .order('created_at', { ascending: true })
    if (!error && data) {
      setAssignments(data)
      cacheSet(cacheKey, data, 30 * 60 * 1000)   // 30 Min TTL
    }
    setLoading(false)
  }

  const vorname = profile?.full_name?.split(' ')[0] || 'Hey'

  return (
    <div>
      <div className="header">
        <img src="/goldeimer-logo.png" alt="Goldeimer" style={{ height: 36 }} />
        <Link to="/profil" style={{ textDecoration: 'none', color: 'var(--schwarz)', display: 'flex', alignItems: 'center' }}>
          <img src="/icon-account.svg" alt="Profil" style={{ width: 26, height: 26 }} />
        </Link>
      </div>

      {/* Greeting Banner */}
      <div style={{
        background: 'var(--schwarz)',
        padding: 'var(--sp-6) var(--sp-4) var(--sp-5)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div className="statement" style={{ fontSize: 'var(--text-h0)', color: 'var(--gelb)', lineHeight: 1 }}>
          Hey {vorname}!
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
          const town = details.festival_town || ''
          const start = getRoleStart(a.role, details)
          const end   = getRoleEnd(a.role, details)

          return (
            <Link key={a.id} to={`/festival/${a.festival.id}`} className="festival-card">
              <div className="festival-card-header">
                <div className="festival-card-name">{a.festival.name}</div>
                <span className="festival-card-role">{ROLLE_LABEL[a.role] || a.role}</span>
              </div>
              <div className="festival-card-meta">
                {formatDateRange(start, end)}{town ? ` | ${town}` : ''}
              </div>
              <div className="festival-card-footer">
                <span className="festival-card-arrow">Details →</span>
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

function getRoleStart(role, details) {
  if (role === 'supporti_plus') return details.start_setup
  if (role === 'supporti')      return details.start_supp
  if (role === 'lead' || role === 'operator') return details.start_leadop
  if (role === 'catering')      return details.start_kitchen
  return details.start_official || details.start_supp
}

function getRoleEnd(role, details) {
  if (role === 'supporti_plus') return details.end_takedown || details.end_official
  if (role === 'supporti')      return details.end_supp     || details.end_official
  if (role === 'lead' || role === 'operator') return details.end_leadop || details.end_official
  if (role === 'catering')      return details.end_kitchen  || details.end_official
  return details.end_official
}

function formatDateRange(startStr, endStr) {
  if (!startStr) return ''
  try {
    const s = new Date(startStr)
    if (isNaN(s)) return startStr
    const startFmt = s.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    if (!endStr) return startFmt + '.'
    const e = new Date(endStr)
    if (isNaN(e)) return startFmt + '.'
    const endFmt = e.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    return `${startFmt} – ${endFmt}`
  } catch { return startStr }
}
