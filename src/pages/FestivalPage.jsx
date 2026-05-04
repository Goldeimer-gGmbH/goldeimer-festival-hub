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

const FKP_FESTIVALS = ['hurricane', 'southside', 'deichbrand', 'highfield', "m'era luna", 'mera luna']
function isFkpFestival(name) {
  const lower = (name || '').toLowerCase()
  return FKP_FESTIVALS.some(f => lower.includes(f))
}

// Tab-Icons mit einheitlicher Größe
const TabIconAblauf   = () => <IconAblauf   size={20} />
const TabIconInfos    = () => <IconInfos    size={20} />
const TabIconKontakte = () => <IconKontakte size={20} />
const TabIconFeedback = () => <IconFeedback size={20} />

// ── Ablauf-Inhalte ────────────────────────────────────────────────────────────

function buildAnreisetagContent(festivalName) {
  const isFkp = isFkpFestival(festivalName)
  const items = [
    { text: 'Goldeimer-Standorte mit der Festival-Produktion gegengecheckt / die Standorte gezeigt' },
  ]
  if (isFkp) {
    items.push({
      text: 'Produktionsordnung von der Aufbau-Crew unterschreiben lassen und an die Festival-Produktion geben (nur FKP-Festivals)',
      extra: { label: 'Per E-Mail: arbeitsschutz-southside@fkpscorpio.com', email: 'arbeitsschutz-southside@fkpscorpio.com' },
    })
  }
  items.push(
    { text: 'Aufbau-Besprechung: Wann starten wir, wer baut welche Camps auf' },
    { text: 'Sicherheitseinweisung für alle am Aufbau beteiligten Personen → Link folgt' },
  )
  return items
}

const CONTENT_AUFBAUTAG = [
  { text: 'Aufbau der Toiletten (der frühe Vogel! 🐦)' },
  { text: 'Koffer für jedes Camp checken und vorbereiten' },
]

const CONTENT_TAG1 = [
  { text: 'Letzter Feinschliff an den Klos, Toiletten betriebsbereit machen' },
  { text: 'Koffer an Operator für jeden Camp rausgeben' },
  { text: 'Jedem Standort wurde ein nummeriertes elektronisches Zahlungsgerät zugewiesen → darauf achten, dass immer das gleiche nummerierte Zahlungsgerät pro Standort verwendet wird' },
  { text: '10 Uhr: Campingplatz- und Goldeimer-Öffnung' },
  { text: '15 Uhr: Welcome Meeting mit Newbies' },
  { text: '16 Uhr: Erste Supporti-Schichten' },
  { text: '23 Uhr: Crew Briefing' },
  { text: 'Bargeld abschöpfen' },
  { text: 'Nach Betriebsschluss: Kassensturz mit allen Orderbirds machen' },
]

const CONTENT_TAG2 = [
  { section: true, text: 'Morgens' },
  { text: 'Koffer an Frühschicht rausgeben' },
  { text: 'Info in die Crew-Gruppe schreiben mit aktualisierten Preisen (Kreideschilder anpassen) und Infos für den Tag' },
  { section: true, text: 'Tagsüber' },
  { text: 'Bargeld abschöpfen und in beschrifteten Beuteln sichern' },
  { text: 'Bestell-Listen (Bauzäune, Strom) bei Festival-Produktion unterschreiben' },
  { text: 'Benötigte IBC-Abpumpungen frühzeitig mit Urin-Dienstleister koordinieren. Spätestens, wenn der erste IBC voll ist und der zweite angebrochen wird.' },
  { text: 'Bargeld nochmal abschöpfen und in beschrifteten Beuteln sichern' },
  { text: 'Bargeld bei FKP einzahlen' },
  { section: true, text: 'Nach Betriebsschluss' },
  { text: 'Koffer entgegennehmen' },
  { text: 'Kassensturz mit allen Orderbirds → How-to-Orderbird-Anleitung' },
  { text: 'Lead-Koffer für den nächsten Tag fertigmachen' },
]

