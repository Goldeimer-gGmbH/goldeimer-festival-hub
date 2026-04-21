import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import { cacheGet, cacheSet } from '../lib/cache'

const ROLLE_LABEL = {
  lead: 'Lead', operator: 'Operator',
  supporti_plus: 'Supporti+', supporti: 'Supporti', catering: 'Catering'
}

export default function FestivalPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => { loadFestivalInfo() }, [id])

  async function loadFestivalInfo() {
    const cacheKey = `festival_${id}`

    // Gecachte Daten sofort zeigen → Festival-Seite öffnet ohne Wartezeit
    const cached = cacheGet(cacheKey)
    if (cached) {
      setData(cached)
      setLoading(false)
    }

    const { data, error } = await supabase.rpc('get_my_festival_info', { p_festival_id: id })
    if (!error && data) {
      setData(data)
      cacheSet(cacheKey, data)   // 10 Min TTL
    }
    if (!cached) setLoading(false)
  }

  if (loading) return <div className="loading">Lädt Festival-Infos...</div>
  if (!data || data.error) return (
    <div className="page">
      <p style={{ color: 'var(--rot)' }}>Fehler: Bist du für dieses Festival zugewiesen?</p>
      <Link to="/">← Zurück</Link>
    </div>
  )

  const details = data.festival?.details || {}
  const role = data.assignment_role

  const tabs = [
    { key: 'info',      label: 'INFO',      icon: '📋' },
    { key: 'kontakte',  label: 'KONTAKTE',  icon: '📞' },
    { key: 'checkliste',label: 'CHECKS',    icon: '✅' },
    { key: 'feedback',  label: 'FEEDBACK',  icon: '💬' },
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
              padding: '11px 2px',
              border: 'none',
              borderRight: '1px solid var(--grau)',
              background: activeTab === tab.key ? 'var(--gelb)' : 'var(--weiss)',
              fontSize: 9,
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
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="page" style={{ paddingTop: 18 }}>

        {/* ── INFO ── */}
        {activeTab === 'info' && (
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
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Notfallnummer</div>
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

        {/* ── CHECKLISTE ── */}
        {activeTab === 'checkliste' && (
          <ChecklistTab festivalId={id} profileId={profile.id} checklists={data.checklists} />
        )}

        {/* ── FEEDBACK ── */}
        {activeTab === 'feedback' && (
          <FeedbackTab festivalId={id} profileId={profile.id} />
        )}
      </div>
    </div>
  )
}

function ChecklistTab({ festivalId, profileId, checklists }) {
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

  if (loading) return <div className="loading">Lädt Checklisten...</div>

  if (!checklists || checklists.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
        <p className="card-sub">Noch keine Checklisten für dieses Festival.</p>
      </div>
    )
  }

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
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 800,
              }}>
                {doneCount}/{clItems.length}
              </span>
            </div>

            {/* Progress bar */}
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

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d)) return dateStr
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return dateStr }
}
