import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { cacheGet, cacheSet } from '../lib/cache'
import { fetchWithTimeout } from '../lib/fetchWithTimeout'
import { IconStar, IconPin, IconKalender, IconStift, IconInfos, IconKontakte } from '../components/Icons'

const CACHE_KEY = 'infos_content'

// ── FAQ-Inhalte ───────────────────────────────────────────────────────────────

const FAQ_GROUPS = [
  {
    group: 'Über Goldeimer',
    items: [
      {
        q: 'Was bedeutet Gemeinnützigkeit?',
        a: 'Goldeimer ist ein gemeinnütziges Unternehmen (gGmbH) in Verantwortungseigentum. Wir sind unverkäuflich und nach Satzung dazu verpflichtet, unsere Arbeit und alle finanziellen Mittel für das Gemeinwohl einzusetzen. Es gibt bei uns also keine Gewinnausschüttungen an Privatpersonen.\n\nUnser gemeinnütziger Zweck ist, Menschen den Zugang zu Klos zu ermöglichen, für kreislauforientierte Toiletten zu begeistern und uns für die Verbreitung von kreislauforientierten Toiletten inklusive Recycling der Hinterlassenschaften einzusetzen.',
      },
      {
        q: 'Was macht Goldeimer auf Festivals?',
        a: 'Seit 2013 nutzen wir Toiletten als Hebel, um auf die Sanitärkrise aufmerksam zu machen und nachhaltige Trockentoiletten wieder salonfähig zu machen. Auf den Campingplätzen der Festivalgelände retten wir den Festival-Besucher*innen den Arsch – mit sauberen, nachhaltigen Klos, die Spaß machen.\n\nUnsere Klos sind während des Festivals idR von 7–22 Uhr geöffnet und gegen Gebühr (Einzelschiss oder Kack-Flatrate) nutzbar. Es gibt immer Klopapier, Desinfektionsmittel, was zu Lesen und gute Musik. Das Ziel ist es, eine fantastische Klo-Experience zu schaffen.',
      },
      {
        q: 'Was ist besonders an den Toiletten?',
        a: '1. Nachhaltig – Unsere Trockentoiletten brauchen weder Chemie noch Wasser. Wir kompostieren die Fäkalien und machen fruchtbaren Humusdünger daraus.\n\n2. Sauber – Unsere Klos sind picobello, das ist unser Anspruch und Versprechen.\n\n3. Sozial – Goldeimer ist gemeinnützig. Keine Kohle für private Taschen, sondern für die Vision »Klos für alle! Alle für Klos!«.',
      },
      {
        q: 'Warum kosten Goldeimer Toiletten Geld?',
        a: 'Goldeimer betreibt Trockenklos. Anders als bei Spül- und Chemietoiletten pumpen wir die Kacke nicht ab, sondern recyceln die Nährstoffe sicher und hygienisch auf unserer eigenen Kompostieranlage südlich von Hamburg. Das ist ein ganz schöner finanzieller und logistischer Aufwand.\n\nAlle, die sich für unsere kostenpflichtigen Trockentoiletten entscheiden, unterstützen unsere gemeinnützige Arbeit für die nachhaltige Sanitärwende.',
      },
      {
        q: 'Wohin fließt das Geld und die Spenden?',
        a: 'Beim Bezahlen können Besuchende „aufrunden" und mit dem Spendchen gezielt für Sanitärprojekte spenden. In diesem Jahr gehen die Spenden in unser Kompostier-Forschungsprojekt in der Lüneburger Heide sowie an das Projekt Mosan in Guatemala.\n\nMosan betreibt am See Atitlán einen Trockenklo-Service und verwertet die Trockenkloinhalte zu Pflanzenkohle für die Landwirtschaft. Das trägt maßgeblich zur Verbesserung der Lebensbedingungen für Mensch und Natur bei.',
      },
      {
        q: 'Was passiert mit der Kacke?',
        a: 'Wir retten den Wertstoff Kacke und die darin enthaltenen Nährstoffe vor der Kanalisation. Nach dem Festival gehen die Trockenkloinhalte in die Kompostierung auf unserer Anlage südlich von Hamburg – fachgerecht hygienisiert und zu nährstoffreichem Recyclingdünger verarbeitet. Diese Super-Erde wird dann in wissenschaftlichen Feldversuchen als Bodenverbesserer genutzt.',
      },
      {
        q: 'Wie kann man Goldeimer unterstützen?',
        a: '• Geldspende: goldeimer.de/spenden oder direkt über das Bezahlsystem am Klo.\n\n• Reichweitenspende: Folg @goldeimer auf Instagram, LinkedIn, TikTok und teile unseren Content.\n\n• Zeitspende: Komm in die Ehrenamtscrew oder unterstütz uns beim Betrieb der Kompostieranlage in Ollsen (Lüneburger Heide).',
      },
    ],
  },
  {
    group: 'Als Supporti auf dem Festival',
    items: [
      {
        q: 'Was sind meine Aufgaben als Supporti?',
        a: 'Als ehrenamtliche*r Supporti begeisterst du die Menschen von der Goldeimer Vision und sorgst für gute Stimmung, Aufklärung und saubere Toiletten.\n\n• Informieren, kassieren, Stand betreuen – Du sorgst für gute Stimmung und glückliche Gesichter am Goldeimer. Du kassierst den Eintritt zu den Klos, bist ansprechbar für Festivalbesucher*innen und vermittelst die Goldeimer-Vision.\n\n• Klos sauber halten – In regelmäßigen Abständen wird das Klo geputzt, Einstreu gefegt und Klopapier nachgefüllt.',
      },
      {
        q: 'Wie sind die Schichten eingeteilt?',
        a: 'Wir planen dich während des gesamten Festivals i.d.R. für sechs Schichten à drei Stunden ein. In jeder Schicht sind immer drei Leute.',
      },
      {
        q: 'Was ist nicht meine Aufgabe?',
        a: 'Für den Auf- und Abbau der Klo-Camps, das Wechseln der vollen Tonnen, den Abtransport und das generelle Management vom Back-Office sind die Operator und Leads zuständig.\n\nWenn es Probleme oder Situationen gibt, in denen du Hilfe brauchst, kannst du dich jederzeit an sie wenden. Pro Camp gibt es zwei zuständige Operator.',
      },
    ],
  },
  {
    group: 'Festival Infos',
    items: [
      {
        q: 'Wie ist das mit dem Camping?',
        a: 'Wir campen zusammen im Crew-Camp. Bitte bring dein eigenes Zelt, Isomatte, Schlafsack und alles mit, was du für die Festival-Tage brauchst.\n\nDenk dran, die Wettervorhersage vorher zu checken. Bist du beim Auf- oder Abbau dabei, brauchst du Sicherheitsschuhe und ein extra Set Kleidung. Das Crew-Camp ist der Ort zum Ausruhen – laut gefeiert wird an den Klos und auf dem Festivalgelände.',
      },
      {
        q: 'Wie ist die Verpflegung geregelt?',
        a: 'Bei den meisten Festivals versorgt dich unsere Küchencrew im Crew Camp – wenn du möchtest – mit leckerem veganen Essen: eine warme Mahlzeit am Tag und eine Snack-Ecke für Frühstück und den Hunger zwischendurch.\n\nDie Verpflegung kostet zwischen 20 und 30 Euro, je nach Länge des Festivals. Getränke und Lieblingssnacks bringt jede*r selbst mit.',
      },
      {
        q: 'Wie läuft die An- und Abreise?',
        a: 'Die An- und Abreise erfolgt individuell. Wenn möglich raten wir dazu, mit den öffentlichen Verkehrsmitteln + Shuttles anzureisen. Wann und wo du vor Ort sein solltest, erfährst du rechtzeitig per Mail.\n\nSupportis starten am Tag der Campingplatzöffnung um 15 Uhr gemeinsam. Operator und Leads sind mind. einen Tag früher zum Aufbau da. Abreise ist für Supportis je nach Schicht am letzten Festivaltag oder am nächsten Tag.',
      },
      {
        q: 'Bekomme ich ein Festivalticket?',
        a: 'Ja! Du bekommst über uns ein Festivalticket für das gesamte Festival. In der Regel bekommst du im Vorfeld einen Voucher per Mail und musst dein Festival-Bändchen dann vor Ort abholen. Genaueres erfährst du rechtzeitig vorm Festival.',
      },
      {
        q: 'Gibt es ein Mindestalter?',
        a: 'Du musst aus haftungsrechtlichen Gründen mindestens 18 Jahre alt sein, um mit uns aufs Festival zu fahren.',
      },
      {
        q: 'Was sollte ich wissen, bevor ich komme?',
        a: 'Ein Festival ist laut, trubelig und dem Wetter ausgesetzt. Im besten Fall warst du schon mal auf Festivals und/oder hast Campingerfahrung und bringst eine gewisse Belastbarkeit mit.\n\nUnd dann ist da noch diese eine Sache: Wir arbeiten an Toiletten. Du wirst ab und an bestimmt mal was riechen und vielleicht auch mal sehen – aber keine Sorge. Wir halten die Klos schön sauber, das wissen die meisten Besuchenden sehr zu schätzen. Falls du mal überfordert bist, ist immer eine Ansprechperson da.',
      },
    ],
  },
]