const CONTENT_TAG_MITTE = [
  { text: 'Koffer an Frühschicht rausgeben' },
  { text: 'Info in die Crew-Gruppe schreiben mit aktualisierten Preisen (Kreideschilder anpassen) und Infos für den Tag' },
  { text: 'Bargeld abschöpfen und ggf. einzahlen' },
  { text: 'Koffer entgegennehmen' },
  { text: 'Kassensturz' },
]

const CONTENT_VORLETZTER_TAG = [
  { text: 'Koffer an Frühschicht rausgeben' },
  { text: 'Info in die Crew-Gruppe schreiben mit aktualisierten Preisen (Kreideschilder anpassen) und Infos für den Tag' },
  { text: 'Die letzte IBC-Abpumpung wird frühzeitig angemeldet (für zeitige Abreise)' },
  { text: 'Mit der Spedition ist abgesprochen, wann und an welchem zentralen Punkt die FSBs aller Module eingeladen werden können' },
  { text: 'Abbau-Besprechung mit Operators + Küche' },
  { text: 'Koffer entgegennehmen' },
]

const CONTENT_LETZTER_TAG = [
  { text: 'Koffer an Frühschicht rausgeben' },
  { text: 'Info in die Crew-Gruppe schreiben mit aktualisierten Preisen (Kreideschilder anpassen) und Infos für den Tag' },
  { text: 'Abbau' },
]

