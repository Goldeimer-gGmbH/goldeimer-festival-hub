import { useEffect, useState, useRef } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import { cacheGet, cacheSet, cacheClear } from '../lib/cache'
import { fetchWithTimeout } from '../lib/fetchWithTimeout'
import { HUB_ADMIN_EMAILS } from '../lib/admins'
import {
  IconAblauf, IconInfos, IconKontakte,
  IconKalender, IconTransport, IconOrderbird, IconStift, IconLupe,
  IconStar, IconPin, IconBrief, IconTelefon,
} from '../components/Icons'

function ChevronIcon({ dir = 'right', size = 16, color = 'currentColor' }) {
  const deg = { down: 0, up: 180, left: 90, right: -90 }[dir] ?? 0
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none"
      style={{ display: 'block', flexShrink: 0, transform: `rotate(${deg}deg)` }}>
      <path d="M4 6.5L9 11.5L14 6.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const ROLLE_LABEL = {
  lead: 'Lead', operator: 'Operator',
  supporti_plus: 'Supporti+', supporti: 'Supporti', catering: 'Catering'
}

// supabase.auth.getSession() kann in manchen Browsern/PWA-Kontexten (v.a. iOS
// Safari/Standalone) durch die interne Web-Locks-API auf unbestimmte Zeit
// blockieren, wenn ein anderer Tab/Worker den Lock hält. Damit Submit-Buttons
// dann nicht ewig auf "Wird abgeschickt…" stehen bleiben, holen wir den Token
// mit Timeout — und lesen ihn notfalls direkt aus dem LocalStorage (derselben
// Quelle, die Supabase intern nutzt).
async function getAccessTokenFast(timeoutMs = 6000) {
  const { data } = await fetchWithTimeout(supabase.auth.getSession(), timeoutMs)
  if (data?.session?.access_token) return data.session.access_token

  try {
    const raw = localStorage.getItem('sb-wsdkmglkqxszyvomrfim-auth-token')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.access_token) return parsed.access_token
    }
  } catch (e) { /* ignore */ }

  return null
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
    {
      title: 'Standorte mit Produktion gegenchecken',
      bullets: [
        'Kontaktiert die Festival-Produktion (siehe Kontakte)',
        'Gegenchecken der Goldeimer-Standorte (auf Karte oder mit dem Produktionsleiter rausfahren und zeigen lassen)',
        'Strom, Bauzäune, Abpumpen klären',
        'Besonderheiten klären (Öffnungszeiten, Arbeitssicherheit…)',
      ],
    },
  ]
  if (isFkp) {
    items.push({
      title: 'Nur für FKP-Festivals',
      bullets: [
        'Lasst die Produktionsordnung von der Aufbau-Crew unterschreiben und gebt sie bei der Festival-Produktion ab.',
      ],
    })
  }
  items.push(
    {
      title: 'Begrüßung und Team-Besprechung',
      bullets: [
        'Ankunft und Begrüßung der Operator/Aufbauhelfenden & Küche',
        'Crewcamp aufbauen (Küchenzelt und -modul)',
        'Alle bauen ihre private Zelte etc. auf',
        'Lead gibt Orientierung für den nächsten Tag (Aufbautag)',
        'Teilt die Gruppe in ausgewogene Teams auf (nach Erfahrung, Kraft etc.)',
      ],
    },
    {
      title: 'Logistik',
      bullets: [
        'Alle Hänger/Container stehen an Ort und Stelle, damit am nächsten Morgen direkt gestartet werden kann mit dem Aufbau',
      ],
    },
    {
      type: 'sicherheitsbriefing',
      title: 'Sicherheitsbriefing',
      bullets: [
        'Geht gemeinsam mit dem Aufbau-Team das Sicherheitsbriefing durch.',
      ],
    },
  )
  return items
}

const CONTENT_AUFBAUTAG = [
  {
    title: 'Koffer vorbereiten',
    bullets: ['Koffer für jedes Camp checken und vorbereiten.'],
  },
  {
    type: 'anleitung',
    title: 'Aufbau',
    bullets: ['Baut im Team alle Camps auf.'],
  },
  {
    type: 'rueckmeldung',
    title: 'Nachbereitung',
    bullets: [
      'Gib Rückmeldung zurück ans Büro, wer alles bei welchen Aufgaben mitgeholfen hat.',
      'Auf Basis dessen berechnen wir die Pauschalen.',
      'Achtung: Dieses Formular kannst du nur einmal ausfüllen.',
    ],
  },
]