// ── CoC-Inhalte ───────────────────────────────────────────────────────────────

const COC_SECTIONS = [
  {
    title: 'Einleitung',
    body: 'Der Code of Conduct (Verhaltenskodex) soll dazu beitragen, die Arbeit auf Festivals für die Goldeimer-Crew möglichst sicher und angenehm zu machen. Er richtet sich an alle Personen, die Teil der Festivalcrew von Goldeimer sind.\n\nMit Betreten des Veranstaltungsortes stimmst du dem Goldeimer Code of Conduct zu. Wird gegen den Code of Conduct verstoßen, erhält die entsprechende Person eine mündliche Verwarnung. Bei schwerwiegenden oder wiederholten Vorfällen kann dies zum Ausschluss von der Veranstaltung führen.\n\nAnmerkung zum Inhalt: Dieses Dokument handelt von dem Umgang mit und der Prävention von Diskriminierung, übergriffigem Verhalten und (sexualisierter) Gewalt. Achtet beim Lesen bitte auf euch.',
  },
  {
    title: 'Was ist Awareness?',
    body: '„Awareness ist ein Ansatz der Achtsamkeit im Umgang miteinander und ein Bewusstsein für die eigenen und die Grenzen anderer. Der Awarenessansatz kommt nicht aus der Theorie, sondern aus der Praxis: Er wurde von Betroffenen von Diskriminierung und (sexualisierter) Gewalt und ihren Verbündeten entwickelt."\n\nAwareness beschreibt das Bestreben, ein respektvolles Miteinander herzustellen, in dem sich alle Personen wohl und sicher fühlen können. Awareness-Arbeit möchte Diskriminierung und Grenzüberschreitungen vorbeugen und reaktive Handlungsstrategien entwickeln, um Betroffene bestmöglich zu unterstützen.\n\nWir verwenden den Begriff „Safer Spaces", um zu zeigen, dass es immer nur Schritte in die richtige Richtung geben kann – Awareness-Arbeit ist ein nie endender Prozess.',
  },
  {
    title: 'Awareness auf Festivals mit Goldeimer',
    body: 'Als Goldeimer-Crew können wir aktuell noch keine umfassende Awareness-Arbeit leisten. Wir können und wollen aber wichtige Schritte gehen:\n\n• Workshops vor der Festivalsaison (Basisworkshop zu Fallbeispielen und Handlungsoptionen)\n\n• Code of Conduct / Verhaltenskodex\n\n• Crew Care Ansprechperson für die Goldeimer-Crew auf jedem Festival\n\n• Hilfekärtchen an den Goldeimer-Toiletten mit 1. Hilfe-Übungen bei Angst & Panik\n\n• Anonymes Logbuch um Vorfälle intern zu dokumentieren\n\nLasst uns die Goldeimer-Festival-Crew gemeinsam zu einem Safer Space machen!',
  },
  {
    title: 'Die vier Grundprinzipien',
    body: '1. Kollektive Verantwortungsübernahme – Wir sind alle gemeinsam für den Raum verantwortlich, den wir schaffen – ganz egal, welche Rolle wir in der Crew haben.\n\n2. Definitionsmacht – Bei der Frage, was Diskriminierung und übergriffiges Verhalten sind, zählt die Sicht der betroffenen Person. Sie hat die Definitionsmacht über die Situation, denn nur sie selbst kennt ihre Grenzen.\n\n3. Parteilichkeit – Wir hören Betroffenen aufmerksam zu, glauben ihnen und unterstützen sie darin, selbstbestimmt zu handeln. Victim blaming oder das Anzweifeln der Wahrnehmung sind fehl am Platz – Solidarität steht an erster Stelle.\n\n4. Betroffenenzentriertheit & Selbstermächtigung – Die betroffene Person entscheidet immer selbst, wie es nach dem Vorfall weitergehen soll bzw. ob/welche Maßnahmen eingeleitet werden sollen.',
  },
  {
    title: 'Die 10 Grundsätze des Verhaltenskodex',
    body: '1. Wir tolerieren keine Diskriminierung und/oder Gewalt. Kein Rassismus, Queerfeindlichkeit, Sexismus, Antisemitismus oder irgendeine andere Form von menschenverachtenden Aussagen oder Handlungen.\n\n2. Goldeimer sind All-Gender-Toiletten. Unsere Toiletten sind von allen Personen nutzbar. Periodenprodukte werden allen Nutzenden kostenlos zur Verfügung gestellt.\n\n3. Selbstfürsorge ist die Grundlage für ein gutes Miteinander. Wir machen regelmäßig Pausen, bleiben hydriert und suchen uns Unterstützung, wenn wir uns überfordert oder unwohl fühlen.\n\n4. Wir achten aufeinander. Wir begegnen allen Menschen auf dem Festival respektvoll und freundlich. Unsere eigene Sicherheit hat dabei oberste Priorität.\n\n5. Wir handeln nach dem Konsens-Prinzip. „Nein" heißt „Nein" und vor allem: Nur „Ja" heißt „Ja"!\n\n6. Wir benutzen sensible Sprache. Wir nutzen genderneutrale Sprache und fragen nach Pronomen, wenn wir uns nicht sicher sind.\n\n7. Wir behalten unsere T-Shirts an. Auf Goldeimer-Flächen (Crew Camp & Goldeimer-Klos) zeigen wir Solidarität mit Personen, die sich nicht problemlos mit unbedeckten Oberkörpern zeigen können.\n\n8. Wenn wir konsumieren, konsumieren wir sensibel. An den Goldeimer-Toiletten herrscht absolutes Verbot von hartem Alkohol und illegalen Drogen.\n\n9. Es ist ein gemeinsamer Lernprozess. Fehler werden passieren und wir können gemeinsam aus ihnen lernen.\n\n10. Crew love is true love! Wir gehen wertschätzend, respektvoll, hilfsbereit und solidarisch miteinander um. 💛',
  },
  {
    title: 'Die 5Ds der Zivilcourage',
    body: 'Wenn ihr eine Situation bezeugt, die nach Belästigung oder Diskriminierung aussieht, ermutigen wir euch, aktiv einzugreifen. Eure eigene Sicherheit hat dabei immer oberste Priorität!\n\n1. DIAGNOSE – Achtet auf die Körpersprache der beteiligten Personen und auf verschiedene Formen der Grenzverletzung. Nur wer Probleme sehen kann, kann Lösungen finden.\n\n2. DIREKT – Sprecht die betroffene Person an und fragt, wie es ihr geht. Bietet Unterstützung an oder schlagt vor, die Situation gemeinsam zu verlassen.\n\n3. DELEGIERE – Bittet eine andere Person aus der Goldeimer-Crew zu helfen. Sprecht einzelne Personen gezielt an: „Du im roten Pullover, kannst du bitte herkommen?"\n\n4. DOKUMENTIERE – Ihr könnt die Situation dokumentieren, damit die betroffene Person das Material später verwenden kann (z.B. für eine Anzeige). Teilt nie Fotos/Videos ohne ausdrückliche Zustimmung der Betroffenen.\n\n5. DANACH – Sprecht die betroffene Person nach dem Vorfall an und fragt, ob ihr sie unterstützen könnt. Um eine Situation im Nachgang anzusprechen: Wendet euch an die Goldeimer-Ansprechperson für Crew Care oder schreibt an festival@goldeimer.de.',
  },
  {
    title: 'Weiterführende Links',
    body: 'Insbesondere Personen, die nicht selbst von Diskriminierung betroffen sind, laden wir ein, sich eigenständig in die Thematik einzulesen:\n\n• awareness-institut.net\n• act-aware.net\n• initiative-awareness.de/informieren/informier-dich\n• safethedance.de/awareness-leitfaden\n\nFragen und Feedback gerne an festival@goldeimer.de oder anonym über das Formular auf goldeimer.de.',
  },
]