// Erzeugt die Tages-Liste dynamisch aus den Festival-Datumfeldern
function generateAblaufDays(details, role, festivalName) {
  const days = []
  const isLeadOp = role === 'lead' || role === 'operator'
  if (!isLeadOp) return days

  if (details.start_leadop) {
    days.push({
      type: 'anreisetag',
      label: 'Anreisetag',
      date: details.start_leadop,
      todo: 'Vorbereitung',
      content: buildAnreisetagContent(festivalName),
    })
  }

  if (details.start_setup) {
    days.push({
      type: 'aufbautag',
      label: 'Aufbautag',
      date: details.start_setup,
      todo: 'Aufbau',
      content: CONTENT_AUFBAUTAG,
    })
  }

  const suppStart = parseDeDate(details.start_supp)
  const suppEnd   = parseDeDate(details.end_supp)

  if (suppStart && suppEnd) {
    const MS_DAY   = 24 * 60 * 60 * 1000
    const totalDays = Math.round((suppEnd - suppStart) / MS_DAY) + 1

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(suppStart.getTime() + i * MS_DAY)
      const dateStr = toDeDate(d)

      let type, label, todo, content

      if (i === 0) {
        type = 'tag1'; todo = 'Betriebsstart'; content = CONTENT_TAG1
      } else if (i === totalDays - 1) {
        type = 'letzter'; todo = 'Letzte Schicht & Abbau'; content = CONTENT_LETZTER_TAG
      } else if (totalDays > 2 && i === totalDays - 2) {
        type = 'vorletzter'; todo = 'Regelbetrieb vorletzter Tag'; content = CONTENT_VORLETZTER_TAG
      } else if (i === 1) {
        type = 'tag2'; todo = 'Regelbetrieb'; content = CONTENT_TAG2
      } else {
        type = 'mitte'; todo = 'Regelbetrieb'; content = CONTENT_TAG_MITTE
      }

      label = i === totalDays - 1 ? 'Abreisetag' : `Goldeimer-Tag ${i + 1}`

      days.push({ type, label, date: dateStr, todo, content })
    }
  }

  return days
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function FestivalPage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile, signOut } = useAuth()
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [notFound, setNotFound]   = useState(false)
  const [authError, setAuthError] = useState(false)

  const activeTab = searchParams.get('tab') || 'ablauf'
  function setActiveTab(tab) {
    setSelectedDay(null)   // Drill-down schließen beim Tab-Wechsel
    setSearchParams(tab === 'ablauf' ? {} : { tab }, { replace: true })
  }

  // Ablauf-Drill-down-State: hier oben damit der Header-Pfeil darauf zugreifen kann
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => { loadFestivalInfo() }, [id])

  async function loadFestivalInfo() {
    setFetchError(false); setAuthError(false); setNotFound(false)
    const cacheKey = `festival_${id}`
    const cached = cacheGet(cacheKey)
    if (cached) { setData(cached); setLoading(false) }

    try {
      const { data: rpcData, error, isAuthError } = await fetchWithTimeout(
        supabase.rpc('get_my_festival_info', { p_festival_id: id })
      )
      if (!error && rpcData) {
        setData(rpcData)
        cacheSet(cacheKey, rpcData, 48 * 60 * 60 * 1000)
      } else if (error) {
        if (isAuthError) setAuthError(true)
        else if (!cached) setFetchError(true)
      } else if (!rpcData && !cached) {
        setNotFound(true)
      }
    } catch {
      if (!cached) setFetchError(true)
    } finally {
      if (!cached) setLoading(false)
    }
  }

  if (loading) return <div className="loading">Lädt Festival-Infos...</div>
  if (authError) return (
    <div className="page" style={{ paddingTop: 'var(--sp-8)', textAlign: 'center' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IconStar size={36} /></div>
      <p className="card-sub" style={{ marginBottom: 20 }}>Deine Sitzung ist abgelaufen. Bitte melde dich neu an.</p>
      <button className="button" onClick={signOut}>Neu anmelden</button>
      <div style={{ marginTop: 20 }}><Link to="/">← Zurück</Link></div>
    </div>
  )
  if (notFound) return (
    <div className="page" style={{ paddingTop: 'var(--sp-8)', textAlign: 'center' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IconLupe size={36} /></div>
      <p className="card-sub" style={{ marginBottom: 20 }}>Festival nicht gefunden oder kein Zugriff.</p>
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

  const details     = data.festival?.details || {}
  const role        = data.assignment_role
  const festivalName = data.festival?.name || ''

  const tabs = [
    { key: 'ablauf',   label: 'Ablauf',    Icon: TabIconAblauf },
    { key: 'infos',    label: 'Infos',     Icon: TabIconInfos },
    { key: 'kontakte', label: 'Kontakte',  Icon: TabIconKontakte },
    { key: 'feedback', label: 'Feedback',  Icon: TabIconFeedback },
  ]

  return (
    <div style={{ background: 'var(--papier)', minHeight: '100dvh' }}>
      {/* ── Logo-Header (cremefarben) ── */}
      <div className="header">
        {/* Auf der Tages-Unterseite: zurück zur Tagesliste; sonst: zurück zur Startseite */}
        {selectedDay ? (
          <button
            onClick={() => setSelectedDay(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, fontWeight: 700, color: 'var(--schwarz)', padding: 0, lineHeight: 1 }}
          >
            ←
          </button>
        ) : (
          <Link to="/" style={{ textDecoration: 'none', fontSize: 20, color: 'var(--schwarz)', fontWeight: 700, lineHeight: 1 }}>
            ←
          </Link>
        )}
        <img src="/goldeimer-logo.png" alt="Goldeimer" style={{ height: 36 }} />
        <span style={{ width: 26 }} />
      </div>

      {/* ── Festival-Hero (schwarz → Welle → papier) ── */}
      <div style={{
        background: 'var(--schwarz)',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '14px var(--sp-4) 0' }}>
          <div
            className="statement"
            style={{ fontSize: 'var(--text-h1)', color: 'var(--papier)', lineHeight: 1.05, letterSpacing: '-0.01em' }}
          >
            {festivalName.toUpperCase()}
          </div>
          <div style={{ marginTop: 10, marginBottom: 'var(--sp-5)' }}>
            <span style={{
              background: 'var(--gruen)',
              color: 'var(--weiss)',
              padding: '3px 10px',
              borderRadius: 'var(--rounded-full)',
              fontSize: 11,
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {ROLLE_LABEL[role] || role}
            </span>
          </div>
        </div>
        <svg viewBox="0 0 480 48" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 40, marginBottom: -2 }}>
          <path d="M0,24 C80,48 160,6 260,28 C340,44 420,8 480,20 L480,48 L0,48 Z"
            fill="var(--papier)" />
        </svg>
      </div>

      {/* ── Tab-Inhalt ── */}
      <div
        className="page"
        style={{
          paddingTop: 16,
          paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 16px))',
          minHeight: 'auto',
          background: 'var(--papier)',
        }}
      >
        {activeTab === 'ablauf' && (
          <AblaufTab
            role={role}
            festivalId={id}
            profileId={profile.id}
            checklists={data.checklists}
            content={data.content}
            festivalName={festivalName}
            details={details}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
          />
        )}

        {activeTab === 'infos' && (
          <InfosTab details={details} role={role} content={data.content} />
        )}

        {activeTab === 'kontakte' && (
          <KontakteTab details={details} contacts={data.contacts} role={role} />
        )}

        {activeTab === 'feedback' && (
          <FeedbackTab festivalId={id} profileId={profile.id} />
        )}
      </div>

      {/* ── Bottom-Navigation (fest unten) ── */}
      {/* Äußere Box: schwarzer Hintergrund über volle Breite */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--schwarz)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        zIndex: 200,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {/* Innere Box: Buttons auf max. 480px zentriert — wie der Seiten-Content */}
        <div style={{
          display: 'flex',
          maxWidth: 480,
          margin: '0 auto',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '9px 2px 11px',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.key ? 'var(--gelb)' : 'var(--papier)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                fontSize: 9,
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                transition: 'color 0.15s',
              }}
            >
              <tab.Icon />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── AblaufTab ─────────────────────────────────────────────────────────────────

function AblaufTab({ role, festivalId, profileId, checklists, festivalName, details, selectedDay, setSelectedDay }) {
  const isLeadOp = role === 'lead' || role === 'operator'

  const ablaufTitle =
    role === 'lead'     ? 'Ablauf für Leads' :
    role === 'operator' ? 'Ablauf für Operator' :
    role === 'catering' ? 'Ablauf für Küchencrew' :
                          'Ablauf für Supportis'

  // Drill-down-Ansicht: einzelner Tag (Pfeil ist im Header der Seite)
  if (selectedDay) {
    return <AblaufDayDetail day={selectedDay} />
  }

  if (!isLeadOp) {
    return (
      <div>
        <div style={{
          fontFamily: 'var(--font-statement)',
          fontSize: 'var(--text-h2)',
          lineHeight: 1.2,
          marginBottom: 'var(--sp-5)',
        }}>
          {ablaufTitle}
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
            <IconAblauf size={36} />
          </div>
          <div className="card-title" style={{ marginBottom: 6 }}>Kommt bald</div>
          <p className="card-sub">
            Der Ablauf für {role === 'catering' ? 'Küchencrew' : 'Supportis'} folgt in Kürze.
          </p>
        </div>
        {checklists && checklists.length > 0 && (
          <>
            <div className="section-title" style={{ marginTop: 8 }}>Checklisten</div>
            <ChecklistSection festivalId={festivalId} profileId={profileId} checklists={checklists} />
          </>
        )}
      </div>
    )
  }

  const days = generateAblaufDays(details, role, festivalName)

  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-statement)',
        fontSize: 'var(--text-h2)',
        lineHeight: 1.2,
        marginBottom: 'var(--sp-5)',
      }}>
        {ablaufTitle}
      </div>

      {days.map((day, idx) => (
        <button
          key={idx}
          onClick={() => setSelectedDay(day)}
          style={{
            width: '100%',
            background: 'var(--weiss)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--rounded)',
            padding: '13px var(--sp-4)',
            marginBottom: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textAlign: 'left',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Zeitpunkt + Datum */}
          <div style={{ flex: '0 0 100px' }}>
            <div style={{
              fontSize: 11,
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: 'var(--schwarz)',
              letterSpacing: '0.02em',
            }}>
              {day.label}
            </div>
            {day.date && (
              <div style={{ fontSize: 11, color: 'var(--grau-text)', marginTop: 2 }}>
                {formatDateShort(day.date)}
              </div>
            )}
          </div>

          {/* Trennlinie */}
          <div style={{ width: 1, height: 30, background: 'var(--border)', flexShrink: 0 }} />

          {/* To-Do */}
          <div style={{
            flex: 1,
            fontWeight: 700,
            fontSize: 'var(--text-sm)',
            color: 'var(--schwarz)',
            fontFamily: 'var(--font-heading)',
          }}>
            {day.todo}
          </div>

          {/* Pfeil */}
          <span style={{ color: 'var(--grau-text)', fontSize: 16, flexShrink: 0 }}>→</span>
        </button>
      ))}

      {/* Checklisten am Ende */}
      {checklists && checklists.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 8 }}>Checklisten</div>
          <ChecklistSection festivalId={festivalId} profileId={profileId} checklists={checklists} />
        </>
      )}
    </div>
  )
}

