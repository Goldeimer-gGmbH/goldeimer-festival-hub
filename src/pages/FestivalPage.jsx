import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import { cacheGet, cacheSet } from '../lib/cache'
import { fetchWithTimeout } from '../lib/fetchWithTimeout'
import {
  IconAblauf, IconInfos, IconKontakte,
  IconKalender, IconTransport, IconOrderbird, IconStift, IconLupe,
  IconStar, IconPin, IconBrief, IconTelefon,
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

  // ── 1. Vortage je nach Rolle ──────────────────────────────────────────────

  if (role === 'lead' || role === 'operator') {
    // Anreisetag nur für Lead/Operator
    if (details.start_leadop) {
      days.push({
        type: 'anreisetag',
        label: 'Anreisetag',
        date: details.start_leadop,
        todo: 'Vorbereitung',
        content: buildAnreisetagContent(festivalName),
      })
    }
    // Aufbautag für Lead/Operator
    if (details.start_setup) {
      days.push({
        type: 'aufbautag',
        label: 'Aufbautag',
        date: details.start_setup,
        todo: 'Aufbau',
        content: CONTENT_AUFBAUTAG,
      })
    }
  } else if (role === 'supporti_plus') {
    // Supporti Plus ist ab Aufbautag dabei, aber nicht beim Anreisetag
    if (details.start_setup) {
      days.push({
        type: 'aufbautag',
        label: 'Aufbautag',
        date: details.start_setup,
        todo: 'Aufbau',
        content: CONTENT_AUFBAUTAG,
      })
    }
  }

  // ── 2. Datumsspanne je nach Rolle bestimmen ───────────────────────────────

  let rangeStart, rangeEnd

  if (role === 'lead' || role === 'operator' || role === 'supporti_plus') {
    // Betrieb start_supp, Abbautag end_takedown (gewinnt wenn später als end_supp)
    const suppStart    = parseDeDate(details.start_supp)
    const suppEndDate  = parseDeDate(details.end_supp)
    const takedownDate = parseDeDate(details.end_takedown)
    rangeStart = suppStart
    rangeEnd   = (takedownDate && (!suppEndDate || takedownDate > suppEndDate))
      ? takedownDate
      : suppEndDate
  } else if (role === 'supporti') {
    rangeStart = parseDeDate(details.start_supp)
    rangeEnd   = parseDeDate(details.end_supp)
  } else if (role === 'catering') {
    rangeStart = parseDeDate(details.start_kitchen)
    rangeEnd   = parseDeDate(details.end_kitchen)
  }

  // ── 3. Betriebstage generieren ────────────────────────────────────────────

  if (rangeStart && rangeEnd) {
    const MS_DAY    = 24 * 60 * 60 * 1000
    const totalDays = Math.round((rangeEnd - rangeStart) / MS_DAY) + 1

    for (let i = 0; i < totalDays; i++) {
      const d       = new Date(rangeStart.getTime() + i * MS_DAY)
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
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [notFound, setNotFound]   = useState(false)
  const [authError, setAuthError] = useState(false)

  const activeTab = searchParams.get('tab') || 'ablauf'
  // Kein replace: push → Browser-Zurück funktioniert zwischen Tabs
  function setActiveTab(tab) {
    setSearchParams(tab === 'ablauf' ? {} : { tab })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Tag-Drill-down: in URL persistiert (Index), damit Browser-Zurück funktioniert
  const selectedDayIdx = parseInt(searchParams.get('day') ?? '-1', 10)
  function onSelectDay(idx) {
    setSearchParams({ day: String(idx) })
  }

  useEffect(() => { loadFestivalInfo() }, [id])

  async function loadFestivalInfo() {
    setFetchError(false); setAuthError(false); setNotFound(false)
    const cacheKey = `festival_v3_${id}`
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
      setLoading(false)  // immer aufrufen – verhindert dauerhaftes Laden
    }
  }

  if (loading || !profile) return <div className="loading">Lädt Festival-Infos...</div>
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
  ]

  return (
    <div style={{ background: 'var(--papier)', minHeight: '100dvh' }}>
      {/* ── Logo-Header (cremefarben) ── */}
      <div className="header">
        {/* Tag-Detail-View: einen Schritt zurück.
            Sonst: direkt zur Startseite — Tab-Klicks sollen kein History-Labyrinth erzeugen. */}
        <button
          onClick={() => selectedDayIdx >= 0 ? navigate(-1) : navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, fontWeight: 700, color: 'var(--schwarz)', padding: 0, lineHeight: 1 }}
        >←</button>
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
            crew={data.crew}
            selectedDayIdx={selectedDayIdx}
            onSelectDay={onSelectDay}
          />
        )}

        {activeTab === 'infos' && (
          <InfosTab details={details} role={role} content={data.content} festivalId={id} />
        )}

        {activeTab === 'kontakte' && (
          <KontakteTab details={details} role={role} festivalName={festivalName} crew={data.crew} />
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

function AblaufTab({ role, festivalId, profileId, checklists, festivalName, details, crew, selectedDayIdx, onSelectDay }) {
  // Supporti bekommt noch keinen Ablauf – alle anderen Rollen schon
  const hasAblauf = role === 'lead' || role === 'operator' || role === 'supporti_plus' || role === 'catering'

  const ablaufTitle =
    role === 'lead'         ? 'Ablauf für Leads' :
    role === 'operator'     ? 'Ablauf für Operator' :
    role === 'supporti_plus'? 'Ablauf für Supporti+' :
    role === 'catering'     ? 'Ablauf für Küchencrew' :
                              'Ablauf für Supportis'

  const days = hasAblauf ? generateAblaufDays(details, role, festivalName) : []
  const selectedDay = selectedDayIdx >= 0 ? days[selectedDayIdx] ?? null : null

  // Drill-down-Ansicht: einzelner Tag (Pfeil = navigate(-1) im Header der Seite)
  if (selectedDay) {
    return <AblaufDayDetail day={selectedDay} crew={crew} festivalId={festivalId} festivalName={festivalName} />
  }

  if (!hasAblauf) {
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
          onClick={() => onSelectDay(idx)}
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
              <div style={{ fontSize: 11, color: 'var(--grau-text)', marginTop: 2, fontFamily: 'var(--font-heading)' }}>
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

function AblaufDayDetail({ day, crew, festivalId, festivalName }) {
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

      {/* Rückmeldungs-Formular – nur am Aufbautag */}
      {day.type === 'aufbautag' && festivalId && (
        <AufbauRueckmeldung
          festivalId={festivalId}
          festivalName={festivalName}
          crew={crew}
        />
      )}
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

// Parst Freitext in einzelne Personen-Karten.
// Neue Person beginnt wenn:
//   (a) eine reine Namenszeile nach Telefonnummern kommt, ODER
//   (b) eine Zeile Name+Nummer enthält UND wir bereits eine Nummer haben
//       (= jede "Name + Nummer auf einer Zeile" ist immer eine eigene Person)
// So können mehrere Nummern zu einer Person (reiner Nummernblock) trotzdem
// in einer Karte landen.
function PersonBlocks({ value }) {
  if (!value) return null
  const phoneRegex = /(\+?[\d][\d\s\-/]{6,}[\d])/

  const lines = value.split('\n').map(l => l.trim()).filter(Boolean)
  const persons = []
  let current = { nameLines: [], phones: [] }

  lines.forEach(line => {
    const match = line.match(phoneRegex)
    if (match) {
      const before = line.slice(0, match.index).trim()
      // Hat die Zeile einen Namen VOR der Nummer UND wir haben schon eine Nummer
      // → das ist eine neue Person (z.B. "Mona Lisa +49..." nach "Shia LaBoef +49...")
      if (before && current.phones.length > 0) {
        persons.push(current)
        current = { nameLines: [], phones: [] }
      }
      if (before) current.nameLines.push(before)
      current.phones.push(match[1])
    } else {
      // Reine Namenszeile — nach Nummern startet immer eine neue Person
      if (current.phones.length > 0) {
        persons.push(current)
        current = { nameLines: [], phones: [] }
      }
      current.nameLines.push(line)
    }
  })
  if (current.nameLines.length > 0 || current.phones.length > 0) {
    persons.push(current)
  }

  return (
    <>
      {persons.map((person, i) => {
        const name = person.nameLines.join(' ')
        return (
          <div key={i} className="card" style={{ marginBottom: 8 }}>
            {name && (
              <div className="card-title" style={{ margin: 0, marginBottom: person.phones.length ? 8 : 0 }}>
                {name}
              </div>
            )}
            {person.phones.map((phone, j) => (
              <a key={j} href={`tel:${phone.replace(/[\s\-/]/g, '')}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--schwarz)', color: 'var(--weiss)',
                  padding: '8px 14px', borderRadius: 8,
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  marginRight: 6, marginTop: 4,
                }}>
                <IconTelefon size={15} /> {phone}
              </a>
            ))}
          </div>
        )
      })}
    </>
  )
}

function KontakteTab({ details, role, festivalName, crew }) {
  const isLeadOp = role === 'lead' || role === 'operator'

  const crewLoaded = Array.isArray(crew)
  const sortedCrew = crewLoaded
    ? [...crew].sort((a, b) => ROLLE_ORDER.indexOf(a.role) - ROLLE_ORDER.indexOf(b.role))
    : []

  const lbl      = { fontSize: 'var(--text-base)', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--schwarz)', marginBottom: 4 }
  const val      = { fontSize: 14, fontWeight: 400, color: 'var(--schwarz)' }
  const valMulti = { fontSize: 14, fontWeight: 400, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--schwarz)' }

  const hasSpecialContacts =
    (isLeadOp && details.production_mgmt) || (isLeadOp && details.urin_pump) ||
    (isLeadOp && details.job_safety) || details.awareness_team || (isLeadOp && details.vca_asp)

  const hasAnyContent = details.telegram_link || hasSpecialContacts || isLeadOp

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-statement)', fontSize: 'var(--text-h2)', lineHeight: 1.2, marginBottom: 'var(--sp-5)' }}>
        Kontakte
      </div>

      {/* Telegramgruppe – alle Rollen */}
      {details.telegram_link && (
        <>
          <div className="section-title">Telegramgruppe</div>
          <div className="card" style={{ marginBottom: 8 }}>
            <a
              href={details.telegram_link.startsWith('http') ? details.telegram_link : `https://${details.telegram_link}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 700, fontSize: 14, color: 'var(--schwarz)', textDecoration: 'underline' }}
            >
              Telegram-Gruppe zum {festivalName} ↗
            </a>
          </div>
        </>
      )}

      {/* Spezial-Kontakte – alle in einem Kasten */}
      {hasSpecialContacts && (
        <>
          <div className="section-title">Spezial-Kontakte</div>
          <div className="card">
            <ul className="info-list">
              {isLeadOp && details.production_mgmt && (
                <li>
                  <div>
                    <div style={lbl}>Produktionsleitung</div>
                    <div style={valMulti}><PhoneText text={details.production_mgmt} /></div>
                  </div>
                </li>
              )}
              {isLeadOp && details.urin_pump && (
                <li>
                  <div>
                    <div style={lbl}>Urinabpumpung</div>
                    <div style={valMulti}><PhoneText text={details.urin_pump} /></div>
                  </div>
                </li>
              )}
              {isLeadOp && details.job_safety && (
                <li>
                  <div>
                    <div style={lbl}>Arbeitssicherheit</div>
                    <div style={valMulti}><PhoneText text={details.job_safety} /></div>
                  </div>
                </li>
              )}
              {details.awareness_team && (
                <li>
                  <div>
                    <div style={lbl}>Awareness-Team</div>
                    <div style={valMulti}><PhoneText text={details.awareness_team} /></div>
                  </div>
                </li>
              )}
              {isLeadOp && details.vca_asp && (
                <li>
                  <div>
                    <div style={lbl}>VcA-ASP</div>
                    <div style={valMulti}><PhoneText text={details.vca_asp} /></div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </>
      )}

      {/* Crew – nur Leads + Operator */}
      {isLeadOp && (
        <>
          <div className="section-title">Crew</div>
          <div className="card" style={{ marginBottom: 8 }}>
            <ul className="info-list">
              <li>
                <div>
                  <div style={lbl}>Crew-Größe</div>
                  <div style={val}>{crewLoaded ? `${sortedCrew.length} Personen` : '...'}</div>
                </div>
              </li>
            </ul>
          </div>
          <CrewListSection crew={sortedCrew} />
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

// ── CrewListSection ───────────────────────────────────────────────────────────

const ROLLE_ORDER = ['lead', 'operator', 'supporti_plus', 'supporti', 'catering']

// Zeigt die bereits geladene Crew-Liste als aufklappbaren Block.
// Daten kommen aus dem Festival-Info-RPC — kein eigener Fetch.
function CrewListSection({ crew }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="button button--secondary"
        style={{ width: '100%', marginBottom: open ? 8 : 0 }}
      >
        {open ? 'Crew-Liste schließen ↑' : 'Crew-Liste anzeigen →'}
      </button>

      {open && crew && (
        <div className="card">
          {crew.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--grau-text)' }}>Keine Crew-Mitglieder gefunden.</p>
          ) : crew.map((a, i) => (
            <div key={i} style={{
              paddingBottom: i < crew.length - 1 ? 10 : 0,
              marginBottom: i < crew.length - 1 ? 10 : 0,
              borderBottom: i < crew.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--schwarz)' }}>
                  {a.full_name || '—'}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: 'var(--papier)', color: 'var(--schwarz)',
                  border: '1.5px solid var(--border)',
                  padding: '2px 7px', borderRadius: 4, flexShrink: 0,
                }}>
                  {ROLLE_LABEL[a.role] || a.role}
                </span>
              </div>
              {a.phone && (
                <a
                  href={`tel:${a.phone.replace(/[\s\-/]/g, '')}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    marginTop: 4,
                    fontSize: 13, fontWeight: 600, color: 'var(--grau-text)',
                    textDecoration: 'none',
                  }}
                >
                  <IconTelefon size={13} /> {a.phone}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── InfosTab ──────────────────────────────────────────────────────────────────

function InfosTab({ details, role, content, festivalId }) {
  const isLeadOp         = role === 'lead' || role === 'operator'
  const isKitchenVisible = role === 'catering' || role === 'operator' || role === 'lead'

  const lbl      = { fontSize: 'var(--text-base)', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--schwarz)', marginBottom: 4 }
  const val      = { fontSize: 14, fontWeight: 400, color: 'var(--schwarz)' }
  const valMulti = { fontSize: 14, fontWeight: 400, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--schwarz)' }
  const linkStyle = { fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--schwarz)', textDecoration: 'none' }
  const ghost    = { fontSize: 14, fontWeight: 600, color: 'var(--grau-text)', fontStyle: 'italic' }

  // Jahr aus Festival-Datumfeldern ableiten (DD.MM.YYYY)
  const festivalYear = parseDeDate(
    details.start_supp || details.start_leadop || details.start_setup
  )?.getFullYear() || ''

  // Goldeimer-Toiletten: zeige Sektion wenn mindestens ein Feld befüllt
  const hasToiletten = details.count_module || details.shift_table_link || details.goldeimer_hours ||
    details.goldeimer_prices || (isKitchenVisible && details.festival_money_info)

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-statement)', fontSize: 'var(--text-h2)', lineHeight: 1.2, marginBottom: 'var(--sp-5)' }}>
        Infos
      </div>

      {/* ── Besonderheiten (roter Kasten, ganz oben) ── */}
      {details.special_notes && (
        <div style={{
          background: '#fde8e3',
          border: '2px solid var(--rot)',
          borderRadius: 'var(--rounded)',
          padding: '14px var(--sp-4)',
          marginBottom: 'var(--sp-4)',
        }}>
          <div style={{
            fontSize: 'var(--text-base)', fontWeight: 700, fontFamily: 'var(--font-heading)',
            color: 'var(--rot)', marginBottom: 8,
          }}>
            Besonderheiten {festivalYear}
          </div>
          <div style={{ fontSize: 14, fontWeight: 400, whiteSpace: 'pre-wrap', lineHeight: 1.65, color: 'var(--schwarz)' }}>
            {details.special_notes}
          </div>
        </div>
      )}

      {/* ── Festival-Infos ── */}
      <div className="section-title">Festival-Infos</div>
      <div className="card">
        <ul className="info-list">
          <li>
            <div>
              <div style={lbl}>Anreise</div>
              <div style={val}>{getAnreise(details, role) || 'Wird noch bekannt gegeben'}</div>
            </div>
          </li>
          <li>
            <div>
              <div style={lbl}>Abreise</div>
              <div style={val}>{getAbreise(details, role) || 'Wird noch bekannt gegeben'}</div>
            </div>
          </li>
          {details.festival_address && (
            <li>
              <div><div style={lbl}>Anschrift</div><div style={valMulti}>{details.festival_address}</div></div>
            </li>
          )}
          <li>
            <div>
              <div style={lbl}>Lageplan</div>
              {details.festival_lageplan
                ? <a href={details.festival_lageplan} target="_blank" rel="noopener noreferrer" style={linkStyle}>Karte öffnen →</a>
                : <div style={ghost}>Folgt</div>
              }
            </div>
          </li>
        </ul>
      </div>

      {/* ── Goldeimer-Toiletten ── */}
      {hasToiletten && (
        <>
          <div className="section-title">Goldeimer-Toiletten</div>
          <div className="card">
            <ul className="info-list">
              {details.count_module && (
                <li>
                  <div><div style={lbl}>Anzahl Module</div><div style={val}>{details.count_module}</div></div>
                </li>
              )}
              {details.shift_table_link && (
                <li>
                  <div>
                    <div style={lbl}>Schichtplan</div>
                    <a href={details.shift_table_link} target="_blank" rel="noopener noreferrer" style={linkStyle}>Plan öffnen →</a>
                  </div>
                </li>
              )}
              {details.goldeimer_hours && (
                <li>
                  <div><div style={lbl}>Öffnungszeiten</div><div style={valMulti}>{details.goldeimer_hours}</div></div>
                </li>
              )}
              {details.goldeimer_prices && (
                <li>
                  <div><div style={lbl}>Preise</div><div style={valMulti}>{details.goldeimer_prices}</div></div>
                </li>
              )}
              {isKitchenVisible && details.festival_money_info && (
                <li>
                  <div><div style={lbl}>Kassensystem</div><div style={valMulti}>{details.festival_money_info}</div></div>
                </li>
              )}
            </ul>
          </div>
        </>
      )}

      {/* ── Küche (Leads, Operators, Catering) ── */}
      {isKitchenVisible && (details.kitchen_op || details.kitchen_crew_list || details.kitchen_info) && (
        <>
          <div className="section-title">Küche</div>
          <div className="card">
            <ul className="info-list">
              {details.kitchen_op && (
                <li>
                  <div><div style={lbl}>Küche-Operator</div><div style={valMulti}>{details.kitchen_op}</div></div>
                </li>
              )}
              {details.kitchen_crew_list && (
                <li>
                  <div>
                    <div style={lbl}>Küchen-Crew</div>
                    <a href={details.kitchen_crew_list} target="_blank" rel="noopener noreferrer" style={linkStyle}>Liste öffnen →</a>
                  </div>
                </li>
              )}
              {details.kitchen_info && (
                <li>
                  <div><div style={lbl}>Infos</div><div style={valMulti}>{details.kitchen_info}</div></div>
                </li>
              )}
            </ul>
          </div>
        </>
      )}

      {/* ── Logistik (nur L & O) ── */}
      {isLeadOp && details.logistic_info && (
        <>
          <div className="section-title">Logistik</div>
          <div className="card">
            <ul className="info-list">
              <li>
                <div><div style={lbl}>Logistik-Infos</div><div style={valMulti}>{details.logistic_info}</div></div>
              </li>
            </ul>
          </div>
        </>
      )}

      {/* ── Dokumente ── */}
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
                  Dokument öffnen →
                </a>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ── AufbauRueckmeldung ────────────────────────────────────────────────────────

const AUFBAU_TASKS = [
  { id: 'packen',   label: 'Packen' },
  { id: 'fahren',   label: 'Fahren' },
  { id: 'ausladen', label: 'Ausladen' },
  { id: 'aufbau',   label: 'Aufbau' },
]

// Alle Rollen, die beim Aufbau dabei sein können
const AUFBAU_CREW_ROLES = ['lead', 'operator', 'supporti_plus', 'catering']

// ── Außerhalb der Komponente definiert: verhindert Unmount/Remount bei Re-Render ──

function AufbauTaskHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }} />
      {AUFBAU_TASKS.map(t => (
        <div key={t.id} style={{
          width: 52, textAlign: 'center', flexShrink: 0,
          fontSize: 9, fontWeight: 800, fontFamily: 'var(--font-heading)',
          letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--grau-text)',
        }}>
          {t.label}
        </div>
      ))}
    </div>
  )
}

function AufbauTaskRow({ name, sublabel, checkedTasks, onToggle, isLast, readOnly }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      paddingBottom: isLast ? 0 : 10, marginBottom: isLast ? 0 : 10,
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--schwarz)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name || '—'}
        </div>
        {sublabel && (
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.04em', color: 'var(--grau-text)', fontFamily: 'var(--font-heading)' }}>
            {sublabel}
          </div>
        )}
      </div>
      {AUFBAU_TASKS.map(t => {
        const checked = (checkedTasks || []).includes(t.id)
        return (
          <button
            key={t.id}
            type="button"
            onClick={e => { e.preventDefault(); !readOnly && onToggle && onToggle(t.id) }}
            style={{
              width: 52, height: 36, flexShrink: 0,
              border: `1.5px solid ${checked ? 'var(--schwarz)' : 'var(--border)'}`,
              borderRadius: 6,
              background: checked ? 'var(--gelb)' : 'transparent',
              cursor: readOnly ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700,
              transition: 'all 0.1s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {checked ? '✓' : ''}
          </button>
        )
      })}
    </div>
  )
}

function AufbauRueckmeldung({ festivalId, festivalName, crew }) {
  const { profile } = useAuth()

  // Crew auf Aufbau-relevante Rollen filtern, nach Rolle sortieren
  const aufbauCrew = (crew || [])
    .filter(m => AUFBAU_CREW_ROLES.includes(m.role))
    .sort((a, b) => ROLLE_ORDER.indexOf(a.role) - ROLLE_ORDER.indexOf(b.role))

  // Pro Crew-Mitglied ein tasks-Array; wird aus DB wiederhergestellt
  const [entries, setEntries]         = useState(() => aufbauCrew.map(() => ({ tasks: [] })))
  const [extraPeople, setExtraPeople] = useState([{ name: '', tasks: [] }])
  const [report, setReport]           = useState(null)
  const [loadingReport, setLoadingReport] = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [saveStatus, setSaveStatus]   = useState('') // 'saving' | 'saved' | ''
  const saveTimer = useRef(null)

  useEffect(() => { loadReport() }, [festivalId])

  async function loadReport() {
    setLoadingReport(true)
    try {
      const { data, error } = await fetchWithTimeout(
        supabase
          .from('aufbau_reports')
          .select('*')
          .eq('festival_id', festivalId)
          .maybeSingle(),
        8000
      )

      if (!error && data) {
        setReport(data)
        // Gespeicherte Aufgaben in den lokalen State zurückschreiben
        if (data.crew_entries?.length) {
          setEntries(aufbauCrew.map(member => {
            const saved = data.crew_entries.find(e => e.name === member.full_name)
            return { tasks: saved?.tasks || [] }
          }))
        }
        if (data.extra_entries?.length) {
          setExtraPeople(data.extra_entries.map(e => ({ name: e.name, tasks: e.tasks || [] })))
        }
      }
    } catch (e) {
      console.error('loadReport error:', e)
    } finally {
      setLoadingReport(false)
    }
  }

  // Debounced Draft-Speicherung (1,5 s nach letzter Änderung)
  function scheduleSave(nextEntries, nextExtra) {
    if (report?.is_submitted) return
    clearTimeout(saveTimer.current)
    setSaveStatus('saving')
    saveTimer.current = setTimeout(() => saveDraft(nextEntries, nextExtra), 1500)
  }

  async function saveDraft(curEntries, curExtra) {
    const crewPayload = aufbauCrew.map((m, i) => ({
      name:       m.full_name || '',
      role:       m.role,
      role_label: ROLLE_LABEL[m.role] || m.role,
      tasks:      curEntries[i]?.tasks || [],
    }))
    const extraPayload = curExtra
      .filter(e => e.name.trim())
      .map(e => ({ name: e.name.trim(), tasks: e.tasks || [] }))

    const { error } = await supabase
      .from('aufbau_reports')
      .upsert(
        { festival_id: festivalId, crew_entries: crewPayload, extra_entries: extraPayload,
          updated_at: new Date().toISOString() },
        { onConflict: 'festival_id' }
      )
    setSaveStatus(error ? '' : 'saved')
  }

  function toggleCrewTask(memberIdx, taskId) {
    if (report?.is_submitted) return
    setEntries(prev => {
      const next = prev.map((e, i) => {
        if (i !== memberIdx) return e
        const tasks = e.tasks.includes(taskId)
          ? e.tasks.filter(t => t !== taskId)
          : [...e.tasks, taskId]
        return { ...e, tasks }
      })
      scheduleSave(next, extraPeople)
      return next
    })
  }

  function toggleExtraTask(idx, taskId) {
    if (report?.is_submitted) return
    setExtraPeople(prev => {
      const next = prev.map((e, i) => {
        if (i !== idx) return e
        const tasks = e.tasks.includes(taskId)
          ? e.tasks.filter(t => t !== taskId)
          : [...e.tasks, taskId]
        return { ...e, tasks }
      })
      scheduleSave(entries, next)
      return next
    })
  }

  function updateExtraName(idx, name) {
    if (report?.is_submitted) return
    setExtraPeople(prev => {
      const next = prev.map((e, i) => i === idx ? { ...e, name } : e)
      scheduleSave(entries, next)
      return next
    })
  }

  function addExtraPerson() {
    setExtraPeople(prev => [...prev, { name: '', tasks: [] }])
  }

  function removeExtraPerson(idx) {
    if (report?.is_submitted) return
    setExtraPeople(prev => {
      const next = prev.filter((_, i) => i !== idx)
      scheduleSave(entries, next)
      return next
    })
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')

    const crewPayload = aufbauCrew.map((m, i) => ({
      name:       m.full_name || '',
      role:       m.role,
      role_label: ROLLE_LABEL[m.role] || m.role,
      tasks:      entries[i]?.tasks || [],
    }))
    const extraPayload = extraPeople
      .filter(e => e.name.trim())
      .map(e => ({ name: e.name.trim(), tasks: e.tasks || [] }))

    const { data: invokeData, error: invokeErr } = await supabase.functions.invoke(
      'submit-aufbau-report',
      { body: { festival_id: festivalId, festival_name: festivalName,
                crew_entries: crewPayload, extra_entries: extraPayload } }
    )

    if (invokeErr || invokeData?.error) {
      setSubmitError(invokeData?.error || invokeErr?.message || 'Fehler beim Abschicken')
    } else {
      setReport(prev => ({
        ...prev,
        is_submitted:      true,
        submitted_by_name: invokeData.submitted_by,
        submitted_at:      new Date().toISOString(),
      }))
    }
    setSubmitting(false)
  }

  if (loadingReport) {
    return (
      <div style={{ marginTop: 'var(--sp-6)', color: 'var(--grau-text)', fontSize: 13 }}>
        Lädt Rückmeldung...
      </div>
    )
  }

  const isSubmitted = !!report?.is_submitted

  return (
    <div style={{ marginTop: 'var(--sp-6)' }}>
      <div style={{
        fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
        color: 'var(--grau-text)', fontFamily: 'var(--font-heading)', marginBottom: 10,
      }}>
        Rückmeldung
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 6 }}>Rückmeldung Aufbau</div>
        <p style={{ fontSize: 13, color: 'var(--grau-text)', lineHeight: 1.6, marginBottom: 'var(--sp-4)' }}>
          Bitte gib uns am Ende des Aufbaus Rückmeldung über Anwesenheiten und Aufgabenverteilungen,
          damit wir im Büro die richtigen Pauschalen berechnen können.
        </p>

        {/* Abgeschickt-Banner */}
        {isSubmitted && (
          <div style={{
            background: '#e8f5e9', border: '1.5px solid var(--gruen)', borderRadius: 8,
            padding: '10px 14px', marginBottom: 'var(--sp-4)',
            fontSize: 13, color: 'var(--gruen)', fontWeight: 600, lineHeight: 1.5,
          }}>
            ✓ Abgeschickt von <strong>{report.submitted_by_name}</strong>
            {report.submitted_at && (
              <> um {new Date(report.submitted_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</>
            )}
          </div>
        )}

        {/* Crew-Liste */}
        {aufbauCrew.length > 0 && (
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <AufbauTaskHeader />
            {aufbauCrew.map((member, idx) => (
              <AufbauTaskRow
                key={idx}
                name={member.full_name}
                sublabel={ROLLE_LABEL[member.role]}
                checkedTasks={entries[idx]?.tasks || []}
                onToggle={taskId => toggleCrewTask(idx, taskId)}
                isLast={idx === aufbauCrew.length - 1}
                readOnly={isSubmitted}
              />
            ))}
          </div>
        )}

        {/* Weitere Personen – bearbeitbar (nicht submitted) */}
        {!isSubmitted && (
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <div style={{
              fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--grau-text)', fontFamily: 'var(--font-heading)', marginBottom: 8,
            }}>
              Weitere Personen
            </div>
            {extraPeople.map((person, idx) => (
              <div key={idx} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <input
                    type="text"
                    value={person.name}
                    onChange={e => updateExtraName(idx, e.target.value)}
                    placeholder="Name eingeben"
                    style={{
                      flex: 1, padding: '7px 10px',
                      border: '1.5px solid var(--border)', borderRadius: 6,
                      fontSize: 13, fontFamily: 'var(--font-body)',
                      background: 'var(--papier)', color: 'var(--schwarz)',
                    }}
                  />
                  {extraPeople.length > 1 && (
                    <button type="button" onClick={e => { e.preventDefault(); removeExtraPerson(idx) }} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--grau-text)', fontSize: 18, padding: '2px 4px', lineHeight: 1,
                      WebkitTapHighlightColor: 'transparent',
                    }}>✕</button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {AUFBAU_TASKS.map(t => {
                    const checked = person.tasks.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={e => { e.preventDefault(); toggleExtraTask(idx, t.id) }}
                        style={{
                          flex: 1, padding: '6px 4px',
                          border: `1.5px solid ${checked ? 'var(--schwarz)' : 'var(--border)'}`,
                          borderRadius: 6,
                          background: checked ? 'var(--gelb)' : 'transparent',
                          cursor: 'pointer',
                          fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-heading)',
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                          color: checked ? 'var(--schwarz)' : 'var(--grau-text)',
                          transition: 'all 0.1s',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <button type="button" onClick={e => { e.preventDefault(); addExtraPerson() }} style={{
              background: 'none', border: '1.5px dashed var(--border)', borderRadius: 6,
              padding: '8px 14px', cursor: 'pointer', width: '100%',
              fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--grau-text)',
              WebkitTapHighlightColor: 'transparent',
            }}>
              + Person hinzufügen
            </button>
          </div>
        )}

        {/* Weitere Personen – read-only (submitted) */}
        {isSubmitted && extraPeople.some(e => e.name) && (
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <div style={{
              fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--grau-text)', fontFamily: 'var(--font-heading)', marginBottom: 8,
            }}>
              Weitere Personen
            </div>
            <AufbauTaskHeader />
            {extraPeople.filter(e => e.name).map((person, idx, arr) => (
              <AufbauTaskRow
                key={idx}
                name={person.name}
                sublabel="Weitere"
                checkedTasks={person.tasks}
                isLast={idx === arr.length - 1}
                readOnly
              />
            ))}
          </div>
        )}

        {/* Zwischenstand-Indikator */}
        {!isSubmitted && saveStatus && (
          <div style={{ fontSize: 11, color: 'var(--grau-text)', marginBottom: 8, textAlign: 'right' }}>
            {saveStatus === 'saving' ? 'Wird gespeichert…' : '✓ Zwischenstand gespeichert'}
          </div>
        )}

        {/* Fehler */}
        {submitError && (
          <div style={{
            background: '#FFF0ED', border: '1px solid var(--rot)', borderRadius: 6,
            padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--rot)',
          }}>
            ⚠ {submitError}
          </div>
        )}

        {/* Abschicken */}
        {!isSubmitted && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="button"
            style={{ width: '100%' }}
          >
            {submitting ? 'Wird abgeschickt…' : 'Rückmeldung abschicken →'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function getAnreise(details, role) {
  if (role === 'supporti_plus') return details.start_leadop
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
