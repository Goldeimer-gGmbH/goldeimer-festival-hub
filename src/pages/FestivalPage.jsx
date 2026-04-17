import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'

export default function FestivalPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    loadFestivalInfo()
  }, [id])

  async function loadFestivalInfo() {
    const { data, error } = await supabase.rpc('get_my_festival_info', {
      p_festival_id: id
    })
    if (!error && data) setData(data)
    setLoading(false)
  }

  if (loading) return <div className="loading">Lädt Festival-Infos...</div>
  if (!data || data.error) return (
    <div className="page">
      <p style={{ color: 'var(--rot)' }}>Fehler beim Laden. Bist du für dieses Festival zugewiesen?</p>
      <Link to="/">← Zurück</Link>
    </div>
  )

  const details = data.festival?.details || {}
  const role = data.assignment_role
  const isLead = ['lead', 'operator'].includes(role)

  return (
    <div>
      {/* Header */}
      <div className="header">
        <Link to="/" style={{ textDecoration: 'none', fontSize: 20, color: 'var(--schwarz)' }}>←</Link>
        <h1 style={{ fontSize: 16 }}>{data.festival?.name}</h1>
        <span style={{ width: 20 }} />
      </div>

      {/* Festival-Bar */}
      <div className="festival-bar">
        <span>🎪</span>
        <span>{details.festival_town || ''}</span>
        {details.start_official && (
          <span style={{ marginLeft: 'auto', opacity: 0.8 }}>
            {formatDate(details.start_official)}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--weiss)', borderBottom: '1px solid #eee' }}>
        {['info', 'kontakte', 'checkliste', 'feedback'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px 4px',
              border: 'none',
              background: 'none',
              fontSize: 13,
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? 'var(--schwarz)' : 'var(--grau-dunkel)',
              borderBottom: activeTab === tab ? '2px solid var(--gelb)' : '2px solid transparent',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'info' ? '📋 Info' :
             tab === 'kontakte' ? '📞 Kontakte' :
             tab === 'checkliste' ? '✅ Checks' : '💬 Feedback'}
          </button>
        ))}
      </div>

      <div className="page" style={{ paddingTop: 16 }}>

        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div>
            {/* Meine Zeiten */}
            <div className="section-title">Deine Zeiten</div>
            <div className="card">
              <ul className="info-list">
                <li>
                  <span className="info-icon">📅</span>
                  <div>
                    <strong>Anreise</strong>
                    <div style={{ fontSize: 13, color: 'var(--grau-dunkel)', marginTop: 2 }}>
                      {getAnreise(details, role) || 'Wird noch bekannt gegeben'}
                    </div>
                  </div>
                </li>
                <li>
                  <span className="info-icon">🏠</span>
                  <div>
                    <strong>Abreise</strong>
                    <div style={{ fontSize: 13, color: 'var(--grau-dunkel)', marginTop: 2 }}>
                      {getAbreise(details, role) || 'Wird noch bekannt gegeben'}
                    </div>
                  </div>
                </li>
                {details.festival_town && (
                  <li>
                    <span className="info-icon">📍</span>
                    <div>
                      <strong>Ort</strong>
                      <div style={{ fontSize: 13, color: 'var(--grau-dunkel)', marginTop: 2 }}>
                        {details.festival_town}
                      </div>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            {/* Inhalte */}
            {data.content && data.content.length > 0 && (
              <>
                <div className="section-title">Infos & Dokumente</div>
                {data.content.map(c => (
                  <div key={c.id} className="card">
                    <div className="card-title">{c.title}</div>
                    {c.body && (
                      <div style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8, color: '#333', whiteSpace: 'pre-wrap' }}>
                        {c.body}
                      </div>
                    )}
                    {c.file_url && (
                      <a
                        href={c.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ marginTop: 12, textDecoration: 'none' }}
                      >
                        📄 Dokument öffnen
                      </a>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* KONTAKTE TAB */}
        {activeTab === 'kontakte' && (
          <div>
            {/* Notfallnummern aus Festival-Details */}
            {(details.emergency_number || details.notfall) && (
              <>
                <div className="section-title">Notfall</div>
                <div className="card" style={{ borderLeft: '4px solid var(--rot)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>🚨</span>
                    <div>
                      <div className="card-title">Notfallnummer</div>
                      <a
                        href={`tel:${details.emergency_number || details.notfall}`}
                        style={{ fontSize: 20, fontWeight: 700, color: 'var(--rot)', textDecoration: 'none' }}
                      >
                        {details.emergency_number || details.notfall}
                      </a>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Lead-Kontakte (für alle sichtbar) */}
            {data.leads && data.leads.length > 0 && (
              <>
                <div className="section-title">Deine Leads</div>
                {data.leads.map((lead, i) => (
                  <div key={i} className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'var(--gelb)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 18, flexShrink: 0
                      }}>
                        {(lead.full_name || lead.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="card-title">{lead.full_name || lead.email}</div>
                        <a
                          href={`mailto:${lead.email}`}
                          style={{ fontSize: 13, color: 'var(--grau-dunkel)', textDecoration: 'none' }}
                        >
                          {lead.email}
                        </a>
                      </div>
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

        {/* CHECKLISTE TAB */}
        {activeTab === 'checkliste' && (
          <ChecklistTab festivalId={id} profileId={profile.id} checklists={data.checklists} />
        )}

        {/* FEEDBACK TAB */}
        {activeTab === 'feedback' && (
          <FeedbackTab festivalId={id} profileId={profile.id} />
        )}
      </div>
    </div>
  )
}

// --- Checkliste Komponente ---
function ChecklistTab({ festivalId, profileId, checklists }) {
  const [items, setItems] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (checklists && checklists.length > 0) {
      loadItems()
    } else {
      setLoading(false)
    }
  }, [checklists])

  async function loadItems() {
    const checklistIds = checklists.map(c => c.id)
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .in('checklist_id', checklistIds)
      .eq('profile_id', profileId)
      .order('sort_order')

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
    const { error } = await supabase
      .from('checklist_items')
      .update({
        is_checked: newVal,
        checked_at: newVal ? new Date().toISOString() : null
      })
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

        return (
          <div key={cl.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="card-title">{cl.title}</div>
              <span style={{ fontSize: 13, color: 'var(--grau-dunkel)' }}>
                {doneCount}/{clItems.length}
              </span>
            </div>

            {cl.description && (
              <p style={{ fontSize: 13, color: 'var(--grau-dunkel)', marginBottom: 12 }}>{cl.description}</p>
            )}

            {clItems.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--grau-dunkel)' }}>Keine Punkte vorhanden.</p>
            ) : (
              clItems.map(item => (
                <div
                  key={item.id}
                  className="check-item"
                  onClick={() => toggleItem(item)}
                >
                  <div className={`check-box ${item.is_checked ? 'checked' : ''}`}>
                    {item.is_checked && '✓'}
                  </div>
                  <span className={`check-label ${item.is_checked ? 'checked' : ''}`}>
                    {item.label}
                  </span>
                </div>
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}

// --- Feedback Komponente ---
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
      festival_id: festivalId,
      profile_id: profileId,
      log_type: type,
      data: { text: text.trim() }
    })

    if (!error) {
      setSent(true)
      setText('')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🙌</div>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Danke für dein Feedback!</p>
        <p className="card-sub">Es wurde gespeichert und wird von uns gelesen.</p>
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => setSent(false)}>
          Weiteres Feedback senden
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <p style={{ fontSize: 14, color: 'var(--grau-dunkel)', marginBottom: 16, lineHeight: 1.5 }}>
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
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Was ist passiert? Was hat gut / nicht gut funktioniert?"
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading || !text.trim()}>
            {loading ? 'Wird gesendet...' : 'Feedback senden'}
          </button>
        </form>
      </div>
    </div>
  )
}

// --- Hilfsfunktionen ---
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
  } catch {
    return dateStr
  }
}