// ── Tages-Detailansicht ───────────────────────────────────────────────────────

function AblaufDayDetail({ day }) {
  return (
    <div>
      {/* Titel (Pfeil ist im Seiten-Header) */}
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <div style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--grau-text)',
          fontFamily: 'var(--font-heading)',
          marginBottom: 4,
        }}>
          {day.label}{day.date ? ` · ${formatDateShort(day.date)}` : ''}
        </div>
        <div style={{
          fontFamily: 'var(--font-statement)',
          fontSize: 'var(--text-h2)',
          color: 'var(--schwarz)',
          lineHeight: 1.2,
        }}>
          {day.todo}
        </div>
      </div>

      <div className="card">
        {day.content.map((item, i) => {
          if (item.section) {
            return (
              <div key={i} style={{
                fontWeight: 800,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--grau-text)',
                fontFamily: 'var(--font-heading)',
                marginTop: i > 0 ? 18 : 0,
                marginBottom: 10,
              }}>
                {item.text}
              </div>
            )
          }
          return (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--gelb)',
                border: '1.5px solid var(--schwarz)',
                marginTop: 5,
                flexShrink: 0,
              }} />
              <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--schwarz)' }}>
                {item.text}
                {item.extra && (
                  <div style={{ marginTop: 4 }}>
                    <a
                      href={`mailto:${item.extra.email}`}
                      style={{ fontSize: 13, color: 'var(--grau-text)', wordBreak: 'break-all' }}
                    >
                      {item.extra.label}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── ChecklistSection ──────────────────────────────────────────────────────────

function ChecklistSection({ festivalId, profileId, checklists }) {
  const [items, setItems]   = useState({})
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
        const clItems  = items[cl.id] || []
        const doneCount = clItems.filter(i => i.is_checked).length
        const pct       = clItems.length ? Math.round((doneCount / clItems.length) * 100) : 0

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

// ── KontakteTab ───────────────────────────────────────────────────────────────

const ROLLE_LABEL_KONTAKT = { lead: 'Lead', operator: 'Operator' }

// Telefonnummer aus einem Freitext extrahieren und als klickbaren Link rendern.
// Alles andere wird als normaler Text angezeigt.
function PhoneText({ text }) {
  if (!text) return null
  // Matcht gängige Nummernformate: +49..., 0..., mit Leerzeichen/Bindestrichen
  const phoneRegex = /(\+?[\d][\d\s\-/]{6,}[\d])/g
  const parts = []
  let last = 0
  let match
  while ((match = phoneRegex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const raw = match[1].replace(/[\s\-/]/g, '')
    parts.push(
      <a key={match.index} href={`tel:${raw}`}
        style={{ color: 'var(--schwarz)', fontWeight: 700, textDecoration: 'underline' }}>
        {match[1]}
      </a>
    )
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <span>{parts}</span>
}

function ContactCard({ label, value, icon }) {
  if (!value) return null
  return (
    <div className="card" style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grau-text)', fontFamily: 'var(--font-heading)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--schwarz)', whiteSpace: 'pre-wrap' }}>
        <PhoneText text={value} />
      </div>
    </div>
  )
}

function KontakteTab({ details, contacts, role }) {
  const isLeadOp = role === 'lead' || role === 'operator'

  const hasAnyContent = details.telegram_link || (contacts && contacts.length > 0) ||
    (isLeadOp && details.production_mgmt) || (isLeadOp && details.urin_pump) ||
    details.awareness_team || (isLeadOp && details.vca_asp)

  return (
    <div>
      {/* Telegramgruppe – alle Rollen */}
      {details.telegram_link && (
        <>
          <div className="section-title">Telegramgruppe</div>
          <div className="card" style={{ marginBottom: 8 }}>
            <a
              href={details.telegram_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 700, fontSize: 14, color: 'var(--schwarz)', textDecoration: 'underline', wordBreak: 'break-all' }}
            >
              {details.telegram_link} ↗
            </a>
          </div>
        </>
      )}

      {/* Kontaktpersonen (Leads + Operators) – alle Rollen */}
      {contacts && contacts.length > 0 && (
        <>
          <div className="section-title">Kontaktpersonen</div>
          {contacts.map((c, i) => (
            <div key={i} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: c.phone ? 6 : 0 }}>
                <div className="card-title" style={{ margin: 0 }}>{c.full_name || c.email}</div>
                <span style={{
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: 'var(--gruen)', color: 'var(--weiss)',
                  padding: '2px 7px', borderRadius: 4,
                }}>
                  {ROLLE_LABEL_KONTAKT[c.role] || c.role}
                </span>
              </div>
              {c.phone && (
                <a href={`tel:${c.phone.replace(/[\s\-/]/g, '')}`}
                  style={{ fontSize: 13, fontWeight: 700, color: 'var(--schwarz)', textDecoration: 'underline', display: 'block' }}>
                  {c.phone}
                </a>
              )}
              {!c.phone && c.email && (
                <a href={`mailto:${c.email}`}
                  style={{ fontSize: 12, color: 'var(--grau-text)', textDecoration: 'none', display: 'block', marginTop: 2 }}>
                  {c.email}
                </a>
              )}
            </div>
          ))}
        </>
      )}

      {/* Produktionsleitung – nur Leads + Operator */}
      {isLeadOp && details.production_mgmt && (
        <>
          <div className="section-title">Produktionsleitung</div>
          <ContactCard value={details.production_mgmt} />
        </>
      )}

      {/* Urinabpumpung – nur Leads + Operator */}
      {isLeadOp && details.urin_pump && (
        <>
          <div className="section-title">Urinabpumpung</div>
          <ContactCard value={details.urin_pump} />
        </>
      )}

      {/* Awareness-Team – alle Rollen */}
      {details.awareness_team && (
        <>
          <div className="section-title">Awareness-Team</div>
          <ContactCard value={details.awareness_team} />
        </>
      )}

      {/* VcA-ASP – nur Leads + Operator */}
      {isLeadOp && details.vca_asp && (
        <>
          <div className="section-title">VcA-ASP</div>
          <ContactCard value={details.vca_asp} />
        </>
      )}

      {!hasAnyContent && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><IconKontakte size={32} /></div>
          <p className="card-sub">Kontakte werden noch eingetragen.</p>
        </div>
      )}
    </div>
  )
}

