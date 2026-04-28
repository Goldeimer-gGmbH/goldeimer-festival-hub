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

function IconSozial() {
  return (
    <svg role="presentation" focusable="false" strokeWidth="2" width="26" height="26"
      viewBox="0 0 28 28" style={{ display: 'block' }}>
      <path fill="currentColor" d="M9.28,22.85c-1.01-.23-1.39-.72-1.41-1.77-.36-.19-.73-.34-1.06-.57-.48-.33-.78-.79-.85-1.38-.02-.15-.08-.3-.16-.43-1-1.65-2.05-3.27-3.02-4.95-2.24-3.9-.04-8.69,4.37-9.56,2.58-.51,5.28.7,6.67,2.98.1.16.19.32.31.51.73-.68,1.46-1.32,2.14-2,.91-.91,1.99-1.39,3.27-1.36.83.01,1.66.05,2.48.16,1.02.14,1.8.73,2.36,1.57,1.16,1.72,1.69,3.66,1.71,5.72,0,.59-.31,1.21-.6,1.76-.82,1.59-2.1,2.81-3.44,3.97-.3.26-.62.51-.88.73.14.54.33,1.04.38,1.55.11,1.21-.5,1.73-1.65,1.59-.26.5-.49.98-.76,1.44-.22.37-.57.55-.99.6-.08.01-.2.06-.23.13-.43.81-1.15,1.03-1.99.98-.28-.02-.42.05-.57.3-.53.87-1.58,1.29-2.52,1.06-.47-.11-.84-.37-1.06-.8-.11-.21-.23-.31-.49-.3-1.15.02-1.94-.74-2.02-1.91ZM6.63,17.59c.53-.19.95-.38,1.39-.48,1.39-.34,2.16.16,2.47,1.56.02.11.1.23.18.31,1.47,1.29,2.95,2.57,4.43,3.86.21.19.43.46.67.49.26.03.56-.16.82-.29.02-.01-.07-.38-.19-.51-.42-.49-.86-.96-1.32-1.41-.87-.87-1.77-1.71-2.64-2.58-.32-.33-.29-.78.01-1.03.29-.24.68-.19.99.13.22.23.45.44.67.67,1.17,1.17,2.35,2.34,3.51,3.52.25.25.46.27.59-.04.09-.22.15-.56.05-.75-.2-.37-.47-.72-.79-1-1.01-.89-2.06-1.73-3.08-2.61-.34-.29-.33-.71-.06-.99.25-.26.65-.25.97.01,1.09.91,2.17,1.82,3.27,2.72.47.38.97.73,1.62.83.04-.65-.27-1.11-.67-1.47-.46-.42-1.01-.75-1.48-1.17-1.17-1.05-2.32-2.12-3.47-3.21-.25-.24-.42-.24-.68-.03-.57.45-1.17.87-1.76,1.31-.56.41-1.2.6-1.88.64-.95.05-1.52-.47-1.56-1.42-.03-.66.15-1.26.55-1.77.36-.46.76-.89,1.16-1.32.82-.88,1.65-1.74,2.46-2.63.1-.11.13-.38.07-.51-1.1-2.55-4.15-3.69-6.71-2.55-2.55,1.14-3.78,4.24-2.53,6.71.88,1.73,1.95,3.36,2.92,5.01ZM20.19,17.3c.65-.56,1.23-1.03,1.77-1.54.98-.91,1.89-1.88,2.48-3.1.17-.35.35-.76.34-1.13-.07-1.41-.43-2.76-1.06-4.04-.41-.82-1.05-1.36-1.88-1.65-.43-.15-.92-.17-1.39-.19-1.17-.06-2.28.04-3.18.95-1.06,1.07-2.18,2.07-3.24,3.13-1.01,1.01-1.98,2.06-2.96,3.1-.29.31-.57.65-.79,1.01-.14.23-.17.54-.27.86.67.06,1.14-.17,1.57-.49.68-.5,1.35-1.01,2.05-1.48.69-.46.88-.45,1.51.11.69.61,1.32,1.27,2.01,1.88,1,.87,2.02,1.72,3.05,2.59ZM12.35,22.72c0-.45-.4-.84-.86-.84-.45,0-.82.37-.83.82-.01.45.38.86.83.87.44,0,.86-.41.86-.85ZM10.72,20.93c0-.46-.37-.86-.82-.88-.44-.01-.86.37-.88.82-.02.45.41.89.87.88.42,0,.82-.41.83-.83ZM9.18,19.07c-.08-.24.04-.71-.43-.68-.42.03-.85.21-1.25.37-.24.1-.27.36-.05.52.27.2.57.36.88.48.43.17.84-.16.85-.68ZM14.01,24.13c0-.32-.25-.57-.57-.57-.33,0-.6.27-.58.61.02.32.27.55.6.54.33,0,.56-.25.56-.58Z"/>
    </svg>
  )
}

