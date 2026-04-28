import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import { cacheGet, cacheSet } from '../lib/cache'
import { fetchWithTimeout } from '../lib/fetchWithTimeout'

const ROLLE_LABEL = {
  lead: 'Lead', operator: 'Operator',
  supporti_plus: 'Supporti+', supporti: 'Supporti', catering: 'Catering'
}

export default function HomePage() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => { loadAssignments() }, [])

  async function loadAssignments() {
    const cacheKey = `assignments_${profile.id}`
    setFetchError(false)

    const cached = cacheGet(cacheKey)
    if (cached) { setAssignments(cached); setLoading(false) }

    const { data, error } = await fetchWithTimeout(
      supabase.from('assignments')
        .select(`id, role, status, festival:festivals(id, name, details)`)
        .eq('profile_id', profile.id)
        .in('status', ['zugesagt', 'akkreditiert', 'teilgenommen'])
    )
    if (!error && data) {
      setAssignments(data)
      cacheSet(cacheKey, data, 30 * 60 * 1000)
    } else if (error && !cached) {
      setFetchError(true)
    }
    setLoading(false)
  }

  const vorname = profile?.full_name?.split(' ')[0] || 'Hey'
  const isLeadOrOp = profile?.role === 'lead' || profile?.role === 'operator'

  // Festivals nach Startdatum sortieren, vergangene ans Ende
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sorted = [...assignments].sort((a, b) => {
    const aEnd = parseDeDate(getRoleEnd(a.role, a.festival?.details || {}))
    const bEnd = parseDeDate(getRoleEnd(b.role, b.festival?.details || {}))
    const aStart = parseDeDate(getRoleStart(a.role, a.festival?.details || {}))
    const bStart = parseDeDate(getRoleStart(b.role, b.festival?.details || {}))
    const aPast = aEnd ? aEnd < today : false
    const bPast = bEnd ? bEnd < today : false
    if (aPast !== bPast) return aPast ? 1 : -1   // vergangene ans Ende
    return (aStart || 0) - (bStart || 0)          // sonst chronologisch
  })

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
        borderBottom: '1px solid var(--on-dark-border)',
      }}>
        <div className="statement" style={{ fontSize: 'var(--text-h0)', color: 'var(--gelb)', lineHeight: 1 }}>
          Hey {vorname}!
        </div>
        <p style={{ color: 'var(--on-dark-sub)', marginTop: 6, fontSize: 'var(--text-sm)', fontWeight: 500 }}>
          Deine Festivals 2026 mit Goldeimer
        </p>
      </div>

      <div className="page" style={{ paddingTop: 'var(--sp-5)' }}>

        {/* Skeleton */}
        {loading && [1, 2].map(i => (
          <div key={i} style={{
            background: 'var(--weiss)', borderRadius: 'var(--rounded)',
            padding: 'var(--sp-3) var(--sp-4)', marginBottom: 'var(--sp-2)',
            opacity: 0.5,
          }}>
            <div style={{ height: 16, width: '55%', background: 'var(--border)', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 12, width: '35%', background: 'var(--border)', borderRadius: 4 }} />
          </div>
        ))}

        {/* Fehler */}
        {!loading && fetchError && (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
            <p className="card-sub" style={{ marginBottom: 16 }}>Verbindung unterbrochen.</p>
            <button className="button" onClick={loadAssignments}>Nochmal versuchen</button>
          </div>
        )}

        {/* Leer */}
        {!loading && !fetchError && assignments.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎪</div>
            <p className="card-sub">Noch keine Festivals zugewiesen. Melde dich bei Goldeimer.</p>
          </div>
        )}

        {/* Festival-Karten */}
        {sorted.map(a => {
          const details = a.festival?.details || {}
          const town    = details.festival_town || ''
          const start   = getRoleStart(a.role, details)
          const end     = getRoleEnd(a.role, details)
          const endDate = parseDeDate(end)
          const isPast  = endDate ? endDate < today : false

          return (
            <Link
              key={a.id}
              to={`/festival/${a.festival.id}`}
              className="festival-card"
              style={isPast ? { opacity: 0.45 } : {}}
            >
              <div className="festival-card-header">
                <div className="festival-card-name">{a.festival.name}</div>
                <span className="festival-card-role">{ROLLE_LABEL[a.role] || a.role}</span>
              </div>
              <div className="festival-card-meta">
                {formatDateRange(start, end)}{town ? ` | ${town}` : ''}
              </div>
            </Link>
          )
        })}

        {/* Allgemeine Infos */}
        <div className="section-title" style={{ marginTop: 'var(--sp-8)' }}>
          {isLeadOrOp ? 'Infos für Leads & Operators' : 'Allgemeine Infos'}
        </div>
        <Link to="/infos" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
            <div style={{
              width: 44, height: 44, background: 'var(--gelb)',
              borderRadius: 'var(--rounded)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>📖</div>
            <div>
              <div className="card-title">
                {isLeadOrOp ? 'Anleitungen, Briefings & FAQ' : 'Anleitungen & Infos'}
              </div>
              <div className="card-sub" style={{ fontSize: 'var(--text-xs)', marginTop: 2 }}>
                {isLeadOrOp
                  ? 'Auf-/Abbau, Briefings, Orderbird, FAQ'
                  : 'Trockentoiletten, Abläufe, FAQ'}
              </div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 18 }}>→</span>
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

function parseDeDate(str) {
  if (!str) return null
  const match = String(str).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (!match) return null
  const [, day, month, year] = match
  return new Date(+year, +month - 1, +day)
}

function formatDateRange(startStr, endStr) {
  if (!startStr) return ''
  try {
    const s = parseDeDate(startStr)
    if (!s) return ''
    const startFmt = s.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    if (!endStr) return startFmt + '.'
    const e = parseDeDate(endStr)
    if (!e) return startFmt + '.'
    const endFmt = e.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    return `${startFmt} – ${endFmt}`
  } catch { return '' }
}