const CONTENT_TAG1 = [
  { title: 'Letzter Feinschliff' },
  { text: 'Falls noch nicht geschehen: Toiletten betriebsbereit machen (Toilettenpapier einhängen, Mülltüte in Mülleimer hängen und einmal grundreinigen)' },

  { title: 'Koffer & Zahlgeräte' },
  { text: 'Koffer an Operator für jeden Camp rausgeben' },
  { text: 'Jedem Standort ein nummeriertes elektronisches Zahlungsgerät zuweisen → darauf achten, dass immer das gleiche nummerierte Zahlungsgerät pro Standort verwendet wird' },

  { title: 'Wichtige Zeiten' },
  { text: '10 Uhr: Campingplatz- und Goldeimer-Öffnung' },
  { text: '15 Uhr: Welcome Meeting mit Newbies' },
  { text: '16 Uhr: Erste Supporti-Schichten' },
  { text: '23 Uhr: Crew Briefing' },

  { title: 'Kassensturz' },
  { text: 'Nach Betriebsschluss Bargeld abschöpfen' },
  { text: 'Kassensturz mit allen Orderbirds machen' },
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

// ── Supporti-spezifische Ablauf-Inhalte ───────────────────────────────────────

const PUTZEN_STEPS = [
  { n: 1,   text: 'Handschuhe an! Wichtig!' },
  { n: 2,   text: 'Zum Putzen brauchst du Flächendesinfektionsmittel – meist in blauen Sprühflaschen – und einen Handfeger.' },
  { tip: true, text: 'Nimm dir ein Stück Kreide aus dem Koffer mit, um auf den Treppen zu markieren, welche Kabine du schon geputzt hast.' },
  { n: 3,   text: 'Beim Reingehen in die Kabine kannst du direkt den Türgriff desinfizieren, damit das gut einwirken kann.' },
  { n: 4,   text: 'Jetzt heißt\'s: Fegen! Erstmal die Kabine von Einstreu befreien. Smart ist, wenn du von oben nach unten fegst – also erst die Sitzplatte, dann den Boden.' },
  { n: 5,   text: 'Als nächstes sprühst du die Oberflächen mit Desi ein, um sie dann mit Klopapier sauber zu wischen. Auch hier am besten erst einmal die Klobrille komplett einsprühen, damit das Desi gut einwirken kann.' },
  { n: 6,   text: 'Dann Sitzplatte desinfizieren und abwischen, die Klobrille gründlich oben und auch unterhalb sauber machen.' },
  { n: 7,   text: 'Achte darauf, dass du nicht direkt in die Tonne sprühst – möglichst keine Chemie in die Toilette.' },
  { n: 8,   text: 'Das Klopapier auch nicht ins Klo werfen, sondern immer in den Mülleimer!' },
  { tip: true, text: 'Wenn der Spritzschutz unter der Klobrille hinten vollgekackt ist, dreh ihn um 180 Grad – dann wird er sauber gepinkelt!' },
  { n: 9,   text: 'Wisch zum Schluss gern nochmal über den Mülleimer und den Türgriff.' },
  { n: 10,  text: 'Für das Extra-Sternchen fegst du beim Rausgehen noch kurz die Treppe, wenn hier viel Streu liegt. Und fertig!' },
]

const CONTENT_SUPPORTI_TAG1 = [
  {
    title: 'Wichtige Zeiten',
    bullets: [
      '10 Uhr: Campingplatz- und Goldeimer-Öffnung',
      '15 Uhr: Welcome Meeting mit Newbies',
      '16 Uhr: Erste Supporti-Schichten',
      '23 Uhr: Crew Briefing',
    ],
  },
  { title: 'Erste Schichten' },
  { type: 'putzen_button' },
]

const CONTENT_SUPPORTI_MITTE = [
  { type: 'putzen_button' },
  { type: 'preise' },
]

const CONTENT_SUPPORTI_VORLETZTER = [
  { type: 'putzen_button' },
  { type: 'preise', withWarning: true },
]

const CONTENT_SUPPORTI_LETZTER = [
  { type: 'preise', withWarning: true },
  { type: 'danke_text' },
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
        todo: 'Anreise & Vorbereitung',
        content: buildAnreisetagContent(festivalName),
      })
    }
    // Aufbautag für Lead/Operator
    if (details.start_setup) {
      days.push({
        type: 'aufbautag',
        label: 'Aufbautag',
        date: details.start_setup,
        todo: 'Aufbautag',
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
        todo: 'Aufbautag',
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

      if (role === 'supporti') {
        if (i === 0) {
          type = 'tag1_supp'; todo = 'Anreise & 1. Tag'; content = CONTENT_SUPPORTI_TAG1
        } else if (i === totalDays - 1) {
          type = 'letzter_supp'; todo = 'Letzte Schicht & Abreise'; content = CONTENT_SUPPORTI_LETZTER
        } else if (totalDays > 2 && i === totalDays - 2) {
          type = 'vorletzter_supp'; todo = 'Regelbetrieb vorletzter Tag'; content = CONTENT_SUPPORTI_VORLETZTER
        } else {
          type = 'mitte_supp'; todo = 'Regelbetrieb'; content = CONTENT_SUPPORTI_MITTE
        }
        label = i === 0 ? 'Anreisetag' : i === totalDays - 1 ? 'Letzter Tag' : `Goldeimer-Tag ${i + 1}`
      } else {
        if (i === 0) {
          type = 'tag1'; todo = 'Betriebsstart'; content = CONTENT_TAG1
        } else if (i === totalDays - 1) {
          type = 'letzter'; todo = 'Abreise & Abbau'; content = CONTENT_LETZTER_TAG
        } else if (totalDays > 2 && i === totalDays - 2) {
          type = 'vorletzter'; todo = 'Regelbetrieb vorletzter Tag'; content = CONTENT_VORLETZTER_TAG
        } else if (i === 1) {
          type = 'tag2'; todo = 'Regelbetrieb'; content = CONTENT_TAG2
        } else {
          type = 'mitte'; todo = 'Regelbetrieb'; content = CONTENT_TAG_MITTE
        }
        label = i === totalDays - 1 ? 'Abreisetag' : `Goldeimer-Tag ${i + 1}`
      }

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
  const isHubAdmin = HUB_ADMIN_EMAILS.includes(profile?.email)
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [notFound, setNotFound]   = useState(false)
  const [authError, setAuthError] = useState(false)
  const [debugMsg, setDebugMsg]   = useState('')

  const activeTab = searchParams.get('tab') || 'ablauf'
  // Kein replace: push → Browser-Zurück funktioniert zwischen Tabs
  function setActiveTab(tab) {
    setSearchParams(tab === 'ablauf' ? {} : { tab })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => { loadFestivalInfo() }, [id])

  async function loadFestivalInfo(retryCount = 0) {
    setFetchError(false); setAuthError(false); setNotFound(false); setDebugMsg('')
    const cacheKey = `festival_v4_${id}`
    const cached = cacheGet(cacheKey)

    // Nur gültigen Cache verwenden — Responses mit error-Key nie cachen/anzeigen.
    // Hintergrund: Das RPC gibt bei fehlendem Assignment HTTP 200 + {error: "..."} zurück.
    // Früher wurde das als gültige Antwort gecacht und beim nächsten Seitenaufruf
    // direkt als Fehlerzustand angezeigt, ohne dass überhaupt ein Netzwerkrequest gemacht wurde.
    // validCached = gültiger Cache ohne error-Key → kann direkt angezeigt werden
    const validCached = cached && !cached.error
    if (validCached) {
      setData(cached); setLoading(false)
    } else {
      if (cached) cacheClear(cacheKey)  // fehlerhaften Cache sofort entfernen
      setData(null)
    }

    try {
      const { data: rpcData, error, isAuthError } = await fetchWithTimeout(
        supabase.rpc('get_my_festival_info', { p_festival_id: id })
      )
      if (!error && rpcData && !rpcData.error) {
        // Nur fehlerfreie Antworten speichern und anzeigen
        setData(rpcData)
        cacheSet(cacheKey, rpcData, 48 * 60 * 60 * 1000)
      } else if (error) {
        // Web-Lock-Konflikt: Supabase-intern, passiert wenn zwei Requests gleichzeitig
        // den Auth-Token refreshen wollen. Einmal still retrien statt Fehler zeigen.
        const isLockError = String(error.message).toLowerCase().includes('lock')
        // Timeout: DB-Kaltstart oder langes Netz — bis zu 2x mit 3s Pause retrien.
        const isTimeout = error.message === 'timeout'
        if ((isLockError || isTimeout) && retryCount < 2) {
          setTimeout(() => loadFestivalInfo(retryCount + 1), isTimeout ? 3000 : 1200)
          return
        }
        if (isAuthError) setAuthError(true)
        else if (!validCached) {
          // Kein gültiger Cache → Fehler zeigen. Mit Cache → still ignorieren,
          // gecachte Daten bleiben sichtbar (z.B. bei Timeout im Hintergrund).
          setDebugMsg(`supabase error: ${error.message || error.status || JSON.stringify(error)}`)
          setFetchError(true)
        }
      } else if (rpcData?.error) {
        // RPC hat application-level Fehler zurückgegeben (z.B. kein Assignment)
        if (isHubAdmin) {
          await loadAdminFallback()
        } else if (!validCached) {
          setDebugMsg(`rpc: ${String(rpcData.error)}`)
          setFetchError(true)
        }
        if (!isHubAdmin) console.error('get_my_festival_info RPC error:', rpcData.error)
      } else if (!rpcData && !validCached) {
        if (isHubAdmin) {
          await loadAdminFallback()
        } else {
          setNotFound(true)
        }
      }
    } catch (e) {
      if (!validCached) {
        setDebugMsg(`exception: ${e?.message || String(e)}`)
        setFetchError(true)
      }
    } finally {
      setLoading(false)  // immer aufrufen – verhindert dauerhaftes Laden
    }
  }

  async function loadAdminFallback() {
    const [{ data: festival, error }, { data: crewRaw }] = await Promise.all([
      supabase.from('festivals').select('id, name, details').eq('id', id).single(),
      supabase.from('assignments')
        .select('id, role, detail_pronouns, detail_carpass, detail_arrival, profile:profiles(full_name, email, phone, birthday)')
        .eq('festival_id', id)
        .in('status', ['zugesagt', 'akkreditiert', 'teilgenommen'])
        .order('role'),
    ])
    if (!error && festival) {
      const crew = (crewRaw || []).map(a => ({
        assignment_id: a.id,
        role: a.role,
        full_name: a.profile?.full_name,
        email: a.profile?.email,
        phone: a.profile?.phone,
        birthday: a.profile?.birthday,
        detail_pronouns: a.detail_pronouns,
        detail_carpass: a.detail_carpass,
        detail_arrival: a.detail_arrival,
        attendance_present: null,
        attendance_checked_by_name: null,
        attendance_checked_at: null,
      }))
      setData({
        festival,
        assignment_role: 'lead',
        crew,
        checklists: null,
        content: null,
        attendance_submission: null,
      })
    } else {
      setNotFound(true)
    }
  }

  if (loading || !profile) return <div className="loading">Lädt Festival-Infos...</div>
  if (authError) return (
    <div className="page" style={{ paddingTop: 'var(--sp-8)', textAlign: 'center' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IconStar size={36} /></div>
      <p className="card-sub" style={{ marginBottom: 20 }}>Deine Sitzung ist abgelaufen. Bitte melde dich neu an.</p>
      <button className="button" onClick={signOut}>Neu anmelden</button>
      <div style={{ marginTop: 20 }}><Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ChevronIcon dir="left" size={16} />Zurück</Link></div>
    </div>
  )
  if (notFound) return (
    <div className="page" style={{ paddingTop: 'var(--sp-8)', textAlign: 'center' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IconLupe size={36} /></div>
      <p className="card-sub" style={{ marginBottom: 20 }}>Festival nicht gefunden oder kein Zugriff.</p>
      <div style={{ marginTop: 20 }}><Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ChevronIcon dir="left" size={16} />Zurück</Link></div>
    </div>
  )
  if (fetchError || (data && data.error)) return (
    <div className="page" style={{ paddingTop: 'var(--sp-8)', textAlign: 'center' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IconStar size={36} /></div>
      <p className="card-sub" style={{ marginBottom: 20 }}>Verbindung unterbrochen.</p>
      {(debugMsg || data?.error) && (
        <p style={{ fontSize: 11, color: 'var(--grau-text)', marginBottom: 16, fontFamily: 'monospace' }}>
          [{debugMsg || String(data.error)}]
        </p>
      )}
      <button className="button" onClick={loadFestivalInfo}>Nochmal versuchen</button>
      <div style={{ marginTop: 20 }}><Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ChevronIcon dir="left" size={16} />Zurück</Link></div>
    </div>
  )
  if (!data) return null

  const details     = data.festival?.details || {}
  const role        = data.assignment_role
  const festivalName = data.festival?.name || ''

  const tabs = [
    { key: 'ablauf',   label: 'Ablauf',                                      Icon: TabIconAblauf },
    { key: 'infos',    label: role === 'supporti' ? 'Infos' : 'Infos & Kontakte', Icon: TabIconInfos },
    { key: 'kontakte', label: 'Crew',                                         Icon: TabIconKontakte },
  ]

  return (
    <div style={{ background: 'var(--papier)', minHeight: '100dvh' }}>
      {/* ── Logo-Header (cremefarben) ── */}
      <div className="header">
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}
        ><ChevronIcon dir="left" size={22} color="var(--schwarz)" /></button>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/goldeimer-logo.png" alt="Goldeimer" style={{ height: 36 }} />
        </Link>
        <span style={{ width: 26 }} />
      </div>

      {/* ── Festival-Hero (schwarz → Welle → papier) ── */}
      <div style={{
        background: 'var(--schwarz)',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-8) var(--sp-4) 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontWeight: 700,
              fontSize: 'var(--text-sm)', color: 'var(--papier)',
              letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0,
            }}>
              {festivalName}
            </h2>
            <span style={{
              background: 'var(--gruen)', color: 'var(--weiss)',
              padding: '2px 8px', borderRadius: 'var(--rounded-full)',
              fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-heading)',
              letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0,
            }}>
              {ROLLE_LABEL[role] || role}
            </span>
          </div>
          <h1 className="statement" style={{
            fontSize: 'var(--text-h1)', color: 'var(--papier)',
            lineHeight: 1.05, letterSpacing: '-0.01em', marginBottom: 'var(--sp-5)',
          }}>
            {tabs.find(t => t.key === activeTab)?.label}
          </h1>
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
          />
        )}

        {activeTab === 'infos' && (
          <InfosTab details={details} role={role} content={data.content} festivalId={id} />
        )}

        {activeTab === 'kontakte' && (
          <KontakteTab details={details} role={role} festivalName={festivalName} crew={data.crew} festivalId={id} attendanceSubmission={data.attendance_submission} />
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

function AblaufTab({ role, festivalId, profileId, checklists, festivalName, details, crew }) {
  const [openDayIdx, setOpenDayIdx] = useState(-1)

  const hasAblauf = role === 'lead' || role === 'operator' || role === 'supporti_plus' || role === 'catering' || role === 'supporti'

  const ablaufTitle =
    role === 'lead'          ? 'Ablauf für Leads' :
    role === 'operator'      ? 'Ablauf für Operator' :
    role === 'supporti_plus' ? 'Ablauf für Supporti+' :
    role === 'catering'      ? 'Ablauf für Küchencrew' :
                               'Ablauf für Supportis'

  const days = hasAblauf ? generateAblaufDays(details, role, festivalName) : []

  const wichtigeTermine = role === 'supporti' ? [
    { lbl: 'Open Campingplatz / Anreise',  val: details.start_campsite || details.start_supp },
    { lbl: 'Welcome Meeting',              val: details.time_welcome_meeting, always: true },
    { lbl: 'Crew Briefing',               val: details.time_crew_briefing,    always: true },
    { lbl: 'Close Campingplatz / Abreise', val: details.end_campsite || details.end_supp },
  ].filter(t => t.val || t.always) : [
    { lbl: 'Anreise Lead & Operator', val: details.start_leadop },
    { lbl: 'Beginn Aufbau',           val: details.start_setup,         suffix: ', ab 8 Uhr' },
    { lbl: 'Open Campingplatz',       val: details.start_campsite },
    { lbl: 'Welcome Meeting',         val: details.time_welcome_meeting },
    { lbl: 'Crew Briefing',           val: details.time_crew_briefing },
    { lbl: 'Abbau',                   val: details.end_takedown,        suffix: ', ab 8 Uhr' },
    { lbl: 'Close Campingplatz',      val: details.end_campsite },
  ].filter(t => t.val)

  if (!hasAblauf) {
    return (
      <div>
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
            <IconAblauf size={36} />
          </div>
          <h4 className="card-title" style={{ marginBottom: 6 }}>Kommt bald</h4>
          <p className="card-sub">
            Der Ablauf für {role === 'catering' ? 'Küchencrew' : 'Supportis'} folgt in Kürze.
          </p>
        </div>
        {checklists && checklists.length > 0 && (
          <>
            <h3 className="section-title" style={{ marginTop: 8 }}>Checklisten</h3>
            <ChecklistSection festivalId={festivalId} profileId={profileId} checklists={checklists} />
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      {wichtigeTermine.length > 0 && (
        <>
          <h3 className="section-title">Wichtigste Termine</h3>
          <div className="card" style={{ marginBottom: 20 }}>
            {wichtigeTermine.map((t, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                paddingBottom: i < wichtigeTermine.length - 1 ? 10 : 0,
                marginBottom: i < wichtigeTermine.length - 1 ? 10 : 0,
                borderBottom: i < wichtigeTermine.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--schwarz)', fontFamily: 'var(--font-heading)' }}>
                  {t.lbl}
                </div>
                <div style={{ fontSize: 13, color: 'var(--grau-text)', textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  {t.val ? (formatDateShort(t.val) || t.val) : '–'}{t.suffix || ''}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="section-title">{ablaufTitle}</h3>
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: 'none', boxShadow: 'none' }}>
        {days.map((day, idx) => {
          const isOpen    = openDayIdx === idx
          const isLast    = idx === days.length - 1
          return (
            <div key={idx} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
              <button
                className="accordion-btn"
                onClick={() => setOpenDayIdx(isOpen ? -1 : idx)}
                style={{
                  width: '100%',
                  background: '#F3E9D6',
                  border: 'none',
                  borderBottom: 'none',
                  padding: '14px var(--sp-4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  textAlign: 'left',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 500,
                    color: 'var(--grau-text)', marginBottom: 3,
                  }}>
                    {formatDateShort(day.date)}
                  </div>
                  <h4 style={{
                    fontWeight: 700, fontSize: 'var(--text-h4)',
                    color: 'var(--schwarz)', fontFamily: 'var(--font-heading)',
                    letterSpacing: 'var(--heading-ls)', lineHeight: 1.2, margin: 0,
                  }}>
                    {day.todo}
                  </h4>
                </div>
                <div className={`accordion-chevron${isOpen ? ' is-open' : ''}`}>
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                    <path d="M4 6.5L9 11.5L14 6.5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              <div className={`accordion-content${isOpen ? ' is-open' : ''}`}>
                <div>
                  <AblaufDayDetail
                    day={day}
                    crew={crew}
                    festivalId={festivalId}
                    festivalName={festivalName}
                    details={details}
                    inAccordion
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {checklists && checklists.length > 0 && (
        <>
          <h3 className="section-title" style={{ marginTop: 8 }}>Checklisten</h3>
          <ChecklistSection festivalId={festivalId} profileId={profileId} checklists={checklists} />
        </>
      )}
    </div>
  )
}

// ── Sicherheitsbriefing-Inhalte (vollständig aus PDF 2025) ───────────────────

const SICHERHEITSBRIEFING_CONTENT = [
  {
    type: 'intro',
    text: 'Damit wir sicher durch Auf- und Abbau kommen, hier die wichtigsten Regeln auf einen Blick:',
  },
  { type: 'section', emoji: '🦺', text: 'Persönliche Schutzausrüstung (PSA)' },
  { type: 'list', items: [
    'Sicherheitsschuhe (S2) tragen – Pflicht!',
    'Arbeitshandschuhe anziehen – schützt vor Schnitt- & Klemmgefahren.',
    'Bei Reinigungs- und Drainagearbeiten (zusätzlich) Einmalhandschuhe tragen.',
    'Sonnenschutz nicht vergessen: Sonnencreme + Cap gegen Sonnenbrand und Hitzschlag.',
    'Impfung gegen Hepatitis A wird empfohlen, besonders bei Arbeit an den FSBs.',
  ]},
  { type: 'section', emoji: '💪', text: 'Sicheres Arbeiten' },
  { type: 'list', items: [
    'Nicht vom Hänger oder Anhänger springen! – Runtersteigen, nicht runterspringen.',
    'Klemm- & Sturzgefahren beachten – besonders bei Treppen, Türen und losem Material.',
    'Achte auf deine Haltung beim Heben und Tragen. Keine ruckartigen Bewegungen, Rücken gerade!',
    'Nur bei stabilen Wetterbedingungen arbeiten – bei Sturm oder Gewitter: Arbeit pausieren, Unterstand suchen.',
  ]},
  { type: 'section', emoji: '🚗', text: 'Verkehr auf dem Gelände' },
  { type: 'list', items: [
    'Es gilt die Straßenverkehrsordnung – auch auf dem Veranstaltungsgelände!',
    'Höchstgeschwindigkeit: 20 km/h.',
    'Bei Trockenheit: Langsam fahren, um Staubaufwirbelung zu vermeiden.',
    'Bei Nässe: Besonders vorsichtig fahren, um Gelände und Maschinen nicht zu beschädigen.',
  ]},
  { type: 'section', emoji: '🚫', text: 'Keine Rauschmittel' },
  { type: 'list', items: [
    'Alkohol, Drogen und bestimmte Medikamente beeinträchtigen deine Aufmerksamkeit und Leistungsfähigkeit.',
    'Daher: Keine Rauschmittel vor und während der Arbeit.',
  ]},
  { type: 'section', emoji: '🧃', text: 'Pausen & Gesundheit' },
  { type: 'list', items: [
    'Regelmäßige Pausen einlegen – auch wenn\'s stressig ist.',
    'Ausreichend trinken und Snacks einpacken. Dehydrierung ist gefährlich!',
    'Bei Anzeichen von Erschöpfung oder Überhitzung: Arbeit unterbrechen und Bescheid sagen.',
  ]},
  { type: 'section', emoji: '⚠️', text: 'Gefahren erkennen & melden' },
  { type: 'list', items: [
    'Rahmenteile immer sichern, damit sie nicht umkippen.',
    'Wetter beobachten – bei Starkwind Aufbau abbrechen.',
    'Defekte Bauteile oder gefährliche Situationen den Leads melden.',
  ]},
  { type: 'section', emoji: '🚨', text: 'Im Notfall' },
  { type: 'list', items: [
    'Verletzte versorgen, Unfallstelle absichern.',
    'Erste-Hilfe-Zelt aufsuchen oder Notruf 112 wählen.',
    'Lead(s) informieren.',
  ]},
  {
    type: 'closing',
    text: 'Bleibt achtsam, schützt euch gegenseitig und denkt dran: Beim Auf- und Abbau gilt offiziell »Sicherheit statt Stimmung!«',
  },
]

// ── Sicherheitsbriefing Bottom-Sheet ─────────────────────────────────────────

function SicherheitsbriefingSheet({ onClose }) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 400,
        }}
      />
      {/* Sheet — max. Smartphone-Breite, zentriert */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: 'var(--weiss)',
        borderRadius: '16px 16px 0 0',
        zIndex: 401,
        maxHeight: '88dvh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
      }}>
        {/* Sheet-Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px var(--sp-4)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ fontWeight: 800, fontSize: 'var(--text-base)', fontFamily: 'var(--font-heading)' }}>
            🦺 Sicherheitsbriefing
          </div>
          <button
            onClick={onClose}
            aria-label="Schließen"
            style={{
              background: 'var(--papier)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: 'var(--schwarz)', fontWeight: 700,
            }}
          >✕</button>
        </div>

        {/* Scrollbarer Inhalt */}
        <div style={{
          overflowY: 'auto',
          padding: 'var(--sp-4)',
          paddingBottom: 'calc(var(--sp-8) + env(safe-area-inset-bottom, 0px))',
          fontSize: 'var(--text-sm)',
        }}>
          {SICHERHEITSBRIEFING_CONTENT.map((block, i) => {
            switch (block.type) {
              case 'intro':
                return (
                  <p key={i} style={{ lineHeight: 1.7, color: 'var(--grau-text)', marginBottom: 'var(--sp-4)', marginTop: 0 }}>
                    {block.text}
                  </p>
                )
              case 'section':
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontWeight: 800, fontSize: 'var(--text-sm)',
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--schwarz)',
                    marginTop: i === 0 ? 0 : 'var(--sp-5)',
                    marginBottom: 'var(--sp-2)',
                    paddingBottom: 'var(--sp-2)',
                    borderBottom: '2px solid var(--gelb)',
                  }}>
                    <span>{block.emoji}</span>
                    <span>{block.text}</span>
                  </div>
                )
              case 'list':
                return (
                  <ul key={i} style={{ paddingLeft: 'var(--sp-4)', marginBottom: 'var(--sp-3)', marginTop: 0 }}>
                    {block.items.map((it, j) => (
                      <li key={j} style={{ lineHeight: 1.65, color: 'var(--grau-text)', marginBottom: 6 }}>
                        {it}
                      </li>
                    ))}
                  </ul>
                )
              case 'closing':
                return (
                  <div key={i} style={{
                    marginTop: 'var(--sp-5)',
                    background: 'var(--schwarz)',
                    borderRadius: 'var(--rounded)',
                    padding: 'var(--sp-3) var(--sp-4)',
                    fontWeight: 700, color: 'var(--gelb)',
                    lineHeight: 1.5, fontSize: 'var(--text-sm)',
                  }}>
                    {block.text}
                  </div>
                )
              default:
                return null
            }
          })}
        </div>
      </div>
    </>
  )
}

// ── Aufbauanleitung-Inhalte (vollständig aus PDF, Abbau weggelassen) ──────────

const AUFBAUANLEITUNG_CONTENT = [
  // ── Mittwoch ─────────────────────────────────────────────────────────────────
  { type: 'h2', text: 'Vorbereitung' },
  { type: 'list', numbered: true, items: [
    'Alle haben gefrühstückt und Proviant (Wasser und Snacks) für den Aufbautag dabei',
    { text: 'Lead gibt Sicherheitsanweisung: Nicht vom Hänger springen, Sicherheitsschuhe anhaben, ausreichend Pausen machen (trinken und snacks), Sonnenschutz..', redSuffix: '(Verlinkung Gefährdungsbeurteilung)' },
    'Idealerweise: Lead zeigt jedem Team nochmal auf dem Geländeplan, wo genau und wie rum die Camps aufgebaut werden (Position und Richtung Eingang, Infostand)',
    'Teams starten mit ihrer persönlichen Schutzausrüstung (Sicherheitsschuhe, Arbeitshandschuhe, Sonnencreme, Mütze, Regenausrüstung) zu den Camps',
  ]},
  { type: 'tip', text: 'Bei angekündigter Hitze ist es sinnvoll früher zu starten und dafür eine längere Mittagspause einzulegen' },

  { type: 'h2', text: 'Modul aufbauen' },
  { type: 'meta', items: [
    { icon: '💪', text: 'Idealerweise 4 Personen pro Modul' },
    { icon: '⏱', text: 'ca. 2–3 Stunden' },
    { icon: '🧤', text: 'Arbeitshandschuhe und Sicherheitsschuhe!' },
  ]},

  { type: 'h3', text: '1. Aufbau planen: Wo wird das Camp aufgebaut?' },
  { type: 'p', text: 'Hier sollte der Lead dabei sein oder die Info vorab geklärt haben:' },
  { type: 'list', items: [
    'Wo ist der Eingang/Ausgang und Infostand? Wie ist das Camp positioniert? → Lead muss entscheiden (Wichtig: Ausgang muss Richtung Hauptlaufwege ausgerichtet sein, um möglichst viele Benutzerinnen zu erreichen)',
    'Wo starten wir mit dem ersten Rahmen (achte darauf von links nach rechts aufzubauen)',
    'Wo positionieren wir den IBC, damit das Abpumpfahrzeug bestmöglich Urin abpumpen kann?',
  ]},
  { type: 'sketch', label: 'Aufbauplan Standard Camp',
    thumb: 'https://wsdkmglkqxszyvomrfim.supabase.co/storage/v1/object/public/assets/anleitung/skizze-standardcamp.thumb.jpg' },

  { type: 'h3', text: '2. Hänger vorbereiten' },
  { type: 'list', items: [
    { text: 'Hänger freiräumen, um Platz zu schaffen und gut an die Rahmen zu kommen', photo: true, sub: [
      'rausräumen: FSBs und Drainagekisten, Stangen für Pavillon sowie IBC',
      'auf dem Hänger (vorne) bleibt stehen: 2x Rolli mit Betriebsmittel/Infostand und Klopapier, Späneballen, Spänekiste mit Füßen, Dächer, Rückwände, Bauzaunbanner',
    ]},
  ]},

  { type: 'h3', text: '3. Aufbau der Rahmen' },
  { type: 'phase', text: '1. Phase' },
  { type: 'list', items: [
    'Füße für die ersten 4 Rahmen schon an Ort und Stelle bringen',
    'Erster Rahmen (leer) mit 4 Personen runterheben und an finalen Standort ablegen (2 Personen stehen auf dem Hänger, 2 Personen nehmen unten an), 1 Person hält Rahmen fest',
  ]},
  { type: 'warning', text: 'Die ersten 3–4 Rahmen unbedingt mit 4 Personen (oder allen, die vor Ort sind) runterheben, da sie sehr hoch sind' },
  { type: 'list', items: [
    'Zweiten Rahmen leeren (Türen, Treppe, Sitzplatte und Bodenplatte zur Seite stellen (werden für die letzte Toilette erst wieder gebraucht) und an Standort bringen',
    { text: 'Beide Rahmen über das Kreuz an der Rückseite verbinden (kein Werkzeug notwendig)', photo: true,
      warning: 'hier drauf achten, dass eine Person die beiden Rahmen noch sichert da es noch instabil ist. Erst ab dem dritten Rahmen steht das Modul auch sicher allein' },
    '3. Rahmen leeren: Tür und Treppe zur Seite stellen; Bodenplatte und die Sitzplatte in die erste Kabine einbauen',
    'FSB Höhe checken (FSB unter die erste Kabine stellen und checken das die Lücke zwischen Oberkante FSB und Sitzplatte nicht größer ist als der Spritzschutz. Über die Füße entsprechend anpassen. Beachte: Wenn die Fläche nicht eben ist muss man an der höchsten Stelle die Füße in der minimalen Höhe haben damit es an der tiefen Stelle die Toiletten nicht zu hoch werden)',
  ]},
  { type: 'tip', text: 'Immer von links nach rechts aufbauen (wenn man von vorne auf das Modul schaut), damit der Rahmen direkt angebaut werden kann' },
  { type: 'photo' },
  { type: 'tip', text: 'Kabinen nach vorne etwas abschüssig aufbauen, damit die Türen beim Betrieb standardmäßig offen stehen und weniger knallen' },

  { type: 'phase', text: '2. Phase (ab dem 3. Rahmen)' },
  { type: 'p', text: 'Scooter ballern, jetzt kommt der Flow!' },
  { type: 'list', numbered: true, items: [
    { text: 'Leeren Rahmen mit 2 Personen aus dem Hänger heben, Füße einschieben und ca. 1 Meter parallel zum vorherigen Rahmen aufstellen.', photo: true },
    { text: 'Über die Querverstrebung miteinander verbinden und schon direkt ausnivellieren, damit es einigermaßen waagerecht ist.',
      tip: 'Erst den neuen Rahmen mit dem alten verbinden, damit man dann noch einfach über die Füße nachjustieren kann?', photo: true },
    { text: 'Den nächsten Rahmen im Hänger leeren', sub: [
      { text: 'Bodenplatte in das bereits stehende Modul legen', photo: true,
        tip: 'Bodenplatte zu zweit von vorne und hinten anpacken, schräg einsetzen und erst an den stehenden Block anlegen, dann an den neuen Rahmen' },
      { text: 'Toilettensitz einlegen', photo: true },
      { text: 'Gummi unter der Bodenplatte befestigen' },
      { text: 'Treppe vor das Modul legen', photo: true },
      { text: 'Türe an den Hänger / am Bauzaun abstellen', photo: true },
    ]},
    { text: 'Wiederholen bis alle 13 Rahmen (12 Toiletten) stehen' },
    { text: 'Inlay aus dem ersten Rahmen wird in der letzten Kabine verbaut' },
  ]},
  { type: 'important', text: 'Schauen, dass die Rahmen einigermaßen in der Waage stehen. Dafür am besten nach jedem Rahmen mit etwas Abstand die Bodenplatten oder die Rahmen anschauen um nach Augenmaß zu prüfen ob sie in der Waage stehen und bei Bedarf an den Füßen nachjustieren' },
  { type: 'photo' },

  { type: 'h3', text: '4. Finalisieren der Toiletten' },
  { type: 'list', numbered: true, items: [
    { text: 'Treppen einhängen', photo: true, sub: [
      'Alle 12 Treppen: Erst Treppe anhalten, Bolzen links einschieben (immer von links nach rechts), dann auf der rechten Seite der Treppe ebenfalls Bolzen einschieben. Bei der nächsten Treppe direkt auf Bolzen einhängen und so weiter. Letzten Bolzen andersrum einschieben.',
    ]},
    { text: 'Alle 12 Rückwände einziehen (am Besten eine Person führt die Plane ein – auf der Sitzplatte stehend – und eine Person zieht von hinten die Planen nach unten',
      photo: true, note: 'Hack: Gleichmäßig einführen, sonst hakt es' },
    { text: 'Alle 12 Dachplanen einziehen', sub: [
      'von vorne nach hinten',
      'auf die Schrauben achten, die fungieren als Bremse und kommen entsprechend vorne an die Schiene, damit die Plane nicht durchrutschen kann',
    ], photo: true, tip: 'Planen immer gleichmäßig in die Leiste einführen, sonst hakt es' },
    { text: 'Tür-Querstreben einsetzen von links nach rechts', sub: [
      'Wichtig: In den ersten und letzten Rahmen muss ein kleiner Keil eingesetzt werden, damit die Rahmen stabil sind und die Türen korrekt schließen',
    ]},
    { text: 'Türen einhängen und Gummiband am Rahmen fixieren', photo: true },
  ]},
  { type: 'highlight', text: 'Jetzt steht die Hardware. Zwischen-High-Five und Trinkpause nicht vergessen!' },

  { type: 'h3', text: '5. Bauzäune und Backoffice einrichten' },
  { type: 'list', numbered: true, items: [
    { text: 'Bauzäune stellen, um das Camp zu sichern', sub: [
      'Skizze siehe oben',
      'Hänger wird mit eingebaut, als Betriebsmittellager',
      'Eingang mit Mütze wird aufgebaut (auch als Wetterschutz für den Aufbau wichtig)',
      'Bebannerte Bauzäune (schwarze Planen) für Sichtschutz zum Backoffice hinten nutzen.',
    ]},
    { text: 'IBC im Backoffice aufstellen', photo: true, sub: [
      'Beachten: Standort so wählen, dass die Drainage möglichst bergab zum IBC läuft, keinesfalls berghoch. Außerdem sollte der IBC möglichst nah am Weg stehen, damit das Abpump Fahrzeug gut dran kommt.',
    ]},
    { text: 'FSBs mit Stroh befüllen und anschließend unter die Toiletten stellen (in jede Tonne kommt eine gute Handvoll Stroh als natürlicher Filter, damit der Abfluss nicht verstopft und der Urin gut abfließen kann)' },
    { text: 'Drainage legen, zusammenstecken und an die Tonnen anschließen', photo: true,
      sub: [
        'Beachten: Es gibt kurze (schwarzer Kabelbinder) und lange Drainage-Schläuche (weißer Kabelbinder). Die Kurzen werden von der Öffnung an der Tonne nach hinten gelegt und mit einem T-Stück verbunden. Seitlich kommt dann der lange Schlauch dran, der parallel zum Moduls zur nächsten Tonne führt.',
      ],
      tip: 'Vor dem Zusammenstecken der Drainage (GeKa-Anschluss) die Gummis anfeuchten, dann geht\'s viel einfacher anzukuppeln.' },
    { text: 'Pumpe anschließen an die Drainage und mit dem IBC verbinden', photo: true, sub: [
      'Verschlusshahn und Pumpe an die Drainageschläuche anschließen. Beachte: Der Verschlusshahn (roter Griff) muss vor die Pumpe auf der Seite der Toiletten eingebaut werden. Dies dient der Absicherung, um bei einem Pumpenausfall bzw. wenn der IBC voll ist den Urinfluss zu stoppen.',
      'Weitere Drainageschläuche von der Pumpe zum IBC legen und anstecken.',
      'Strom mit Kabeltrommel zur Pumpe legen (wetterfest machen!)',
      'Pumpe und Hahn erst bei Öffnung der Toiletten einschalten / öffnen.',
    ]},
    { text: 'Spritzschütze einhängen und Müllbeutel befestigen (neues Verfahren)' },
  ]},

  { type: 'h3', text: '6. Infostand, Pavillon und Aktionsbereich aufbauen' },
  { type: 'list', items: [
    { text: 'Infotresen aufbauen', photo: true },
    'Betriebsmittelkisten einlegen',
    { text: 'Pfand und Müllsack einrichten', photo: true },
    'Schilder beschriften',
    'Goldeimer Klopapier präsentieren',
    'Bierbank aufstellen',
    'Strom vom Strommast / Generator zum Infostand legen',
    'Pavillon aufbauen',
    'Fahne aufbauen',
    { text: 'Banner anbringen (s. Mannis Aufbauskizze)',
      warning: 'Goldeimer Banner bitte nur für die Präsentation nach vorne nutzen, nicht an der Rückseite des Camps aufhängen, da sie dort häufig beschmiert werden' },
    'Spänebox (+ Becher) aufstellen',
    'Desispender am Eingang aufhängen',
    'Superflitzer',
  ]},

  // ── Donnerstag ───────────────────────────────────────────────────────────────
  { type: 'h3', text: '7. Toiletten betriebsbereit machen' },
  { type: 'list', numbered: true, items: [
    { text: 'Klopapier einhängen', photo: true },
    { text: 'Mülleimer reinstellen und Mülltüte einhängen', photo: true },
    { text: 'Reinigung: Alle Kabinen einmal durchwischen und Sitzplatte und Klobrille putzen' },
  ]},

  { type: 'h2', text: 'Grundregeln' },
  { type: 'list', items: [
    'Aufbau der Module immer mit mind. 3 Personen',
    'Je nach Anzahl an Aufbauhelfenden können nicht alle Camps gleichzeitig aufgebaut werden',
    'Camps können dann auch mit 2 Personen finalisiert werden',
    'Lead sind hauptsächlich für Strom, Bauzäune und Koordination vor Ort verantwortlich damit es hier keine Verzögerungen gibt. Allerdings helfen sie auch beim Aufbau wenn die Kapazitäten dafür vorhanden sind',
    'Laufwege aller Helfer möglichst gering halten da sehr kraftraubend',
    'Inventur vor dem Start: alles ausreichend vor Ort und das Camp komplett autark ist (diese Listen gilt es noch zu aktualisieren)',
  ]},
]

// ── Hilfsfunktionen für Aufbauanleitung ──────────────────────────────────────

// Fullscreen-Lightbox für Fotos — unterstützt natives Pinch-to-Zoom
function MediaLightbox({ src, alt, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
          width: 36, height: 36, color: '#fff', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 601,
        }}>✕</button>
        {/* overflow-auto + touch-action erlaubt natives Pinch-to-Zoom im Browser */}
        <div style={{
          width: '100%', height: '100%', overflow: 'auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          touchAction: 'manipulation',
        }} onClick={e => e.stopPropagation()}>
          <img src={src} alt={alt || ''} style={{
            maxWidth: '100%', maxHeight: '100%',
            objectFit: 'contain', display: 'block',
            touchAction: 'manipulation',
          }} />
        </div>
      </div>
    </>
  )
}

// Foto-Platzhalter — zeigt echtes Bild wenn src vorhanden, sonst Placeholder
function AnleitungPhoto({ src, alt }) {
  const [open, setOpen] = useState(false)
  if (src) {
    return (
      <>
        <div onClick={() => setOpen(true)} style={{
          borderRadius: 8, marginTop: 8, marginBottom: 4, overflow: 'hidden',
          cursor: 'zoom-in', border: '1px solid var(--border)',
        }}>
          <img src={src} alt={alt || 'Foto'} style={{
            width: '100%', display: 'block', maxHeight: 200, objectFit: 'cover',
          }} />
        </div>
        {open && <MediaLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
      </>
    )
  }
  return (
    <div style={{
      background: 'var(--border)', borderRadius: 8, marginTop: 8, marginBottom: 4,
      padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 12, color: 'var(--grau-text)',
    }}>
      <span style={{ fontSize: 16 }}>📷</span>
      <span>Foto folgt</span>
    </div>
  )
}

// Skizze-Karte — zeigt Thumbnail inline, Tap öffnet Lightbox mit Pinch-to-Zoom
function SketchCard({ thumb, label }) {
  const [open, setOpen] = useState(false)

  if (!thumb) {
    // Placeholder
    return (
      <div style={{
        background: 'var(--border)', borderRadius: 8, marginBottom: 'var(--sp-3)',
        padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, fontSize: 12, color: 'var(--grau-text)', minHeight: 80,
      }}>
        <span>{label || 'Skizze folgt'}</span>
      </div>
    )
  }

  return (
    <>
      {/* Inline-Vorschau */}
      <div
        onClick={() => setOpen(true)}
        style={{ marginBottom: 'var(--sp-3)', borderRadius: 8, overflow: 'hidden',
          border: '1px solid var(--border)', cursor: 'zoom-in', background: '#fff' }}>
        <div style={{
          padding: '6px 10px', fontSize: 11, color: 'var(--grau-text)',
          display: 'flex', alignItems: 'center', gap: 6,
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ flex: 1, fontWeight: 600 }}>{label}</span>
          <span style={{ opacity: 0.6 }}>Antippen zum Vergrößern</span>
        </div>
        <img src={thumb} alt={label} style={{ width: '100%', display: 'block' }} />
      </div>

      {/* Fullscreen Lightbox mit Pinch-Zoom / Pan / Double-Tap */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 601,
          display: 'flex', flexDirection: 'column',
          background: '#fff',
        }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', flexShrink: 0,
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--schwarz)' }}>{label}</span>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'var(--border)', border: 'none', borderRadius: '50%',
                width: 34, height: 34, color: 'var(--schwarz)', fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>✕</button>
          </div>

          {/* Zoom-Container — füllt restlichen Platz */}
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={6}
            centerOnInit
            doubleClick={{ mode: 'reset' }}
            wheel={{ step: 0.1 }}
          >
            <TransformComponent
              wrapperStyle={{ flex: 1, width: '100%', overflow: 'hidden' }}
              contentStyle={{ width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center' }}
            >
              <img
                src={thumb}
                alt={label}
                style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', userSelect: 'none' }}
              />
            </TransformComponent>
          </TransformWrapper>
        </div>
      )}
    </>
  )
}


const CALLOUT_STYLE = {
  padding: '8px 12px', borderLeft: '3px solid var(--gelb)',
  background: '#FFFBEB', borderRadius: '0 6px 6px 0',
  fontSize: 12, color: 'var(--grau-text)', lineHeight: 1.6,
}

function AnleitungItem({ item, numbered, index, depth = 0 }) {
  const text      = typeof item === 'string' ? item : item.text
  const photo     = typeof item === 'object' && item.photo
  const sub       = typeof item === 'object' && item.sub
  const tip       = typeof item === 'object' && item.tip
  const warn      = typeof item === 'object' && item.warning
  const note      = typeof item === 'object' && item.note
  const redSuffix = typeof item === 'object' && item.redSuffix

  // depth 0 → schwarzer Punkt; depth 1 → a), b); depth 2+ → kleiner schwarzer Punkt
  const renderBullet = () => {
    if (numbered && depth === 0) {
      return <span style={{ flexShrink: 0, fontWeight: 700, fontSize: 13, color: 'var(--schwarz)', minWidth: 20 }}>{index + 1}.</span>
    }
    if (depth === 1) {
      return <span style={{ flexShrink: 0, fontWeight: 600, fontSize: 12, color: 'var(--schwarz)', minWidth: 18 }}>{String.fromCharCode(97 + index)})</span>
    }
    if (depth === 0) {
      return <span style={{ flexShrink: 0, width: 5, height: 5, borderRadius: '50%', background: 'var(--schwarz)', marginTop: 8 }} />
    }
    return <span style={{ flexShrink: 0, width: 4, height: 4, borderRadius: '50%', background: 'var(--grau-text)', marginTop: 9 }} />
  }

  return (
    <div style={{ marginBottom: depth > 0 ? 5 : 10 }}>
      <div style={{ display: 'flex', gap: depth >= 1 ? 6 : 8, alignItems: 'flex-start' }}>
        {renderBullet()}
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--schwarz)' }}>
            {text}{redSuffix && <span style={{ color: 'var(--rot)' }}> {redSuffix}</span>}
          </span>
          {photo && <AnleitungPhoto />}
          {warn && (
            <div style={{ marginTop: 6, ...CALLOUT_STYLE }}>💡 {warn}</div>
          )}
          {tip && (
            <div style={{ marginTop: 6, ...CALLOUT_STYLE }}>💡 {tip}</div>
          )}
          {note && (
            <div style={{ marginTop: 6, ...CALLOUT_STYLE }}>💡 {note}</div>
          )}
          {sub && (
            <div style={{ marginTop: 6, paddingLeft: depth === 0 ? 4 : 0 }}>
              {sub.map((s, si) => (
                <AnleitungItem key={si} item={s} numbered={false} index={si} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── How-to-Putzen Sheet ───────────────────────────────────────────────────────

function PutzenSheet({ onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, background: 'var(--weiss)',
        borderRadius: '16px 16px 0 0', zIndex: 401,
        maxHeight: '88dvh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px var(--sp-4)', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{ fontWeight: 800, fontSize: 'var(--text-base)', fontFamily: 'var(--font-heading)' }}>
            How to Putzen
          </div>
          <button onClick={onClose} aria-label="Schließen" style={{
            background: 'var(--papier)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: 'var(--schwarz)', fontWeight: 700,
          }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: 'var(--sp-4)', paddingBottom: 'calc(var(--sp-6) + env(safe-area-inset-bottom, 0px))' }}>
          <p style={{ fontSize: 13, color: 'var(--grau-text)', lineHeight: 1.65, marginBottom: 16 }}>
            Bevor es losgeht: Gute Laune Lieblingssong in die Warteschlange packen. Jetzt wird geputzt!
          </p>
          {PUTZEN_STEPS.map((step, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              {step.tip ? (
                <div style={{
                  background: '#FFF9D6', border: '1.5px solid var(--gelb)',
                  borderRadius: 8, padding: '10px 12px',
                  fontSize: 13, lineHeight: 1.6, color: 'var(--schwarz)',
                }}>
                  <strong>Pro-Tipp:</strong> {step.text}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--schwarz)', color: 'var(--gelb)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-heading)', marginTop: 1,
                  }}>{step.n}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--schwarz)' }}>{step.text}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ── Aufbauanleitung Sheet ─────────────────────────────────────────────────────

function AnleitungSheet({ onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'var(--weiss)', borderRadius: '16px 16px 0 0',
        zIndex: 401, maxHeight: '92dvh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px var(--sp-4)', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{ fontWeight: 800, fontSize: 'var(--text-base)', fontFamily: 'var(--font-heading)' }}>
            Aufbauanleitung
          </div>
          <button onClick={onClose} aria-label="Schließen" style={{
            background: 'var(--papier)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: 'var(--schwarz)', fontWeight: 700,
          }}>✕</button>
        </div>

        {/* Inhalt */}
        <div style={{
          overflowY: 'auto',
          padding: 'var(--sp-4)',
          paddingBottom: 'calc(var(--sp-8) + env(safe-area-inset-bottom, 0px))',
          fontSize: 'var(--text-sm)',
        }}>
          {AUFBAUANLEITUNG_CONTENT.map((block, i) => {
            switch (block.type) {
              case 'day':
                return null
              case 'h2':
                return (
                  <div key={i} style={{
                    fontWeight: 800, fontSize: 'var(--text-base)',
                    fontFamily: 'var(--font-heading)', color: 'var(--schwarz)',
                    marginTop: i === 0 ? 0 : 'var(--sp-6)', marginBottom: 'var(--sp-3)',
                    paddingBottom: 'var(--sp-2)', borderBottom: '2px solid var(--gelb)',
                  }}>
                    {block.text}
                  </div>
                )
              case 'h3': {
                const m = block.text.match(/^(\d+)\.\s*(.*)/)
                const num   = m ? m[1] : null
                const label = m ? m[2] : block.text
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    marginTop: 'var(--sp-5)', marginBottom: 'var(--sp-2)',
                  }}>
                    {num && (
                      <span style={{
                        flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
                        background: 'var(--schwarz)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--weiss)', fontWeight: 800, fontSize: 12,
                        fontFamily: 'var(--font-heading)',
                      }}>{num}</span>
                    )}
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--schwarz)', lineHeight: 1.35, flex: 1 }}>
                      {label}
                    </div>
                  </div>
                )
              }
              case 'phase':
                return (
                  <div key={i} style={{ marginTop: 'var(--sp-3)', marginBottom: 'var(--sp-2)' }}>
                    <span style={{
                      display: 'inline-block',
                      background: 'var(--gelb)', color: 'var(--schwarz)',
                      padding: '3px 10px', borderRadius: 'var(--rounded-full)',
                      fontSize: 11, fontWeight: 800,
                      fontFamily: 'var(--font-heading)',
                    }}>{block.text}</span>
                  </div>
                )
              case 'meta':
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 'var(--sp-4)' }}>
                    {block.items.map((m, mi) => (
                      <div key={mi} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--grau-text)' }}>
                        <span>{m.icon}</span>
                        <span>{m.text}</span>
                      </div>
                    ))}
                  </div>
                )
              case 'p':
                return (
                  <p key={i} style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--grau-text)', marginTop: 0, marginBottom: 'var(--sp-3)' }}>
                    {block.text}
                  </p>
                )
              case 'list':
                return (
                  <div key={i} style={{ marginBottom: 'var(--sp-3)' }}>
                    {block.items.map((item, ii) => (
                      <AnleitungItem key={ii} item={item} numbered={!!block.numbered} index={ii} depth={0} />
                    ))}
                  </div>
                )
              case 'tip':
              case 'warning':
              case 'important':
              case 'highlight':
                return (
                  <div key={i} style={{ ...CALLOUT_STYLE, marginBottom: 'var(--sp-3)' }}>
                    💡 {block.text}
                  </div>
                )
              case 'photo':
                return <AnleitungPhoto key={i} />
              case 'sketch':
                return <SketchCard key={i} thumb={block.thumb} label={block.label} />
              default:
                return null
            }
          })}
        </div>
      </div>
    </>
  )
}

// ── Rückmeldung Aufbau Sheet ──────────────────────────────────────────────────

function RueckmeldungSheet({ festivalId, festivalName, crew, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'var(--papier)', borderRadius: '16px 16px 0 0',
        zIndex: 401, maxHeight: '92dvh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px var(--sp-4)', borderBottom: '1px solid var(--border)',
          flexShrink: 0, background: 'var(--weiss)', borderRadius: '16px 16px 0 0',
        }}>
          <div style={{ fontWeight: 800, fontSize: 'var(--text-base)', fontFamily: 'var(--font-heading)' }}>
            Rückmeldung Aufbau
          </div>
          <button onClick={onClose} aria-label="Schließen" style={{
            background: 'var(--papier)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: 'var(--schwarz)', fontWeight: 700,
          }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <AufbauRueckmeldung festivalId={festivalId} festivalName={festivalName} crew={crew} inSheet />
        </div>
      </div>
    </>
  )
}

// ── Tages-Detailansicht ───────────────────────────────────────────────────────

function AblaufDayDetail({ day, crew, festivalId, festivalName, details, inAccordion = false }) {
  const [showBriefing, setShowBriefing]         = useState(false)
  const [showAnleitung, setShowAnleitung]       = useState(false)
  const [showRueckmeldung, setShowRueckmeldung] = useState(false)
  const [showPutzen, setShowPutzen]             = useState(false)

  return (
    <div>
      {!inAccordion && (
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
      )}

      <div style={inAccordion
        ? { padding: 'var(--sp-3) var(--sp-5) var(--sp-5)', background: '#F3E9D6' }
        : { background: 'var(--weiss)', border: '1px solid var(--border)', borderRadius: 'var(--rounded)', padding: 'var(--sp-4)', boxShadow: 'var(--shadow-sm)' }
      }>
        {day.content.map((item, i) => {
          // ── Gemeinsamer Abschnitts-Header (section, title, typed items) ──
          // Kein Aufzählungspunkt — fett als Überschrift, Abstand zur vorherigen Gruppe
          const SectionHeader = ({ text }) => (
            <h4 style={{
              fontWeight: 700, fontSize: 'var(--text-h4)',
              fontFamily: 'var(--font-heading)',
              color: 'var(--schwarz)', lineHeight: 1.3,
              marginTop: i > 0 ? 16 : 0, marginBottom: 4,
            }}>
              {text}
            </h4>
          )

          if (item.section) {
            return <SectionHeader key={i} text={item.text} />
          }

          // Bullet-Liste als Custom-Dots (einheitlich, kein natives <ul>)
          const BulletList = ({ bullets, mb = 6 }) => (
            <div style={{ marginBottom: mb }}>
              {bullets.map((b, bi) => (
                <div key={bi} style={{ display: 'flex', gap: 8, marginBottom: 3, alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, width: 5, height: 5, borderRadius: '50%', background: 'var(--schwarz)', marginTop: 7 }} />
                  <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--schwarz)' }}>{b}</span>
                </div>
              ))}
            </div>
          )

          // ── Anleitung-Item ──
          if (item.type === 'anleitung') {
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <SectionHeader text={item.title} />
                {item.bullets?.length > 0 && <BulletList bullets={item.bullets} />}
                {item.detail && !item.bullets && (
                  <div style={{ fontSize: 13, color: 'var(--grau-text)', marginBottom: 6, lineHeight: 1.5 }}>{item.detail}</div>
                )}
                <button onClick={() => setShowAnleitung(true)} className="button button--yellow button--sm" style={{ width: 'auto' }}>
                  Aufbauanleitung öffnen
                </button>
              </div>
            )
          }

          // ── Rückmeldung-Item ──
          if (item.type === 'rueckmeldung') {
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <SectionHeader text={item.title} />
                {item.bullets?.length > 0 && <BulletList bullets={item.bullets} />}
                {item.detail && !item.bullets && (
                  <div style={{ fontSize: 13, color: 'var(--grau-text)', marginBottom: 6, lineHeight: 1.5 }}>{item.detail}</div>
                )}
                <button onClick={() => setShowRueckmeldung(true)} className="button button--sm" style={{ width: 'auto' }}>
                  Rückmeldung Aufbau
                </button>
              </div>
            )
          }

          // ── Putzen-Button ──
          if (item.type === 'putzen_button') {
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <button onClick={() => setShowPutzen(true)} className="button button--yellow button--sm" style={{ width: 'auto' }}>
                  How to Putzen
                </button>
              </div>
            )
          }

          // ── Preisänderungs-Warnung (schmale Inline-Box) ──
          if (item.type === 'preisaenderung') {
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{
                  display: 'inline-block',
                  background: '#fde8e3', border: '1.5px solid var(--rot)',
                  borderRadius: 6, padding: '5px 10px',
                  fontSize: 13, fontWeight: 700, color: 'var(--rot)', fontFamily: 'var(--font-heading)',
                }}>
                  Achtung Preisänderung!
                </div>
              </div>
            )
          }

          // ── Preise aus Festival-Details ──
          if (item.type === 'preise') {
            if (!details?.goldeimer_prices) return null
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <SectionHeader text="Preise" />
                {item.withWarning && (
                  <div style={{
                    display: 'inline-block',
                    background: '#fde8e3', border: '1.5px solid var(--rot)',
                    borderRadius: 6, padding: '5px 10px', marginBottom: 6, marginTop: 2,
                    fontSize: 13, fontWeight: 700, color: 'var(--rot)', fontFamily: 'var(--font-heading)',
                  }}>
                    Achtung Preisänderung!
                  </div>
                )}
                <div style={{ fontSize: 13, color: 'var(--schwarz)', whiteSpace: 'pre-wrap', lineHeight: 1.6, marginTop: 4 }}>
                  {details.goldeimer_prices}
                </div>
              </div>
            )
          }

          // ── Abschluss-Text (letzter Tag Supporti) ──
          if (item.type === 'danke_text') {
            return (
              <div key={i} style={{ fontSize: 14, color: 'var(--schwarz)', lineHeight: 1.65, marginBottom: 12 }}>
                Danke für euer Engagement! Wir sehen uns bei der AfterShit 🎉
              </div>
            )
          }

          // ── Sicherheitsbriefing-Item ──
          if (item.type === 'sicherheitsbriefing') {
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <SectionHeader text={item.title} />
                {item.bullets?.length > 0 && <BulletList bullets={item.bullets} />}
                {item.detail && !item.bullets && (
                  <div style={{ fontSize: 13, color: 'var(--grau-text)', marginBottom: 6, lineHeight: 1.5 }}>{item.detail}</div>
                )}
                <button onClick={() => setShowBriefing(true)} className="button button--yellow button--sm" style={{ width: 'auto' }}>
                  Sicherheitsbriefing öffnen
                </button>
              </div>
            )
          }

          // ── Titel-Item (Abschnittsüberschrift mit optionalem Inhalt) ──
          if (item.title) {
            return (
              <div key={i} style={{ marginBottom: item.bullets || item.detail || item.extra ? 10 : 0 }}>
                <SectionHeader text={item.title} />
                {item.bullets?.length > 0 && <BulletList bullets={item.bullets} mb={4} />}
                {item.detail && !item.bullets && (
                  <div style={{ fontSize: 13, color: 'var(--grau-text)', lineHeight: 1.5 }}>
                    {item.detail}
                  </div>
                )}
                {item.extra && (
                  <a href={`mailto:${item.extra.email}`} style={{ fontSize: 13, color: 'var(--grau-text)', wordBreak: 'break-all' }}>
                    {item.extra.label}
                  </a>
                )}
              </div>
            )
          }
          // ── Normales Todo (plain text, wie bisher) ──
          return (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: 'var(--schwarz)',
                marginTop: 9, flexShrink: 0,
              }} />
              <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--schwarz)' }}>
                {item.text}
                {item.extra && (
                  <div style={{ marginTop: 4 }}>
                    <a href={`mailto:${item.extra.email}`}
                      style={{ fontSize: 13, color: 'var(--grau-text)', wordBreak: 'break-all' }}>
                      {item.extra.label}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Sheets */}
      {showBriefing    && <SicherheitsbriefingSheet onClose={() => setShowBriefing(false)} />}
      {showAnleitung   && <AnleitungSheet onClose={() => setShowAnleitung(false)} />}
      {showPutzen      && <PutzenSheet onClose={() => setShowPutzen(false)} />}
      {showRueckmeldung && festivalId && (
        <RueckmeldungSheet
          festivalId={festivalId}
          festivalName={festivalName}
          crew={crew}
          onClose={() => setShowRueckmeldung(false)}
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
              <h4 className="card-title">{cl.title}</h4>
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
function ContactText({ text }) {
  if (!text) return null
  const phoneRegex = /(\+?[\d][\d\s\-/]{6,}[\d])/
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const persons = []
  let current = { nameLines: [], phones: [] }
  lines.forEach(line => {
    const match = line.match(phoneRegex)
    if (match) {
      const before = line.slice(0, match.index).trim()
      if (before && current.phones.length > 0) { persons.push(current); current = { nameLines: [], phones: [] } }
      if (before) current.nameLines.push(before)
      current.phones.push(match[1])
    } else {
      if (current.phones.length > 0) { persons.push(current); current = { nameLines: [], phones: [] } }
      current.nameLines.push(line)
    }
  })
  if (current.nameLines.length > 0 || current.phones.length > 0) persons.push(current)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {persons.map((person, i) => (
        <div key={i}>
          {person.nameLines.length > 0 && (
            <div style={{ fontSize: 14, color: 'var(--schwarz)', lineHeight: 1.5 }}>
              {person.nameLines.join(' ')}
            </div>
          )}
          {person.phones.map((phone, j) => (
            <a key={j} href={`tel:${phone.replace(/[\s\-/]/g, '')}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 13, color: 'var(--grau-text)', textDecoration: 'none', marginTop: 2 }}>
              <IconTelefon size={12} /> {phone}
            </a>
          ))}
        </div>
      ))}
    </div>
  )
}

function KontakteTab({ details, role, festivalName, crew, festivalId, attendanceSubmission }) {
  const isLeadOp   = role === 'lead' || role === 'operator'
  const isSupporti = role === 'supporti'
  const [showCrewSheet, setShowCrewSheet] = useState(false)

  const crewLoaded  = Array.isArray(crew)
  const sortedCrew  = crewLoaded
    ? [...crew].sort((a, b) => ROLLE_ORDER.indexOf(a.role) - ROLLE_ORDER.indexOf(b.role))
    : []

  const leadCrew     = sortedCrew.filter(m => m.role === 'lead')
  const opCrew       = sortedCrew.filter(m => m.role === 'operator')
  const suppPlusCrew = sortedCrew.filter(m => m.role === 'supporti_plus')

  const lbl      = { margin: 0, fontSize: 'var(--text-h4)', color: 'var(--schwarz)', marginBottom: 4 }
  const val      = { fontSize: 14, fontWeight: 400, color: 'var(--schwarz)' }
  const valMulti = { fontSize: 14, fontWeight: 400, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--schwarz)' }

  const hasCrewSection = isSupporti || leadCrew.length > 0 || opCrew.length > 0 ||
    (!isSupporti && suppPlusCrew.length > 0) ||
    details.crew_care ||
    (!isSupporti && (details.social_media_fotos || details.crew_sonstiges))

  // NUR Telegram-Links – shift_table_link kommt in die eigene Crew-Sektion
  const hasTelegramButtons = details.telegram_link || details.telegram_op_link

  // Crew-Sektion: für Leads/Ops immer anzeigen (ggf. mit Placeholder)
  const hasCrewCard = isSupporti || details.shift_table_link || isLeadOp

  return (
    <div>
      {/* [1] TELEGRAM */}
      {hasTelegramButtons && (
        <>
          <h3 className="section-title">Telegram</h3>
          <div className="card">
            <ul className="info-list">
              <li>
                <div>
                  <h4 style={lbl}>Telegram-Gruppe(n)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6, alignItems: 'flex-start' }}>
                    {details.telegram_link && (
                      <a
                        href={details.telegram_link.startsWith('http') ? details.telegram_link : `https://${details.telegram_link}`}
                        className="button button--yellow button--sm"
                        style={{ textDecoration: 'none', width: 'auto' }}
                      >
                        Telegram-Crew
                      </a>
                    )}
                    {isLeadOp && details.telegram_op_link && (
                      <a
                        href={details.telegram_op_link.startsWith('http') ? details.telegram_op_link : `https://${details.telegram_op_link}`}
                        className="button button--yellow button--sm"
                        style={{ textDecoration: 'none', width: 'auto' }}
                      >
                        Telegram-Op
                      </a>
                    )}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </>
      )}

      {/* [2] CREW (Schichtplan + Crew-Liste) */}
      {hasCrewCard && (
        <>
          <h3 className="section-title">Crew</h3>
          <div className="card">
            <ul className="info-list">
              {(details.shift_table_link || isSupporti) && (
                <li>
                  <div>
                    <h4 style={lbl}>Schichtplan</h4>
                    {details.shift_table_link ? (
                      <div style={{ marginTop: 6 }}>
                        <a
                          href={details.shift_table_link}
                          target="_blank" rel="noopener noreferrer"
                          className="button button--yellow button--sm"
                          style={{ textDecoration: 'none', width: 'auto' }}
                        >
                          Schichtplan öffnen
                        </a>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--grau-text)', marginTop: 2 }}>Wird noch bekannt gegeben</div>
                    )}
                  </div>
                </li>
              )}
              {isLeadOp && (
                <li>
                  <div>
                    <h4 style={lbl}>Crew-Liste</h4>
                    {crewLoaded ? (
                      <div style={{ marginTop: 6 }}>
                        <button
                          onClick={() => setShowCrewSheet(true)}
                          className="button button--sm"
                          style={{ border: 'none', cursor: 'pointer' }}
                        >
                          Crew-Liste & Anwesenheit feedbacken
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--grau-text)', marginTop: 2 }}>Wird noch bekannt gegeben</div>
                    )}
                  </div>
                </li>
              )}
            </ul>
          </div>
        </>
      )}

      {/* CREW-LISTE SHEET */}
      {showCrewSheet && (
        <CrewListSheet
          crew={sortedCrew}
          festivalId={role === 'lead' ? festivalId : null}
          festivalName={festivalName}
          attendanceSubmission={attendanceSubmission}
          details={details}
          onClose={() => setShowCrewSheet(false)}
        />
      )}

      {/* [3] SPECIAL CREW (Lead/Op/Supporti+/crew_care etc.) */}
      {hasCrewSection && (
        <>
          <h3 className="section-title">Special Crew</h3>
          <div className="card">
            <ul className="info-list">
              {(leadCrew.length > 0 || isSupporti) && (
                <li>
                  <div>
                    <h4 style={lbl}>Lead</h4>
                    {leadCrew.length > 0 ? leadCrew.map((m, i) => (
                      <div key={i} style={{ marginTop: i === 0 ? 2 : 6 }}>
                        <div style={{ fontSize: 14, color: 'var(--schwarz)' }}>{m.full_name}</div>
                        {m.phone && (
                          <a href={`tel:${m.phone.replace(/[\s\-/]/g, '')}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 13, color: 'var(--grau-text)', textDecoration: 'none', marginTop: 2 }}>
                            <IconTelefon size={12} /> {m.phone}
                          </a>
                        )}
                      </div>
                    )) : (
                      <div style={{ fontSize: 13, color: 'var(--grau-text)', marginTop: 2 }}>Wird noch bekannt gegeben</div>
                    )}
                  </div>
                </li>
              )}
              {(opCrew.length > 0 || isSupporti) && (
                <li>
                  <div>
                    <h4 style={lbl}>Operator</h4>
                    {opCrew.length > 0 ? opCrew.map((m, i) => (
                      <div key={i} style={{ marginTop: i === 0 ? 2 : 6 }}>
                        <div style={{ fontSize: 14, color: 'var(--schwarz)' }}>{m.full_name}</div>
                        {m.phone && (
                          <a href={`tel:${m.phone.replace(/[\s\-/]/g, '')}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 13, color: 'var(--grau-text)', textDecoration: 'none', marginTop: 2 }}>
                            <IconTelefon size={12} /> {m.phone}
                          </a>
                        )}
                      </div>
                    )) : (
                      <div style={{ fontSize: 13, color: 'var(--grau-text)', marginTop: 2 }}>Wird noch bekannt gegeben</div>
                    )}
                  </div>
                </li>
              )}
              {!isSupporti && suppPlusCrew.length > 0 && (
                <li>
                  <div>
                    <h4 style={lbl}>Supporti+</h4>
                    {suppPlusCrew.map((m, i) => (
                      <p key={i}>{m.full_name}</p>
                    ))}
                  </div>
                </li>
              )}
              {(details.crew_care || isSupporti) && (
                <li><div>
                  <h4 style={lbl}>Crew Care</h4>
                  {details.crew_care
                    ? <div style={valMulti}><ContactText text={details.crew_care} /></div>
                    : <div style={{ fontSize: 13, color: 'var(--grau-text)', marginTop: 2 }}>Wird noch bekannt gegeben</div>
                  }
                </div></li>
              )}
              {!isSupporti && details.social_media_fotos && (
                <li><div>
                  <h4 style={lbl}>Social Media / Fotos</h4>
                  <div style={valMulti}><ContactText text={details.social_media_fotos} /></div>
                </div></li>
              )}
              {!isSupporti && details.vca_crew && (
                <li><div>
                  <h4 style={lbl}>VCA Crew</h4>
                  <div style={valMulti}><ContactText text={details.vca_crew} /></div>
                </div></li>
              )}
              {!isSupporti && details.crew_sonstiges && (
                <li><div>
                  <h4 style={lbl}>Sonstiges</h4>
                  <div style={valMulti}>{details.crew_sonstiges}</div>
                </div></li>
              )}
            </ul>
          </div>
        </>
      )}

      {!hasTelegramButtons && !hasCrewCard && !hasCrewSection && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><IconKontakte size={32} /></div>
          <p className="card-sub">Infos werden noch eingetragen.</p>
        </div>
      )}

    </div>
  )
}

// ── CrewListSheet ─────────────────────────────────────────────────────────────

function CrewListSheet({ crew, festivalId, festivalName, attendanceSubmission, details, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, background: 'var(--weiss)',
        borderRadius: '16px 16px 0 0', zIndex: 401,
        maxHeight: '88dvh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px var(--sp-4)', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-h3)' }}>
            Crew-Liste
          </h3>
          <button onClick={onClose} aria-label="Schließen" style={{
            background: 'var(--papier)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: 'var(--schwarz)', fontWeight: 700,
          }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: 'var(--sp-4)', paddingBottom: 'calc(var(--sp-8) + env(safe-area-inset-bottom, 0px))' }}>
          <CrewListSection
            crew={crew}
            festivalId={festivalId}
            festivalName={festivalName}
            attendanceSubmission={attendanceSubmission}
            details={details}
            defaultOpen
          />
        </div>
      </div>
    </>
  )
}