const ALL_TOPICS = [
  { icon: '🔧', title: 'Auf- und Abbauanleitung Modul',      slug: 'abbau-modul' },
  { icon: '📦', title: 'Auf- und Abbauanleitung Container',  slug: 'abbau-container' },
  { icon: '👥', title: 'Crew-Briefing',                      slug: 'crew-briefing' },
  { icon: '📢', title: 'Promo-Team-Briefing',                slug: 'promo-briefing' },
  { icon: '🤝', title: 'Welcome-Meeting-Briefing',           slug: 'welcome-briefing' },
  { icon: '📱', title: 'How to Orderbird',                   slug: 'orderbird',       leadOnly: true },
  { icon: '❓', title: 'FAQ',                                slug: 'faq' },
  { icon: <IconSozial />, title: 'Code of Conduct',          slug: 'code-of-conduct', iconRaw: true },
]

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

  const topics = ALL_TOPICS.filter(t => !t.leadOnly || isLeadOrOp)

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
    if (aPast !== bPast) return aPast ? 1 : -1
    return (aStart || 0) - (bStart || 0)
  })

  return (
    <div>
      <div className="header">
        <img src="/goldeimer-logo.png" alt="Goldeimer" style={{ height: 36 }} />
        <Link to="/profil" style={{ textDecoration: 'none', color: 'var(--schwarz)', display: 'flex', alignItems: 'center' }}>
          <img src="/icon-account.svg" alt="Profil" style={{ width: 26, height: 26 }} />
        </Link>
      </div>

      {/* Greeting Banner – Full-Bleed (breiter als der 480px-Body) */}
      <div style={{
        background: 'var(--schwarz)',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
      }}>
        {/* Innerer Content bleibt auf max 480px zentriert */}
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-6) var(--sp-4) 0' }}>
          <div className="statement" style={{ fontSize: 'var(--text-h0)', color: 'var(--gelb)', lineHeight: 1 }}>
            Hey {vorname}!
          </div>
          <p style={{ color: 'var(--on-dark-sub)', marginTop: 6, marginBottom: 'var(--sp-6)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
            Deine Festivals 2026 mit Goldeimer
          </p>
        </div>

        {/* Welle: Schwarz → Papier */}
        <svg viewBox="0 0 480 64" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 56, marginBottom: -2 }}>
          <path d="M0,32 C80,64 160,8 260,36 C340,58 420,12 480,28 L480,64 L0,64 Z"
            fill="var(--papier)" />
        </svg>
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
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'var(--sp-2)' }}>
                <div className="festival-card-meta">
                  {formatDateRange(start, end)}{town ? ` | ${town}` : ''}
                </div>
                <span style={{ fontSize: 16, opacity: 0.45 }}>→</span>
              </div>
            </Link>
          )
        })}

        {/* Infos & Anleitungen */}
        <div className="section-title" style={{ marginTop: 'var(--sp-8)' }}>
          {isLeadOrOp ? 'Infos für Leads & Operator' : 'Allgemeine Infos'}
        </div>

        {/* Topic-Liste */}
        <div style={{
          background: 'var(--weiss)',
          borderRadius: 'var(--rounded)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {topics.map((topic, i) => (
            <Link
              key={topic.slug}
              to={`/infos?section=${topic.slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-3)',
                padding: 'var(--sp-3) var(--sp-4)',
                borderBottom: i < topics.length - 1 ? '1px solid var(--border)' : 'none',
                textDecoration: 'none',
                color: 'var(--schwarz)',
              }}
            >
              {topic.iconRaw ? (
                <span style={{
                  width: 36, height: 36, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {topic.icon}
                </span>
              ) : (
                <span style={{
                  width: 36, height: 36,
                  background: 'var(--gelb)',
                  borderRadius: 'var(--rounded-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {topic.icon}
                </span>
              )}
              <span style={{ flex: 1, fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                {topic.title}
              </span>
              <span style={{ fontSize: 18, opacity: 0.4 }}>→</span>
            </Link>
          ))}
        </div>

        {/* Footer – Full-Bleed */}
        <div style={{
          marginTop: 'var(--sp-10)',
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
        }}>
          {/* Welle: Papier → Schwarz */}
          <svg viewBox="0 0 480 64" preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: 56, marginBottom: -2 }}>
            <path d="M0,36 C80,8 180,56 280,24 C360,4 420,48 480,28 L480,64 L0,64 Z"
              fill="var(--schwarz)" />
          </svg>
          <div style={{
            background: 'var(--schwarz)',
            padding: 'var(--sp-5) var(--sp-4)',
            textAlign: 'center',
          }}>
            <p style={{ color: 'var(--on-dark-sub)', fontSize: 'var(--text-xs)' }}>
              © Goldeimer gGmbH · Kacke für den guten Zweck 💛
            </p>
          </div>
        </div>

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
