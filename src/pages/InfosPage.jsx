import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { cacheGet, cacheSet } from '../lib/cache'
import { fetchWithTimeout } from '../lib/fetchWithTimeout'
import { IconStar, IconPin, IconKalender, IconStift, IconInfos, IconKontakte } from '../components/Icons'

const CACHE_KEY = 'infos_content'

// ── FAQ-Inhalte (vollständig aus PDF) ────────────────────────────────────────

const FAQ_GROUPS = [
  {
    group: 'Über Goldeimer',
    items: [
      {
        q: 'Was ist Goldeimer?',
        a: 'Goldeimer ist ein gemeinnütziges Unternehmen aus Hamburg, das sich für den Zugang zu Klos für alle Menschen weltweit und eine nachhaltige Sanitärwende einsetzt. 3,4 Milliarden Menschen haben noch keinen Zugang zu einer gesicherten Sanitärversorgung. Daran wollen wir was ändern. Wir betreiben Trockenklos auf Festivals, leisten Aufklärungs-, Bildungs- und Forschungsarbeit, verkaufen soziale Produkte wie unser Klopapier, verwerten menschliche Fäkalien zu Recyclingdünger und unterstützen durch Spenden weltweite Sanitärprojekte. Unsere Vision ist »Alle für Klos! Klos für alle!«',
      },
      {
        q: 'Was bedeutet Gemeinnützigkeit?',
        a: 'Goldeimer ist ein gemeinnütziges Unternehmen (gGmbH) in Verantwortungseigentum. Wir sind unverkäuflich und nach Satzung dazu verpflichtet, unsere Arbeit und alle finanziellen Mittel für das Gemeinwohl einzusetzen. Es gibt bei uns also keine Gewinnausschüttungen an Privatpersonen. Unser gemeinnütziger Zweck ist, Menschen den Zugang zu Klos zu ermöglichen, für kreislauforientierte Toiletten zu begeistern und uns für die Verbreitung von kreislauforientierten Toiletten inklusive Recycling der Hinterlassenschaften einzusetzen.',
      },
      {
        q: 'Was macht Goldeimer auf Festivals?',
        a: 'Seit 2013 nutzen wir Toiletten als Hebel, um auf die Sanitärkrise aufmerksam zu machen und nachhaltige Trockentoiletten wieder salonfähig zu machen. Auf den Campingplätzen der Festivalgelände retten wir den Festival Besucher*innen den Arsch – mit sauberen, nachhaltigen Klos, die Spaß machen. Unsere Klos sind während des Festivals idR von 7 - 22 Uhr geöffnet und gegen Gebühr (Einzelschiss oder Kack-Flatrate) nutzbar. Es gibt immer Klopapier, Desinfektionsmittel, was zu Lesen und gute Musik. Die Goldeimer Crew ist jederzeit ansprechbar, hält die Toiletten sauber, informiert die Besuchenden und sorgt für gute Stimmung. Das Ziel ist es, eine fantastische Klo-Experience zu schaffen.',
      },
      {
        q: 'Was ist besonders an den Toiletten?',
        a: '1. Nachhaltig: Unsere Trockentoiletten brauchen weder Chemie noch Wasser. Außerdem schließen sie den Nährstoffkreislauf: Wir kompostieren die Fäkalien und machen fruchtbaren Humusdünger daraus, der als Bodenverbesserer genutzt wird.\n\n2. Sauber: Unsere Klos sind picobello, das ist unser Anspruch und Versprechen.\n\n3. Sozial: Goldeimer ist gemeinnützig. Das heißt: Keine Kohle für private Taschen, sondern für unseren gemeinnützigen Zweck und die Vision »Klos für alle! Alle für Klos!«. Mit jeder Sitzung unterstützten Besucher*innen unsere Aufklärungs- und Bildungsarbeit, die Sanitärwende und Partner-Sanitärprojekte im Ausland.',
      },
      {
        q: 'Warum kosten Goldeimer Toiletten Geld?',
        a: 'Goldeimer betreibt Trockenklos. Anders als bei Spül- und Chemietoiletten pumpen wir die Kacke nicht ab und leiten sie ins nächste Klärwerk, sondern haben Größeres damit vor. Die Nährstoffe aus der Schiete recyceln wir sicher und hygienisch auf unserer eigenen Kompostieranlage südlich von Hamburg. Das ist ein ganz schöner finanzieller und logistischer Aufwand. Anders als bei wassergespülten Toiletten, gibt es für die Verwertung von Trockenkloinhalten noch keine ausgebaute Infrastruktur in Deutschland. Aber jetzt die gute Nachricht: Das Ziel von Goldeimer ist, dass es für den Betrieb von Trockenklos zukünftig keine Hürden mehr geben soll. Dann plumpsen nicht nur die großen Geschäfte, sondern auch die Betriebskosten. Dafür brauchen wir in Deutschland eine Änderung der rechtlichen Rahmenbedingungen, mehr Forschung und Kompostieranlagen, die die Kacke sicher und professionell verwerten können. In allen drei Punkten arbeiten wir fleißig mit. Alle, die sich für unsere kostenpflichtigen Goldeimer Trockentoiletten entscheiden, unterstützen unsere gemeinnützige Arbeit für die nachhaltige Sanitärwende.',
      },
      {
        q: 'Wohin fließt das Geld und die Spenden?',
        a: [
          'Beim Bezahlen können Besuchende "aufrunden" und z.B. mit dem Spendchen gezielt für Sanitärprojekte spenden. In diesem Jahr gehen die Spenden in unser Kompostier-Forschungsprojekt in der Lüneburger Heide sowie an das Projekt ',
          { text: 'Mosan', href: 'https://mosan.com/' },
          ' in Guatemala. Mosan betreibt am See Atitlán einen Trockenklo-Service und verwertet die Trockenkloinhalte zu Pflanzenkohle, die wiederum in der Landwirtschaft für die Aufwertung der Böden genutzt wird. Aufgrund schlechter sanitärer Infrastruktur in der Region werden Fäkalien unkontrolliert in den See geleitet und kontaminieren das Wasser – dabei sind viele tausend Menschen von der Frischwasserquelle abhängig. Mosan trägt so maßgeblich zur Verbesserung der Lebensbedingungen für Mensch und Natur bei.',
        ],
      },
      {
        q: 'Was passiert mit der Kacke?',
        a: [
          'Wir retten den Wertstoff Kacke und die darin enthaltenen Nährstoffe vor der Kanalisation und geben die Trockenkloinhalte nach dem Festival in die Kompostierung. Auf unserer Kompostieranlage südlich von Hamburg wird die Kacke fachgerecht hygienisiert, kompostiert und zu nährstoffreichem Recyclingdünger. Diese Super-Erde wird dann in wissenschaftlichen Feldversuchen als Bodenverbesserer genutzt. Alles andere ist aktuell leider illegal. Mehr dazu ',
          { text: 'hier', href: 'https://goldeimer.de/pages/recyclinganlage' },
          '.',
        ],
      },
      {
        q: 'Wie kann man Goldeimer unterstützen?',
        a: [
          '• Geldspende: Unterstütz unsere gemeinnützige Arbeit finanziell → ',
          { text: 'goldeimer.de/spenden', href: 'https://goldeimer.de/spenden' },
          ' oder hier direkt über das Bezahlsystem als Freie Spende\n\n• Reichweitenspende: Folg @goldeimer auf Social Media (Instagram, LinkedIn, TikTok), teile unseren Content und verbreite unsere Marke.\n\n• Zeitspende: Komm in die Ehrenamtscrew und fahr mit Goldeimer auf\'s Festival oder unterstütz uns beim Betrieb der Kompostieranlage in Ollsen (Lüneburger Heide).',
        ],
      },
    ],
  },
  {
    group: 'Als Supporti mit Goldeimer auf dem Festival',
    items: [
      {
        q: 'Aufgaben',
        a: 'Als ehrenamtliche*r Supporti begeisterst du die Menschen von der Goldeimer Vision und sorgst für gute Stimmung, Aufklärung und saubere Toiletten am Goldeimer. Deine Aufgaben sind vor allem:\n\n• Informieren, kassieren, Stand betreuen: Du sorgst für gute Stimmung und glückliche Gesichter am Goldeimer. Hau Musik in die Warteschleife und bring die Meute zum Tanzen. Du kassierst am Infostand den Eintritt zu den Klos und bist außerdem ansprechbar für die Festivalbesucher*innen. Wir wollen den Leuten die Vision von Goldeimer mitgeben, einige haben auch Fragen zur Trockentoilette. Wir weisen dich vorher in die komplette Thematik ein, sodass du vor Festivalbeginn eine Koryphäe im Scheiße labern wirst!\n\n• Klos sauber halten: In regelmäßigen Abständen wird das Klo geputzt, Einstreu aus der Toilette gefegt und Klopapier nachgefüllt. Dafür kriegst du eine Menge Liebe und Dankbarkeit von den Besucher*innen.\n\nDu wirst Teil unserer Crew und herzlich in die Goldeimer und Viva con Agua Familie aufgenommen. Klingt banal, ist aber fast das Beste an der ganzen Sache: Goldeimer ist ein Ehrenamt, das verdammt viel Spaß macht, und von dem alle profitieren – Festival-Besuchende, Ehrenamtliche, die Umwelt und Sanitärprojekte weltweit. Das wird ein zorniges Wochenende mit tollen Menschen und guter Musik!',
      },
      {
        q: 'Schichten',
        a: 'Wir planen dich während des gesamten Festivals i.d.R. für sechs Schichten à drei Stunden ein. In jeder Schicht sind immer drei Leute.',
      },
      {
        q: 'Das sind nicht deine Aufgaben',
        a: 'Für den Auf- und Abbau der Klo-Camps, das Wechseln der vollen Tonnen, den Abtransport und das generelle Management vom sogenannten Back-Office (alles, was hinter den Klos passiert) sind die Operator und Leads zuständig. Wenn es irgendwelche Probleme oder Situationen gibt, in denen du dir unsicher bist oder Hilfe brauchst, kannst du dich an sie wenden. Pro Camp gibt es zwei zuständige Operator.',
      },
    ],
  },
  {
    group: 'Festival Infos',
    items: [
      {
        q: 'Camping',
        a: 'Wir campen zusammen im Crew-Camp. Bitte bring dein eigenes Zelt, Isomatte, Schlafsack und alles mit, was du für die Festival-Tage brauchst. Denk dran, die Wettervorhersage vorher zu checken und entsprechende Kleidung einzupacken. Bist du beim Auf- oder Abbau der Goldeimer Toiletten dabei, brauchst du Sicherheitsschuhe und ein extra Set Kleidung. Das Crew-Camp ist Ort zum Ausruhen und Pause machen – laut gefeiert wird an den Klos und auf dem Festivalgelände.',
      },
      {
        q: 'Verpflegung',
        a: 'Bei den meisten Festivals versorgt dich unsere Küchencrew im Crew Camp - wenn du möchtest - mit leckerem veganen Essen (eine warme Mahlzeit am Tag und eine Snack-Ecke für Frühstück oder den Hunger zwischendurch). Die Verpflegung kostet zwischen 20 und 30 Euro, je nach Länge des Festivals. Getränke und Lieblingssnacks bringt jede*r selbst mit.',
      },
      {
        q: 'An- und Abreise',
        a: 'Die An- und Abreise zum Festival erfolgt individuell. Wenn möglich raten wir dazu, mit den öffentlichen Verkehrsmitteln + Shuttles anzureisen und nur mit dem Auto zu planen, wenn du es wirklich brauchst. Auf der Website des jeweiligen Festivals findest du alle Informationen zu den Anreisemöglichkeiten. Wann und wo du vor Ort sein solltest, erfährst du rechtzeitig per Mail. Grundsätzlich geht es für Supportis am Tag der Campingplatzöffnung um 15 Uhr mit einem gemeinsamen Start los, Operator und Leads sind schon mind. einen Tag früher zum Aufbau da. Abreise ist für Supportis je nach Schicht am letzten Festivaltag oder am nächsten Tag, Operator und Leads reisen nach dem Abbau ab.',
      },
      {
        q: 'Ticket',
        a: 'Du bekommst über uns ein Festivalticket für das gesamte Festival. In der Regel bekommst du im Vorfeld einen Voucher per Mail und musst dein Festival-Bändchen dann vor Ort abholen. Genaueres erfährst du rechtzeitig vorm Festival.',
      },
      {
        q: 'Mindestalter',
        a: 'Du musst aus haftungsrechtlichen Gründen mindestens 18 Jahre alt sein, um mit uns aufs Festival zu fahren.',
      },
      {
        q: 'Das sollte dir bewusst sein: Festival-Check',
        a: 'Ein Festival ist laut, trubelig und dem Wetter ausgesetzt – auf diese Dinge solltest du vorbereitet sein. Im besten Fall warst du schon mal auf Festivals und/oder hast Campingerfahrung und bringst eine gewisse Belastbarkeit in Sachen Wetter, Lärm und Menschen mit.\n\nUnd dann ist da noch diese eine Sache: Wir arbeiten an Toiletten. Das sollte dich nicht in Ekel versetzen. Du wirst ab und an bestimmt mal was riechen und vielleicht auch mal sehen, aber keine Sorge. Wir halten die Klos schön sauber, das wissen die meisten Besuchenden auch sehr zu schätzen. Falls du mal überfordert bist, ist immer eine Ansprechperson da.',
      },
      {
        q: 'Crew Love',
        a: [
          'steht bei uns an erster Stelle. Wir wollen als Goldeimer Crew einen diskriminierungsfreien Raum schaffen, in dem sich alle respektiert und willkommen fühlen können. Darum haben wir unsere Grundsätze für einen achtsamen Umgang miteinander im Code of Conduct formuliert, den du per Mail bekommen hast. Darin steht beispielsweise, dass wir keine Diskriminierung und/oder Gewalt tolerieren, auf sensible Sprache und Musik achten, unsere T-Shirts anbehalten und wertschätzend, respektvoll, hilfsbereit und solidarisch miteinander umgehen.\n\nMehr Infos zu Goldeimer: ',
          { text: 'www.goldeimer.de', href: 'https://www.goldeimer.de' },
          '\nWeitere Fragen an ',
          { text: 'festival@goldeimer.de', href: 'mailto:festival@goldeimer.de' },
        ],
      },
    ],
  },
]