// ── CrewListSection ───────────────────────────────────────────────────────────

const ROLLE_ORDER = ['lead', 'operator', 'supporti_plus', 'supporti', 'catering']

// Zeigt die bereits geladene Crew-Liste als aufklappbaren Block.
// Daten kommen aus dem Festival-Info-RPC — kein eigener Fetch.
// Leads/Operators können hier außerdem die Anwesenheit beim Festival abhaken
// (tri-state: offen / anwesend / nicht anwesend). Jede Änderung wird sofort als
// Entwurf gespeichert (attendance_entries), das Abschicken (→ Crew-Management)
// ist beliebig oft möglich, auch zur Korrektur.
function CrewListSection({ crew, festivalId, festivalName, attendanceSubmission, details, defaultOpen = false }) {
  const [open, setOpen]                       = useState(defaultOpen)
  const [attendance, setAttendance]           = useState({})
  const [savingIds, setSavingIds]             = useState(() => new Set())
  const [submitting, setSubmitting]           = useState(false)
  const [submitError, setSubmitError]         = useState('')
  const [submission, setSubmission]           = useState(attendanceSubmission || null)
  const saveTimers  = useRef({})

  useEffect(() => { setSubmission(attendanceSubmission || null) }, [attendanceSubmission])

  // Schnell-Initialisierung aus dem Crew-Array (kommt aus get_my_festival_info, kann gecacht sein).
  // Wird sofort gesetzt — der Loading-Indikator blendet die Liste aus, bis die DB-Abfrage
  // fertig ist und diesen Stand überschreibt. So gibt es einen Fallback falls der DB-Fetch scheitert.
  useEffect(() => {
    if (!crew) return
    setAttendance(prev => {
      const next = { ...prev }
      crew.forEach(a => {
        if (!(a.assignment_id in next)) next[a.assignment_id] = a.attendance_present ?? null
      })
      return next
    })
  }, [crew])

  // Beim Öffnen sofort frische DB-Daten holen (bypassed Cache), danach alle 20s
  // wiederholen — so sieht man immer den aktuellen Stand, auch wenn ein Kollege
  // zwischenzeitlich Einträge gemacht hat.
  useEffect(() => {
    if (!open || !festivalId) return
    let cancelled = false
    const refresh = async () => {
      try {
        const [entriesRes, subRes] = await Promise.all([
          fetchWithTimeout(
            supabase.from('attendance_entries')
              .select('assignment_id, present')
              .eq('festival_id', festivalId),
            8000
          ),
          fetchWithTimeout(
            supabase.from('attendance_submissions')
              .select('last_submitted_by_name, last_submitted_at, submission_count')
              .eq('festival_id', festivalId)
              .maybeSingle(),
            8000
          ),
        ])
        if (cancelled) return
        if (entriesRes.data) {
          setAttendance(prev => {
            const next = { ...prev }
            entriesRes.data.forEach(e => { next[e.assignment_id] = e.present })
            return next
          })
        }
        if (subRes.data) setSubmission(subRes.data)
      } catch (e) { /* Netzwerkfehler ignorieren, lokaler Stand bleibt erhalten */ }
    }
    refresh()
    const interval = setInterval(refresh, 20000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [open, festivalId])

  function cyclePresent(current) {
    // offen -> anwesend -> nicht anwesend -> offen
    if (current === null || current === undefined) return true
    if (current === true) return false
    return null
  }

  function setPresent(assignmentId, value) {
    setAttendance(prev => ({ ...prev, [assignmentId]: value }))
    setSavingIds(prev => { const next = new Set(prev); next.add(assignmentId); return next })
    clearTimeout(saveTimers.current[assignmentId])
    saveTimers.current[assignmentId] = setTimeout(async () => {
      try {
        await supabase.from('attendance_entries').upsert({
          festival_id:   festivalId,
          assignment_id: assignmentId,
          present:       value,
          checked_at:    new Date().toISOString(),
        }, { onConflict: 'assignment_id' })
      } catch (e) {
        console.error('Anwesenheit speichern fehlgeschlagen:', e)
      } finally {
        setSavingIds(prev => { const next = new Set(prev); next.delete(assignmentId); return next })
      }
    }, 600)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')
    try {
      const entries = (crew || []).map(a => ({
        assignment_id: a.assignment_id,
        email:         a.email || '',
        full_name:     a.full_name || '',
        role:          a.role,
        present:       attendance[a.assignment_id] ?? null,
      }))

      const token = await getAccessTokenFast()
      if (!token) throw new Error('Nicht eingeloggt – bitte Seite neu laden')

      const controller = new AbortController()
      const timeoutId  = setTimeout(() => controller.abort(), 30000)

      let res
      try {
        res = await fetch(
          'https://wsdkmglkqxszyvomrfim.supabase.co/functions/v1/submit-attendance-report',
          {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${token}`,
              'apikey':        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZGttZ2xrcXhzenl2b21yZmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTk4NjYsImV4cCI6MjA5MTczNTg2Nn0.CkX010BgVGjJUOs7RSYHlXJSwA-0jL4iPvi4gA59dTM',
            },
            body: JSON.stringify({ festival_id: festivalId, festival_name: festivalName, entries }),
            signal: controller.signal,
          }
        )
      } finally {
        clearTimeout(timeoutId)
      }

      const resData = await res.json()
      if (!res.ok || resData?.error) {
        setSubmitError(resData?.error || `Fehler ${res.status}`)
      } else {
        setSubmission({
          last_submitted_by_name: resData.submitted_by,
          last_submitted_at:      new Date().toISOString(),
          submission_count:       resData.submission_count || 1,
        })
      }
    } catch (e) {
      setSubmitError(e?.name === 'AbortError' ? 'Netz zu langsam – Daten wurden wahrscheinlich trotzdem gespeichert, bitte prüfen.' : (e?.message || 'Unbekannter Fehler beim Abschicken'))
    } finally {
      setSubmitting(false)
    }
  }

  const presentCount = Object.values(attendance).filter(v => v === true).length
  const decidedCount = Object.values(attendance).filter(v => v !== null && v !== undefined).length

  const festStart = parseDeDate(details?.start_leadop)
  const festEnd   = parseDeDate(details?.end_takedown)

  return (
    <div>
      {!defaultOpen && (
        <button
          onClick={() => setOpen(o => !o)}
          className="button button--yellow"
          style={{ width: '100%', marginBottom: open ? 8 : 0 }}
        >
          {open ? 'Crew-Liste schließen' : 'Crew-Liste anzeigen'}
        </button>
      )}

      {open && crew && (
        <div className="card">
          {crew.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--grau-text)' }}>Keine Crew-Mitglieder gefunden.</p>
          ) : (
            <>
              {festivalId && (
                <div style={{ marginBottom: 12 }}>
                  <h4 style={{
                    margin: 0, marginBottom: 4,
                    fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: 'var(--grau-text)', fontFamily: 'var(--font-heading)',
                  }}>
                    Anwesenheit beim Festival
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--grau-text)', lineHeight: 1.5, marginBottom: 8 }}>
                    Tippe auf den Kreis neben einer Person, um sie als anwesend ✓ oder nicht anwesend ✕
                    zu markieren. Das wird automatisch zwischengespeichert. Erst nach „Anwesenheit abschicken“
                    wird der Stand ins Crew-Management übertragen – das geht beliebig oft, auch zur Korrektur.
                  </p>
                  {submission?.last_submitted_at && (
                    <div style={{
                      background: '#e8f5e9', border: '1.5px solid var(--gruen)', borderRadius: 8,
                      padding: '8px 12px', fontSize: 12, color: 'var(--gruen)', fontWeight: 600, lineHeight: 1.5,
                      marginBottom: 8,
                    }}>
                      ✓ Zuletzt abgeschickt von <strong>{submission.last_submitted_by_name}</strong> um{' '}
                      {new Date(submission.last_submitted_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} Uhr
                      {submission.submission_count > 1 && <> ({submission.submission_count}. Abschicken)</>}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--grau-text)' }}>
                    {presentCount} von {crew.length} als anwesend markiert
                    {decidedCount < crew.length && <> · {crew.length - decidedCount} noch offen</>}
                  </div>
                </div>
              )}

              {crew.map((a, i) => {
                const present  = attendance[a.assignment_id]
                const isSaving = savingIds.has(a.assignment_id)
                return (
                  <div key={a.assignment_id || i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    paddingBottom: i < crew.length - 1 ? 10 : 0,
                    marginBottom: i < crew.length - 1 ? 10 : 0,
                    borderBottom: i < crew.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--schwarz)' }}>
                          {a.full_name || '—'}
                          {a.detail_pronouns && (
                            <span style={{ fontWeight: 400, color: 'var(--grau-text)', marginLeft: 4 }}>
                              ({a.detail_pronouns})
                            </span>
                          )}
                          {a.birthday && hasBirthdayDuring(a.birthday, festStart, festEnd) && (
                            <span style={{ fontWeight: 400, color: 'var(--grau-text)', marginLeft: 6, fontSize: 13 }}>
                              🎂 {formatBirthdayDe(a.birthday)}
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                          background: 'var(--papier)', color: 'var(--schwarz)',
                          border: '1.5px solid var(--border)',
                          padding: '2px 7px', borderRadius: 4, flexShrink: 0,
                        }}>
                          {a.detail_carpass === 'Ja' && (
                            <span style={{ fontSize: 14, marginRight: 3, display: 'inline-block', verticalAlign: 'middle' }}>🚗</span>
                          )}
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
                      {a.detail_arrival && (
                        <div style={{ fontSize: 11, color: 'var(--grau-text)', marginTop: 2, lineHeight: 1.4 }}>
                          {a.detail_arrival}
                        </div>
                      )}
                    </div>

                    {festivalId && (
                      <button
                        type="button"
                        onClick={() => setPresent(a.assignment_id, cyclePresent(present))}
                        disabled={!a.assignment_id}
                        title={present === true ? 'Anwesend – tippen zum Ändern' : present === false ? 'Nicht anwesend – tippen zum Ändern' : 'Noch offen – tippen zum Markieren'}
                        style={{
                          flexShrink: 0, width: 40, height: 40, borderRadius: 8,
                          border: `1.5px solid ${present === true ? 'var(--gruen)' : present === false ? 'var(--rot)' : 'var(--border)'}`,
                          background: present === true ? '#e8f5e9' : present === false ? '#FFF0ED' : 'transparent',
                          color: present === true ? 'var(--gruen)' : present === false ? 'var(--rot)' : 'var(--grau-text)',
                          fontSize: 18, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: isSaving ? 0.5 : 1, transition: 'all 0.1s',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {present === true ? '✓' : present === false ? '✕' : '–'}
                      </button>
                    )}
                  </div>
                )
              })}

              {festivalId && (
                <div style={{ marginTop: 12 }}>
                  {submission?.last_submitted_at && (
                    <div style={{
                      background: '#e8f5e9', border: '1.5px solid var(--gruen)', borderRadius: 8,
                      padding: '8px 12px', fontSize: 12, color: 'var(--gruen)', fontWeight: 600, lineHeight: 1.5,
                      marginBottom: 10,
                    }}>
                      ✓ Zuletzt abgeschickt von <strong>{submission.last_submitted_by_name}</strong> um{' '}
                      {new Date(submission.last_submitted_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} Uhr
                      {submission.submission_count > 1 && <> ({submission.submission_count}. Mal)</>}
                    </div>
                  )}
                  {submitError && (
                    <div style={{
                      background: '#FFF0ED', border: '1px solid var(--rot)', borderRadius: 6,
                      padding: '10px 14px', marginBottom: 10, fontSize: 13, color: 'var(--rot)',
                    }}>
                      ⚠ {submitError}
                    </div>
                  )}
                  <button onClick={handleSubmit} disabled={submitting} className="button" style={{ width: '100%' }}>
                    {submitting ? 'Wird abgeschickt…' : 'Anwesenheit abschicken'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── InfosTab ──────────────────────────────────────────────────────────────────

function InfosTab({ details, role, content, festivalId }) {
  const isLeadOp         = role === 'lead' || role === 'operator'
  const isKitchenVisible = role === 'catering' || role === 'operator' || role === 'lead'

  const lbl      = { margin: 0, fontSize: 'var(--text-h4)', color: 'var(--schwarz)', marginBottom: 4 }
  const val      = { fontSize: 14, fontWeight: 400, color: 'var(--schwarz)' }
  const valMulti = { fontSize: 14, fontWeight: 400, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--schwarz)' }

  const festivalYear = parseDeDate(
    details.start_supp || details.start_leadop || details.start_setup
  )?.getFullYear() || ''

  const hasKloInfos = details.count_module || details.shift_table_link || details.goldeimer_hours ||
    details.goldeimer_prices || (isKitchenVisible && details.festival_money_info)

  const hasExterneKontakte = isLeadOp && (
    details.production_mgmt || details.production_arbeitssicherheit || details.job_safety ||
    details.urin_pump || details.fsb_spedition || details.anhaenger_spedition ||
    details.vca_asp || details.awareness_team
  )

  const hasLogistik = isLeadOp && (
    details.location_info || details.lead_rider_link || details.festival_lageplan ||
    details.logistic_info || details.material_order || details.production_arbeitssicherheit
  )

  const hasKueche = isKitchenVisible && (
    details.kitchen_op || details.kitchen_crew_list || details.kitchen_info || details.kitchen_cost
  )

  return (
    <div>
      {/* ── Besonderheiten (roter Kasten, ganz oben) — nicht für Supportis ── */}
      {details.special_notes && role !== 'supporti' && (
        <div style={{
          background: '#fde8e3',
          border: '2px solid var(--rot)',
          borderRadius: 'var(--rounded)',
          padding: '14px var(--sp-4)',
          marginBottom: 'var(--sp-4)',
        }}>
          <h3 style={{ fontSize: 'var(--text-h3)', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--rot)', marginBottom: 8 }}>
            Besonderheiten {festivalYear}
          </h3>
          <div style={{ fontSize: 14, fontWeight: 400, whiteSpace: 'pre-wrap', lineHeight: 1.65, color: 'var(--schwarz)' }}>
            {details.special_notes}
          </div>
        </div>
      )}

      {/* ── Festival-Infos ── */}
      <h3 className="section-title">Festival-Infos</h3>
      <div className="card">
        <ul className="info-list">
          <li><div>
            <h4 style={lbl}>Anreise</h4>
            <div style={val}>{getAnreise(details, role) || 'Wird noch bekannt gegeben'}</div>
          </div></li>
          <li><div>
            <h4 style={lbl}>Abreise</h4>
            <div style={val}>{getAbreise(details, role) || 'Wird noch bekannt gegeben'}</div>
          </div></li>
          {details.festival_address && (
            <li><div><h4 style={lbl}>Anschrift</h4><div style={valMulti}>{details.festival_address}</div></div></li>
          )}
        </ul>
      </div>

      {/* ── Klo-Infos & Schichtplan ── */}
      {hasKloInfos && (
        <>
          <h3 className="section-title">Klo-Infos & Schichtplan</h3>
          <div className="card">
            <ul className="info-list">
              {details.shift_table_link && (
                <li><div>
                  <h4 style={lbl}>Schichtplan</h4>
                  <a href={details.shift_table_link} target="_blank" rel="noopener noreferrer"
                    className="button button--yellow button--sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 6 }}>
                    Schichtplan
                  </a>
                </div></li>
              )}
              {details.count_module && (
                <li><div><h4 style={lbl}>Anzahl Module</h4><div style={val}>{details.count_module}</div></div></li>
              )}
              {details.goldeimer_hours && (
                <li><div><h4 style={lbl}>Öffnungszeiten</h4><div style={valMulti}>{details.goldeimer_hours}</div></div></li>
              )}
              {details.goldeimer_prices && (
                <li><div><h4 style={lbl}>Preise</h4><div style={valMulti}>{details.goldeimer_prices}</div></div></li>
              )}
              {isKitchenVisible && details.festival_money_info && (
                <li><div><h4 style={lbl}>Kassensystem</h4><div style={valMulti}>{details.festival_money_info}</div></div></li>
              )}
            </ul>
          </div>
        </>
      )}

      {/* ── Externe Ansprechpersonen (nur Leads + Operator) ── */}
      {hasExterneKontakte && (
        <>
          <h3 className="section-title">Externe Ansprechpersonen</h3>
          <div className="card">
            <ul className="info-list">
              {details.production_mgmt && (
                <li><div>
                  <h4 style={lbl}>Produktion</h4>
                  <div style={valMulti}><ContactText text={details.production_mgmt} /></div>
                </div></li>
              )}
              {(details.production_arbeitssicherheit || details.job_safety) && (
                <li><div>
                  <h4 style={lbl}>Arbeitssicherheit</h4>
                  <div style={valMulti}><ContactText text={details.production_arbeitssicherheit || details.job_safety} /></div>
                </div></li>
              )}
              {details.urin_pump && (
                <li><div>
                  <h4 style={lbl}>IBC Abpumpung</h4>
                  <div style={valMulti}><ContactText text={details.urin_pump} /></div>
                </div></li>
              )}
              {details.fsb_spedition && (
                <li><div>
                  <h4 style={lbl}>FSB Spedition</h4>
                  <div style={valMulti}><ContactText text={details.fsb_spedition} /></div>
                </div></li>
              )}
              {details.anhaenger_spedition && (
                <li><div>
                  <h4 style={lbl}>Anhänger Spedition</h4>
                  <div style={valMulti}><ContactText text={details.anhaenger_spedition} /></div>
                </div></li>
              )}
              {details.vca_asp && (
                <li><div>
                  <h4 style={lbl}>VcA</h4>
                  <div style={valMulti}><ContactText text={details.vca_asp} /></div>
                </div></li>
              )}
              {details.awareness_team && (
                <li><div>
                  <h4 style={lbl}>Awareness-Team</h4>
                  <div style={valMulti}><ContactText text={details.awareness_team} /></div>
                </div></li>
              )}
            </ul>
          </div>
        </>
      )}

      {/* ── Standorte, Auf- und Abbau & Logistik (nur Leads + Operator) ── */}
      {hasLogistik && (
        <>
          <h3 className="section-title">Standorte, Auf- und Abbau & Logistik</h3>
          <div className="card">
            <ul className="info-list">
              {details.lead_rider_link && (
                <li><div>
                  <h4 style={lbl}>Anleitungen</h4>
                  <a href={details.lead_rider_link} target="_blank" rel="noopener noreferrer"
                    className="button button--yellow button--sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 6 }}>
                    Auf- und Abbauanleitung
                  </a>
                </div></li>
              )}
              {details.production_arbeitssicherheit && (
                <li><div>
                  <h4 style={lbl}>Arbeitssicherheit</h4>
                  <a href={details.production_arbeitssicherheit} target="_blank" rel="noopener noreferrer"
                    className="button button--yellow button--sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 6 }}>
                    Sicherheitsbriefing
                  </a>
                </div></li>
              )}
              {details.location_info && (
                <li><div><h4 style={lbl}>Standorte</h4><div style={valMulti}>{details.location_info}</div></div></li>
              )}
              {details.material_order && (
                <li><div><h4 style={lbl}>Bestellung</h4><div style={valMulti}>{details.material_order}</div></div></li>
              )}
              {details.logistic_info && (
                <li><div><h4 style={lbl}>Logistik</h4><div style={valMulti}>{details.logistic_info}</div></div></li>
              )}
            </ul>
          </div>
        </>
      )}

      {/* ── Küchen-Info (Leads, Operators, Catering) ── */}
      {hasKueche && (
        <>
          <h3 className="section-title">Küchen-Info</h3>
          <div className="card">
            <ul className="info-list">
              {details.kitchen_crew_list && (
                <li><div>
                  <h4 style={lbl}>Küchen-Liste</h4>
                  <a href={details.kitchen_crew_list} target="_blank" rel="noopener noreferrer"
                    className="button button--yellow button--sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 6 }}>
                    Küchen-Liste
                  </a>
                </div></li>
              )}
              {details.kitchen_op && (
                <li><div><h4 style={lbl}>Küche-Operator</h4><div style={valMulti}>{details.kitchen_op}</div></div></li>
              )}
              {details.kitchen_cost && (
                <li><div><h4 style={lbl}>Pauschale</h4><div style={valMulti}>{details.kitchen_cost}</div></div></li>
              )}
              {details.kitchen_info && (
                <li><div><h4 style={lbl}>Infos</h4><div style={valMulti}>{details.kitchen_info}</div></div></li>
              )}
            </ul>
          </div>
        </>
      )}

      {/* ── Dokumente ── */}
      {content && content.length > 0 && (
        <>
          <h3 className="section-title">Dokumente</h3>
          {content.map(c => (
            <div key={c.id} className="card">
              <h4 className="card-title">{c.title}</h4>
              {c.body && (
                <div style={{ fontSize: 14, lineHeight: 1.65, marginTop: 8, color: 'var(--schwarz)', whiteSpace: 'pre-wrap' }}>
                  {c.body}
                </div>
              )}
              {c.file_url && (
                <a href={c.file_url} target="_blank" rel="noopener noreferrer"
                  className="button button--yellow" style={{ marginTop: 12, textDecoration: 'none' }}>
                  Dokument öffnen
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
  { id: 'packen', label: 'Packen' },
  { id: 'fahren', label: 'Fahren' },
  { id: 'aufbau', label: 'Aufbau' },
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

function AufbauRueckmeldung({ festivalId, festivalName, crew, inSheet = false }) {
  const { profile } = useAuth()

  // Crew auf Aufbau-relevante Rollen filtern, nach Rolle sortieren
  const aufbauCrew = (crew || [])
    .filter(m => AUFBAU_CREW_ROLES.includes(m.role))
    .sort((a, b) => ROLLE_ORDER.indexOf(a.role) - ROLLE_ORDER.indexOf(b.role))

  // Pro Crew-Mitglied ein tasks-Array; wird aus DB wiederhergestellt
  const reportCacheKey = `aufbau_report_${festivalId}`

  function applyReportData(data) {
    setReport(data)
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

  const cachedReport = cacheGet(reportCacheKey)
  const [entries, setEntries]         = useState(() => {
    if (cachedReport?.crew_entries?.length) {
      return aufbauCrew.map(member => {
        const saved = cachedReport.crew_entries.find(e => e.name === member.full_name)
        return { tasks: saved?.tasks || [] }
      })
    }
    return aufbauCrew.map(() => ({ tasks: [] }))
  })
  const [extraPeople, setExtraPeople] = useState(() =>
    cachedReport?.extra_entries?.length
      ? cachedReport.extra_entries.map(e => ({ name: e.name, tasks: e.tasks || [] }))
      : [{ name: '', tasks: [] }]
  )
  const [report, setReport]           = useState(() => cachedReport || null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [saveStatus, setSaveStatus]   = useState('') // 'saving' | 'saved' | ''
  const saveTimer = useRef(null)

  useEffect(() => { loadReport() }, [festivalId])

  async function loadReport() {
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
        applyReportData(data)
        cacheSet(reportCacheKey, data, 48 * 60 * 60 * 1000)
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

    try {
      const crewPayload = aufbauCrew.map((m, i) => ({
        name:       m.full_name || '',
        role:       m.role,
        role_label: ROLLE_LABEL[m.role] || m.role,
        tasks:      entries[i]?.tasks || [],
      }))
      const extraPayload = extraPeople
        .filter(e => e.name.trim())
        .map(e => ({ name: e.name.trim(), tasks: e.tasks || [] }))

      // Plain fetch statt supabase.functions.invoke — invoke blockiert intern
      // beim Session-Refresh (Web-Lock-Problem). Mit getAccessTokenFast() holen
      // wir den Token mit Timeout + LocalStorage-Fallback, damit der Button nie
      // ewig auf "Wird abgeschickt…" hängen bleibt.
      const token = await getAccessTokenFast()
      if (!token) throw new Error('Nicht eingeloggt – bitte Seite neu laden')

      const controller = new AbortController()
      const timeoutId  = setTimeout(() => controller.abort(), 30000)

      let res
      try {
        res = await fetch(
          'https://wsdkmglkqxszyvomrfim.supabase.co/functions/v1/submit-aufbau-report',
          {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${token}`,
              'apikey':        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZGttZ2xrcXhzenl2b21yZmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTk4NjYsImV4cCI6MjA5MTczNTg2Nn0.CkX010BgVGjJUOs7RSYHlXJSwA-0jL4iPvi4gA59dTM',
            },
            body:    JSON.stringify({
              festival_id:    festivalId,
              festival_name:  festivalName,
              crew_entries:   crewPayload,
              extra_entries:  extraPayload,
            }),
            signal: controller.signal,
          }
        )
      } finally {
        clearTimeout(timeoutId)
      }

      const invokeData = await res.json()

      if (!res.ok || invokeData?.error) {
        setSubmitError(invokeData?.error || `Fehler ${res.status}`)
      } else {
        const updated = {
          ...(report || {}),
          is_submitted:      true,
          submitted_by_name: invokeData.submitted_by,
          submitted_at:      new Date().toISOString(),
          submission_count:  invokeData.submission_count || 1,
        }
        setReport(updated)
        cacheSet(reportCacheKey, updated, 48 * 60 * 60 * 1000)
      }
    } catch (e) {
      setSubmitError(e?.name === 'AbortError' ? 'Netz zu langsam – Daten wurden wahrscheinlich trotzdem gespeichert, bitte prüfen.' : (e?.message || 'Unbekannter Fehler beim Abschicken'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingReport) {
    return (
      <div style={{ marginTop: 'var(--sp-6)', color: 'var(--grau-text)', fontSize: 13 }}>
        Lädt Rückmeldung...
      </div>
    )
  }

  const isSubmitted = !!report?.is_submitted
  const isLocked = isSubmitted

  return (
    <div style={{ marginTop: inSheet ? 0 : 'var(--sp-6)' }}>
      {!inSheet && (
        <div style={{
          fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
          color: 'var(--grau-text)', fontFamily: 'var(--font-heading)', marginBottom: 10,
        }}>
          Rückmeldung
        </div>
      )}

      <div className="card" style={ inSheet ? { borderRadius: 0, boxShadow: 'none', border: 'none' } : {} }>
        {!inSheet && <h4 className="card-title" style={{ marginBottom: 6 }}>Rückmeldung Aufbau</h4>}
        <p style={{ fontSize: 13, color: 'var(--grau-text)', lineHeight: 1.6, marginBottom: 'var(--sp-4)' }}>
          Bitte gib uns am Ende des Aufbaus Rückmeldung über Anwesenheiten und Aufgabenverteilungen,
          damit wir im Büro die richtigen Pauschalen berechnen können.
        </p>

        {/* Crew-Liste */}
        {aufbauCrew.length > 0 && (
          <div style={{ marginBottom: 'var(--sp-4)', opacity: submitting ? 0.4 : 1, pointerEvents: submitting ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
            <AufbauTaskHeader />
            {aufbauCrew.map((member, idx) => (
              <AufbauTaskRow
                key={idx}
                name={member.full_name}
                sublabel={ROLLE_LABEL[member.role]}
                checkedTasks={entries[idx]?.tasks || []}
                onToggle={taskId => toggleCrewTask(idx, taskId)}
                isLast={idx === aufbauCrew.length - 1}
                readOnly={isLocked || submitting}
              />
            ))}
          </div>
        )}

        {/* Weitere Personen – bearbeitbar */}
        {!isLocked && (
          <div style={{ marginBottom: 'var(--sp-4)', opacity: submitting ? 0.4 : 1, pointerEvents: submitting ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
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

        {/* Weitere Personen – read-only (gesperrt) */}
        {isLocked && extraPeople.some(e => e.name) && (
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

        {/* Zwischenstand */}
        {!isLocked && saveStatus && (
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

        {/* Abschicken-Button (nicht gesperrt) */}
        {!isLocked && (
          <button onClick={handleSubmit} disabled={submitting} className="button" style={{ width: '100%' }}>
            {submitting ? 'Wird abgeschickt…' : 'Rückmeldung abschicken'}
          </button>
        )}

        {/* Grüne Bestätigung (gesperrt, kein Nachtrag-Button) */}
        {isLocked && (
          <div style={{
            background: '#e8f5e9', border: '1.5px solid var(--gruen)', borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13, color: 'var(--gruen)', fontWeight: 600, lineHeight: 1.5,
          }}>
            ✓ Abgeschickt von <strong>{report.submitted_by_name}</strong>
            {report.submitted_at && (
              <> um {new Date(report.submitted_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</>
            )}
          </div>
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

// Prüft ob ein Geburtstag (ISO-Date 'YYYY-MM-DD') in den Festivaltagen liegt
function hasBirthdayDuring(birthday, start, end) {
  if (!birthday || !start || !end) return false
  const [yr, mo, dy] = birthday.split('-').map(Number)
  // Festival kann Jahreswechsel überspannen → beide Jahre prüfen
  for (const year of new Set([start.getFullYear(), end.getFullYear()])) {
    const bd = new Date(year, mo - 1, dy)
    if (bd >= start && bd <= end) return true
  }
  return false
}

function formatBirthdayDe(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
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
