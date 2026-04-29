import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import { cacheGet, cacheSet } from '../lib/cache'
import { fetchWithTimeout } from '../lib/fetchWithTimeout'
import {
  IconAblauf, IconInfos, IconKontakte, IconFeedback,
  IconKalender, IconTransport, IconOrderbird, IconStift, IconLupe,
  IconStar, IconPin,
} from '../components/Icons'

const ROLLE_LABEL = {
  lead: 'Lead', operator: 'Operator',
  supporti_plus: 'Supporti+', supporti: 'Supporti', catering: 'Catering'
}

// Tab-Icons: kommen aus Icons.jsx, hier als lokale Wrapper mit Tab-Größe
const TabIconAblauf   = () => <IconAblauf   size={18} />
const TabIconInfos    = () => <IconInfos    size={18} />
const TabIconKontakte = () => <IconKontakte size={18} />
const TabIconFeedback = () => <IconFeedback size={18} />

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
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile, signOut } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [authError, setAuthError] = useState(false)
  // Tab aus URL lesen → überlebt Reload und Browser-Back
  const activeTab = searchParams.get('tab') || 'ablauf'
  function setActiveTab(tab) {
    setSearchParams(tab === 'ablauf' ? {} : { tab }, { replace: true })
  }

  useEffect(() => { loadFestivalInfo() }, [id])

  async function loadFestivalInfo() {
    setFetchError(false)
    setAuthError(false)
    setNotFound(false)
    const cacheKey = `festival_${id}`
    const cached = cacheGet(cacheKey)
    if (cached) { setData(cached); setLoading(false) }

    const { data: rpcData, error, isAuthError } = await fetchWithTimeout(
      supabase.rpc('get_my_festival_info', { p_festival_id: id })
    )
    if (!error && rpcData) {
      setData(rpcData)
      cacheSet(cacheKey, rpcData, 8 * 60 * 60 * 1000)
    } else if (error) {
      console.error('[FestivalPage] RPC Fehler:', error.message, error)
      if (isAuthError) setAuthError(true)
      else if (!cached) setFetchError(true)
    } else if (!rpcData && !cached) {
      // Kein Fehler, aber auch keine Daten → kein Zugriff auf dieses Festival
      console.warn('[FestivalPage] RPC lieferte null für festival_id:', id)
      setNotFound(true)
    }
    if (!cached) setLoading(false)
  }

  if (loading) return <div className="loading">Lädt Festival-Infos...</div>
  if (authError) return (
    <div className="page" style={{ paddingTop: 'var(--sp-8)', textAlign: 'center' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IconStar size={36} /></div>
      <p className="card-sub" style={{ marginBottom: 20 }}>
        Deine Sitzung ist abgelaufen. Bitte melde dich neu an.
      </p>
      <button className="button" onClick={signOut}>Neu anmelden</button>
      <div style={{ marginTop: 20 }}><Link to="/">← Zurück</Link></div>
    </div>
  )
  if (notFound) return (
    <div className="page" style={{ paddingTop: 'var(--sp-8)', textAlign: 'center' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IconLupe size={36} /></div>
      <p className="card-sub" style={{ marginBottom: 20 }}>
        Festival nicht gefunden oder kein Zugriff.
      </p>
      <div style={{ marginTop: 20 }}><Link to="/">← Zurück</Link></div>
    </div>
  )
  if (fetchError || (data && data.error)) return (
    <div className="page" style={{ paddingTop: 'var(--sp-8)', textAlign: 'center' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IconStar size={36} /></div>
      <p className="card-sub" style={{ marginBottom: 20 }}>Verbindung unterbrochen.</p>
      <button className="button" onClick={loadFestivalInfo}>Nochmal versuchen</button>
      <div style={{ marginTop: 20 }}><Link to="/">← Zurück</Link></div>
    </div>
  )
  if (!data) return null

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
        <IconStar size={16} />
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
          <InfosTab details={details} role={role} content={data.content} />
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
                  <IconKontakte size={32} />
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
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><IconKontakte size={32} /></div>
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
          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}><IconAblauf size={36} /></div>
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
            <span style={{ color: 'var(--grau-text)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <svg role="presentation" focusable="false" width="8" height="6" viewBox="0 0 8 6"
                style={{
                  display: 'block',
                  transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s ease',
                }}>
                <path d="m1 1.5 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
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

// ── InfosTab ──────────────────────────────────────────────────────────────────

function InfosTab({ details, role, content }) {
  const isLeadOp        = role === 'lead' || role === 'operator'
  const isKitchenVisible = role === 'catering' || role === 'operator' || role === 'lead'

  const lbl = {
    fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: 'var(--grau-text)', marginBottom: 3,
  }
  const val = { fontSize: 14, fontWeight: 600 }
  const valMulti = { fontSize: 14, fontWeight: 600, whiteSpace: 'pre-wrap', lineHeight: 1.6 }
  const linkStyle = {
    fontSize: 14, fontWeight: 700, color: 'var(--schwarz)', textDecoration: 'underline',
  }
  const ghost = { fontSize: 14, fontWeight: 600, color: 'var(--grau-text)', fontStyle: 'italic' }

  // Betrieb-Sektion nur anzeigen wenn mindestens ein Feld befüllt ist
  const hasBetrieb = details.shift_table_link || details.goldeimer_hours ||
    details.goldeimer_prices || details.festival_money_info ||
    (isLeadOp && details.festival_actions) ||
    (isKitchenVisible && details.kitchen_crew_list) ||
    (isLeadOp && details.logistic_info)

  return (
    <div>

      {/* ── Deine Zeiten ── */}
      <div className="section-title">Deine Zeiten</div>
      <div className="card">
        <ul className="info-list">
          <li>
            <span className="info-icon"><IconKalender size={22}/></span>
            <div>
              <div style={lbl}>Anreise</div>
              <div style={val}>{getAnreise(details, role) || 'Wird noch bekannt gegeben'}</div>
            </div>
          </li>
          <li>
            <span className="info-icon"><IconKalender size={22}/></span>
            <div>
              <div style={lbl}>Abreise</div>
              <div style={val}>{getAbreise(details, role) || 'Wird noch bekannt gegeben'}</div>
            </div>
          </li>
          {details.festival_town && (
            <li>
              <span className="info-icon"><IconPin size={22}/></span>
              <div>
                <div style={lbl}>Ort</div>
                <div style={val}>{details.festival_town}</div>
              </div>
            </li>
          )}
          {details.festival_address && (
            <li>
              <span className="info-icon"><IconPin size={22}/></span>
              <div>
                <div style={lbl}>Anschrift</div>
                <div style={valMulti}>{details.festival_address}</div>
              </div>
            </li>
          )}
        </ul>
      </div>

      {/* ── Festival ── */}
      <div className="section-title">Festival</div>
      <div className="card">
        <ul className="info-list">

          {/* Lageplan: immer anzeigen — "Folgt" als Platzhalter wenn leer */}
          <li>
            <span className="info-icon"><IconPin size={22}/></span>
            <div>
              <div style={lbl}>Lageplan</div>
              {details.festival_lageplan
                ? <a href={details.festival_lageplan} target="_blank" rel="noopener noreferrer" style={linkStyle}>Karte öffnen ↗</a>
                : <div style={ghost}>Folgt</div>
              }
            </div>
          </li>

          {details.need_total && (
            <li>
              <span className="info-icon"><IconKontakte size={22}/></span>
              <div>
                <div style={lbl}>Crew-Größe</div>
                <div style={val}>{details.need_total} Personen</div>
              </div>
            </li>
          )}

          {isLeadOp && details.link_crew_list && (
            <li>
              <span className="info-icon"><IconStift size={22}/></span>
              <div>
                <div style={lbl}>Crew-Liste</div>
                <a href={details.link_crew_list} target="_blank" rel="noopener noreferrer" style={linkStyle}>Liste öffnen ↗</a>
              </div>
            </li>
          )}

        </ul>
      </div>

      {/* ── Betrieb ── */}
      {hasBetrieb && (
        <>
          <div className="section-title">Betrieb</div>
          <div className="card">
            <ul className="info-list">

              {details.shift_table_link && (
                <li>
                  <span className="info-icon"><IconKalender size={22}/></span>
                  <div>
                    <div style={lbl}>Schichtplan</div>
                    <a href={details.shift_table_link} target="_blank" rel="noopener noreferrer" style={linkStyle}>Plan öffnen ↗</a>
                  </div>
                </li>
              )}

              {details.goldeimer_hours && (
                <li>
                  <span className="info-icon"><IconAblauf size={22}/></span>
                  <div>
                    <div style={lbl}>Goldeimer Öffnungszeiten</div>
                    <div style={valMulti}>{details.goldeimer_hours}</div>
                  </div>
                </li>
              )}

              {details.goldeimer_prices && (
                <li>
                  <span className="info-icon"><IconStar size={22}/></span>
                  <div>
                    <div style={lbl}>Preise</div>
                    <div style={valMulti}>{details.goldeimer_prices}</div>
                  </div>
                </li>
              )}

              {details.festival_money_info && (
                <li>
                  <span className="info-icon"><IconOrderbird size={22}/></span>
                  <div>
                    <div style={lbl}>Kassensystem</div>
                    <div style={valMulti}>{details.festival_money_info}</div>
                  </div>
                </li>
              )}

              {isLeadOp && details.festival_actions && (
                <li>
                  <span className="info-icon"><IconStar size={22}/></span>
                  <div>
                    <div style={lbl}>Aktionen</div>
                    <div style={valMulti}>{details.festival_actions}</div>
                  </div>
                </li>
              )}

              {isKitchenVisible && details.kitchen_crew_list && (
                <li>
                  <span className="info-icon"><IconStar size={22}/></span>
                  <div>
                    <div style={lbl}>Küche</div>
                    <a href={details.kitchen_crew_list} target="_blank" rel="noopener noreferrer" style={linkStyle}>Liste öffnen ↗</a>
                  </div>
                </li>
              )}

              {isLeadOp && details.logistic_info && (
                <li>
                  <span className="info-icon"><IconTransport size={22}/></span>
                  <div>
                    <div style={lbl}>Logistik-Infos</div>
                    <div style={valMulti}>{details.logistic_info}</div>
                  </div>
                </li>
              )}

            </ul>
          </div>
        </>
      )}

      {/* ── Sonstiges ── */}
      {details.festival_sonstiges && (
        <>
          <div className="section-title">Sonstiges</div>
          <div className="card">
            <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--schwarz)' }}>
              {details.festival_sonstiges}
            </div>
          </div>
        </>
      )}

      {/* ── Dokumente (aus content-Tabelle) ── */}
      {content && content.length > 0 && (
        <>
          <div className="section-title">Dokumente</div>
          {content.map(c => (
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
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IconStar size={40} /></div>
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