// ── InfosTab ──────────────────────────────────────────────────────────────────

function InfosTab({ details, role, content }) {
  const isLeadOp        = role === 'lead' || role === 'operator'
  const isKitchenVisible = role === 'catering' || role === 'operator' || role === 'lead'

  const lbl = { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grau-text)', marginBottom: 3 }
  const val = { fontSize: 14, fontWeight: 600 }
  const valMulti = { fontSize: 14, fontWeight: 600, whiteSpace: 'pre-wrap', lineHeight: 1.6 }
  const linkStyle = { fontSize: 14, fontWeight: 700, color: 'var(--schwarz)', textDecoration: 'underline' }
  const ghost = { fontSize: 14, fontWeight: 600, color: 'var(--grau-text)', fontStyle: 'italic' }

  const hasBetrieb = details.shift_table_link || details.goldeimer_hours ||
    details.goldeimer_prices || details.festival_money_info ||
    (isLeadOp && details.festival_actions) ||
    (isKitchenVisible && details.kitchen_crew_list) ||
    (isLeadOp && details.logistic_info)

  return (
    <div>
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
              <div><div style={lbl}>Ort</div><div style={val}>{details.festival_town}</div></div>
            </li>
          )}
          {details.festival_address && (
            <li>
              <span className="info-icon"><IconPin size={22}/></span>
              <div><div style={lbl}>Anschrift</div><div style={valMulti}>{details.festival_address}</div></div>
            </li>
          )}
        </ul>
      </div>

      <div className="section-title">Festival</div>
      <div className="card">
        <ul className="info-list">
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
              <div><div style={lbl}>Crew-Größe</div><div style={val}>{details.need_total} Personen</div></div>
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
                  <div><div style={lbl}>Goldeimer Öffnungszeiten</div><div style={valMulti}>{details.goldeimer_hours}</div></div>
                </li>
              )}
              {details.goldeimer_prices && (
                <li>
                  <span className="info-icon"><IconStar size={22}/></span>
                  <div><div style={lbl}>Preise</div><div style={valMulti}>{details.goldeimer_prices}</div></div>
                </li>
              )}
              {details.festival_money_info && (
                <li>
                  <span className="info-icon"><IconOrderbird size={22}/></span>
                  <div><div style={lbl}>Kassensystem</div><div style={valMulti}>{details.festival_money_info}</div></div>
                </li>
              )}
              {isLeadOp && details.festival_actions && (
                <li>
                  <span className="info-icon"><IconStar size={22}/></span>
                  <div><div style={lbl}>Aktionen</div><div style={valMulti}>{details.festival_actions}</div></div>
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
                  <div><div style={lbl}>Logistik-Infos</div><div style={valMulti}>{details.logistic_info}</div></div>
                </li>
              )}
            </ul>
          </div>
        </>
      )}

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
  const [text, setText]     = useState('')
  const [type, setType]     = useState('feedback')
  const [sent, setSent]     = useState(false)
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
  if (role === 'supporti')      return details.start_supp
  if (role === 'lead' || role === 'operator') return details.start_leadop
  if (role === 'catering')      return details.start_kitchen
  return null
}

function getAbreise(details, role) {
  if (role === 'supporti_plus') return details.end_takedown
  if (role === 'supporti')      return details.end_supp
  if (role === 'lead' || role === 'operator') return details.end_leadop
  if (role === 'catering')      return details.end_kitchen
  return null
}

function parseDeDate(str) {
  if (!str) return null
  const match = String(str).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (!match) return null
  const [, day, month, year] = match
  return new Date(+year, +month - 1, +day)
}

function toDeDate(d) {
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = parseDeDate(dateStr)
  if (!d) return dateStr
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = parseDeDate(dateStr)
    if (!d) return String(dateStr).split(' ')[0]
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return dateStr }
}