// ── Chevron-Icon ──────────────────────────────────────────────────────────────
function Chevron({ open }) {
  return (
    <svg role="presentation" focusable="false" width="10" height="7" viewBox="0 0 10 7"
      style={{ display: 'block', flexShrink: 0, transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s ease' }}>
      <path d="m1 1.5 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// ── FAQ-Sektion ───────────────────────────────────────────────────────────────
function FaqSection() {
  const [openItem, setOpenItem] = useState(null) // "groupIdx-itemIdx"

  function toggle(key) {
    setOpenItem(prev => prev === key ? null : key)
  }

  return (
    <div>
      {FAQ_GROUPS.map((group, gi) => (
        <div key={gi} style={{ marginBottom: 'var(--sp-5)' }}>
          <div style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--grau-text)',
            marginBottom: 'var(--sp-2)',
            paddingLeft: 2,
          }}>
            {group.group}
          </div>
          <div style={{ background: 'var(--weiss)', borderRadius: 'var(--rounded)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {group.items.map((item, ii) => {
              const key = `${gi}-${ii}`
              const isOpen = openItem === key
              return (
                <div key={ii} style={{ borderBottom: ii < group.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <button
                    onClick={() => toggle(key)}
                    style={{
                      width: '100%', textAlign: 'left', background: 'none', border: 'none',
                      cursor: 'pointer', padding: 'var(--sp-4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--schwarz)', lineHeight: 1.4, flex: 1 }}>
                      {item.q}
                    </span>
                    <span style={{ color: 'var(--grau-dunkel)' }}>
                      <Chevron open={isOpen} />
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: '0 var(--sp-4) var(--sp-4)',
                      fontSize: 'var(--text-sm)',
                      lineHeight: 1.7,
                      color: 'var(--grau-text)',
                      whiteSpace: 'pre-wrap',
                      borderTop: '1px solid var(--border)',
                      paddingTop: 'var(--sp-3)',
                      marginTop: 0,
                    }}>
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── CoC-Sektion ───────────────────────────────────────────────────────────────
function CocSection() {
  const [openIdx, setOpenIdx] = useState(null)

  return (
    <div>
      {/* Intro-Banner */}
      <div style={{
        background: 'var(--schwarz)', borderRadius: 'var(--rounded)',
        padding: 'var(--sp-4)', marginBottom: 'var(--sp-4)',
        display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
      }}>
        <span style={{ fontSize: 28, lineHeight: 1 }}>💛</span>
        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--gelb)', marginBottom: 2 }}>
            Lasst uns gemeinsam einen Safer Space machen!
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--on-dark-sub)', lineHeight: 1.5 }}>
            Stand: April 2026 · Feedback an festival@goldeimer.de
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--weiss)', borderRadius: 'var(--rounded)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {COC_SECTIONS.map((section, i) => {
          const isOpen = openIdx === i
          return (
            <div key={i} style={{ borderBottom: i < COC_SECTIONS.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <button
                onClick={() => setOpenIdx(prev => prev === i ? null : i)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  cursor: 'pointer', padding: 'var(--sp-4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}
              >
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--schwarz)', lineHeight: 1.4, flex: 1 }}>
                  {section.title}
                </span>
                <span style={{ color: 'var(--grau-dunkel)' }}>
                  <Chevron open={isOpen} />
                </span>
              </button>
              {isOpen && (
                <div style={{
                  padding: '0 var(--sp-4) var(--sp-4)',
                  paddingTop: 'var(--sp-3)',
                  borderTop: '1px solid var(--border)',
                  fontSize: 'var(--text-sm)',
                  lineHeight: 1.75,
                  color: 'var(--grau-text)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {section.body}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Hauptseite ────────────────────────────────────────────────────────────────
export default function InfosPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const cached    = cacheGet(CACHE_KEY)
  const [content, setContent] = useState(cached || [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError]     = useState(false)

  const faqRef = useRef(null)
  const cocRef = useRef(null)

  useEffect(() => { loadContent() }, [])

  // Auto-scroll zu FAQ oder CoC wenn ?section= gesetzt
  useEffect(() => {
    const params  = new URLSearchParams(location.search)
    const section = params.get('section')
    if (!section) return
    const target = section === 'faq' ? faqRef : section === 'code-of-conduct' ? cocRef : null
    if (!target?.current) return
    // Kurzes Delay damit das Layout fertig ist
    const t = setTimeout(() => {
      target.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    return () => clearTimeout(t)
  }, [location.search])

  async function loadContent() {
    setError(false)
    const { data, error } = await fetchWithTimeout(
      supabase.from('content').select('*')
        .is('festival_id', null).eq('visibility', 'all').order('sort_order')
    )
    if (!error && data) {
      setContent(data)
      cacheSet(CACHE_KEY, data, 48 * 60 * 60 * 1000)
    } else if (error) {
      setError(true)
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--schwarz)' }}>
      {/* Header */}
      <div className="header">
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, fontWeight: 700, color: 'var(--schwarz)', padding: 0, lineHeight: 1 }}
        >←</button>
        <span className="header-logo" style={{ fontSize: '0.9rem' }}>Anleitungen & Infos</span>
        <span style={{ width: 20 }} />
      </div>

      {/* Schwarzes Banner */}
      <div style={{ background: 'var(--schwarz)', width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-6) var(--sp-4) 0' }}>
          <div className="statement" style={{ fontSize: 'var(--text-h0)', color: 'var(--gelb)', lineHeight: 1 }}>
            Anleitungen.
          </div>
          <p style={{ color: 'var(--on-dark-sub)', marginTop: 4, marginBottom: 0, fontSize: 'var(--text-sm)', fontWeight: 500 }}>
            Alles was ihr wissen müsst
          </p>
          <div style={{ paddingBottom: 'var(--sp-5)' }} />
        </div>
        {/* Welle: Schwarz → Papier */}
        <svg viewBox="0 0 480 64" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 56, marginBottom: -2, background: 'var(--papier)' }}>
          <path d="M0,0 L480,0 L480,32 C400,64 320,8 220,36 C140,58 60,12 0,28 Z"
            fill="var(--schwarz)" />
        </svg>
      </div>

      {/* Inhalt */}
      <div style={{ flex: 1, background: 'var(--papier)', padding: 'var(--sp-5) var(--sp-4) var(--sp-10)' }}>
        {loading && <div className="loading">Lädt...</div>}

        {!loading && error && (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IconStar size={32} /></div>
            <p className="card-sub" style={{ marginBottom: 16 }}>Verbindung unterbrochen.</p>
            <button className="button" onClick={loadContent}>Nochmal versuchen</button>
          </div>
        )}

        {/* Dynamische Inhalte aus DB */}
        {content.map(c => (
          <ContentCard key={c.id} item={c} />
        ))}

        {/* ── FAQ ── */}
        <div ref={faqRef} style={{ scrollMarginTop: 72 }}>
          <div className="section-title" style={{ marginTop: content.length > 0 ? 'var(--sp-8)' : 0, marginBottom: 'var(--sp-4)', fontSize: 'var(--text-base)' }}>
            FAQ
          </div>
          <FaqSection />
        </div>

        {/* ── Code of Conduct ── */}
        <div ref={cocRef} style={{ scrollMarginTop: 72, marginTop: 'var(--sp-8)' }}>
          <div className="section-title" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--text-base)' }}>
            Code of Conduct
          </div>
          <CocSection />
        </div>
      </div>

      {/* Footer: Welle Papier → Schwarz */}
      <div style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
        <svg viewBox="0 0 480 64" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 56, marginBottom: -2, background: 'var(--papier)' }}>
          <path d="M0,36 C80,8 180,56 280,24 C360,4 420,48 480,28 L480,64 L0,64 Z"
            fill="var(--schwarz)" />
        </svg>
        <div style={{ background: 'var(--schwarz)', padding: 'var(--sp-5) var(--sp-4)', textAlign: 'center' }}>
          <p style={{ color: 'var(--on-dark-sub)', fontSize: 'var(--text-xs)' }}>© Goldeimer gGmbH</p>
        </div>
      </div>
    </div>
  )
}

// ── DB-ContentCard (unverändert) ──────────────────────────────────────────────
function ContentCard({ item }) {
  const [expanded, setExpanded] = useState(false)

  const typeIcon = {
    anleitung:      <IconStift size={26}/>,
    lageplan:       <IconPin size={26}/>,
    notfallnummern: <IconKontakte size={26}/>,
    schichtplan:    <IconKalender size={26}/>,
    info:           <IconInfos size={26}/>,
  }[item.content_type] || <IconStar size={26}/>

  return (
    <div className="card" style={{ cursor: item.body ? 'pointer' : 'default' }} onClick={() => item.body && setExpanded(!expanded)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{typeIcon}</span>
        <div style={{ flex: 1 }}>
          <div className="card-title">{item.title}</div>
        </div>
        {item.body && (
          <span style={{ color: 'var(--grau-dunkel)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <svg role="presentation" focusable="false" width="8" height="6" viewBox="0 0 8 6"
              style={{ display: 'block', transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s ease' }}>
              <path d="m1 1.5 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </span>
        )}
      </div>

      {expanded && item.body && (
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: '1px solid var(--border)',
          fontSize: 14, lineHeight: 1.7,
          whiteSpace: 'pre-wrap', color: 'var(--schwarz)',
        }}>
          {item.body}
        </div>
      )}

      {item.file_url && (
        <a
          href={item.file_url} target="_blank" rel="noopener noreferrer"
          className="button button--secondary"
          style={{ marginTop: 12, textDecoration: 'none', display: 'inline-block' }}
          onClick={e => e.stopPropagation()}
        >
          Dokument öffnen →
        </a>
      )}
    </div>
  )
}
