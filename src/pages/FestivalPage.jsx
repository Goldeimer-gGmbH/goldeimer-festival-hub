import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import { cacheGet, cacheSet } from '../lib/cache'
import { fetchWithTimeout } from '../lib/fetchWithTimeout'

const ROLLE_LABEL = {
  lead: 'Lead', operator: 'Operator',
  supporti_plus: 'Supporti+', supporti: 'Supporti', catering: 'Catering'
}

// ── Tab Icons ────────────────────────────────────────────────────────────────

function TabIconAblauf() {
  return (
    <svg role="presentation" focusable="false" width="18" height="18" viewBox="0 0 28 28" style={{ display: 'block' }}>
      <path fill="currentColor" d="M21.61,7c-2.03-2.14-4.89-3.39-7.7-3.3-5.73.14-10.04,4.45-10.25,10.24-.1,2.8,1.09,5.58,3.28,7.63,1.87,1.74,4.22,2.7,6.57,2.7.29,0,.59-.01.88-.04,5.49-.57,9.34-4.58,9.81-10.2.21-2.54-.71-5.04-2.59-7.03ZM22.71,13.91c-.41,4.87-3.73,8.33-8.47,8.83-2.21.23-4.49-.6-6.27-2.27-1.88-1.75-2.9-4.11-2.81-6.48.18-4.97,3.88-8.67,8.79-8.8,2.38-.06,4.83,1,6.57,2.84,1.58,1.68,2.36,3.76,2.19,5.88Z"/>
      <path fill="currentColor" d="M14,7.84c-.42,0-.75.34-.75.75v4.96l-1.85,3.27c-.21.36-.08.82.28,1.02.12.07.24.1.37.1.26,0,.51-.14.65-.38l1.89-3.34.05-.08c.03-.06.06-.12.08-.19.02-.06.03-.12.03-.18v-5.18c0-.41-.34-.75-.75-.75Z"/>
    </svg>
  )
}

function TabIconInfos() {
  return (
    <svg role="presentation" focusable="false" width="18" height="18" viewBox="0 0 28 28" style={{ display: 'block' }}>
      <path fill="currentColor" d="M21.12,6.54c-1.46-1.57-3.63-2.43-5.91-2.35-2.2.07-4.19,1.02-5.48,2.6-2.46,3.04-2.57,6.91-.34,10.08,0,0,0,0,0,0-.44.36-1.61,1.37-2.28,2.35-.44.65-1.96,1.91-2.8,2.56-.5.38-.6,1.09-.22,1.59.22.29.56.45.9.45.24,0,.48-.08.68-.23.25-.19,2.51-1.92,3.3-3.08.49-.72,1.55-1.64,1.95-1.97,1.17.91,2.62,1.41,4.22,1.46h.23c2.17,0,4.3-.88,5.72-2.38,3.02-3.18,3.02-7.84.01-11.08ZM11.09,16.62c-2.3-2.71-2.37-6.2-.19-8.89,1.01-1.24,2.6-1.99,4.36-2.04.08-.01.16-.01.23-.01,1.77,0,3.41.68,4.53,1.88,1.23,1.32,1.84,2.94,1.84,4.54s-.61,3.2-1.84,4.49c-1.18,1.25-2.96,1.96-4.81,1.91-1.67-.05-3.14-.72-4.12-1.88Z"/>
      <path fill="currentColor" d="M20.03,12.92c-.23,0-.42-.19-.42-.43,0-2.65-2.16-4.81-4.81-4.81-.23,0-.42-.19-.42-.43s.19-.43.42-.43c3.12,0,5.66,2.54,5.66,5.66,0,.23-.19.43-.42.43Z"/>
    </svg>
  )
}