// ── CoC-Inhalte (vollständig aus PDF, Stand 17.04.2026) ───────────────────────

const COC_CONTENT = [
  {
    type: 'intro',
    text: 'Das vorliegende Dokument soll dazu beitragen, die Arbeit auf Festivals für die Crew von Goldeimer möglichst sicher und angenehm zu machen, um uns allen einen schönen und sichereren Festivalsommer zu ermöglichen. Im Folgenden wird erklärt, was Awareness ist, wozu es Awareness-Arbeit braucht und welche Schritte wir als Goldeimer-Crew unternehmen können, damit sich alle von uns wohlfühlen. Dieser Code of Conduct (Verhaltenskodex) stärkt das Bewusstsein dafür, was getan werden muss, um uns allen eine gute Zeit zu ermöglichen und richtet sich daher an alle Personen, die Teil der Festivalcrew von Goldeimer sind.',
  },
  {
    type: 'p',
    text: 'Der Verhaltenskodex wurde nicht von Expert*innen aus dem Bereich formuliert, sondern basiert auf Gedanken von Mitgliedern der Goldeimer-Crew und ist in Teilen an den Safe the Dance Leitfaden angelehnt. Der Code of Conduct ist kein statisches Dokument; er soll regelmäßig (d.h. mindestens jährlich nach der Festivalsaison) überprüft und angepasst werden, um die Grundlage für einen möglichst sicheren Raum zu schaffen. Sollte euch etwas im Dokument auffallen, was unklar oder nicht in Ordnung ist, freuen wir uns über konstruktives Feedback und Verbesserungsvorschläge (an festival@goldeimer.de oder anonym via Formular).',
  },
  {
    type: 'note',
    text: 'Anmerkung zum Inhalt: Dieses Dokument handelt von dem Umgang mit und der Prävention von Diskriminierung, übergriffigem Verhalten und (sexualisierter) Gewalt. Auch wenn keine konkreten Vorfälle beschrieben werden, können Gefühle und Erinnerungen an Erlebnisse ausgelöst werden. Achtet beim Lesen daher bitte auf euch: Falls es euch nicht gut geht, macht eine Pause und nehmt euch Zeit, bevor ihr weiterlest, und lest das Dokument ggf. gemeinsam mit einer Person eures Vertrauens.',
  },
  {
    type: 'h2',
    text: 'Einleitende Gedanken',
  },
  {
    type: 'note',
    text: 'Tipp: Begriffe, die ihr noch nicht (ausreichend) kennt, könnt ihr in Glossaren wie bspw. awareness-akademie.de/glossar oder safethedance.de/glossar nachlesen.',
  },
  {
    type: 'p',
    text: 'Festivals sind ein Ort der Freude, an dem gemeinsam ausgelassen getanzt, gelacht und gefeiert werden kann. Trotz bester Intentionen kann dabei jedoch bewusst oder unbewusst grenzüberschreitendes, diskriminierendes und/oder gewaltvolles Verhalten auftreten. Diskriminierende und gewaltsame Einstellungen und daraus resultierende Handlungen sind tief in unserer Gesellschaft verankert und deshalb keine individuellen Einzelfälle, sondern ein strukturelles Problem. So sind Rassismus, Sexismus, Queerfeindlichkeit, Ableism, Catcalling, körperliche Übergriffe etc. auch bei vielen Veranstaltungen an der Tagesordnung. Dies kann zu Unsicherheiten und Ängsten führen – vor allem bei marginalisierten und/oder strukturell benachteiligten Menschen, die statistisch besonders häufig von diskriminierendem, übergriffigen und gewaltvollem Verhalten betroffen sind, wie bspw. bei BiPoC, FLINTA*, LGBTQIA* Personen und/oder Menschen mit Behinderung. Die Festivalstrukturen sowie die Besuchenden können wir dahingehend kaum beeinflussen, aber wir können versuchen, für unsere Crew einen „Safer Space" zu schaffen.',
  },
  {
    type: 'h2',
    text: 'Was ist Awareness?',
  },
  {
    type: 'note',
    text: 'to be aware = engl. aufmerksam / sich bewusst sein, für gewisse Problematiken sensibilisiert sein',
  },
  {
    type: 'quote',
    text: '„Awareness ist ein Ansatz der Achtsamkeit im Umgang miteinander und ein Bewusstsein für die eigenen und die Grenzen anderer. Der Awarenessansatz kommt nicht aus der Theorie, sondern aus der Praxis: Er wurde von Betroffenen von Diskriminierung und (sexualisierter) Gewalt und ihren Verbündeten entwickelt." (Quelle: awareness-institut.net)',
  },
  {
    type: 'p',
    text: 'Awareness beschreibt also das Bestreben, ein respektvolles Miteinander herzustellen, in dem sich alle Personen wohl und sicher fühlen können. Awareness-Arbeit kann grenzverletzendes Verhalten nicht generell verhindern, möchte aber einerseits Diskriminierung, Grenzüberschreitungen und gewaltvollen Übergriffen vorbeugen und andererseits reaktive Handlungsstrategien entwickeln, um Betroffene entsprechend ihren individuellen Bedürfnissen bestmöglich auf praktischer Ebene zu unterstützen.',
  },
  {
    type: 'p',
    text: 'Awareness ist nicht nur ein Konzept, sondern auch eine Haltung: Es ist notwendig, dass alle Teilnehmenden einer Veranstaltung sich der eigenen Position und Privilegien in der Gesellschaft bewusst sind, aktiv Verantwortung übernehmen und sich mit von Übergriffen betroffenen Personen solidarisieren.',
  },
  {
    type: 'p',
    text: 'Weil die Grenzen einzelner Personen sehr unterschiedlich sein können und eine Überschreitung – beabsichtigt oder nicht – nie ganz ausgeschlossen werden kann, gibt es keine zu 100% sicheren Räume, in denen alle Menschen gänzlich geschützt sind. Wir verwenden daher den Begriff „Safer Spaces“ (‚sicherere Räume‘), um zu zeigen, dass es immer nur Schritte in die richtige Richtung geben kann und Awareness-Arbeit ein nie endender Prozess ist.',
  },
  {
    type: 'h2',
    text: 'Wozu braucht es Awareness?',
  },
  {
    type: 'p',
    text: 'Vielleicht fragt ihr euch, wozu Awareness-Arbeit gut sein soll. Eventuell denkt ihr, eine Veranstaltung wäre sicher, weil bislang keine Vorfälle gemeldet wurden. Das könnte daran liegen, dass es tatsächlich keine grenzüberschreitenden Situationen gab; wahrscheinlicher ist jedoch, dass passende Anlaufstellen gefehlt haben oder die betroffenen Personen sich nicht getraut haben, ihre Erlebnisse anzusprechen. (Statistiken dazu findet ihr z.B. im Awareness-Leitfaden von Safe the Dance)',
  },
  {
    type: 'quote',
    text: '„Das langfristige Ziel von Awareness ist es, über Veranstaltungen niederschwellig viele Menschen für diese Themen zu sensibilisieren und ein rücksichtsvolle Art des Zusammenseins vorzuleben, um so einen gesamtgesellschaftlichen Wandel zu erreichen." (Quelle: Act-Aware e.V.)',
  },
  {
    type: 'p',
    text: 'Awareness-Arbeit ist dabei als ein fortlaufender Prozess zu betrachten, der auf allen Ebenen von Veranstaltungen verankert sein muss, damit er funktioniert. Awareness betrifft uns alle!',
  },
  {
    type: 'h2',
    text: 'Awareness auf Festivals mit Goldeimer',
  },
  {
    type: 'p',
    text: 'Als Goldeimer-Crew können wir aktuell noch keine umfassende Awareness-Arbeit leisten – weder für alle Besuchenden eines Festivals noch für uns selbst. Das bedeutet: Wir können keine umfängliche Ausbildung und Qualifizierung im Bereich Awareness ermöglichen, kein eigenes Awareness-Konzept anbieten, das alle möglichen Situationen auffangen kann, und keine Person stellen, die auf Festivals professionelle Awareness-Arbeit leistet.',
  },
  {
    type: 'p',
    text: 'Wir können und wollen aber wichtige Schritte gehen, um innerhalb unserer Crew ein Bewusstsein für Awareness zu schaffen, einen achtsamen Umgang miteinander zu haben und diskriminierende, gewaltvolle Situationen zu minimieren. Diese Schritte umfassen u.a.:',
  },
  {
    type: 'list',
    items: [
      'Workshops vor der Festivalsaison (Basisworkshop zu Fallbeispielen und Handlungsoptionen)',
      'Code of Conduct/Verhaltenskodex',
      'Crew Care Ansprechperson für die Goldeimer-Crew auf jedem Festival',
      'Hilfekärtchen an den Goldeimer-Toiletten mit 1. Hilfe-Übungen bei Angst & Panik',
      'Anonymes Logbuch um Vorfälle intern zu dokumentieren',
    ],
  },
  {
    type: 'highlight',
    text: 'Lasst uns die Goldeimer-Festival Crew gemeinsam zu einem Safer Space machen!',
  },
  {
    type: 'h2',
    text: 'Die vier goldenen Grundprinzipien',
  },
  {
    type: 'p',
    text: 'Als Festivalcrew von Goldeimer nehmen wir eine gemeinsame Haltung an, die auf den vier Grundprinzipien „kollektive Verantwortungsübernahme", „Definitionsmacht", „Parteilichkeit" und „Betroffenenzentriertheit & Selbstermächtigung" beruht. Dadurch schaffen wir die Grundlage für einen Umgang mit grenzüberschreitenden Vorfällen, der deren „negative Konsequenzen abmildert und auf die Wiederherstellung oder Erhaltung der Handlungsfähigkeit Betroffener abzielt. Handlungsmaxime sind dabei das individuelle Erleben und die Bedürfnisse betroffener Personen." (Quelle: Act-Aware e.V.)',
  },
  {
    type: 'h3',
    text: 'Kollektive Verantwortungsübernahme',
  },
  {
    type: 'p',
    text: 'Es ist wichtig, anzuerkennen, dass wir als Goldeimer Festivalcrew alle gemeinsam für den Raum verantwortlich sind, den wir schaffen – ganz egal, welche Rolle wir in der Crew haben. Für eine kollektive Haltung sind daher nicht nur die Personen zuständig, die z.B. den Code of Conduct formuliert haben, sondern alle, die mit Goldeimer an Festivals teilnehmen.',
  },
  {
    type: 'h3',
    text: 'Definitionsmacht',
  },
  {
    type: 'p',
    text: 'Bei der Frage, was Diskriminierung, übergriffiges Verhalten und (sexualisierte) Gewalt sind, zählen für uns nicht wissenschaftliche Definitionen, sondern die Sicht der betroffenen Person. Sie hat die Definitionsmacht über die Situation, denn nur sie selbst kennt ihre Grenzen und weiß genau, wann diese überschritten wurden. Es geht nicht darum, das Erlebte zu bewerten und es ist nicht notwendig, die Perspektive der Täter*innen zu kennen, um der betroffenen Person glauben zu können. Welche Vorfälle dazu führen, dass sich Menschen angegriffen, verletzt, herabgewürdigt oder diskriminiert fühlen, stellen wir nicht in Frage. Was für eine Person eine Kleinigkeit darstellt, kann anderen Menschen bspw. die Freude an der Veranstaltung nehmen. Wenn für eine betroffene Person etwas grenzüberschreitend ist, braucht es keine Rechtfertigung.',
  },
  {
    type: 'h3',
    text: 'Parteilichkeit',
  },
  {
    type: 'p',
    text: 'Betroffene stehen leider immer wieder vor der Hürde, dass ihnen gar nicht oder nur eingeschränkt geglaubt wird. Das Prinzip der Parteilichkeit beschreibt eine Haltung: Wir hören Betroffenen aufmerksam zu, glauben ihnen und unterstützen sie darin, selbstbestimmt zu handeln. Victim blaming, das Einfordern von Beweisen oder das Anzweifeln der Wahrnehmung der Betroffenen sind hier fehl am Platz – Solidarität steht an erster Stelle.',
  },
  {
    type: 'h3',
    text: 'Betroffenenzentriertheit & Selbstermächtigung',
  },
  {
    type: 'p',
    text: 'Wenn Grenzüberschreitungen passiert sind, wird die Tat häufig ins Zentrum der Aufmerksamkeit gerückt (Was ist passiert? Wer hat Schuld? Welche Konsequenzen sollte die Tat haben?). Dabei werden die Bedürfnisse der betroffenen Personen jedoch häufig außer Acht gelassen.',
  },
  {
    type: 'p',
    text: 'Durch grenzverletzende Situationen erleben Betroffene eine Art Kontrollverlust. Um diesem entgegenzuwirken, nehmen wir (anders als bspw. in der Security-Arbeit, deren Fokus häufig auf den Täter*innen liegt) daher eine betroffenenzentrierte Haltung ein: Wir versuchen, einen Raum zu schaffen, in dem die betroffene Person ihre Bedürfnisse spüren und äußern kann, damit wir sie unterstützen können. Wir zeigen eventuell Handlungsoptionen auf, aber die betroffene Person entscheidet immer selbst, wie es nach dem Vorfall weitergehen soll bzw. ob/welche Maßnahmen eingeleitet werden sollen. Dieses Prinzip basiert auf der Annahme, dass jede Person selbst am besten weiß, was ihr guttut.',
  },
  {
    type: 'h2',
    text: 'Goldeimer Code of Conduct (Verhaltenskodex)',
  },
  {
    type: 'p',
    text: 'Wir erkennen an, dass Diskriminierung und (sexualisierte) Gewalt überall passieren können – auch innerhalb unserer eigenen Crew. Wir tragen gemeinsam die Verantwortung, dem entgegenzuwirken. Zur Prävention von grenzüberschreitenden Situationen formulieren wir in diesem Code of Conduct (Verhaltenskodex) daher unsere Grundsätze für ein achtsames Miteinander innerhalb der Festivalcrew von Goldeimer. An vereinzelten Stellen beinhaltet der Code of Conduct auch Verweise auf mögliche Handlungsoptionen.',
  },
  {
    type: 'p',
    text: 'Mit Betreten des Veranstaltungsortes stimmst du dem Goldeimer Code of Conduct zu. Wird gegen den Code of Conduct verstoßen, erhält die entsprechende Person eine mündliche Verwarnung und bekommt die Gründe erklärt. Bei schwerwiegenden oder wiederholten Vorfällen kann dies zum Ausschluss von der Veranstaltung führen.',
  },
  {
    type: 'numbered',
    items: [
      {
        title: 'Wir tolerieren keine Diskriminierung und/oder Gewalt.',
        text: 'Wir wollen einen respektvollen, möglichst diskriminierungsfreien oder zumindest diskriminierungsarmen Safer Space schaffen, in dem sich jede Person wohl und respektiert fühlt und eine gute Zeit verbringen kann – hierfür sind wir alle gemeinsam verantwortlich. Deshalb dulden wir auf dieser Veranstaltung keine Form von Rassismus, Queerfeindlichkeit, Sexismus, Antisemitismus oder irgendeine andere Form von menschenverachtenden Aussagen oder Handlungen. Wir erkennen dabei an, dass es \'Intersektionalität\' gibt, d.h. dass einige Personen von mehrfacher Diskriminierung betroffen sind.',
      },
      {
        title: 'Goldeimer sind All-Gender-Toiletten.',
        text: 'Der Toilettengang ist ein allen Menschen gemeinsames Bedürfnis. All-Gender-Toiletten sind bspw. für trans*, inter* und nicht-binäre Personen sicherer als binär geteilte Toiletten. Um zu vermeiden, dass Personen sich beim Besuch unserer Toiletten vor schrägen Blicken, Kommentaren oder gar Verweisen fürchten müssen, gilt daher: Unsere Toiletten sind von allen Personen nutzbar: Periodenprodukte werden allen Nutzenden kostenlos zur Verfügung gestellt. Bedenkt dabei bitte immer, dass Menschen – unabhängig davon, wie wir sie vielleicht lesen – auf jede unserer Toiletten gehen dürfen, die sie für sich als richtig erachten. Wir können Menschen weder ansehen, womit sie pinkeln, noch, wie sie am liebsten pinkeln. (Wichtig: Aktuell sind die Goldeimer-Toiletten leider weder barrierefrei noch barrierearm.)',
      },
      {
        title: 'Selbstfürsorge ist die Grundlage für ein gutes Miteinander.',
        text: 'Um für andere unterstützend da sein zu können, müssen wir zuerst für unsere eigene Gesundheit und unser Wohlbefinden sorgen. Wir machen regelmäßig Pausen, bleiben hydriert und suchen uns Unterstützung, wenn wir uns überfordert oder unwohl (physisch oder psychisch) fühlen.',
      },
      {
        title: 'Wir achten aufeinander.',
        text: 'Wir begegnen allen Menschen auf dem Festival respektvoll und freundlich. Wenn wir vermuten, dass eine andere Person Hilfe brauchen könnte, fragen wir nach, ob und wie Unterstützung geleistet werden kann. Wenn eine Person ihre Sorgen oder Probleme anspricht, hören wir aufmerksam, empathisch und verständnisvoll zu. Sollten wir selbst in dem Moment keine ausreichenden Kapazitäten haben, um das zu leisten, holen wir eine andere Person aus der Crew dazu. Die betroffene Person entscheidet selbst, ob und in welcher Form Hilfe benötigt wird. Dabei beachten wir: Unsere eigene Sicherheit hat oberste Priorität!\n\nEmotionale Ausnahmezustände und Gewalteinwirkungen liegen außerhalb unseres Kompetenzbereichs. Beim Crew Briefing erfahren wir auf jedem Festival, welche anderen Instanzen in so einem Fall übernehmen können und wie wir diese Instanzen erreichen (bspw. Awareness-Konzept und -Team des Festivals, Sicherheitspersonal, Mitarbeitende des Festivals, Notrufnummern).\n\nWenn wir grenzüberschreitende Situationen sehen oder erleben und Support benötigen, wenden wir uns an vertrauensvolle Personen, wie z.B. an die Goldeimer-Ansprechperson für Crew Care oder an unmittelbar für uns erreichbare Mitglieder aus der Goldeimer Crew. Sollten Festivalbesuchende sich wiederholt oder besonders unangenehm verhalten, behalten wir uns in harten Fällen vor, sie vom Goldeimer zu verweisen.',
      },
      {
        title: 'Wir handeln nach dem Konsens-Prinzip.',
        text: '„Nein" heißt „Nein" und vor allem: Nur „Ja" heißt „Ja"! Auf dieser Grundlage stellen wir gegenseitiges Einverständnis bei jeder zwischenmenschlichen Interaktion sicher und sorgen dafür, dass unsere und die Grenzen anderer Personen respektiert werden.',
      },
      {
        title: 'Wir benutzen sensible Sprache.',
        text: 'Wir nutzen sensible, möglichst diskriminierungsarme und genderneutrale Sprache (bspw. Teilnehmende, Teilnehmer*innen) und schließen das generische Maskulinum aus. Wenn wir nicht wissen, welche Pronomen eine Person verwendet (z.B. they/them, sie/ihr, keine Pronomen), fragen wir die Person danach. Falsche Pronomen zu verwenden, kann verletzen und auch traumatisierend wirken und sollte daher möglichst vermieden werden.',
      },
      {
        title: 'Wir behalten unsere T-Shirts an.',
        text: 'Oberkörperfrei zu sein ist für cis Männer häufig selbstverständlich. Indem wir auf Goldeimer-Flächen (Crew Camp & Goldeimer-Klos) unsere Oberteile anlassen, zeigen wir Solidarität mit Personen, die sich nicht problemlos mit unbedeckten Oberkörpern zeigen können.',
      },
      {
        title: 'Wenn wir konsumieren, konsumieren wir sensibel.',
        text: 'An den Goldeimer-Toiletten herrscht absolutes Verbot von hartem Alkohol und illegalen Drogen. Wir achten immer darauf, dass wir arbeitsfähig und wohlauf, repräsentativ für Goldeimer und angenehm für unsere Mitmenschen bleiben. Dabei bedenken wir, dass nicht alle Menschen aus der Crew Alkohol, Cannabis oder Tabak konsumieren, und verhalten uns entsprechend rücksichtsvoll.',
      },
      {
        title: 'Es ist ein gemeinsamer Lernprozess.',
        text: 'Fehler werden passieren und wir können gemeinsam aus ihnen lernen. Wenn Personen diskriminierende Sprache oder Denkweisen verwenden, versuchen wir sie möglichst ruhig und durch konstruktive Kritik darauf aufmerksam zu machen. Wenn Menschen konstruktiv Kritik an uns richten, sind wir dafür offen und hören zu. Irritationen, Feedback und Reflexion können wir als Ausgangspunkt nehmen, um gemeinsam zu überlegen, wie wir das Festival zu einem möglichst angenehmen Ort für alle machen können.',
      },
      {
        title: 'Crew love is true love!',
        text: 'Wir gehen wertschätzend, respektvoll, hilfsbereit und solidarisch miteinander um. Be kind to each other und lasst uns gemeinsam eine tolle Zeit haben! 💛',
      },
    ],
  },
  {
    type: 'h2',
    text: 'Die 5Ds der Zivilcourage',
  },
  {
    type: 'note',
    text: 'Dies ist eine adaptierte und leicht gekürzte Version der 7Ds von Safe the Dance.',
  },
  {
    type: 'p',
    text: 'Wenn ihr eine Situation bezeugt, die für euch nach Belästigung oder Diskriminierung aussieht, ermutigen wir euch, aktiv einzugreifen. Wenn ihr euch nicht sicher seid, wie ihr intervenieren solltet, findet ihr hier ein paar mögliche Handlungsoptionen (während und nach dem Festival). Wichtig: Bei allem, was ihr tut, hat eure eigene Sicherheit oberste Priorität!',
  },
  {
    type: 'h3',
    text: '1. DIAGNOSE',
  },
  {
    type: 'p',
    text: 'Fallen euch Situationen unangenehm auf, so achtet auf die Körpersprache der beteiligten Personen und auf verschiedene, potentielle Formen der Grenzverletzung. Nur wer Probleme sehen kann, kann Lösungen finden und Menschen unterstützen.',
  },
  {
    type: 'h3',
    text: '2. DIREKT',
  },
  {
    type: 'p',
    text: 'Sprecht die betroffene Person an und fragt, wie es ihr geht. Bietet der Person eure Unterstützung an oder schlagt vor, die Situation gemeinsam zu verlassen.',
  },
  {
    type: 'h3',
    text: '3. DELEGIERE',
  },
  {
    type: 'p',
    text: 'Bittet eine andere Person (bspw. andere Personen aus der Goldeimer-Crew) zu helfen. Weist auf den Vorfall hin und bittet sie um Unterstützung. Wenn ihr Personen einbeziehen möchtet, die weiter weg sind, sprecht diese Personen gezielt an: „Du im roten Pullover, kannst du bitte herkommen und mir helfen?"',
  },
  {
    type: 'h3',
    text: '4. DOKUMENTIERE',
  },
  {
    type: 'p',
    text: 'Ihr könnt die Situation dokumentieren, um der betroffenen Person die Möglichkeit zu geben, dieses Material später zu verwenden, z.B. für eine Anzeige bei der Polizei. Teilt oder veröffentlicht nie Notizen/Fotos/Videos von einem Übergriff ohne die Zustimmung der Betroffenen. Teilt der betroffenen Person mit, dass ihr für eine Zeug*innenaussage zur Verfügung steht. Wichtig: Wenn eine Person keine Hilfe will, respektiert diese Entscheidung. Wenn ihr das Gefühl habt, dass das Leben der Person in unmittelbarer Gefahr ist, alarmiert je nach Vorfall den Sanitätsdienst, den Sicherheitsdienst oder die Polizei. Bedenkt dabei jedoch, dass die Polizei nicht für jede Person eine gute Wahl ist.',
  },
  {
    type: 'h3',
    text: '5. DANACH',
  },
  {
    type: 'p',
    text: 'Wir können nicht immer direkt eingreifen, aber es ist häufig möglich, Menschen nach einem Vorfall zu unterstützen. Sprecht die betroffene Person an und fragt, ob es ihr gut geht oder ob ihr sie bei etwas unterstützen könnt (z.B. Freund*innen anrufen).',
  },
  {
    type: 'p',
    text: 'Um eine erlebte Situation im Nachgang innerhalb des Goldeimer Kosmos anzusprechen, kannst du dich an die Goldeimer-Ansprechperson für Crew Care wenden. Alternativ kannst du andere Mitglieder der Goldeimer Crew (z.B. Leads oder Operatis), die Goldeimer Festivalkoordination (Tanja & Rolf via festival@goldeimer.de) kontaktieren oder das anonyme Formular von Goldeimer – auch im Nachgang des Festivals – nutzen.',
  },
  {
    type: 'h2',
    text: 'Weiterführende Informationen',
  },
  {
    type: 'p',
    text: 'Da wir keine umfängliche Auseinandersetzung mit allen möglich auftretenden Themen anbieten und auch nicht voraussetzen können, dass alle in der Crew umfangreiches Hintergrundwissen mitbringen, gibt es hier ein paar Links zu weiterführenden Informationen. Die Auswahl hat keinen Anspruch auf Vollständigkeit und darf gerne ergänzt werden.',
  },
  {
    type: 'p',
    text: 'Insbesondere Personen, die nicht selbst von Diskriminierung betroffen sind, laden wir ein, sich eigenständig in die Thematik einzulesen. So können wir uns gegenseitig unterstützen und übergriffige Situationen wahrnehmen, auch wenn sie uns nicht direkt selbst betreffen.',
  },
  {
    type: 'links',
    items: [
      'awareness-institut.net',
      'act-aware.net',
      'initiative-awareness.de/informieren/informier-dich',
      'safethedance.de/awareness-leitfaden',
    ],
  },
]