function TabIconKontakte() {
  return (
    <svg role="presentation" focusable="false" width="18" height="18" viewBox="0 0 28 28" style={{ display: 'block' }}>
      <path fill="currentColor" d="M24.57,13.74c.38-.17.55-.61.39-.99-.11-.26-.36-.42-.63-.44h0s.04-1.68.04-1.68h0s.26-.12.26-.12c.38-.16.55-.61.39-.99-.11-.25-.35-.41-.61-.44h0s.05-1.84.05-1.84h0s.05-.02.05-.02c.38-.16.55-.61.39-.99-.17-.38-.61-.55-.99-.39l-.5.22s-.01.01-.02.02c-.01,0-.03.01-.04.02-.71.38-1.86,1.02-2.88,1.59-.29-.73-1.19-1.33-2.68-1.81-1.55-.49-3.6-.8-5.77-.86-4.18-.11-8.67.72-8.73,2.8v.14s-.01.05-.01.08v.07l-.23,3.53.13,6-.25,3.25v.13c.2,2.05,4.46,3.24,8.56,3.35.36.01.7.01,1.04.01,3.34,0,5.65-.48,7.57-1.55,1.49-.66,3.14-1.98,3.61-2.37,0,0,.01-.01.02-.02.06,0,.12-.01.18-.04l.5-.22c.38-.16.55-.61.39-.99-.12-.28-.39-.44-.67-.45h0s.04-1.65.04-1.65h0s.31-.14.31-.14c.38-.17.55-.61.39-.99-.12-.27-.37-.43-.65-.44l.04-1.67.29-.12ZM12,6.52c3.1.09,5.34.68,6.41,1.21.4.19.64.37.69.52-.03.08-.11.16-.24.24-.33.24-.99.49-1.93.7-.58.13-1.28.24-2.08.32-.19.02-.39.04-.6.05-.21.02-.42.02-.64.03h-.05c-.06.01-.13.01-.2.01-.46.01-.94.01-1.45,0-.46-.01-.9-.03-1.32-.07-1.48-.11-2.71-.34-3.65-.61-.96-.26-1.62-.56-1.93-.8-.12-.09-.19-.17-.21-.24.05-.14.3-.32.73-.5,1-.43,3.01-.87,5.74-.87.24,0,.48,0,.73,0Z"/>
    </svg>
  )
}

function TabIconFeedback() {
  return (
    <svg role="presentation" focusable="false" width="18" height="18" viewBox="0 0 28 28" style={{ display: 'block' }}>
      <path fill="currentColor" d="M20.03,24.41c-.73,0-1.25-.61-1.44-.83-.9-1.05-1.93-1.75-3.02-2.49-.12-.08-.24-.14-.36-.21-.2-.1-.4-.21-.57-.34-.12-.09-.22-.19-.3-.27-.06.04-.11.08-.16.11-.15.11-.31.22-.47.32l-.33.22c-.53.35-1.19.79-1.75,1.42l-.11.13-.16.06c-.51.21-1.17.72-1.96,1.51l-.2.14c-.72.36-1.21.06-1.38-.09-.52-.43-.53-1.18-.38-1.69l.12-.41c.14-.5.28-1.02.49-1.51.14-.33.3-.65.47-.97.3-.6.59-1.17.72-1.76l.05-.21c.04-.17.15-.63.17-.88-.11-.09-.32-.21-.43-.27-.12-.07-.22-.13-.29-.18-.47-.34-1.27-.89-2.21-1.54l-.23-.16c-.09-.06-.22-.14-.38-.24-1.3-.81-3.08-1.91-2.44-3.14.45-.86,1.71-.9,3.18-.87.17,0,.32,0,.43,0,1.21-.03,2.4.02,3.54.14.09,0,.21.03.34.06.07.01.16.03.25.05.03-.11.05-.24.07-.31.02-.11.04-.21.06-.29.15-.45.37-1.3.61-2.19l.17-.67c.03-.12.07-.28.11-.47.26-1.22.52-2.26,1.14-2.71.53-.38.96-.33,1.24-.22.68.27.84,1.08.95,1.62.02.11.04.2.06.27.16.47.32.94.51,1.4l.21.74c.22.78.44,1.59.68,2.03l.08.22c.06.33.07.44.71.38h.07s.07,0,.07,0c.42.04,1.16,0,1.87-.05.28-.02.57-.03.85-.05.08,0,.21-.01.36-.03,1.77-.14,2.76-.12,3.26.36.36.35.48.88.32,1.41-.24.77-.98,1.27-1.58,1.68-.18.12-.34.23-.48.34-.81.59-1.42,1.17-1.87,1.6l-.21.18c-.43.27-.83.72-1.02.97.19.66.72,2.37,1.08,3.2l.04.12c.03.13.12.33.22.57.4.96.9,2.15.48,3.01-.18.36-.49.6-.89.71-.12.03-.23.04-.34.04Z"/>
    </svg>
  )
}

// ── Ablauf-Daten ──────────────────────────────────────────────────────────────

// Chronologischer Festivalablauf für Lead & Operator
const ABLAUF_LEAD = [
  {
    id: 'anreise-leadop',
    step: 1,
    time: 'Aufbautag – Anreise',
    title: 'Anreise Lead & Operator',
    tag: 'Checkliste',
    slug: 'anreise-leadop',
  },
  {
    id: 'start-aufbau',
    step: 2,
    time: 'Aufbautag',
    title: 'Start Aufbau',
    slug: 'start-aufbau',
  },
  {
    id: 'open-camping',
    step: 3,
    time: 'Tag 0 – Abend vor Festivalbeginn',
    title: 'Open Campingplatz',
    slug: 'open-camping',
  },
  {
    id: 'welcome-meeting',
    step: 4,
    time: 'Tag 0 – Abend vor Festivalbeginn',
    title: 'Welcome Meeting',
    slug: 'welcome-meeting',
  },
  {
    id: 'promo-briefing',
    step: 5,
    time: '1. Festivaltag – morgens',
    title: 'Promo-Team-Briefing',
    slug: 'promo-briefing',
  },
  {
    id: 'moho-briefing',
    step: 6,
    time: '1. Festivaltag – vor Schichtstart',
    title: 'Moho-Briefing',
    slug: 'moho-briefing',
  },
  {
    id: 'erste-schichten',
    step: 7,
    time: '1. Festivaltag – ab 9:00 Uhr',
    title: 'Erste Schichten',
    slug: 'erste-schichten',
  },
  {
    id: 'crew-briefing',
    step: 8,
    time: '1. Festivaltag – Mittag',
    title: 'Crew-Briefing',
    slug: 'crew-briefing',
  },
  {
    id: 'abbau',
    step: 9,
    time: 'Letzter Festivaltag – nach Betrieb',
    title: 'Abbau',
    slug: 'abbau',
  },
  {
    id: 'close-camping',
    step: 10,
    time: 'Letzter Festivaltag – Abend',
    title: 'Close Campingplatz',
    slug: 'close-camping',
  },
]

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function FestivalPage() {
  const { id } = useParams()
  const { profile, signOut } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [activeTab, setActiveTab] = useState('ablauf')

  useEffect(() => { loadFestivalInfo() }, [id])

  async function loadFestivalInfo() {
    setFetchError(false)
    setAuthError(false)
    const cacheKey = `festival_${id}`
    const cached = cacheGet(cacheKey)
    if (cached) { setData(cached); setLoading(false) }

    const { data, error, isAuthError } = await fetchWithTimeout(
      supabase.rpc('get_my_festival_info', { p_festival_id: id })
    )
    if (!error && data) {
      setData(data)
      cacheSet(cacheKey, data, 30 * 60 * 1000)
    } else if (error) {
      if (isAuthError) setAuthError(true)
      else if (!cached) setFetchError(true)
    }
    if (!cached) setLoading(false)
  }

  if (loading) return <div className="loading">Lädt Festival-Infos...</div>
  if (authError) return (
    <div className="page" style={{ paddingTop: 'var(--sp-8)', textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
      <p className="card-sub" style={{ marginBottom: 20 }}>
        Deine Sitzung ist abgelaufen. Bitte melde dich neu an.
      </p>
      <button className="button" onClick={signOut}>Neu anmelden</button>
      <div style={{ marginTop: 20 }}><Link to="/">← Zurück</Link></div>
    </div>
  )
  if (fetchError || !data || data.error) return (
    <div className="page" style={{ paddingTop: 'var(--sp-8)', textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
      <p className="card-sub" style={{ marginBottom: 20 }}>Verbindung unterbrochen.</p>
      <button className="button" onClick={loadFestivalInfo}>Nochmal versuchen</button>
      <div style={{ marginTop: 20 }}><Link to="/">← Zurück</Link></div>
    </div>
  )

  const details = data.festival?.details || {}
  const role = data.assignment_role

  const tabs = [
    { key: 'ablauf',   label: 'ABLAUF',    Icon: TabIconAblauf },
    { key: 'infos',    label: 'INFOS',     Icon: TabIconInfos },
    { key: 'kontakte', label: 'KONTAKTE',  Icon: TabIconKontakte },
    { key: 'feedback', label: 'FEEDBACK',  Icon: TabIconFeedback },
  ]

  return (
    <div>
      {/* Header */}
      <div className="header">
        <Link to="/" style={{ textDecoration: 'none', fontSize: 20, color: 'var(--schwarz)', fontWeight: 700 }}>←</Link>
        <span className="header-logo" style={{ fontSize: 17 }}>{data.festival?.name?.toUpperCase()}</span>
        <span className={`badge badge-${role}`} style={{ fontSize: 9 }}>
          {ROLLE_LABEL[role] || role}
        </span>
      </div>

      {/* Festival Bar */}
      <div className="festival-bar">
        <span>🎪</span>
        <span>{details.festival_town || ''}</span>
        {details.start_official && (
          <span style={{ marginLeft: 'auto', color: 'rgba(255,229,0,0.6)', fontSize: 12 }}>
            {formatDate(details.start_official)}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'var(--weiss)',
        borderBottom: '3px solid var(--schwarz)',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '10px 2px',
              border: 'none',
              borderRight: '1px solid var(--grau)',
              background: activeTab === tab.key ? 'var(--gelb)' : 'var(--weiss)',
              fontSize: 8,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: 'var(--schwarz)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              transition: 'background 0.15s',
            }}
          >
            <tab.Icon />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="page" style={{ paddingTop: 18 }}>

        {/* ── ABLAUF / CHECKS ── */}
        {activeTab === 'ablauf' && (
          <AblaufTab
            role={role}
            festivalId={id}
            profileId={profile.id}
            checklists={data.checklists}
            content={data.content}
          />
        )}

        {/* ── INFOS ── */}
        {activeTab === 'infos' && (
          <div>
            <div className="section-title">Deine Zeiten</div>
            <div className="card">
              <ul className="info-list">
                <li>
                  <span className="info-icon">📅</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grau-text)', marginBottom: 3 }}>Anreise</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{getAnreise(details, role) || 'Wird noch bekannt gegeben'}</div>
                  </div>
                </li>
                <li>
                  <span className="info-icon">🏠</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grau-text)', marginBottom: 3 }}>Abreise</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{getAbreise(details, role) || 'Wird noch bekannt gegeben'}</div>
                  </div>
                </li>
                {details.festival_town && (
                  <li>
                    <span className="info-icon">📍</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grau-text)', marginBottom: 3 }}>Ort</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{details.festival_town}</div>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            {data.content && data.content.length > 0 && (
              <>
                <div className="section-title">Infos & Dokumente</div>
                {data.content.map(c => (
                  <div key={c.id} className="card">
                    <div className="card-title">{c.title}</div>
                    {c.body && (
                      <div style={{ fontSize: 14, lineHeight: 1.65, marginTop: 8, color: 'var(--schwarz)', whiteSpace: 'pre-wrap' }}>
                        {c.body}
                      </div>
                    )}
                    {c.file_url && (
                      <a href={c.file_url} target="_blank" rel="noopener noreferrer"
                        className="button button--secondary" style={{ marginTop: 12, textDecoration: 'none' }}>
                        📄 Dokument öffnen
                      </a>
                    )}
                  </div>
                ))}
              </>
            )}

            {(!data.content || data.content.length === 0) && (
              <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <p className="card-sub">Infos werden noch eingetragen.</p>
              </div>
            )}
          </div>
        )}

        {/* ── KONTAKTE ── */}
        {activeTab === 'kontakte' && (
          <div>
            {(details.emergency_number || details.notfall) && (
              <>
                <div className="section-title">Notfall</div>
                <div style={{
                  background: 'var(--rot)',
                  border: '2px solid var(--rot)',
                  borderRadius: 'var(--radius)',
                  padding: '16px',
                  boxShadow: '4px 4px 0 rgba(0,0,0,0.3)',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}>
                  <span style={{ fontSize: 32 }}>🚨</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-dark-sub)', marginBottom: 4 }}>Notfallnummer</div>
                    <a href={`tel:${details.emergency_number || details.notfall}`}
                      style={{ fontSize: 24, fontWeight: 900, color: 'var(--weiss)', textDecoration: 'none', fontFamily: 'var(--font-statement)', letterSpacing: '0.05em' }}>
                      {details.emergency_number || details.notfall}
                    </a>
                  </div>
                </div>
              </>
            )}

            {data.leads && data.leads.length > 0 && (
              <>
                <div className="section-title">Deine Leads</div>
                {data.leads.map((lead, i) => (
                  <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%',
                      background: 'var(--gelb)', border: '2px solid var(--schwarz)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-statement)', fontSize: 22, flexShrink: 0,
                      color: 'var(--schwarz)',
                    }}>
                      {(lead.full_name || lead.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="card-title">{lead.full_name || lead.email}</div>
                      <a href={`mailto:${lead.email}`}
                        style={{ fontSize: 13, color: 'var(--grau-text)', textDecoration: 'none' }}>
                        {lead.email}
                      </a>
                    </div>
                  </div>
                ))}
              </>
            )}

            {(!data.leads || data.leads.length === 0) && !details.emergency_number && (
              <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📞</div>
                <p className="card-sub">Kontakte werden noch eingetragen.</p>
              </div>
            )}
          </div>
        )}

        {/* ── FEEDBACK ── */}
        {activeTab === 'feedback' && (
          <FeedbackTab festivalId={id} profileId={profile.id} />
        )}
      </div>
    </div>
  )
}

// ── AblaufTab ─────────────────────────────────────────────────────────────────

function AblaufTab({ role, festivalId, profileId, checklists, content }) {
  const isLeadOp = role === 'lead' || role === 'operator'

  if (!isLeadOp) {
    return (
      <div>
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔜</div>
          <div className="card-title" style={{ marginBottom: 6 }}>Kommt bald</div>
          <p className="card-sub">Der Ablauf für Supportis und Catering-Crew folgt in Kürze.</p>
        </div>
        {/* Checklisten trotzdem anzeigen wenn vorhanden */}
        {checklists && checklists.length > 0 && (
          <>
            <div className="section-title" style={{ marginTop: 8 }}>Checklisten</div>
            <ChecklistSection festivalId={festivalId} profileId={profileId} checklists={checklists} />
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Checklisten oben wenn vorhanden */}
      {checklists && checklists.length > 0 && (
        <>
          <div className="section-title">Checklisten</div>
          <ChecklistSection festivalId={festivalId} profileId={profileId} checklists={checklists} />
          <div className="section-title" style={{ marginTop: 8 }}>Ablauf</div>
        </>
      )}

      {/* Chronologischer Ablauf */}
      <div style={{ position: 'relative' }}>
        {/* Vertikale Linie */}
        <div style={{
          position: 'absolute',
          left: 18,
          top: 10,
          bottom: 10,
          width: 2,
          background: 'var(--grau)',
          zIndex: 0,
        }} />

        {ABLAUF_LEAD.map((item, idx) => (
          <AblaufItem
            key={item.id}
            item={item}
            isLast={idx === ABLAUF_LEAD.length - 1}
            content={content?.find(c => c.slug === item.slug)}
          />
        ))}
      </div>
    </div>
  )
}

function AblaufItem({ item, isLast, content }) {
  const [expanded, setExpanded] = useState(false)
  const hasContent = content?.body || content?.file_url

  return (
    <div style={{ position: 'relative', paddingLeft: 44, marginBottom: isLast ? 0 : 10 }}>
      {/* Schritt-Dot */}
      <div style={{
        position: 'absolute',
        left: 10,
        top: 14,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: 'var(--gelb)',
        border: '2px solid var(--schwarz)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 8,
        fontWeight: 900,
        fontFamily: 'var(--font-heading)',
        zIndex: 1,
        flexShrink: 0,
      }}>
        {item.step}
      </div>

      {/* Card */}
      <div
        className="card"
        style={{ cursor: hasContent ? 'pointer' : 'default', marginBottom: 0 }}
        onClick={() => hasContent && setExpanded(e => !e)}
      >
        {/* Zeit-Badge */}
        <div style={{
          display: 'inline-block',
          background: 'var(--gelb)',
          color: 'var(--schwarz)',
          fontSize: 10,
          fontWeight: 800,
          fontFamily: 'var(--font-heading)',
          letterSpacing: '0.04em',
          padding: '2px 8px',
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.12)',
          marginBottom: 6,
        }}>
          {item.time}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>{item.title}</div>
          {hasContent && (
            <span style={{ color: 'var(--grau-text)', fontSize: 14, flexShrink: 0 }}>
              {expanded ? '▲' : '▼'}
            </span>
          )}
          {!hasContent && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: 'var(--grau-text)',
              border: '1px solid var(--grau)', borderRadius: 3,
              padding: '1px 5px', flexShrink: 0, whiteSpace: 'nowrap',
            }}>
              folgt
            </span>
          )}
        </div>

        {/* Ausgeklappter Inhalt */}
        {expanded && hasContent && (
          <div style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
          }}>
            {content.body && (
              <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--schwarz)' }}>
                {content.body}
              </div>
            )}
            {content.file_url && (
              <a href={content.file_url} target="_blank" rel="noopener noreferrer"
                className="button button--secondary"
                style={{ marginTop: 10, textDecoration: 'none', display: 'inline-block' }}
                onClick={e => e.stopPropagation()}
              >
                📄 Dokument öffnen
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── ChecklistSection (aus ChecklistTab herausgelöst) ──────────────────────────

function ChecklistSection({ festivalId, profileId, checklists }) {
  const [items, setItems] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (checklists && checklists.length > 0) loadItems()
    else setLoading(false)
  }, [checklists])

  async function loadItems() {
    const ids = checklists.map(c => c.id)
    const { data, error } = await supabase
      .from('checklist_items').select('*')
      .in('checklist_id', ids).eq('profile_id', profileId).order('sort_order')
    if (!error && data) {
      const grouped = {}
      data.forEach(item => {
        if (!grouped[item.checklist_id]) grouped[item.checklist_id] = []
        grouped[item.checklist_id].push(item)
      })
      setItems(grouped)
    }
    setLoading(false)
  }

  async function toggleItem(item) {
    const newVal = !item.is_checked
    const { error } = await supabase.from('checklist_items')
      .update({ is_checked: newVal, checked_at: newVal ? new Date().toISOString() : null })
      .eq('id', item.id)
    if (!error) {
      setItems(prev => {
        const updated = { ...prev }
        updated[item.checklist_id] = updated[item.checklist_id].map(i =>
          i.id === item.id ? { ...i, is_checked: newVal } : i
        )
        return updated
      })
    }
  }

  if (loading) return <div className="loading">Lädt...</div>

  return (
    <div>
      {checklists.map(cl => {
        const clItems = items[cl.id] || []
        const doneCount = clItems.filter(i => i.is_checked).length
        const pct = clItems.length ? Math.round((doneCount / clItems.length) * 100) : 0

        return (
          <div key={cl.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div className="card-title">{cl.title}</div>
              <span style={{
                background: doneCount === clItems.length && clItems.length > 0 ? 'var(--gruen)' : 'var(--gelb)',
                color: doneCount === clItems.length && clItems.length > 0 ? 'var(--weiss)' : 'var(--schwarz)',
                border: '1.5px solid var(--schwarz)',
                borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 800,
              }}>
                {doneCount}/{clItems.length}
              </span>
            </div>
            {clItems.length > 0 && (
              <div style={{ height: 4, background: 'var(--grau)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gruen)', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
            )}
            {cl.description && (
              <p style={{ fontSize: 13, color: 'var(--grau-text)', marginBottom: 10 }}>{cl.description}</p>
            )}
            {clItems.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--grau-text)' }}>Keine Punkte vorhanden.</p>
            ) : clItems.map(item => (
              <div key={item.id} className="check-item" onClick={() => toggleItem(item)}>
                <div className={`check-box ${item.is_checked ? 'checked' : ''}`}>
                  {item.is_checked && '✓'}
                </div>
                <span className={`check-label ${item.is_checked ? 'checked' : ''}`}>{item.label}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ── FeedbackTab ───────────────────────────────────────────────────────────────

function FeedbackTab({ festivalId, profileId }) {
  const [text, setText] = useState('')
  const [type, setType] = useState('feedback')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    const { error } = await supabase.from('logs').insert({
      festival_id: festivalId, profile_id: profileId,
      log_type: type, data: { text: text.trim() }
    })
    if (!error) { setSent(true); setText('') }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🙌</div>
        <div className="display" style={{ fontSize: 28, marginBottom: 8 }}>DANKE!</div>
        <p className="card-sub">Dein Feedback wurde gespeichert und wird gelesen.</p>
        <button className="button button--secondary" style={{ marginTop: 16 }} onClick={() => setSent(false)}>
          Weiteres Feedback senden
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <p style={{ fontSize: 14, color: 'var(--grau-text)', marginBottom: 16, lineHeight: 1.6 }}>
          Etwas lief nicht gut? Hast du einen Verbesserungsvorschlag? Sag es uns!
        </p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Art der Meldung</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="feedback">Allgemeines Feedback</option>
              <option value="schicht_report">Schicht-Report</option>
              <option value="meldung">Wichtige Meldung</option>
              <option value="lob">Lob 🌟</option>
            </select>
          </div>
          <div className="input-group">
            <label>Deine Nachricht</label>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Was ist passiert? Was hat gut / nicht gut funktioniert?" required />
          </div>
          <button className="button" type="submit" disabled={loading || !text.trim()}>
            {loading ? 'Wird gesendet...' : 'Feedback senden →'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function getAnreise(details, role) {
  if (role === 'supporti_plus') return details.start_setup
  if (role === 'supporti') return details.start_supp
  if (role === 'lead' || role === 'operator') return details.start_leadop
  if (role === 'catering') return details.start_kitchen
  return null
}

function getAbreise(details, role) {
  if (role === 'supporti_plus') return details.end_takedown
  if (role === 'supporti') return details.end_supp
  if (role === 'lead' || role === 'operator') return details.end_leadop
  if (role === 'catering') return details.end_kitchen
  return null
}

function parseDeDate(str) {
  if (!str) return null
  const match = String(str).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (!match) return null
  const [, day, month, year] = match
  return new Date(+year, +month - 1, +day)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = parseDeDate(dateStr)
    if (!d) return String(dateStr).split(' ')[0]
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return dateStr }
}