// ── Chevron ───────────────────────────────────────────────────────────────────
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
  const [openItem, setOpenItem] = useState(null)

  return (
    <div>
      {FAQ_GROUPS.map((group, gi) => (
        <div key={gi} style={{ marginBottom: 'var(--sp-5)' }}>
          <div style={{
            fontSize: 'var(--text-xs)', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--grau-text)', marginBottom: 'var(--sp-2)', paddingLeft: 2,
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
                    onClick={() => setOpenItem(prev => prev === key ? null : key)}
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
                      padding: 'var(--sp-3) var(--sp-4) var(--sp-4)',
                      borderTop: '1px solid var(--border)',
                      fontSize: 'var(--text-sm)', lineHeight: 1.75,
                      color: 'var(--grau-text)', whiteSpace: 'pre-wrap',
                    }}>
                      {Array.isArray(item.a)
                        ? item.a.map((part, pi) =>
                            typeof part === 'string'
                              ? part
                              : <a key={pi} href={part.href} target="_blank" rel="noopener noreferrer"
                                  style={{ color: 'var(--schwarz)', fontWeight: 600, textDecoration: 'underline' }}>
                                  {part.text}
                                </a>
                          )
                        : item.a}
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

// ── CoC als fließender Text ───────────────────────────────────────────────────
function CocPlainText() {
  return (
    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--schwarz)' }}>
      {COC_CONTENT.map((block, i) => {
        switch (block.type) {
          case 'intro':
            return (
              <p key={i} style={{ lineHeight: 1.75, marginBottom: 'var(--sp-4)', color: 'var(--grau-text)' }}>
                {block.text}
              </p>
            )
          case 'p':
            return (
              <p key={i} style={{ lineHeight: 1.75, marginBottom: 'var(--sp-4)', color: 'var(--grau-text)' }}>
                {block.text}
              </p>
            )
          case 'note':
            return (
              <div key={i} style={{
                background: 'var(--papier)', border: '1px solid var(--border)',
                borderRadius: 'var(--rounded-input)',
                padding: 'var(--sp-3) var(--sp-4)',
                marginBottom: 'var(--sp-4)',
                fontSize: 'var(--text-xs)', lineHeight: 1.6,
                color: 'var(--grau-text)', fontStyle: 'italic',
              }}>
                {block.text}
              </div>
            )
          case 'quote':
            return (
              <div key={i} style={{
                borderLeft: '3px solid var(--gelb)',
                paddingLeft: 'var(--sp-4)',
                marginBottom: 'var(--sp-4)',
                color: 'var(--grau-text)', lineHeight: 1.75,
                fontStyle: 'italic',
              }}>
                {block.text}
              </div>
            )
          case 'highlight':
            return (
              <div key={i} style={{
                background: 'var(--schwarz)', borderRadius: 'var(--rounded)',
                padding: 'var(--sp-3) var(--sp-4)',
                marginBottom: 'var(--sp-4)',
                fontSize: 'var(--text-sm)', fontWeight: 700,
                color: 'var(--gelb)', lineHeight: 1.5,
              }}>
                {block.text}
              </div>
            )
          case 'h2':
            return (
              <h2 key={i} style={{
                fontSize: 'var(--text-base)', fontWeight: 700,
                color: 'var(--schwarz)',
                marginTop: i === 0 ? 0 : 'var(--sp-7)',
                marginBottom: 'var(--sp-3)',
                paddingBottom: 'var(--sp-2)',
                borderBottom: '2px solid var(--gelb)',
              }}>
                {block.text}
              </h2>
            )
          case 'h3':
            return (
              <h3 key={i} style={{
                fontSize: 'var(--text-sm)', fontWeight: 700,
                color: 'var(--schwarz)',
                marginTop: 'var(--sp-5)', marginBottom: 'var(--sp-2)',
              }}>
                {block.text}
              </h3>
            )
          case 'list':
            return (
              <ul key={i} style={{ paddingLeft: 'var(--sp-5)', marginBottom: 'var(--sp-4)', lineHeight: 1.75, color: 'var(--grau-text)' }}>
                {block.items.map((it, j) => (
                  <li key={j} style={{ marginBottom: 'var(--sp-2)' }}>{it}</li>
                ))}
              </ul>
            )
          case 'numbered':
            return (
              <ol key={i} style={{ paddingLeft: 0, marginBottom: 'var(--sp-4)', listStyle: 'none' }}>
                {block.items.map((it, j) => (
                  <li key={j} style={{
                    display: 'flex', gap: 'var(--sp-3)',
                    marginBottom: 'var(--sp-4)',
                    paddingBottom: 'var(--sp-4)',
                    borderBottom: j < block.items.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{
                      flexShrink: 0, width: 24, height: 24,
                      background: 'var(--gelb)', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: 'var(--schwarz)',
                      marginTop: 2,
                    }}>
                      {j + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--schwarz)', marginBottom: 4, lineHeight: 1.4 }}>
                        {it.title}
                      </div>
                      <div style={{ color: 'var(--grau-text)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                        {it.text}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )
          case 'links':
            return (
              <div key={i} style={{ marginBottom: 'var(--sp-4)' }}>
                {block.items.map((link, j) => (
                  <div key={j} style={{
                    fontSize: 'var(--text-sm)', color: 'var(--grau-text)',
                    lineHeight: 1.75, fontFamily: 'monospace',
                  }}>
                    → <a href={`https://${link}`} target="_blank" rel="noopener noreferrer"
                        style={{ color: 'inherit', fontFamily: 'inherit', textDecoration: 'underline' }}>
                        {link}
                      </a>
                  </div>
                ))}
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}

// ── Hauptseite ────────────────────────────────────────────────────────────────
export default function InfosPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const params   = new URLSearchParams(location.search)
  const section  = params.get('section') // 'faq' | 'code-of-conduct' | null

  const cached = cacheGet(CACHE_KEY)
  const [content, setContent] = useState(cached || [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError]     = useState(false)

  const faqRef = useRef(null)
  const cocRef = useRef(null)

  useEffect(() => {
    // Immer nach oben scrollen wenn die Seite aufgerufen wird
    window.scrollTo(0, 0)
    // DB-Inhalte nur laden wenn keine spezifische Sektion aufgerufen wird
    if (!section) loadContent()
  }, [])

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

  // Titel und Untertitel im Banner je nach section
  const bannerTitle    = section === 'faq' ? 'FAQ' : section === 'code-of-conduct' ? 'Code of Conduct' : 'Anleitungen.'
  const bannerSubtitle = (!section) ? 'Alles was ihr wissen müsst' : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--schwarz)' }}>
      {/* Header */}
      <div className="header">
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, fontWeight: 700, color: 'var(--schwarz)', padding: 0, lineHeight: 1 }}
        >←</button>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/goldeimer-logo.png" alt="Goldeimer" style={{ height: 36 }} />
        </Link>
        <span style={{ width: 20 }} />
      </div>

      {/* Schwarzes Banner */}
      <div style={{ background: 'var(--schwarz)', width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-6) var(--sp-4) 0' }}>
          <div className="statement" style={{ fontSize: 'var(--text-h0)', color: 'var(--gelb)', lineHeight: 1.1 }}>
            {bannerTitle}
          </div>
          {bannerSubtitle && (
            <p style={{ color: 'var(--on-dark-sub)', marginTop: 4, marginBottom: 0, fontSize: 'var(--text-sm)', fontWeight: 500 }}>
              {bannerSubtitle}
            </p>
          )}
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

        {/* ── Nur FAQ ── */}
        {section === 'faq' && <FaqSection />}

        {/* ── Nur CoC ── */}
        {section === 'code-of-conduct' && (
          <div style={{ background: 'var(--weiss)', borderRadius: 'var(--rounded)', padding: 'var(--sp-5)', boxShadow: 'var(--shadow-sm)' }}>
            <CocPlainText />
          </div>
        )}

        {/* ── Standardansicht: DB-Inhalte + FAQ + CoC ── */}
        {!section && (
          <>
            {loading && <div className="loading">Lädt...</div>}

            {!loading && error && (
              <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IconStar size={32} /></div>
                <p className="card-sub" style={{ marginBottom: 16 }}>Verbindung unterbrochen.</p>
                <button className="button" onClick={loadContent}>Nochmal versuchen</button>
              </div>
            )}

            {content.map(c => <ContentCard key={c.id} item={c} />)}

            <div ref={faqRef} style={{ scrollMarginTop: 72, marginTop: content.length > 0 ? 'var(--sp-8)' : 0 }}>
              <div className="section-title" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--text-base)' }}>FAQ</div>
              <FaqSection />
            </div>

            <div ref={cocRef} style={{ scrollMarginTop: 72, marginTop: 'var(--sp-8)' }}>
              <div className="section-title" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--text-base)' }}>Code of Conduct</div>
              <div style={{ background: 'var(--weiss)', borderRadius: 'var(--rounded)', padding: 'var(--sp-5)', boxShadow: 'var(--shadow-sm)' }}>
                <CocPlainText />
              </div>
            </div>
          </>
        )}
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

// ── DB-ContentCard ────────────────────────────────────────────────────────────
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
          marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)',
          fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--schwarz)',
        }}>
          {item.body}
        </div>
      )}
      {item.file_url && (
        <a href={item.file_url} target="_blank" rel="noopener noreferrer"
          className="button button--yellow"
          style={{ marginTop: 12, textDecoration: 'none', display: 'inline-block' }}
          onClick={e => e.stopPropagation()}>
          Dokument öffnen
        </a>
      )}
    </div>
  )
}
