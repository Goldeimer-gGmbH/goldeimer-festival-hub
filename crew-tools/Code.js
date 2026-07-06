
/****************************************************
 * Goldeimer Crew Tools – Google Sheets Apps Script
 * (BEREINIGT / FULL REPLACE)
 ****************************************************/

/* =========================
 * CONFIG
 * ========================= */
const SHEETS = {
  APPLICATIONS: "APPLICATIONS",
  CREW_MASTER: "CREW_MASTER",
  FORM_RESPONSES: "Formularantworten 6",
  FESTIVALS: "CONFIG_FESTIVALS",
  TEMPLATES: "TEMPLATES_EMAIL",
  LOG: "LOG",
  DETAIL_CFG: "CONFIG_DETAILABFRAGE",
  SCHICHTPLAN: "SCHICHTPLAN",
  SHIFTSTATS: "SCHICHT_STATS",
  NEWBIES: "NEWBIES", 
  SPERRLISTE: "SPERRLISTE",
};

const ALL_ROLES = ["Lead", "Operator", "Supporti Plus", "Supporti", "Catering"];

// --- NEUE SORTIER-LOGIK (Ersetzt DASH_STATUS_ORDER) ---

// 1. Hierarchie der Rollen (für die vertikale Sortierung im Dashboard)
const ROLE_SORT_ORDER = {
  "LEAD": 1,
  "OPERATOR": 2,
  "SUPPORTI_PLUS": 3,
  "SUPPORTI": 4,
  "CATERING": 5,
  "FRIEND": 6,
  "OTHER": 7
};

// 2. Hierarchie der Status (für die Sortierung innerhalb der Rollen)
const STATUS_SORT_ORDER = {
  "teilgenommen": 1,
  "akkreditiert": 2,
  "zugesagt": 3,
  "friend": 3,
  "zusagen": 4,
  "auf warteliste": 5,
  "für warteliste": 6,
  "in_pruefung": 7,
  "eingegangen": 8,
  "final absagen": 9,
  "final abgesagt": 10,
  "zurueckgezogen": 11
};

const STATUS = {
  EINGEGANGEN: "eingegangen",
  IN_PRUEFUNG: "in_pruefung",
  ZUSAGEN: "zusagen",
  ZUGESAGT: "zugesagt",
  FRIEND: "friend",
  AKKREDITIERT: "akkreditiert",
  TEILGENOMMEN: "teilgenommen",
  FUER_WARTELISTE: "für warteliste",
  AUF_WARTELISTE: "auf warteliste",
  FINAL_ABSAGEN: "final absagen",
  FINAL_ABGESAGT: "final abgesagt",
  ZURUECKGEZOGEN: "zurueckgezogen",
};

// Diese Liste steuert die Dropdowns in den Zellen
const STATUS_LIST = [
  "eingegangen",
  "in_pruefung",
  "zusagen",
  "für warteliste",
  "final absagen",
  "zugesagt",
  "auf warteliste",
  "final abgesagt",
  "zurueckgezogen",
  "akkreditiert",
  "teilgenommen",
  "friend",
];

// Die alten Funktionen toDashboardStatus_ und DASHBOARD_STATUS_LIST 
// löschen wir komplett, da wir keine "Vereinfachung" mehr wollen, 
// sondern die echten Werte in 9 Spalten sehen.

const MAIL_STATUS_LIST = ["-", "zusage_gesendet", "warteliste_gesendet", "final_absage_gesendet"];
const DETAIL_STATUS_LIST = ["-", "detailabfrage_gesendet", "reminder_geschickt", "formular_ausgefuellt"];
const CONTRACT_STATUS_LIST = ["-", "unterschrieben"];

const MAIL_STATUS = {
  NONE: "-",
  ZUSAGE_SENT: "zusage_gesendet",
  WARTELISTE_SENT: "warteliste_gesendet",
  FINAL_ABSAGE_SENT: "final_absage_gesendet",
};

const DETAIL_STATUS = {
  NONE: "-",
  SENT: "detailabfrage_gesendet",
  REMINDER: "reminder_geschickt",
  DONE: "formular_ausgefuellt",
};

const MAIL_CFG = {
  TEST_RECIPIENT: "festival@goldeimer.de",
  SENDER_NAME: "Goldeimer Crew",
  REPLY_TO: "festival@goldeimer.de",
};

// Spreadsheet-ID der Newbie-Briefing-Anmeldeliste (Form_Responses)
const NEWBIE_BRIEFING_RESPONSES_ID = "1kzHtQCiW77tTNqRYAUdoQF3vqCTEDA_3lbWwoDVyaXw";

/* =========================
 * MENU
 * ========================= */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Crew Tools")
    .addItem("📤 Import aus Anmeldeformular", "uiSyncApplicationsFromForm")
    .addItem("🗂️ Dashboards erstellen/aktualisieren", "uiBuildFestivalDashboards")
    .addSeparator()
    .addItem("✉️ Zusage: Testversand", "uiSendOffersTest")
    .addItem("📩 Zusage: Echter Versand", "uiSendOffersReal")
    .addItem("✉️ Warteliste: Testversand", "uiSendWaitlistTest")
    .addItem("📩 Warteliste: Echter Versand", "uiSendWaitlistReal")
    .addItem("✉️ Finale Absage: Testversand", "uiSendFinalAbsageTest")
    .addItem("📩 Finale Absage: Echter Versand", "uiSendFinalAbsageReal")
    .addSeparator()
    .addItem("📤 Import Detailabfrage-Antworten", "uiSyncDetailResponses")
    .addItem("✉️ Detailabfrage: Testversand", "uiSendDetailRequestTest")
    .addItem("📩 Detailabfrage: Echter Versand", "uiSendDetailRequestReal")
    .addItem("✉️ Detailabfrage-Reminder: Testversand", "uiSendDetailReminderTest")
    .addItem("📩 Detailabfrage-Reminder: Echter Versand", "uiSendDetailReminderReal")
    .addSeparator()
    .addItem("📋 Lead Rider generieren & speichern", "uiGenerateLeadRider")
    .addItem("🚽 Crew-Liste generieren", "uiBuildCrewList")
    .addItem("🍽️ Küchen-Liste generieren", "uiBuildKitchenCrewList")
    .addItem("⌚️ Schichtplan erstellen/aktualisieren", "uiBuildUniversalSchichtplan")
    .addItem("📊 Schicht-Statistik neu berechnen", "uiRecalcUniversalShiftstats")
    .addItem("❌ Schichtplan-Reset", "uiResetUniversalSchichtplanLink")
    .addSeparator()
    .addItem("✉️ Letzte Info-Mail: Testversand", "uiSendLastInfoTest")
    .addItem("📩 Letzte Info-Mail: Echter Versand", "uiSendLastInfoReal")
    .addSeparator()
    .addItem("✅ Anwesenheit übernehmen (Status 'teilgenommen')", "uiSyncAttendanceToStatus")
    .addSeparator()
    .addItem("📜 Newbies-Liste aktualisieren", "uiBuildNewbieSheet")
    .addSeparator()
    .addItem("🌐 Festivals zu Supabase synchronisieren", "syncAllFestivalsToSupabase")
    .addToUi();
}



/* =========================
 * UI ACTIONS
 * ========================= */
function uiSyncApplicationsFromForm() {
  const result = syncApplicationsFromForm_();
  toast_(`Import fertig: ${result.created} neu, ${result.updated} aktualisiert, ${result.skipped} übersprungen.`);
}

function uiBuildFestivalDashboards() {
  const res = buildFestivalDashboards_();
  toast_(`Dashboards aktualisiert: ${res.created} neu, ${res.updated} aktualisiert.`);
}

function uiBuildNewbieSheet() {
  const res = buildNewbieSheet_();
  toast_(`Newbies aktualisiert: ${res.count} Personen gefunden.`);
}

function buildNewbieSheet_() {
  const ss = SpreadsheetApp.getActive();
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  const crewSheet = ss.getSheetByName(SHEETS.CREW_MASTER);
  if (!appSheet || !crewSheet) throw new Error("APPLICATIONS oder CREW_MASTER fehlt.");

  const appData = readSheetAsObjects_(appSheet);
  const crewData = readSheetAsObjects_(crewSheet);

  const crewByEmail = new Map();
  crewData.rows.forEach(r => {
    const em = normEmail_(r.email);
    if (em) crewByEmail.set(em, r);
  });

  const newbieApps = appData.rows.filter(r =>
    parseExperienceBucket_(r.experience_count) === "0"
  );

  const byEmail = new Map();
  newbieApps.forEach(r => {
    const em = normEmail_(r.email);
    if (!em) return;
    if (!byEmail.has(em)) byEmail.set(em, []);
    byEmail.get(em).push(r);
  });

  // ── Bestehende Notizen sichern (vor dem Clear) ──────────────────────────
  const savedNotes = new Map(); // email → note-text
  const NOTES_COL_LABEL = "Notizen";
  const EMAIL_COL_LABEL  = "E-Mail";

  let sh = ss.getSheetByName(SHEETS.NEWBIES);
  if (sh) {
    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();
    if (lastRow >= 1 && lastCol >= 1) {
      const existing = sh.getRange(1, 1, lastRow, lastCol).getValues();
      const existHeaders = existing[0].map(h => String(h).trim());
      const emailIdx = existHeaders.indexOf(EMAIL_COL_LABEL);
      const notesIdx = existHeaders.indexOf(NOTES_COL_LABEL);
      if (emailIdx !== -1 && notesIdx !== -1) {
        for (let i = 1; i < existing.length; i++) {
          const em = normEmail_(existing[i][emailIdx]);
          const note = String(existing[i][notesIdx] || "").trim();
          if (em && note) savedNotes.set(em, note);
        }
      }
    }
    sh.clear();
    sh.clearConditionalFormatRules();
  } else {
    sh = ss.insertSheet(SHEETS.NEWBIES);
  }

  // ── Header ───────────────────────────────────────────────────────────────
  const HEADER_LABELS = [
    "Vorname", "Nachname", EMAIL_COL_LABEL, "Telefon",
    "Wohnort", "Geburtsdatum", "Über mich", "Festivals & Rollen", NOTES_COL_LABEL
  ];
  const NOTES_COL_IDX = HEADER_LABELS.indexOf(NOTES_COL_LABEL) + 1; // 1-based

  sh.getRange(1, 1, 1, HEADER_LABELS.length)
    .setValues([HEADER_LABELS])
    .setFontWeight("bold")
    .setBackground("#444444")
    .setFontColor("#ffffff");
  sh.setFrozenRows(1);

  // ── Daten aufbauen ────────────────────────────────────────────────────────
  const sortedEmails = [...byEmail.keys()].sort((a, b) => {
    const ca = crewByEmail.get(a) || byEmail.get(a)[0];
    const cb = crewByEmail.get(b) || byEmail.get(b)[0];
    return String(ca.last_name || "").toLowerCase()
      .localeCompare(String(cb.last_name || "").toLowerCase(), "de");
  });

  const rows = sortedEmails.map(em => {
    const apps = byEmail.get(em);
    const crew = crewByEmail.get(em) || {};

    const festLines = apps
      .sort((a, b) => String(a.festival_name).localeCompare(String(b.festival_name), "de"))
      .map(a => `${String(a.festival_name || a.festival_id || "").trim()} (${String(a.role || "").trim()}) – ${String(a.status || "").trim()}`)
      .join("\n");

    return [
      String(crew.first_name || apps[0].first_name || "").trim(),
      String(crew.last_name  || apps[0].last_name  || "").trim(),
      em,
      String(crew.phone     || "").trim(),
      String(crew.city      || "").trim(),
      String(crew.birthdate || "").trim(),
      String(crew.about     || apps[0].about || "").trim(),
      festLines,
      savedNotes.get(em) || "",   // ← gesicherte Notiz wiederherstellen
    ];
  });

  if (rows.length > 0) {
    sh.getRange(2, 1, rows.length, HEADER_LABELS.length).setValues(rows);

    // Festivals-Spalte: Wrap + feste Breite
    const festColIdx = HEADER_LABELS.indexOf("Festivals & Rollen") + 1;
    sh.getRange(2, festColIdx, rows.length, 1)
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    sh.setColumnWidth(festColIdx, 320);

    // About: feste Breite + Clip
    const aboutColIdx = HEADER_LABELS.indexOf("Über mich") + 1;
    sh.setColumnWidth(aboutColIdx, 220);
    sh.getRange(2, aboutColIdx, rows.length, 1)
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

    // Notizen-Spalte: gelb hinterlegt + Wrap
    sh.setColumnWidth(NOTES_COL_IDX, 250);
    sh.getRange(1, NOTES_COL_IDX, Math.max(rows.length + 1, 2), 1)
      .setBackground("#fff9c4");
      sh.getRange(1, NOTES_COL_IDX).setFontColor("#000000");  // ← NEU
    sh.getRange(2, NOTES_COL_IDX, rows.length, 1)
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

    // Kontaktspalten auto-resize
    sh.autoResizeColumns(1, 6);

    // Zeilenhöhe: alle Datenzeilen einheitlich etwas größer
    for (let r = 2; r <= rows.length + 1; r++) sh.setRowHeight(r, 40);
  }

  // ── Sheet hinter CREW_MASTER einordnen ────────────────────────────────────
  const allSheets = ss.getSheets();
  const crewIdx = allSheets.findIndex(s => s.getName() === SHEETS.CREW_MASTER);
  if (crewIdx !== -1) {
    ss.setActiveSheet(sh);
    ss.moveActiveSheet(crewIdx + 2); // 1-based: direkt nach CREW_MASTER
  }

  log_({ action: "BUILD_NEWBIE_SHEET", meta: { count: rows.length }, count: rows.length });
  return { count: rows.length };
}

function uiSendOffersTest() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  const res = sendOffersAllRolesForFestival_({ festivalId, forceTest: true });
  toast_(`TEST Zusagen: ${res.sentOk} OK, ${res.sentFailed} Fehler`);
}

function uiSendOffersReal() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  const res = sendOffersAllRolesForFestival_({ festivalId, forceTest: false });
  toast_(`ECHT Zusagen: ${res.sentOk} OK, ${res.sentFailed} Fehler`);
}

function uiSendWaitlistTest() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  const res = sendWaitlistAllRolesForFestival_({ festivalId, forceTest: true });
  toast_(`TEST Warteliste: ${res.sentOk} OK, ${res.sentFailed} Fehler`);
}

function uiSendWaitlistReal() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  const res = sendWaitlistAllRolesForFestival_({ festivalId, forceTest: false });
  toast_(`ECHT Warteliste: ${res.sentOk} OK, ${res.sentFailed} Fehler`);
}

function uiSendFinalAbsageTest() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  const res = sendFinalAbsageAllRolesForFestival_({ festivalId, forceTest: true });
  toast_(`TEST Absage: ${res.sentOk} OK, ${res.sentFailed} Fehler`);
}

function uiSendFinalAbsageReal() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  const res = sendFinalAbsageAllRolesForFestival_({ festivalId, forceTest: false });
  toast_(`ECHT Absage: ${res.sentOk} OK, ${res.sentFailed} Fehler`);
}

function uiSendDetailRequestTest() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  const res = sendDetailRequestForFestival_({ festivalId, forceTest: true, isReminder: false });
  toast_(`TEST Detailabfrage: ${res.sentOk} OK, ${res.sentFailed} Fehler`);
}

function uiSendDetailRequestReal() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  const res = sendDetailRequestForFestival_({ festivalId, forceTest: false, isReminder: false });
  toast_(`ECHT Detailabfrage: ${res.sentOk} OK, ${res.sentFailed} Fehler`);
}

function uiSendDetailReminderTest() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  const res = sendDetailRequestForFestival_({ festivalId, forceTest: true, isReminder: true });
  toast_(`TEST Reminder: ${res.sentOk} OK, ${res.sentFailed} Fehler`);
}

function uiSendDetailReminderReal() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  const res = sendDetailRequestForFestival_({ festivalId, forceTest: false, isReminder: true });
  toast_(`ECHT Reminder: ${res.sentOk} OK, ${res.sentFailed} Fehler`);
}

function uiSyncDetailResponses() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  const res = syncDetailResponsesFromForm_({ festivalId });
  toast_(`Detail-Import: ${res.updated} neu, ${res.alreadyCurrent || 0} bereits aktuell, ${res.skipped} nicht zugeordnet`);
}

function uiBuildUniversalSchichtplan() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;

  const outSS = getOrCreateSchichtplanSpreadsheet_({ festivalId, label: "Goldeimer_SCHICHTPLAN" });

  const res = buildUniversalSchichtplan_({ festivalId, targetSpreadsheetId: outSS.getId() });

  writeSchichtplanLinkToDashboard_({ festivalId, url: outSS.getUrl() });
  writeSchichtplanLinkToFestConfig_(festivalId, outSS.getUrl());

  toast_(`Schichtplan fertig: Slots=${res.slots}, Besetzte Plätze=${res.filledPositions}`);
}


function uiRecalcUniversalShiftstats() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;

  const outSS = getOrCreateSchichtplanSpreadsheet_({ festivalId, label: "Goldeimer_SCHICHTPLAN" });

  const res = rebuildShiftStatsFromPlan_({
    festivalId,
    targetSpreadsheetId: outSS.getId(),
  });

  toast_(`Stats aktualisiert: ${res.people} Personen erfasst.`);
}



function sendOffersAllRolesForFestival_({ festivalId, forceTest }) {
  let candidates = 0, sentOk = 0, sentFailed = 0;
  let errorSample = "";

  ALL_ROLES.forEach((role) => {
    const res = sendOffers_({ festivalId, role, forceTest }) || { candidates: 0, sentOk: 0, sentFailed: 0, errorSample: "" };
    candidates += Number(res.candidates || 0);
    sentOk += Number(res.sentOk || 0);
    sentFailed += Number(res.sentFailed || 0);
    if (!errorSample && res.errorSample) errorSample = res.errorSample;
  });

  // ✅ Dashboard Update (nur bei echtem Versand)
  triggerDashboardRecalcAfterMail_(festivalId, forceTest, sentOk);

  log_({
    action: "MAIL_SUMMARY_OFFERS",
    meta: { festivalId, candidates, sentOk, sentFailed, errorSample, mode: forceTest ? "TEST" : "ECHT" },
    count: sentOk,
  });

  return { candidates, sentOk, sentFailed, errorSample };
}

function sendWaitlistAllRolesForFestival_({ festivalId, forceTest }) {
  let candidates = 0, sentOk = 0, sentFailed = 0;
  let errorSample = "";

  ALL_ROLES.forEach((role) => {
    const res = sendWaitlist_({ festivalId, role, forceTest }) || { candidates: 0, sentOk: 0, sentFailed: 0, errorSample: "" };
    candidates += Number(res.candidates || 0);
    sentOk += Number(res.sentOk || 0);
    sentFailed += Number(res.sentFailed || 0);
    if (!errorSample && res.errorSample) errorSample = res.errorSample;
  });

  // ✅ Dashboard Update (nur bei echtem Versand)
  triggerDashboardRecalcAfterMail_(festivalId, forceTest, sentOk);

  log_({
    action: "MAIL_SUMMARY_WAITLIST",
    meta: { festivalId, candidates, sentOk, sentFailed, errorSample, mode: forceTest ? "TEST" : "ECHT" },
    count: sentOk,
  });

  return { candidates, sentOk, sentFailed, errorSample };
}

function sendFinalAbsageAllRolesForFestival_({ festivalId, forceTest }) {
  let candidates = 0, sentOk = 0, sentFailed = 0;
  let errorSample = "";

  ALL_ROLES.forEach((role) => {
    const res = sendFinalAbsage_({ festivalId, role, forceTest }) || { candidates: 0, sentOk: 0, sentFailed: 0, errorSample: "" };
    candidates += Number(res.candidates || 0);
    sentOk += Number(res.sentOk || 0);
    sentFailed += Number(res.sentFailed || 0);
    if (!errorSample && res.errorSample) errorSample = res.errorSample;
  });

  // ✅ Dashboard Update (nur bei echtem Versand)
  triggerDashboardRecalcAfterMail_(festivalId, forceTest, sentOk);

  log_({
    action: "MAIL_SUMMARY_FINAL_ABSAGE",
    meta: { festivalId, candidates, sentOk, sentFailed, errorSample, mode: forceTest ? "TEST" : "ECHT" },
    count: sentOk,
  });

  return { candidates, sentOk, sentFailed, errorSample };
}

function sendOffers_({ festivalId, role, forceTest }) {
  const ss = SpreadsheetApp.getActive();
  const isTestRun = !!forceTest;
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  const data = readSheetAsObjects_(appSheet);

  const template = getTemplate_("ZUSAGE", { allowInactive: true });
  if (!isTestRun && !template.active) return { candidates: 0, sentOk: 0, sentFailed: 0 };

  const candidates = data.rows.filter((r) => 
    String(r.festival_id).trim() === String(festivalId).trim() &&
    String(r.role).trim().toLowerCase() === String(role).trim().toLowerCase() &&
    normalizeStatus_(r.status) === normalizeStatus_(STATUS.ZUSAGEN) &&
    String(r.mail_status || MAIL_STATUS.NONE).trim() !== MAIL_STATUS.ZUSAGE_SENT
  );

  let sentOk = 0, sentFailed = 0;
  candidates.forEach((r) => {
    try {
      const vars = buildVars_(r);
      let htmlBody = render_(template.body_html, vars);
      
      if (isTestRun) {
        htmlBody = buildTestHeader_(r.email, festivalId, role) + htmlBody;
      }

      // 1. E-Mail versenden
      sendMailBccSafe_({ 
        toReal: r.email, 
        subject: template.subject, 
        htmlBody: htmlBody, 
        isTestRun: isTestRun,
        vars: vars,
        includeAttachments: true 
      });
      
      sentOk++;

      // 2. Status-Updates & Supabase Sync (NUR bei echtem Versand)
      if (!isTestRun) {
        // Lokale Google Updates
        updateCell_(appSheet, data.headerMap, r.__rowNumber, "mail_status", MAIL_STATUS.ZUSAGE_SENT);
        updateCell_(appSheet, data.headerMap, r.__rowNumber, "status", STATUS.ZUGESAGT);
        updateDashboardRowByApplicationId_(festivalId, r.application_id, {
          mail_status: MAIL_STATUS.ZUSAGE_SENT,
          status: STATUS.ZUGESAGT,
        });

        // --- SUPABASE SYNC ---
        const props = PropertiesService.getScriptProperties();
        const sbUrl = props.getProperty("SUPABASE_URL");
        const sbKey = props.getProperty("SUPABASE_SERVICE_KEY");

        // A. Profil in Supabase anlegen/aktualisieren
        sendToSupabase_("profiles", {
          email:     normEmail_(r.email),
          full_name: ((r.first_name || '') + ' ' + (r.last_name || '')).trim() || null,
          role:      normalizeRole_(r.role).toLowerCase(),
        }, "email");

        // B. Supabase Auth User anlegen (ohne Einladungs-E-Mail, direkt bestätigt)
        //    → Person kann sich sofort per Magic Link einloggen
        try {
          const adminUrl = sbUrl + "/auth/v1/admin/users";
          const authRes = UrlFetchApp.fetch(adminUrl, {
            method: "post",
            contentType: "application/json",
            headers: {
              apikey: sbKey,
              Authorization: "Bearer " + sbKey
            },
            muteHttpExceptions: true,
            payload: JSON.stringify({
              p_email:          r.email,
              p_google_fest_id: festivalId,
              p_status:         'zugesagt',
              p_role:           normalizeRole_(r.role).toLowerCase(),
            })
          });
          const authCode = authRes.getResponseCode();
          // 422 = User existiert bereits → kein Problem, einfach weiter
          if (authCode !== 200 && authCode !== 201 && authCode !== 422) {
            Logger.log("Auth-User Fehler für " + r.email + ": " + authCode + " " + authRes.getContentText());
          }
        } catch (authErr) {
          Logger.log("Auth-User Exception für " + r.email + ": " + authErr.message);
        }

        // C. Das Assignment über die SQL-Weiche (RPC) erstellen
        //    Das verknüpft den User automatisch mit dem richtigen Festival
        const rpcUrl = sbUrl + "/rest/v1/rpc/sync_assignment";
        const rpcOptions = {
          method: "post",
          contentType: "application/json",
          headers: {
            apikey: sbKey,
            Authorization: "Bearer " + sbKey
          },
          muteHttpExceptions: true,
          payload: JSON.stringify({
            p_email:          r.email,
            p_google_fest_id: festivalId,
            p_status:         'zugesagt',
            p_role:           normalizeRole_(r.role).toLowerCase(),
          })
        };
        UrlFetchApp.fetch(rpcUrl, rpcOptions);
      }
    } catch (err) { 
      Logger.log("Fehler bei sendOffers für " + r.email + ": " + err);
      sentFailed++; 
    }
  });
  return { candidates: candidates.length, sentOk, sentFailed };
}

function sendWaitlist_({ festivalId, role, forceTest }) {
  const ss = SpreadsheetApp.getActive();
  const isTestRun = !!forceTest;
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  const data = readSheetAsObjects_(appSheet);

  // Holt die universelle Vorlage "WARTELISTE"
  const template = getTemplate_("WARTELISTE", { allowInactive: true });
  if (!isTestRun && !template.active) {
    Logger.log("Abbruch: Wartelisten-Template nicht aktiv.");
    return { candidates: 0, sentOk: 0, sentFailed: 0 };
  }

  const candidates = data.rows.filter((r) => 
    String(r.festival_id || "").trim() === String(festivalId).trim() &&
    String(r.role || "").trim().toLowerCase() === String(role).trim().toLowerCase() &&
    normalizeStatus_(r.status) === normalizeStatus_(STATUS.FUER_WARTELISTE) &&
    String(r.mail_status || MAIL_STATUS.NONE).trim() !== MAIL_STATUS.WARTELISTE_SENT
  );

  let sentOk = 0, sentFailed = 0;
  candidates.forEach((r) => {
    try {
      const vars = buildVars_(r);
      let htmlBody = render_(template.body_html, vars);
      
      if (isTestRun) {
        htmlBody = buildTestHeader_(r.email, festivalId, role) + htmlBody;
      }

      sendMailBccSafe_({ 
        toReal: r.email, 
        subject: template.subject, 
        htmlBody: htmlBody, 
        isTestRun: isTestRun,
        vars: vars // <--- FIX: Das hat gefehlt für die Betreff-Ersetzung!
      });
      
      sentOk++;

      if (!isTestRun) {
        updateCell_(appSheet, data.headerMap, r.__rowNumber, "mail_status", MAIL_STATUS.WARTELISTE_SENT);
        updateCell_(appSheet, data.headerMap, r.__rowNumber, "status", STATUS.AUF_WARTELISTE);
        updateDashboardRowByApplicationId_(festivalId, r.application_id, {
          mail_status: MAIL_STATUS.WARTELISTE_SENT,
          status: STATUS.AUF_WARTELISTE,
        });
      }
    } catch (err) { 
      Logger.log(`Fehler bei Warteliste (${r.email}): ${err}`);
      sentFailed++; 
    }
  });
  return { candidates: candidates.length, sentOk, sentFailed };
}

function sendFinalAbsage_({ festivalId, role, forceTest }) {
  const ss = SpreadsheetApp.getActive();
  const isTestRun = !!forceTest;
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  const data = readSheetAsObjects_(appSheet);

  // Holt die universelle Vorlage "ABSAGE"
  const template = getTemplate_("ABSAGE", { allowInactive: true });
  if (!isTestRun && !template.active) {
    Logger.log("Abbruch: Absage-Template nicht aktiv.");
    return { candidates: 0, sentOk: 0, sentFailed: 0 };
  }

  const candidates = data.rows.filter((r) => 
    String(r.festival_id || "").trim() === String(festivalId).trim() &&
    String(r.role || "").trim().toLowerCase() === String(role).trim().toLowerCase() &&
    normalizeStatus_(r.status) === normalizeStatus_(STATUS.FINAL_ABSAGEN) &&
    String(r.mail_status || MAIL_STATUS.NONE).trim() !== MAIL_STATUS.FINAL_ABSAGE_SENT
  );

  let sentOk = 0, sentFailed = 0;
  candidates.forEach((r) => {
    try {
      const vars = buildVars_(r);
      let htmlBody = render_(template.body_html, vars);
      
      if (isTestRun) {
        htmlBody = buildTestHeader_(r.email, festivalId, role) + htmlBody;
      }

      sendMailBccSafe_({ 
        toReal: r.email, 
        subject: template.subject, 
        htmlBody: htmlBody, 
        isTestRun: isTestRun,
        vars: vars // <--- FIX: Auch hier vars für den Betreff übergeben!
      });
      
      sentOk++;

      if (!isTestRun) {
        updateCell_(appSheet, data.headerMap, r.__rowNumber, "mail_status", MAIL_STATUS.FINAL_ABSAGE_SENT);
        updateCell_(appSheet, data.headerMap, r.__rowNumber, "status", STATUS.FINAL_ABGESAGT);
        updateDashboardRowByApplicationId_(festivalId, r.application_id, {
          mail_status: MAIL_STATUS.FINAL_ABSAGE_SENT,
          status: STATUS.FINAL_ABGESAGT,
        });
      }
    } catch (err) { 
      Logger.log(`Fehler bei Absage (${r.email}): ${err}`);
      sentFailed++; 
    }
  });
  return { candidates: candidates.length, sentOk, sentFailed };
}


/* =========================
 * DETAIL MAIL (REQUEST/REMINDER)
 * ========================= */
function sendDetailRequestForFestival_({ festivalId, forceTest, isReminder }) {
  Logger.log(`▶ START | festival=${festivalId} | forceTest=${forceTest} | isReminder=${isReminder}`);

  const ss = SpreadsheetApp.getActive();
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!appSheet) throw new Error(`Sheet fehlt: ${SHEETS.APPLICATIONS}`);

  const { detailFormUrl } = getDetailCfgByFestivalId_(festivalId);
  Logger.log(`detailFormUrl=${detailFormUrl}`);

  const isTestRun = !!forceTest;
  const templateName = isReminder ? "DETAILABFRAGE_REMINDER" : "DETAILABFRAGE";
const template = getTemplate_(templateName, { allowInactive: true });
  Logger.log(`template gefunden: ${!!template} | active=${template && template.active}`);

  if (!isTestRun && !template.active) {
    Logger.log("⚠ Abbruch: Template inaktiv und kein Test-Run");
    return { candidates: 0, sentOk: 0, sentFailed: 0 };
  }

  // ── Festival-Config ────────────────────────────────────────────────────────
  const festSheet = ss.getSheetByName(SHEETS.FESTIVALS);
  const festData  = readSheetAsObjects_(festSheet);
  const festCfg   = festData.rows.find(r => String(r.festival_id || "").trim() === festivalId) || {};
  Logger.log(`festCfg gefunden: ${Object.keys(festCfg).length > 0} | Keys: ${Object.keys(festCfg).join(", ")}`);

  const festivalName       = festCfg.festival_name        || festivalId;
  const telegramLink       = festCfg.telegram_link        || "";
  const telegramOpLink     = festCfg.telegram_op_link     || "";
  const timeCrewBriefing   = festCfg.time_crew_briefing   || "";
  const timeWelcomeMeeting = festCfg.time_welcome_meeting || "";
  const startOfficial      = festCfg.start_official       || "";
  const endOfficial        = festCfg.end_official         || "";
  const festivalTown       = festCfg.festival_town        || "";
  const startCampsite      = festCfg.start_campsite       || "";
  const startSetup         = festCfg.start_setup          || "";
  const startLeadOp        = festCfg.start_leadop         || "";
  const endTakedown        = festCfg.end_takedown          || "";
  const startKitchen       = festCfg.start_kitchen        || "";
  const startSupp          = festCfg.start_supp           || "";
  const endSupp            = festCfg.end_supp             || "";
  const newbiePreBriefing  = festCfg.newbie_pre_briefing  || "";
  const newbieBriefingLink = festCfg.newbie_briefing_link || "";

  // ── Statische Blöcke ───────────────────────────────────────────────────────

  const BLOCK_CONTRACT_HTML = `
<p style="background-color: #fff4e5; border-left: 4px solid #e67e00; padding: 10px 14px; margin: 16px 0;">
  <strong>&#128221; Ehrenamtsvertrag</strong><br>
  Du hast den Ehrenamtsvertrag noch nicht unterzeichnet. Bitte hole das nach.
  Das geht ganz einfach online:<br>
  &#8594;<a href="https://app.dpms-online.de/vertrag-anfordern/695e416c623d5" target="_blank"> Jetzt Vertrag unterzeichnen</a>
</p>`;

  // Block nur bauen wenn ein Anmeldelink vorhanden ist – sonst bleibt er leer
  const BLOCK_NEWBIE_BRIEFING_HTML = newbieBriefingLink ? `
<p style="background-color: #f2f2f2; border-left: 4px solid #aaaaaa; padding: 10px 14px; margin: 16px 0;">
  &#x1F4CB; <strong>Newbie-Briefing am ${newbiePreBriefing || "TBA"}</strong><br>
  Da du das erste Mal mit Goldeimer auf einem Festival bist, m&#246;chten wir dich zum
  Online Briefing am <strong>${newbiePreBriefing || "TBA"}</strong> einladen.
  Hier bekommst du wichtige Infos zum Ablauf vor Ort und Hintergrundwissen zu Goldeimer
  und unserer Arbeit &ndash; damit dein erstes Festival wie am Schn&#252;rchen l&#228;uft.
  Bitte plan dir den Termin wenn m&#246;glich ein und melde dich
  <a href="${newbieBriefingLink}" target="_blank">hier</a> kurz an.
</p>` : "";

  const ROLE_DETAIL_BLOCKS = {
    LEAD: `
<p>Als <strong>Lead</strong> bist du ab <strong>{{START_LEADOP}}</strong> auf dem Gel&#228;nde.
Du meldest uns vor Ort bei der Produktion an und kl&#228;rst schon mal die Standorte ab,
bevor am n&#228;chsten Morgen der Aufbau losgeht. Abbau ist am <strong>{{END_TAKEDOWN}}</strong>
und Abreise nachdem alles eingepackt, abgepumpt und verladen ist.</p>`,
    OPERATOR: `
<p>Als <strong>Operator</strong> bist du f&#252;r den Aufbau am <strong>{{START_SETUP}}</strong>
ab 8 Uhr eingeplant. Am besten bist du am Abend vorher schon auf dem Gel&#228;nde, kommst
entspannt an und dann kann der Aufbau direkt am n&#228;chsten Morgen starten. Abbau ist am
<strong>{{END_TAKEDOWN}}</strong> und Abreise nachdem alles eingepackt, abgepumpt und verladen ist.
Wir bauen alle gemeinsam bis zum Schluss ab.</p>`,

    CATERING: `
<p>F&#252;r die <strong>K&#252;chencrew</strong> geht es i.d.R. am Aufbautag
<strong>{{START_KITCHEN}}</strong> los mit Einkauf und erstem Essen f&#252;r die Aufbau-Crew.
Du kannst auch schon am Abend vorher anreisen. Abbau ist am <strong>{{END_TAKEDOWN}}</strong>
und Abreise nachdem alles verladen ist. Den genauen Ablauf besprechen wir in der
K&#252;chen-Telegram-Gruppe :)</p>`,
    SUPPORTI_PLUS: `
<p>Als <strong>Supporti Plus</strong> bist du f&#252;r den Aufbau am <strong>{{START_SETUP}}</strong>
ab 8 Uhr eingeplant. Am besten bist du am Abend vorher schon auf dem Gel&#228;nde, dann kann
der Aufbau direkt am n&#228;chsten Morgen starten. Abbau ist am <strong>{{END_TAKEDOWN}}</strong>
und Abreise nachdem alles eingepackt, abgepumpt und verladen ist. Wir bauen alle gemeinsam
bis zum Schluss ab.</p>`,
    SUPPORTI: `
<p>Als <strong>Supporti</strong> bist du von <strong>{{START_SUPP}}</strong> bis
<strong>{{END_SUPP}}</strong> vor Ort eingeplant.</p>`,
  };

  const NEWBIE_BRIEFING_EXPERIENCES = ["0", "1-2"];

if (isReminder) {
  try {
    const importRes = syncDetailResponsesFromForm_({ festivalId });
    Logger.log(`Auto-Import vor Reminder: ${importRes.updated} aktualisiert, ${importRes.skipped} übersprungen`);
  } catch (e) {
    Logger.log(`⚠ Auto-Import fehlgeschlagen (${e.message}) – Reminder wird mit alten Daten fortgesetzt`);
  }
}

  // ── Bewerbungen laden & filtern ────────────────────────────────────────────
  const appData = readSheetAsObjects_(appSheet);
  Logger.log(`Gesamt-Zeilen in APPLICATIONS: ${appData.rows.length}`);

  const candidates = appData.rows.filter((r) => {
    const fidMatch = String(r.festival_id || "").trim() === String(festivalId).trim();
    const normSt = normalizeStatus_(r.status);
    const isSigned = normSt === normalizeStatus_(STATUS.ZUGESAGT) || normSt === STATUS.FRIEND;
    const ds       = r.detail_status || DETAIL_STATUS.NONE;
    const notDone  = ds !== DETAIL_STATUS.DONE;
    const statusOk = isReminder
      ? (ds === DETAIL_STATUS.SENT || ds === DETAIL_STATUS.REMINDER)
      : (ds === DETAIL_STATUS.NONE);

    // Reminder: mind. 24h seit letztem Versand warten (verhindert Doppelmail am gleichen Tag)
    let minGapOk = true;
    if (isReminder && statusOk) {
      const sentAt = parseDEDatetime_(r.detail_last_sent_at);
      if (sentAt) {
        const hoursSince = (new Date() - sentAt) / (1000 * 60 * 60);
        minGapOk = hoursSince >= 24;
        if (!minGapOk && fidMatch) {
          Logger.log(`  ⏭ ${r.email}: Reminder übersprungen – erst ${hoursSince.toFixed(1)}h seit letztem Versand (< 24h)`);
        }
      }
    }

    if (fidMatch) {
      Logger.log(`  Zeile: email=${r.email} | festival_id="${r.festival_id}" | status="${r.status}" | detail_status="${r.detail_status}" → fidMatch=${fidMatch} isSigned=${isSigned} notDone=${notDone} statusOk=${statusOk} minGapOk=${minGapOk}`);
    }

    return fidMatch && isSigned && notDone && statusOk && minGapOk;
  });

  Logger.log(`Kandidaten nach Filter: ${candidates.length}`);
  if (candidates.length === 0) {
    Logger.log("⚠ Keine Kandidaten gefunden – Funktion endet hier.");
    return { candidates: 0, sentOk: 0, sentFailed: 0 };
  }

  let sentOk = 0, sentFailed = 0;

  candidates.forEach((r) => {
    try {
      Logger.log(`── Verarbeite: ${r.email} | Rolle: ${r.role} | Erfahrung: ${r.experience_count}`);

      const roleNorm       = normalizeRole_(r.role || "");
      const expNorm        = String(r.experience_count || "").trim();
      const contractSigned = String(r.contract_status || "").trim().toLowerCase() === "unterschrieben";
      Logger.log(`   roleNorm=${roleNorm} | expNorm=${expNorm} | contractSigned=${contractSigned}`);

      // IBAN-Block (kein Catering)
      const blockIban = ["LEAD", "OPERATOR", "SUPPORTI_PLUS"].includes(roleNorm)
        ? `<p style="background-color: #fffbe6; border-left: 4px solid #e6c300; padding: 10px 14px; margin: 16px 0;">
  <strong>&#128176; Pauschale / IBAN</strong><br>
 Für dein Engagement bekommst du eine Ehrenamtspauschale ausgezahlt. Bitte melde dich proaktiv bei Steffi, wenn du in 2026 bereits bei einem anderen Verein die Pauschale in Anspruch genommen hast oder noch nehmen wirst und die Höchstgrenze von 960€ im Jahr reißen wirst. Teile ihr bitte auch deine aktuellen Kontodaten (Inhaber*in, IBAN) für die Überweisung mit.<br>
 &#8594; Mail an <a href="mailto:stefanie@goldeimer.de">stefanie@goldeimer.de</a>
</p>`
        : "";

      // Telegram-Block
      const telegramOpExtra = ["LEAD", "OPERATOR"].includes(roleNorm) && telegramOpLink
        ? `<br>Bitte tritt als <strong>${r.role || ""}</strong> zus&#228;tzlich der
  <a href="${telegramOpLink}" target="_blank">Telegram-Gruppe f&#252;r Leads &amp; Operator</a> bei.`
        : "";

      const blockTelegram = telegramLink
        ? `<p style="background-color: #e8f4fd; border-left: 4px solid #0088cc; padding: 10px 14px; margin: 16px 0;">
  <strong>&#128172; Komm in die Gruppe!</strong><br>
  Für schnelle Absprachen und direkte Kommunikation vor- und während des Festivals nutzen wir Telegram. Komm bitte in die Gruppe, damit du keine wichtigen Infos verpasst.<br>
  &#8594; <a href="${telegramLink}" target="_blank">Zur Telegram-Gruppe für das ${festivalName}</a>
  ${telegramOpExtra}
</p>`
        : "";

      // Briefing-Zeiten (nur Supporti & Supporti Plus)
      const blockBriefingTimes = ["SUPPORTI", "SUPPORTI_PLUS"].includes(roleNorm)
        ? `<p>Wir treffen uns zum gemeinsamen Start ins Festival und für ein kurzes Willkommens-Briefing <b>am ${timeWelcomeMeeting} im Crew Camp</b>. Bitte sei pünktlich da und plan dir ausreichend Zeit für die Anreise, zum Ankommen und Aufbauen ein.
Unser Crew-Briefing für alle findet <b>am ${timeCrewBriefing} im Crew Camp</b> statt. Hier solltest du unbedingt da sein.
</p>`
        : "";

      const blockNewbieBriefing = NEWBIE_BRIEFING_EXPERIENCES.includes(expNorm) ? BLOCK_NEWBIE_BRIEFING_HTML : "";
      const blockContract   = !contractSigned ? BLOCK_CONTRACT_HTML : "";
      // Vorrendern: {{START_SETUP}} etc. direkt ersetzen, bevor der Block in vars landet
      // (render_ ist single-pass – der Block würde sonst nach START_SETUP verarbeitet)
      const blockRoleDetail = render_(ROLE_DETAIL_BLOCKS[roleNorm] || "", {
        START_SETUP:   startSetup,
        START_LEADOP:  startLeadOp,
        END_TAKEDOWN:  endTakedown,
        START_KITCHEN: startKitchen,
        START_SUPP:    startSupp,
        END_SUPP:      endSupp,
      });

      Logger.log(`   Blöcke: iban=${!!blockIban} | telegram=${!!blockTelegram} | contract=${!!blockContract} | newbieBriefing=${!!blockNewbieBriefing} | briefing=${!!blockBriefingTimes}`);

      // ── Variablen & Rendern ────────────────────────────────────────────────
      const vars = {
        ...buildVars_(r),
        DETAIL_FORM_URL:      detailFormUrl,
        BLOCK_IBAN:           blockIban,
        BLOCK_NEWBIE_BRIEFING: blockNewbieBriefing,
        BLOCK_CONTRACT:       blockContract,
        BLOCK_ROLE_DETAIL:    blockRoleDetail,
        BLOCK_BRIEFING_TIMES: blockBriefingTimes,
        BLOCK_TELEGRAM:       blockTelegram,
        START_OFFICIAL:       startOfficial,
        END_OFFICIAL:         endOfficial,
        FESTIVAL_TOWN:        festivalTown,
        START_CAMPSITE:       startCampsite,
        START_SETUP:          startSetup,
        START_LEADOP:         startLeadOp,
        END_TAKEDOWN:         endTakedown,
        START_KITCHEN:        startKitchen,
        START_SUPP:           startSupp,
        END_SUPP:             endSupp,
        NEWBIE_PRE_BRIEFING:  newbiePreBriefing,
        NEWBIE_BRIEFING_LINK: newbieBriefingLink,
      };

      const htmlBody  = render_(template.body_html, vars);
      const subject   = render_(template.subject || "Detailabfrage {{FESTIVAL_NAME}}", vars);
      const recipient = isTestRun ? Session.getActiveUser().getEmail() : (r.email || "");

      Logger.log(`   Sende an: ${recipient} | Betreff: ${subject}`);

      if (!recipient) throw new Error("Keine E-Mail-Adresse vorhanden");

      GmailApp.sendEmail(recipient, subject, "", {
        htmlBody,
        name: "Goldeimer Crew",
      });

      Logger.log(`   ✓ Mail gesendet`);

    if (!isTestRun) {
  const newStatus   = isReminder ? DETAIL_STATUS.REMINDER : DETAIL_STATUS.SENT;
  const now         = new Date();
  const nowFormatted = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm");

  const rowIdx             = appData.rows.indexOf(r);
  const colIdx             = appData.headerMap["detail_status"];
  const sentAtColIdx       = appData.headerMap["detail_last_sent_at"];
  const reminderCountColIdx = appData.headerMap["detail_reminder_count"];

  Logger.log(`   Status-Update: rowIdx=${rowIdx} | colIdx=${colIdx} | newStatus=${newStatus}`);

  if (rowIdx >= 0 && colIdx !== undefined) {
    appSheet.getRange(rowIdx + 2, colIdx + 1).setValue(newStatus);
  }
  if (rowIdx >= 0 && sentAtColIdx !== undefined) {
    appSheet.getRange(rowIdx + 2, sentAtColIdx + 1).setValue(nowFormatted);
  }
  if (isReminder && rowIdx >= 0 && reminderCountColIdx !== undefined) {
    const currentCount = Number(r.detail_reminder_count || 0);
    appSheet.getRange(rowIdx + 2, reminderCountColIdx + 1).setValue(currentCount + 1);
  }

  const dashUpdate = {
    detail_status:      newStatus,
    detail_last_sent_at: nowFormatted,
  };
  if (isReminder) {
    dashUpdate.detail_reminder_count = String(Number(r.detail_reminder_count || 0) + 1);
  }
  updateDashboardRowByApplicationId_(festivalId, r.application_id, dashUpdate);
}

      sentOk++;

    } catch (e) {
      sentFailed++;
      Logger.log(`   ✗ FEHLER bei ${r.email || "?"}: ${e.message}\n${e.stack}`);
    }
  });

  Logger.log(`▶ FERTIG | kandidaten=${candidates.length} | ok=${sentOk} | fehler=${sentFailed}`);
  return { candidates: candidates.length, sentOk, sentFailed };
}


/* =========================
 * DASHBOARDS
 * ========================= */

function buildFestivalDashboards_() {
  const ss = SpreadsheetApp.getActive();
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  const crewSheet = ss.getSheetByName(SHEETS.CREW_MASTER);
  if (!appSheet || !crewSheet) throw new Error(`Sheets fehlen: ${SHEETS.APPLICATIONS} oder ${SHEETS.CREW_MASTER}`);

  // ── Backfill: extra_info aus Formular in APPLICATIONS nachladen ──────────
  try {
    backfillExtraInfoFromForm_();
  } catch(e) {
    Logger.log("Backfill extra_info übersprungen: " + e.message);
  }

  const appData  = readSheetAsObjects_(appSheet);
  const crewData = readSheetAsObjects_(crewSheet);
  const festMap  = buildFestivalMaps_();

  // ── Sperrliste einmal laden (für alle Festivals) ─────────────────────────
  const sperrMap = loadSperrlisteMap_();

  const crewByEmail = new Map();
  crewData.rows.forEach((r) => {
    const em = String(r.email || "").trim().toLowerCase();
    if (em) crewByEmail.set(em, r);
  });

  const festivals = new Map();
  appData.rows.forEach((r) => {
    const fid = String(r.festival_id || "").trim();
    if (!fid) return;
    const fname = String(r.festival_name || "").trim() || fid;
    festivals.set(fid, fname);
  });

  const DASH_COLUMNS = [
    "first_name", "last_name", "email", "role", "experience_count", "status",
    "decision_note", "about", "extra_info", "mail_status", "detail_status", "contract_status", "last_info_sent", 
    "under_18_flag", "conflict_flag", "plus5_festivals_flag", "applied_at", "application_id",
    "hepa_vax_flag",
    "detail_last_sent_at", "detail_reminder_count", "detail_ts",
    "detail_first_name", "detail_first_name_doc", "detail_last_name",
    "detail_last_name_birth", "detail_pronouns", "detail_birthdate",
    "detail_birthplace", "detail_birthcountry", "detail_phone",
    "detail_food", "detail_allergies", "detail_carpass",
    "detail_shift_pref_1", "detail_shift_pref_2", "detail_promo_want",
    "detail_arrival", "detail_other"
  ];

  let created = 0, updated = 0;

  for (const [fid, fname] of festivals.entries()) {
    const dashName = `DASH_${fid}`;
    let sh = ss.getSheetByName(dashName);

    if (!sh) {
      sh = ss.insertSheet(dashName);
      created++;
    } else {
      updated++;
      // Preserve-Zellen vor dem Clear retten (Notizen + Link-Daten)
      const savedNotes     = sh.getRange("A4").getValue();
      const savedCrewDate  = sh.getRange("E2").getValue();
      const savedSPDate    = sh.getRange("F2").getValue();
      const savedLRDate      = sh.getRange("G2").getValue();
      const savedKitchenDate = sh.getRange("H2").getValue();
      // Links als RichText retten (E1/F1/G1/H1 – gehen sonst beim Clear verloren)
      const savedCrewLink    = sh.getRange("E1").getRichTextValue();
      const savedSPLink      = sh.getRange("F1").getRichTextValue();
      const savedLRLink      = sh.getRange("G1").getRichTextValue();
      const savedKitchenLink = sh.getRange("H1").getRichTextValue();
      const maxR = Math.max(sh.getLastRow(), 200);
      const maxC = Math.max(sh.getLastColumn(), 45);
      sh.getRange(1, 1, maxR, maxC).breakApart(); // Alle Merges aufheben bevor clear
      sh.getRange(1, 1, maxR, maxC).clear().setDataValidation(null);
      sh.clearConditionalFormatRules();
      // Wiederherstellen – alte KPI-Header-Werte nicht zurückschreiben
      const staleValues = ["Notizen", "Rolle", "Need", "Bewerbungen", "📝 Notizen..."];
      if (savedNotes && !staleValues.includes(String(savedNotes).trim())) {
        sh.getRange("A4").setValue(savedNotes);
      }
      if (savedCrewDate)    sh.getRange("E2").setValue(savedCrewDate);
      if (savedSPDate)      sh.getRange("F2").setValue(savedSPDate);
      if (savedLRDate)      sh.getRange("G2").setValue(savedLRDate);
      if (savedKitchenDate) sh.getRange("H2").setValue(savedKitchenDate);
      // Links wiederherstellen (werden unten ggf. durch CONFIG_FESTIVALS überschrieben)
      if (savedCrewLink?.getLinkUrl())    sh.getRange("E1").setRichTextValue(savedCrewLink).setFontWeight("bold");
      if (savedSPLink?.getLinkUrl())      sh.getRange("F1").setRichTextValue(savedSPLink).setFontWeight("bold");
      if (savedLRLink?.getLinkUrl())      sh.getRange("G1").setRichTextValue(savedLRLink).setFontWeight("bold");
      if (savedKitchenLink?.getLinkUrl()) sh.getRange("H1").setRichTextValue(savedKitchenLink).setFontWeight("bold");
    }

    sh.getRange(1, 1).setValue(`Festival-Dashboard – ${fname} (${fid})`).setFontWeight("bold").setFontSize(14);
    sh.getRange(1, 1, 1, 3).merge();
    sh.getRange(2, 1).setValue(`Aktualisiert: ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm")}`);

    // Notizen-Feld A4 stylen (bleibt beim Refresh erhalten)
    sh.getRange("A4").setBackground("#fffde7").setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    if (!sh.getRange("A4").getValue()) {
      sh.getRange("A4").setValue("Notizen").setFontColor("#999999").setFontStyle("italic");
    } else {
      sh.getRange("A4").setFontColor("#1a1a1a").setFontStyle("normal");
    }
    sh.getRange(4, 1, 1, 3).merge();
    sh.setRowHeight(4, 40);

    const rowsForFestival = appData.rows.filter(r => String(r.festival_id || "").trim() === fid);

    const kpiHeader = [["Rolle", "Need", "Bewerbungen", "Zusagen", "Warteliste", "Absagen", "Zugesagt", "Auf Warteliste", "Abgesagt"]];
    const kpiColors = [null, null, "#eeeeee", "#d9ead3", "#ead1dc", "#f4cccc", "#6aa84f", "#8e7cc3", "#cc0000"];

    sh.getRange(6, 1, 1, 9).setValues(kpiHeader).setFontWeight("bold").setBorder(true, true, true, true, null, null);
    kpiColors.forEach((color, i) => {
      if (color) {
        sh.getRange(6, i + 1).setBackground(color);
        if (i > 5) sh.getRange(6, i + 1).setFontColor("#ffffff");
      }
    });

    const fCfg = festMap.fullDataById.get(fid) || {};

    const kpiDefinition = [
      // [Label, needKey, roleFilters, statusFilter]
      // roleFilters=null + statusFilter gesetzt → zählen nach Status statt Rolle (z.B. Friend)
      ["Lead",          "need_lead",     ["LEAD"],          null],
      ["Operator",      "need_operator", ["OPERATOR"],      null],
      ["Supporti Plus", null,            ["SUPPORTI_PLUS"], null],
      ["Supporti",      "need_supporti", ["SUPPORTI"],      null],
      ["Catering",      "need_kitchen",  ["CATERING"],      null],
      ["Friend",        null,            null,              "friend"],
    ];

    const kpiData = kpiDefinition.map(def => {
      const [label, needKey, roleFilters, statusFilter] = def;
      const needValue = needKey ? (Number(fCfg[needKey]) || 0) : "";
      let apps = 0, zusagen = 0, wl_vor = 0, abs_vor = 0, zugesagt_fix = 0, wl_fix = 0, abs_fix = 0;
      rowsForFestival.forEach(r => {
        const st = normalizeStatus_(r.status);
        if (statusFilter) {
          // Status-basiertes Filtern (Friend: egal welche Rolle)
          if (st === statusFilter) {
            apps++;
            zugesagt_fix++; // friends gelten als bestätigt
          }
        } else {
          // Rollen-basiertes Filtern – friends grundsätzlich ausschließen
          const normR = normalizeRole_(r.role);
          if (roleFilters.includes(normR) && st !== "friend") {
            apps++;
            if (st === "zusagen")                                              zusagen++;
            else if (st === "für warteliste")                                  wl_vor++;
            else if (st === "final absagen")                                   abs_vor++;
            else if (["zugesagt","akkreditiert","teilgenommen"].includes(st))  zugesagt_fix++;
            else if (st === "auf warteliste")                                  wl_fix++;
            else if (["final abgesagt","zurueckgezogen"].includes(st))         abs_fix++;
          }
        }
      });
      return [label, needValue, apps, zusagen, wl_vor, abs_vor, zugesagt_fix, wl_fix, abs_fix];
    });

    sh.getRange(7, 1, kpiData.length, 9).setValues(kpiData).setBorder(null, true, null, true, null, null);
    // Friend-Zeile blau hinterlegen (letzte KPI-Zeile)
    sh.getRange(7 + kpiData.length - 1, 1, 1, 9).setBackground("#c9daf8");

    const totalNeed = Number(fCfg.need_total || 0);
    const totals = ["GESAMT", totalNeed];
    for (let col = 2; col <= 8; col++) {
      totals.push(kpiData.reduce((sum, row) => sum + (typeof row[col] === "number" ? row[col] : 0), 0));
    }
    const totalRowIdx = 7 + kpiData.length;
    sh.getRange(totalRowIdx, 1, 1, 9).setValues([totals]).setFontWeight("bold").setBackground("#f3f3f3").setBorder(true, true, true, true, null, null);

    // Links: Crew-Liste (E1/E2), Schichtplan (F1/F2), Lead Rider (G1/G2), Küchen-Liste (H1/H2) aus CONFIG_FESTIVALS
    // Nur anzeigen wenn URL vorhanden, Datum aus gespeicherter E2/F2/G2/H2 oder leer lassen
    const crewListUrl    = String(fCfg.crew_list_link    || "").trim();
    const schichtplanUrl = String(fCfg.shift_table_link  || "").trim();
    const leadRiderUrl   = String(fCfg.lead_rider_link   || "").trim();
    const kitchenUrl     = String(fCfg.kitchen_crew_list || "").trim();

    if (crewListUrl) {
      sh.getRange("E1").setRichTextValue(
        SpreadsheetApp.newRichTextValue().setText("👥 Crew-Liste").setLinkUrl(crewListUrl).build()
      ).setFontWeight("bold");
      // Datum bleibt aus savedCrewDate (s.o.) – nur setzen wenn noch leer
      if (!sh.getRange("E2").getValue())
        sh.getRange("E2").setValue("").setFontColor("#999999").setFontSize(9);
    }
    if (schichtplanUrl) {
      sh.getRange("F1").setRichTextValue(
        SpreadsheetApp.newRichTextValue().setText("📅 Schichtplan").setLinkUrl(schichtplanUrl).build()
      ).setFontWeight("bold");
      if (!sh.getRange("F2").getValue())
        sh.getRange("F2").setValue("").setFontColor("#999999").setFontSize(9);
    }
    if (leadRiderUrl) {
      sh.getRange("G1").setRichTextValue(
        SpreadsheetApp.newRichTextValue().setText("📄 Lead Rider").setLinkUrl(leadRiderUrl).build()
      ).setFontWeight("bold");
      if (!sh.getRange("G2").getValue())
        sh.getRange("G2").setValue("").setFontColor("#999999").setFontSize(9);
    }
    if (kitchenUrl) {
      sh.getRange("H1").setRichTextValue(
        SpreadsheetApp.newRichTextValue().setText("🍳 Küchen-Liste").setLinkUrl(kitchenUrl).build()
      ).setFontWeight("bold");
      if (!sh.getRange("H2").getValue())
        sh.getRange("H2").setValue("").setFontColor("#999999").setFontSize(9);
    }

    const headerRow = totalRowIdx + 2;
    sh.getRange(headerRow, 1, 1, DASH_COLUMNS.length).setValues([DASH_COLUMNS]).setFontWeight("bold").setBackground("#444444").setFontColor("#ffffff");
    sh.setFrozenRows(headerRow);

    const sorted = rowsForFestival
      .slice()
      .sort((a, b) => {
        // Friends immer ganz ans Ende, unabhängig von der Rolle
        const aIsFriend = normalizeStatus_(a.status) === "friend" ? 1 : 0;
        const bIsFriend = normalizeStatus_(b.status) === "friend" ? 1 : 0;
        if (aIsFriend !== bIsFriend) return aIsFriend - bIsFriend;
        const rA = ROLE_SORT_ORDER[normalizeRole_(a.role)] || 99;
        const rB = ROLE_SORT_ORDER[normalizeRole_(b.role)] || 99;
        if (rA !== rB) return rA - rB;
        const sA = STATUS_SORT_ORDER[normalizeStatus_(a.status)] || 99;
        const sB = STATUS_SORT_ORDER[normalizeStatus_(b.status)] || 99;
        return sA - sB;
      })
      .map((r) => {
        const em = String(r.email || "").trim().toLowerCase();
        const crew = crewByEmail.get(em);
        const merged = { ...r };
        merged.first_name = merged.first_name || (crew ? crew.first_name : "");
        merged.last_name  = merged.last_name  || (crew ? crew.last_name  : "");
        merged.status = coerceStatus_(merged.status);
        const exp = String(merged.experience_count || "").trim();
        if (exp.includes("-")) merged.experience_count = "'" + exp;
        const festStart = festMap.startDateById.get(fid);
        merged.under_18_flag = isUnder18AtFestival_(crew ? crew.birthdate : null, festStart) ? "Ja" : "Nein";
        return DASH_COLUMNS.map((col) => merged[col] ?? "");
      });

    if (sorted.length > 0) {
      const expIdx = DASH_COLUMNS.indexOf("experience_count");
      if (expIdx !== -1) sh.getRange(headerRow + 1, expIdx + 1, sorted.length, 1).setNumberFormat("@");
      sh.getRange(headerRow + 1, 1, sorted.length, DASH_COLUMNS.length).setValues(sorted);

      // ── Sperrliste-Highlighting ────────────────────────────────────────────
      applySperrlisteHighlighting_(sh, sorted, DASH_COLUMNS, headerRow, sperrMap);
    }

    const toRow = headerRow + Math.max(1, sorted.length);
    applyDropdownValidation_(sh, headerRow + 1, toRow, DASH_COLUMNS, "status",          STATUS_LIST);
    applyDropdownValidation_(sh, headerRow + 1, toRow, DASH_COLUMNS, "mail_status",     MAIL_STATUS_LIST);
    applyDropdownValidation_(sh, headerRow + 1, toRow, DASH_COLUMNS, "detail_status",   DETAIL_STATUS_LIST);
    applyDropdownValidation_(sh, headerRow + 1, toRow, DASH_COLUMNS, "contract_status", CONTRACT_STATUS_LIST);

    applyFlagConditionalFormatting_(sh, DASH_COLUMNS, headerRow);
    applyStatusConditionalFormatting_(sh, DASH_COLUMNS, headerRow);
    applyDetailStatusConditionalFormatting_(sh, DASH_COLUMNS, headerRow);
    applyHepaConditionalFormatting_(sh, DASH_COLUMNS, headerRow);
    applyWithdrawnHighlighting_(sh, DASH_COLUMNS, headerRow);

    sh.autoResizeColumns(2, 20);
    sh.setColumnWidth(1, 150);

    // about-Spalte
    const aboutColIdx = DASH_COLUMNS.indexOf("about") + 1;
    if (aboutColIdx > 0) {
      sh.setColumnWidth(aboutColIdx, 200);
      const lastDataRow = headerRow + Math.max(1, sorted.length);
      sh.getRange(headerRow + 1, aboutColIdx, lastDataRow - headerRow, 1)
        .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
        .setVerticalAlignment("middle");
    }

    // extra_info-Spalte
    const extraColIdx = DASH_COLUMNS.indexOf("extra_info") + 1;
    if (extraColIdx > 0) {
      sh.setColumnWidth(extraColIdx, 200);
      const lastDataRow = headerRow + Math.max(1, sorted.length);
      sh.getRange(headerRow + 1, extraColIdx, lastDataRow - headerRow, 1)
        .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
        .setVerticalAlignment("middle");
    }

    // Zeilenhöhe
    const lastDataRow = headerRow + Math.max(1, sorted.length);
    for (let r = headerRow + 1; r <= lastDataRow; r++) sh.setRowHeight(r, 21);
  }

  log_({ action: "BUILD_FESTIVAL_DASHBOARDS", meta: { created, updated }, count: created + updated });
  return { created, updated };
}

function backfillExtraInfoFromForm_() {
  const ss = SpreadsheetApp.getActive();
  const formSheet = ss.getSheetByName(SHEETS.FORM_RESPONSES);
  const appSheet  = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!formSheet || !appSheet) return { updated: 0, skipped: 0 };

  const formData = readSheetAsObjects_(formSheet);
  const appData  = readSheetAsObjects_(appSheet);

  // Spaltenname im Formular suchen (robust, case-insensitiv)
  const EXTRA_KEY = formData.headers.find(h =>
    h.toLowerCase().includes("gibt es noch etwas")
  );
  if (!EXTRA_KEY) {
    Logger.log("backfillExtraInfo: Spalte 'Gibt es noch etwas...' nicht gefunden – übersprungen.");
    return { updated: 0, skipped: 0 };
  }

  // Pro E-Mail den letzten Formular-Eintrag merken
  const extraByEmail = new Map();
  formData.rows.forEach(fr => {
    const emailKeys = Object.keys(fr).filter(k => k.toLowerCase().includes("e-mail"));
    let email = "";
    for (const key of emailKeys) {
      if (fr[key] && String(fr[key]).includes("@")) {
        email = normEmail_(fr[key]);
        break;
      }
    }
    if (!email) return;
    extraByEmail.set(email, String(fr[EXTRA_KEY] || "").trim());
  });

  // Spalte muss in APPLICATIONS vorhanden sein
  if (appData.headerMap["extra_info"] === undefined) {
    Logger.log("backfillExtraInfo: Spalte 'extra_info' fehlt in APPLICATIONS – bitte anlegen.");
    return { updated: 0, skipped: 0 };
  }

  let updated = 0, skipped = 0;

  appData.rows.forEach(r => {
    const em = normEmail_(r.email);
    if (!extraByEmail.has(em)) { skipped++; return; }

    const newVal     = extraByEmail.get(em);
    const currentVal = String(r.extra_info || "").trim();
    if (currentVal === newVal) { skipped++; return; }

    updateCell_(appSheet, appData.headerMap, r.__rowNumber, "extra_info", newVal);

    if (r.festival_id && r.application_id) {
      updateDashboardRowByApplicationId_(r.festival_id, r.application_id, { extra_info: newVal });
    }

    updated++;
  });

  Logger.log(`backfillExtraInfo: ${updated} aktualisiert, ${skipped} übersprungen.`);
  return { updated, skipped };
}

/* =========================
 * DASHBOARD: EDIT -> SYNC
 * ========================= */
function onEdit(e) {
  try {
    const range = e.range;
    const sheet = range.getSheet();
    const name = sheet.getName();
    if (!name.startsWith("DASH_")) return;

    // Falls die Änderung in der KPI-Tabelle oben passiert (unwahrscheinlich, aber sicherheitshalber):
    const headerRow = findDashHeaderRow_(sheet);
    if (range.getRow() < headerRow) return;
    const headers = sheet
      .getRange(headerRow, 1, 1, sheet.getLastColumn())
      .getValues()[0]
      .map((h) => String(h).trim());

    const colName = headers[range.getColumn() - 1];
    
    const ALLOWED = new Set([
      "status", 
      "decision_note", 
      "mail_status", 
      "detail_status", 
      "contract_status",
      "first_name",         
      "last_name", 
      "role",
      "experience_count",
      "hepa_vax_flag"
    ]);

    if (!ALLOWED.has(colName)) return;

    const appIdIdx = headers.indexOf("application_id");
    if (appIdIdx === -1) return;

    const row = range.getRow();
    const applicationId = String(sheet.getRange(row, appIdIdx + 1).getValue() || "").trim();
    if (!applicationId) return;

    let value = range.getValue();

    // Status-Logik: Automatischer Reset des Mail-Status bei Prozess-Rückstufung
    if (colName === "status") {
      const newStatus = coerceStatus_(value);
      if (newStatus !== value) range.setValue(newStatus);
      value = newStatus;

      const norm = normalizeStatus_(value);

      // Zeilenfarbe sofort aktualisieren
      const lastCol = sheet.getLastColumn();
      const rowRange = sheet.getRange(row, 1, 1, lastCol);
      if (norm === "zurueckgezogen" || norm === "final abgesagt") {
        rowRange.setBackground("#f4cccc").setFontColor("#990000");
      } else {
        rowRange.setBackground(null).setFontColor(null);
      }

      // Wenn der Status auf einen "Versand-Vorbereitungs-Status" gesetzt wird, Reset der Mail-Spalte
      if (["zusagen", "für warteliste", "final absagen"].includes(norm)) {
        const mailStatusColIdx = headers.indexOf("mail_status");
        if (mailStatusColIdx !== -1) {
          sheet.getRange(row, mailStatusColIdx + 1).setValue("-");
          updateApplicationById_(applicationId, "mail_status", "-");
        }
      }
    }

    // Wert in die Haupttabelle APPLICATIONS schreiben
    updateApplicationById_(applicationId, colName, value);
    
    // 🔥 LIVE-UPDATE: Die KPI Tabelle oben (Zeile 5-10) sofort neu berechnen
    // Übergibt die Dash-Header, damit die Funktion weiß, wo Rolle/Status stehen
    recalcDashboardKpis_(sheet, headers, headerRow);
    
  } catch (err) {
    log_({ action: "ONEDIT_SYNC_ERROR", meta: { message: String(err) }, count: 0 });
  }
}

function updateApplicationById_(applicationId, fieldName, value) {
  const ss = SpreadsheetApp.getActive();
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!appSheet) throw new Error(`Sheet fehlt: ${SHEETS.APPLICATIONS}`);

  const data = readSheetAsObjects_(appSheet);
  const idCol = data.headerMap["application_id"];
  const targetCol = data.headerMap[fieldName];

  if (idCol === undefined) throw new Error("APPLICATIONS: Spalte application_id fehlt.");
  if (targetCol === undefined) throw new Error(`APPLICATIONS: Spalte ${fieldName} fehlt.`);

  const lastRow = appSheet.getLastRow();
  if (lastRow < 2) return;

  const idRange = appSheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < idRange.length; i++) {
    if (String(idRange[i][0] || "").trim() === applicationId) {
      const rn = i + 2;
      setValueSafe_(appSheet.getRange(rn, targetCol + 1), value, `updateApplicationById field=${fieldName}`);
      return;
    }
  }
}


/* =====================================================
 * SYNC APPLICATIONS: FORM RESPONSES 4 -> APPLICATIONS & CREW_MASTER
 * Befüllt alle Stammdaten und Bewerbungsdaten simultan.
 * ===================================================== */
function syncApplicationsFromForm_() {
  const ss = SpreadsheetApp.getActive();
  const maxFestivals = 5;

  const formSheet = ss.getSheetByName(SHEETS.FORM_RESPONSES);
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  const crewSheet = ss.getSheetByName(SHEETS.CREW_MASTER);
  
  if (!formSheet || !appSheet || !crewSheet) throw new Error("Sheets fehlen!");

  const formData = readSheetAsObjects_(formSheet);
  const appData = readSheetAsObjects_(appSheet);
  const crewData = readSheetAsObjects_(crewSheet); 
  const festMap = buildFestivalMaps_();
  const knownFestivals = Array.from(festMap.idByName.keys());

  Logger.log("Anzahl Formular-Antworten gefunden: " + formData.rows.length);

  const crewLookup = new Map();
  crewData.rows.forEach(c => {
    if (c.email) crewLookup.set(String(c.email).toLowerCase().trim(), c);
  });

  let created = 0, updated = 0, skipped = 0;

  for (const fr of formData.rows) {
    const emailKeys = Object.keys(fr).filter(k => k.toLowerCase().includes("e-mail"));
    let email = "";
    for (let key of emailKeys) {
      if (fr[key] && String(fr[key]).includes("@")) {
        email = String(fr[key]).trim().toLowerCase();
        break;
      }
    }
    if (!email) {
      Logger.log("Überspringe Zeile: Keine gültige E-Mail gefunden.");
      skipped++;
      continue;
    }

    const ts = fr["Zeitstempel"];
    const fName     = String(fr["Vorname"] || "").trim();
    const lName     = String(fr["Nachname"] || "").trim();
    const phone     = String(fr["Telefonnummer"] || "").trim();
    const bday      = fr["Geburtsdatum"] || "";
    const city      = String(fr["Wohnort"] || "").trim();
    const exp       = String(fr["Wie viele Festivals hast du bisher mit Goldeimer gemacht?"] || "").trim();
    const about     = String(fr["Erzähl uns noch kurz was über dich."] || "").trim();
    const extra_info = String(fr["Gibt es noch etwas, was wir wissen sollten?"] || "").trim(); // ← NEU
    const consent   = String(fr["Ich bin mit der Datenverarbeitung über dieses Webformular gemäß Datenschutzvereinbarung einverstanden."] || "").trim();

    // --- 1. CREW MASTER ---
    let personInMaster = crewLookup.get(email);
    const cmap = crewData.headerMap;

    if (!personInMaster) {
      const newCrewRow = new Array(crewSheet.getLastColumn() || 15).fill("");
      const setC = (k, v) => { if (cmap[k] !== undefined) newCrewRow[cmap[k]] = v; };
      setC("crew_id", email);
      setC("email", email);
      setC("first_name", fName);
      setC("last_name", lName);
      setC("phone", phone);
      setC("birthdate", bday);
      setC("city", city);
      setC("experience_count", exp);
      setC("about", about);
      setC("consent", consent);
      setC("last_applied_at", ts);
      crewSheet.appendRow(newCrewRow);
      personInMaster = { __rowNumber: crewSheet.getLastRow() };
      crewLookup.set(email, personInMaster);
      Logger.log("Crew Master neu: " + email);
    } else {
      const rn = personInMaster.__rowNumber;
      updateIfCol_(crewSheet, cmap, rn, "first_name", fName);
      updateIfCol_(crewSheet, cmap, rn, "last_name", lName);
      updateIfCol_(crewSheet, cmap, rn, "phone", phone);
      updateIfCol_(crewSheet, cmap, rn, "birthdate", bday);
      updateIfCol_(crewSheet, cmap, rn, "city", city);
      updateIfCol_(crewSheet, cmap, rn, "experience_count", exp);
      updateIfCol_(crewSheet, cmap, rn, "about", about);
      updateIfCol_(crewSheet, cmap, rn, "last_applied_at", ts);
    }

    // --- 2. FESTIVALS ---
    const allHeaders = Object.keys(fr);
    const selectedFestivals = [];
    knownFestivals.forEach(festName => {
      const colKey = allHeaders.find(h => normalizeFestName_(h).includes(normalizeFestName_(festName)));
      if (colKey && fr[colKey] && String(fr[colKey]).trim() !== "") {
        selectedFestivals.push({
          name: festName,
          role: String(fr[colKey]).trim(),
          overlapGroup: festMap.overlapByName.get(festName) || null
        });
      }
    });

    if (selectedFestivals.length === 0) {
      Logger.log("Keine Festivals gewählt für: " + email);
      continue;
    }

    const hasConflict = hasDuplicates_(selectedFestivals.map(f => f.overlapGroup).filter(Boolean));
    const tooMany = selectedFestivals.length > maxFestivals;

    // --- 3. APPLICATIONS ---
    for (const festObj of selectedFestivals) {
      const fid = festMap.idByName.get(festObj.name);
      const existingApp = appData.rows.find(r =>
        String(r.email).toLowerCase() === email && String(r.festival_id) === fid
      );

      if (!existingApp) {
        const hMap = appData.headerMap;
        const rowData = new Array(appSheet.getLastColumn() || 25).fill("");
        const setVal = (k, v) => { if (hMap[k] !== undefined) rowData[hMap[k]] = v; };

        setVal("application_id", Utilities.getUuid());
        setVal("email", email);
        setVal("first_name", fName);
        setVal("last_name", lName);
        setVal("festival_id", fid);
        setVal("festival_name", festObj.name);
        setVal("role", festObj.role);
        setVal("experience_count", exp);
        setVal("status", STATUS.EINGEGANGEN);
        setVal("applied_at", ts);
        setVal("hepa_vax_flag", normalizeYesNo_(fr["Hast du eine aktuelle Hepatitis A Impfung bzw. ausreichend Immunisierung (10 Jahre Schutz)?"]));
        setVal("driving_license", normalizeYesNo_(fr["Hast du einen Hänger-Führerschein (BE oder höher) und Bock für Goldeimer zu fahren?"]));
        setVal("conflict_flag", hasConflict ? "Ja" : "Nein");
        setVal("plus5_festivals_flag", tooMany ? "Ja" : "Nein");
        setVal("about", about);
        setVal("extra_info", extra_info); // ← NEU

        appSheet.appendRow(rowData);
        created++;
      } else {
        updated++;
      }
    }
  }
  Logger.log(`FERTIG: ${created} Bewerbungen neu angelegt.`);
  return { created, updated, skipped };
}


/* =========================
 * DETAIL IMPORT: RESPONSES -> APPLICATIONS + DASH
 * ========================= */
function syncDetailResponsesFromForm_({ festivalId }) {
  const ss = SpreadsheetApp.getActive();
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!appSheet) throw new Error(`Sheet fehlt: ${SHEETS.APPLICATIONS}`);

  const { responsesSpreadsheetId, responsesSheetName } = getDetailCfgByFestivalId_(festivalId);

  // Zugriff prüfen
  try {
    if (!responsesSpreadsheetId || String(responsesSpreadsheetId).length < 20) {
      throw new Error(`Ungültige Spreadsheet-ID: "${responsesSpreadsheetId}"`);
    }
    DriveApp.getFileById(responsesSpreadsheetId);
  } catch (e) {
    throw new Error(
      `Kein Zugriff / falsche ID für detail_responses_spreadsheet_id.\n` +
      `festival_id=${festivalId}\n` +
      `ID=${responsesSpreadsheetId}\n` +
      `Original-Fehler: ${e && e.message ? e.message : e}`
    );
  }

  const respSS = SpreadsheetApp.openById(responsesSpreadsheetId);
  const respSheet = respSS.getSheetByName(responsesSheetName);
  if (!respSheet) throw new Error(`Responses-Sheet nicht gefunden: ${responsesSheetName}`);

  const respData = readSheetAsObjects_(respSheet);
  const appData = readSheetAsObjects_(appSheet);
  const respHeaders = respData.headers;

  function getRespVal_(rowObj, headerKey) {
    if (!headerKey) return "";
    return rowObj[headerKey];
  }

  function setIfExists_(sheet, headerMap, rowNumber, colName, value) {
    if (headerMap[colName] === undefined && headerMap[String(colName).toLowerCase()] === undefined) return;
    updateCell_(sheet, headerMap, rowNumber, colName, value);
  }

const respKey = {
  detail_ts:            findHeaderKey_(respHeaders, [(h) => h.includes("zeitstempel") || h.includes("timestamp")]),
  application_id:       findHeaderKey_(respHeaders, [(h) => h.includes("application") && h.includes("id")]),
  email:                findHeaderKey_(respHeaders, [(h) => h.includes("e-mail") || h.includes("email")]),

  detail_first_name:     findHeaderKey_(respHeaders, [(h) => h.includes("vorname") && !h.includes("abweichend") && !h.includes("ausweisdokument")]),
  detail_first_name_doc: findHeaderKey_(respHeaders, [(h) => h.includes("abweichend") || h.includes("ausweisdokument")]),  // ← FIX
  detail_last_name:      findHeaderKey_(respHeaders, [(h) => (h.includes("nachname") || h.includes("lastname")) && !h.includes("geburt")]),
  detail_last_name_birth:findHeaderKey_(respHeaders, [(h) => (h.includes("nachname") && h.includes("geburt")) || h.includes("birth")]),
  detail_pronouns:       findHeaderKey_(respHeaders, [(h) => h.includes("pron") || h.includes("pronomen")]),
  detail_birthdate:      findHeaderKey_(respHeaders, [(h) => h.includes("geburtsdatum") || (h.includes("birth") && h.includes("date"))]),
  detail_birthplace:     findHeaderKey_(respHeaders, [(h) => h.includes("geburtsort") || (h.includes("birth") && h.includes("place"))]),
  detail_birthcountry:   findHeaderKey_(respHeaders, [(h) => h.includes("geburtsland") || (h.includes("birth") && h.includes("country"))]),
  detail_phone:          findHeaderKey_(respHeaders, [(h) => h.includes("telefon") || h.includes("phone")]),
  detail_food:           findHeaderKey_(respHeaders, [(h) => h.includes("verpflegung") || h.includes("mitessen") || h.includes("essen") || h.includes("food") || h.includes("ernaehr")]),
  detail_allergies:      findHeaderKey_(respHeaders, [(h) => h.includes("allerg")]),
  detail_carpass:        findHeaderKey_(respHeaders, [(h) => h.includes("carpass") || h.includes("fahr") || h.includes("auto")]),
  detail_shift_pref_1:   findHeaderKey_(respHeaders, [(h) => h.includes("wahl") && (h.includes("1.") || h.includes("erste"))]),  // ← FIX
  detail_shift_pref_2:   findHeaderKey_(respHeaders, [(h) => h.includes("wahl") && (h.includes("2.") || h.includes("zweite"))]), // ← FIX
  detail_promo_want:     findHeaderKey_(respHeaders, [(h) => h.includes("promo") || h.includes("bauchladen") || h.includes("superflitzer") || h.includes("freischiss")]),
  detail_arrival: findHeaderKey_(respHeaders, [(h) => h.includes("reist") || h.includes("anrei") || h.includes("arrival") || h.includes("ankunft") || (h.includes("wann") && h.includes("an"))]),
  detail_other:          findHeaderKey_(respHeaders, [(h) => h.includes("sonst") || h.includes("noch was")]), // ← NEU
};

  if (!respKey.application_id && !respKey.email) {
    throw new Error(`Detail-Responses: Weder application_id noch email gefunden.\nHeaders: ${respHeaders.join(" | ")}`);
  }

  // Index in APPLICATIONS
  const appById = new Map();
  const appByEmailFestival = new Map();
  appData.rows.forEach((r) => {
    const fid = String(r.festival_id || "").trim();
    const em = normEmail_(r.email);
    const aid = String(r.application_id || "").trim();
    if (aid) appById.set(aid, r);
    if (fid && em) appByEmailFestival.set(`${em}|${fid}`, r);
  });

  // ⚡ Dashboard-Cache einmalig aufbauen (Headers + application_id → Zeile)
  // Dadurch: keine Sheet-Reads mehr pro Person, sondern 2 Reads insgesamt
  const dashSheet = ss.getSheetByName(`DASH_${festivalId}`);
  let dashCache = null;
  if (dashSheet) {
    const DASH_HEADER_ROW = findDashHeaderRow_(dashSheet);
    const lastCol = dashSheet.getLastColumn();
    const lastRow = dashSheet.getLastRow();
    if (lastCol > 0 && lastRow > DASH_HEADER_ROW) {
      const headers = dashSheet.getRange(DASH_HEADER_ROW, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
      const idColIdx = headers.indexOf("application_id");
      if (idColIdx !== -1) {
        const idValues = dashSheet.getRange(DASH_HEADER_ROW + 1, idColIdx + 1, lastRow - DASH_HEADER_ROW, 1).getValues();
        const rowByAppId = new Map();
        idValues.forEach(([v], i) => {
          const id = String(v || "").trim();
          if (id) rowByAppId.set(id, DASH_HEADER_ROW + 1 + i);
        });
        dashCache = { headers, rowByAppId, sheet: dashSheet };
      }
    }
  }

  let updated = 0;
  let skipped = 0;
  let alreadyCurrent = 0;

  respData.rows.forEach((rr) => {
    const respAppId = String(getRespVal_(rr, respKey.application_id) || "").trim();
    const respEmail = normEmail_(getRespVal_(rr, respKey.email));
    const respTs = String(getRespVal_(rr, respKey.detail_ts) || "").trim();

    let appRow = null;
    if (respAppId && appById.has(respAppId)) {
      appRow = appById.get(respAppId);
    } else if (respEmail) {
      appRow = appByEmailFestival.get(`${respEmail}|${String(festivalId).trim()}`) || null;
    }
    if (!appRow) { skipped++; return; }
    if (String(appRow.festival_id || "").trim() !== String(festivalId).trim()) { skipped++; return; }

    // ⚡ Bereits importiert? Überspringen wenn Timestamp identisch und Status schon "ausgefüllt"
    const alreadyDone = String(appRow.detail_status || "").trim() === DETAIL_STATUS.DONE;
    const sameTs = respTs && String(appRow.detail_ts || "").trim() === respTs;
    if (alreadyDone && sameTs) { alreadyCurrent++; return; }

    const appsUpdates = {
  detail_last_import_at: new Date(),
  detail_ts:             respTs || "",
  detail_first_name:     getRespVal_(rr, respKey.detail_first_name) || "",
  detail_first_name_doc: getRespVal_(rr, respKey.detail_first_name_doc) || "",
  detail_last_name:      getRespVal_(rr, respKey.detail_last_name) || "",
  detail_last_name_birth:getRespVal_(rr, respKey.detail_last_name_birth) || "",
  detail_pronouns:       getRespVal_(rr, respKey.detail_pronouns) || "",
  detail_birthdate:      getRespVal_(rr, respKey.detail_birthdate) || "",
  detail_birthplace:     getRespVal_(rr, respKey.detail_birthplace) || "",
  detail_birthcountry:   getRespVal_(rr, respKey.detail_birthcountry) || "",
  detail_phone:          normalizePhone_(getRespVal_(rr, respKey.detail_phone)) || "", // ← FIX
  detail_food:           parseYesNoLoose_(getRespVal_(rr, respKey.detail_food)),
  detail_allergies:      getRespVal_(rr, respKey.detail_allergies) || "",
  detail_carpass:        parseYesNoLoose_(getRespVal_(rr, respKey.detail_carpass)),
  detail_shift_pref_1:   String(getRespVal_(rr, respKey.detail_shift_pref_1) || "").trim(),
  detail_shift_pref_2:   String(getRespVal_(rr, respKey.detail_shift_pref_2) || "").trim(),
  detail_promo_want:     parsePromoWant_(getRespVal_(rr, respKey.detail_promo_want)),
  detail_arrival:        String(getRespVal_(rr, respKey.detail_arrival) || "").trim(), // ← NEU
  detail_other:          String(getRespVal_(rr, respKey.detail_other) || "").trim(),   // ← NEU
};

    const hasAnyDetailValue =
      Object.keys(appsUpdates).some((k) => k.startsWith("detail_") && String(appsUpdates[k] || "").trim() !== "");
    if (!hasAnyDetailValue) { skipped++; return; }

    Object.keys(appsUpdates).forEach((col) => {
      const val = appsUpdates[col];
      if (val === "" || val === null || typeof val === "undefined") return;
      setIfExists_(appSheet, appData.headerMap, appRow.__rowNumber, col, val);
    });

    setIfExists_(appSheet, appData.headerMap, appRow.__rowNumber, "detail_status", DETAIL_STATUS.DONE);

    const dashUpdates = { detail_status: DETAIL_STATUS.DONE };
    Object.keys(appsUpdates).forEach((k) => {
      if (k === "detail_last_import_at") return;
      if (k === "detail_ts" || k.startsWith("detail_")) dashUpdates[k] = appsUpdates[k];
    });
    updateDashboardRowByApplicationId_(festivalId, appRow.application_id, dashUpdates, dashCache);

    // Supabase: Pronomen, Carpass, Anreise ins Assignment schreiben
    try {
      callRpc_("sync_assignment_details", {
        p_email:       respEmail || normEmail_(appRow.email),
        p_festival_id: String(festivalId || "").trim(),
        p_pronouns:    String(appsUpdates.detail_pronouns || ""),
        p_carpass:     String(appsUpdates.detail_carpass  || ""),
        p_arrival:     String(appsUpdates.detail_arrival  || ""),
      });
    } catch (e) {
      Logger.log("sync_assignment_details Error: " + e.message);
    }

    updated++;
  });

  log_({
    action: "SYNC_DETAIL_RESPONSES",
    meta: { festivalId, updated, skipped, alreadyCurrent, responsesSheetName, responsesSpreadsheetId },
    count: updated,
  });
  Logger.log(`Detail-Sync: ${updated} neu importiert, ${alreadyCurrent} bereits aktuell übersprungen, ${skipped} nicht zugeordnet`);

  return { updated, skipped, alreadyCurrent };
}


/* =========================
 * VALIDATIONS & FORMATTING
 * ========================= */
function applyDropdownValidation_(sheet, fromRow, toRow, dashCols, columnName, allowedValues) {
  const idx = dashCols.indexOf(columnName);
  if (idx === -1) return;

  const numRows = Math.max(0, toRow - fromRow + 1);
  if (numRows <= 0) return;

  const range = sheet.getRange(fromRow, idx + 1, numRows, 1);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(allowedValues, true)
    .setAllowInvalid(false)
    .build();

  range.setDataValidation(rule);
}

function applyStatusValidationPerRow_(sheet, fromRow, toRow, dashCols) {
  const statusIdx = dashCols.indexOf("status");
  if (statusIdx === -1) return;

  const numRows = Math.max(0, toRow - fromRow + 1);
  if (numRows <= 0) return;

  const values = sheet.getRange(fromRow, 1, numRows, dashCols.length).getValues();

  for (let i = 0; i < numRows; i++) {
    const rowArr = values[i];
    const rowObj = {};
    dashCols.forEach((c, idx) => (rowObj[c] = rowArr[idx]));

    const allowed = getAllowedNextStatuses_(rowObj);

    const cell = sheet.getRange(fromRow + i, statusIdx + 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(allowed, true)
      .setAllowInvalid(false)
      .build();

    cell.setDataValidation(rule);
  }
}

/**
 * ✅ Fehlte bei dir vorher oft komplett.
 * State-Machine: Welche Status sind als NÄCHSTES erlaubt (plus aktueller Status).
 */
function getAllowedNextStatuses_(rowObj) {
  const cur = coerceStatus_(rowObj && rowObj.status);

  const map = {};
  map[STATUS.EINGEGANGEN]     = [STATUS.EINGEGANGEN, STATUS.IN_PRUEFUNG, STATUS.ZUSAGEN, STATUS.FUER_WARTELISTE, STATUS.FINAL_ABSAGEN, STATUS.ZURUECKGEZOGEN];
  map[STATUS.IN_PRUEFUNG]     = [STATUS.IN_PRUEFUNG, STATUS.ZUSAGEN, STATUS.FUER_WARTELISTE, STATUS.FINAL_ABSAGEN, STATUS.ZURUECKGEZOGEN];

  // ✅ Zusage-Pipeline
  map[STATUS.ZUSAGEN]         = [STATUS.ZUSAGEN, STATUS.ZUGESAGT, STATUS.FUER_WARTELISTE, STATUS.FINAL_ABSAGEN, STATUS.ZURUECKGEZOGEN];
  map[STATUS.ZUGESAGT]        = [STATUS.ZUGESAGT, STATUS.AKKREDITIERT, STATUS.TEILGENOMMEN, STATUS.ZURUECKGEZOGEN];
  map[STATUS.AKKREDITIERT]    = [STATUS.AKKREDITIERT, STATUS.TEILGENOMMEN, STATUS.ZURUECKGEZOGEN];
  map[STATUS.TEILGENOMMEN]    = [STATUS.TEILGENOMMEN];

  map[STATUS.FUER_WARTELISTE] = [STATUS.FUER_WARTELISTE, STATUS.AUF_WARTELISTE, STATUS.ZUSAGEN, STATUS.FINAL_ABSAGEN, STATUS.ZURUECKGEZOGEN];
  map[STATUS.AUF_WARTELISTE]  = [STATUS.AUF_WARTELISTE, STATUS.ZUSAGEN, STATUS.FINAL_ABSAGEN, STATUS.ZURUECKGEZOGEN];

  map[STATUS.FINAL_ABSAGEN]   = [STATUS.FINAL_ABSAGEN, STATUS.FINAL_ABGESAGT, STATUS.ZURUECKGEZOGEN];
  map[STATUS.FINAL_ABGESAGT]  = [STATUS.FINAL_ABGESAGT, STATUS.ZURUECKGEZOGEN];

  map[STATUS.ZURUECKGEZOGEN]  = [STATUS.ZURUECKGEZOGEN];

  let allowed = map[cur] ? map[cur].slice() : [cur];

  allowed = allowed
    .map(coerceStatus_)
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .filter((s) => STATUS_LIST.includes(s));

  if (allowed.length === 0) allowed = [STATUS.EINGEGANGEN];
  return allowed;
}


function applyFlagConditionalFormatting_(sheet, dashCols, headerRow) {
  const existingRules = sheet.getConditionalFormatRules() || [];
  const lastRow = Math.max(sheet.getLastRow(), headerRow + 1);
  const newRules = [];

  ["conflict_flag", "plus5_festivals_flag", "under_18_flag"].forEach((flagName) => {
    const colIndex = dashCols.indexOf(flagName);
    if (colIndex === -1) return;

    const range = sheet.getRange(headerRow + 1, colIndex + 1, lastRow - headerRow, 1);
    const a1 = range.getA1Notation().split(":")[0];
    const formula = `=LOWER(TRIM(${a1}))="ja"`;

    newRules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(formula)
        .setBackground("#f4cccc")
        .setFontColor("#990000")
        .setRanges([range])
        .build()
    );
  });

  sheet.setConditionalFormatRules(existingRules.concat(newRules));
}

/**
 * Markiert "Nein" in der Hepatitis-Spalte rot.
 */
function applyHepaConditionalFormatting_(sheet, dashCols, headerRow) {
  const colIndex = dashCols.indexOf("hepa_vax_flag");
  if (colIndex === -1) return;

  const lastRow = Math.max(sheet.getLastRow(), headerRow + 1);
  const range = sheet.getRange(headerRow + 1, colIndex + 1, lastRow - headerRow, 1);
  
  const rules = sheet.getConditionalFormatRules();
  const a1 = range.getA1Notation().split(":")[0];
  
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=LOWER(TRIM(${a1}))="nein"`)
    .setBackground("#f4cccc")
    .setFontColor("#990000")
    .setRanges([range])
    .build();
    
  rules.push(rule);
  sheet.setConditionalFormatRules(rules);
}

/**
 * Wendet bedingte Formatierungen auf das Dashboard an.
 * Beinhaltet den Bewerbungs-Status UND den neuen Vertrags-Status.
 */
function applyStatusConditionalFormatting_(sheet, dashCols, headerRow) {
  const lastRow = Math.max(sheet.getLastRow(), headerRow + 1);
  const existingRules = sheet.getConditionalFormatRules() || [];
  const newRules = [];

  // --- 1. FORMATIERUNG FÜR STATUS-SPALTE ---
  // Hinweis: "zurueckgezogen" und "final abgesagt" werden NICHT per CF gefärbt,
  // sondern über applyWithdrawnHighlighting_ direkt als Zeilenhintergrund gesetzt.
  const statusIdx = dashCols.indexOf("status");
  if (statusIdx !== -1) {
    const range = sheet.getRange(headerRow + 1, statusIdx + 1, lastRow - headerRow, 1);
    const firstCell = range.getA1Notation().split(":")[0];

    const mkStatusRule = (value, bg, font) =>
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(`=LOWER(TRIM(${firstCell}))="${value.toLowerCase()}"`)
        .setBackground(bg)
        .setFontColor(font)
        .setRanges([range])
        .build();

    newRules.push(
      mkStatusRule("eingegangen", "#ffffff", "#000000"),
      mkStatusRule("in_pruefung", "#fff2cc", "#000000"),
      mkStatusRule("zusagen", "#d9ead3", "#000000"),
      mkStatusRule("für warteliste", "#ead1dc", "#000000"),
      mkStatusRule("final absagen", "#f4cccc", "#000000"),
      mkStatusRule("zugesagt", "#6aa84f", "#ffffff"),
      mkStatusRule("friend", "#4a86e8", "#ffffff"),
      mkStatusRule("auf warteliste", "#8e7cc3", "#ffffff"),
      mkStatusRule("akkreditiert", "#274e13", "#ffffff"),
      mkStatusRule("teilgenommen", "#000000", "#ffffff")
      // "zurueckgezogen" + "final abgesagt" → direkte Zeilenfarbe via applyWithdrawnHighlighting_
    );
  }

  // --- 2. FORMATIERUNG FÜR CONTRACT-STATUS (DPMS) ---
  const contractIdx = dashCols.indexOf("contract_status");
  if (contractIdx !== -1) {
    const range = sheet.getRange(headerRow + 1, contractIdx + 1, lastRow - headerRow, 1);
    const firstCell = range.getA1Notation().split(":")[0];

    // Regel für "unterschrieben" -> Grün
    newRules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(`=LOWER(TRIM(${firstCell}))="unterschrieben"`)
        .setBackground("#b6d7a8") // Hellgrün
        .setFontColor("#1e4620") // Dunkelgrüner Text
        .setRanges([range])
        .build()
    );

    // Regel für "-" oder leer -> Dezent (optional)
    newRules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(`=OR(${firstCell}="-";ISBLANK(${firstCell}))`)
        .setBackground("#efefef")
        .setFontColor("#999999")
        .setRanges([range])
        .build()
    );
  }

  sheet.setConditionalFormatRules(existingRules.concat(newRules));
}

/**
 * Setzt direkte Zeilenhintergrundfarbe für zurückgezogen/final abgesagt.
 * Direkte Formatierung (nicht CF) damit kein CF-Konflikt entsteht.
 */
function applyWithdrawnHighlighting_(sheet, dashCols, headerRow) {
  const statusIdx = dashCols.indexOf("status");
  if (statusIdx === -1) return;
  const lastRow = sheet.getLastRow();
  if (lastRow <= headerRow) return;
  const lastCol = Math.max(sheet.getLastColumn(), dashCols.length);
  const numDataRows = lastRow - headerRow;
  const statusValues = sheet.getRange(headerRow + 1, statusIdx + 1, numDataRows, 1).getValues();
  const WITHDRAWN_STATUSES = new Set(["zurueckgezogen", "final abgesagt"]);

  statusValues.forEach(([val], i) => {
    const st = normalizeStatus_(String(val || "").trim());
    const rowRange = sheet.getRange(headerRow + 1 + i, 1, 1, lastCol);
    if (WITHDRAWN_STATUSES.has(st)) {
      rowRange.setBackground("#f4cccc").setFontColor("#990000");
    } else {
      // Hintergrundfarbe zurücksetzen falls vorher zurückgezogen war
      rowRange.setBackground(null).setFontColor(null);
    }
  });
}

/* =========================
 * DASHBOARD KPI RECALC
 * ========================= */
function recalcDashboardKpis_(sheet, dashCols, headerRow) {
  const lastRow = sheet.getLastRow();
  // Wenn keine Daten da sind, trotzdem die Header-Struktur respektieren (Zeile 12 ist Header)
  if (lastRow <= headerRow) return;

  const roleIdx = dashCols.indexOf("role");
  const statusIdx = dashCols.indexOf("status");
  if (roleIdx === -1 || statusIdx === -1) return;

  // Reihenfolge entspricht der KPI-Tabelle (Zeilen 7–12): 5 Rollen + Friend
  const rolesToTrack = ["Lead", "Operator", "Supporti Plus", "Supporti", "Catering", "Friend"];

  const stats = {};
  rolesToTrack.forEach(r => {
    // Index: 0:Apps, 1:Zusagen(offen), 2:WL(offen), 3:Absage(offen), 4:Zugesagt(fix), 5:WL(fix), 6:Abgesagt(fix)
    stats[normalizeRole_(r)] = [0, 0, 0, 0, 0, 0, 0];
  });

  const data = sheet.getRange(headerRow + 1, 1, lastRow - headerRow, dashCols.length).getValues();

  data.forEach(row => {
    const r = normalizeRole_(row[roleIdx]);
    const s = normalizeStatus_(row[statusIdx]);

    if (s === "friend") {
      // Friend immer in der Friend-Zeile zählen (egal welche Rolle)
      stats["FRIEND"][0]++; // Apps
      stats["FRIEND"][4]++; // Zugesagt (fix)
    } else if (stats[r]) {
      stats[r][0]++; // Spalte "Apps" (Gesamt)
      if (s === "zusagen") {
        stats[r][1]++; // Spalte "Zusagen" (Vorbereitung)
      } else if (s === "für warteliste") {
        stats[r][2]++; // Spalte "Warteliste" (Vorbereitung)
      } else if (s === "final absagen") {
        stats[r][3]++; // Spalte "Absagen" (Vorbereitung)
      } else if (["zugesagt", "akkreditiert", "teilgenommen"].includes(s)) {
        stats[r][4]++; // Spalte "ZUGESAGT ✅" (Fix)
      } else if (s === "auf warteliste") {
        stats[r][5]++; // Spalte "AUF WL ⏳" (Fix)
      } else if (["final abgesagt", "zurueckgezogen"].includes(s)) {
        stats[r][6]++; // Spalte "ABGESAGT ❌" (Fix)
      }
    }
  });

  // Mapping auf das Ausgabeformat (Zeilen 7–12): Lead, Operator, Supporti Plus, Supporti, Catering, Friend
  const output = rolesToTrack.map(rName => stats[normalizeRole_(rName)]);

  // Wir schreiben in Zeile 7, ab Spalte 3 (C), über 6 Zeilen und 7 Spalten (C bis I)
  sheet.getRange(7, 3, output.length, 7).setValues(output);

  // Gesamtzeile (Zeile 13 = 7 + 6 Rollen) berechnen
  const totals = [0, 0, 0, 0, 0, 0, 0];
  output.forEach(roleRow => {
    roleRow.forEach((val, i) => {
      totals[i] += val;
    });
  });

  // Gesamtwerte in Zeile 13 (7 + 6) schreiben
  sheet.getRange(7 + rolesToTrack.length, 3, 1, 7).setValues([totals]);
}

function getActiveFestivalIdOrPrompt_() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const name = sheet.getName();

  if (name.startsWith("DASH_")) return name.replace("DASH_", "").trim();

  const ui = SpreadsheetApp.getUi();
  const fest = ui.prompt("Festival-ID", "Du bist nicht in einem DASH_ Tab. Bitte festival_id eingeben:", ui.ButtonSet.OK_CANCEL);
  if (fest.getSelectedButton() !== ui.Button.OK) return null;
  return fest.getResponseText().trim();
}

function getDashboardSheet_(festivalId) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(`DASH_${festivalId}`);
  if (!sh) throw new Error(`Dashboard nicht gefunden: DASH_${festivalId} (bitte zuerst "Dashboards aktualisieren")`);
  return sh;
}

/* =========================
 * TEMPLATES
 * ========================= */
function getTemplate_(templateKey, { allowInactive }) {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SHEETS.TEMPLATES);
  if (!sheet) throw new Error(`Sheet fehlt: ${SHEETS.TEMPLATES}`);

  const data = readSheetAsObjects_(sheet);
  const matches = data.rows.filter((r) => String(r.template_key || "").trim() === String(templateKey).trim());
  
  if (matches.length === 0) throw new Error(`Template nicht gefunden: ${templateKey}`);

  // Wir suchen das erste aktive Template, oder nehmen das erste verfügbare
const t = matches.find((m) => {
  const val = String(m.active || "").trim().toLowerCase();
  // Erkennt jetzt Englisch (true), Deutsch (wahr) und andere Bestätigungen
  return val === "true" || val === "wahr" || val === "ja" || val === "yes" || val === "1" || m.active === true;
}) || matches[0];

const isActive = (function(val) {
  const s = String(val || "").trim().toLowerCase();
  return s === "true" || s === "wahr" || s === "ja" || s === "yes" || s === "1" || val === true;
})(t.active);

  if (!allowInactive && !isActive) {
    Logger.log(`Template gefunden, aber NICHT aktiv: ${templateKey}`);
    return { ...t, active: false };
  }

  return {
    template_key: t.template_key,
    subject: t.subject || "",
    body_html: t.body_html || "",
    active: isActive,
  };
}

/* =========================
 * GENERIC HELPERS
 * ========================= */
function readSheetAsObjects_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < 1) return { headers: [], headerMap: {}, rows: [] };

  // .getDisplayValues() statt .getValues() ist hier der Schlüssel!
  const values = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  const headers = values[0].map((h) => String(h || "").trim());

  const headerMap = {};
  headers.forEach((h, idx) => {
    if (h) headerMap[h] = idx;
  });

  const rows = [];
  if (lastRow > 1) {
    for (let i = 1; i < values.length; i++) {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[i][idx];
      });
      obj.__rowNumber = i + 1;
      rows.push(obj);
    }
  }

  return { headers, headerMap, rows };
}

/**
 * Nimmt das erste "wirklich leere" Sheet (z.B. das Default-Sheet in einer neuen Datei),
 * benennt es um und nutzt es weiter. Falls keines leer ist: neues Sheet erstellen.
 */
function reuseFirstEmptySheetOrCreate_(ss, desiredName) {
  const existing = ss.getSheetByName(desiredName);
  if (existing) return existing;

  // leeres Sheet suchen (typisch: "Tabellenblatt1" / "Sheet1")
  const sheets = ss.getSheets();
  for (const sh of sheets) {
    const name = sh.getName();
    const isDefaultName = /^(Sheet1|Tabelle1|Tabellenblatt1)$/i.test(name);

    // "wirklich leer" = keine Inhalte im used range
    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();
    const looksEmpty = lastRow <= 1 && lastCol <= 1 && String(sh.getRange(1, 1).getValue() || "").trim() === "";

    if (looksEmpty && (isDefaultName || sheets.length === 1)) {
      sh.setName(desiredName);
      return sh;
    }
  }

  // sonst neu
  return ss.insertSheet(desiredName);
}



function getOrCreateSheet_(ss, name) {
  if (!ss) throw new Error("getOrCreateSheet_: ss fehlt");
  const sheetName = String(name || "").trim();
  if (!sheetName) throw new Error("getOrCreateSheet_: name fehlt");

  let sh = ss.getSheetByName(sheetName);
  if (sh) return sh;

  // Google Sheets mag keine superlangen Namen
  const safeName = sheetName.length > 99 ? sheetName.slice(0, 99) : sheetName;

  // Wenn abgeschnitten -> prüfen ob existiert
  sh = ss.getSheetByName(safeName);
  if (sh) return sh;

  return ss.insertSheet(safeName);
}

function deleteEmptySheetsExcept_(ss, keepNames) {
  const keep = new Set((keepNames || []).map(s => String(s).trim()).filter(Boolean));

  // nicht das letzte Sheet löschen – also nur wenn > 1
  const sheets = ss.getSheets();
  if (sheets.length <= 1) return;

  sheets.forEach(sh => {
    const nm = sh.getName();
    if (keep.has(nm)) return;

    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();
    const a1 = String(sh.getRange(1, 1).getValue() || "").trim();

    const isEmpty = (lastRow <= 1) && (lastCol <= 1) && (a1 === "");
    if (isEmpty) {
      try {
        // nur löschen wenn danach noch mind. 1 Sheet bleibt
        if (ss.getSheets().length > 1) ss.deleteSheet(sh);
      } catch (e) {
        // ignore
      }
    }
  });
}

function enforceSheetOrder_(ss, orderedNames) {
  const names = (orderedNames || []).map(s => String(s).trim()).filter(Boolean);

  // moveActiveSheet ist 1-basiert
  for (let i = names.length - 1; i >= 0; i--) {
    const sh = ss.getSheetByName(names[i]);
    if (!sh) continue;
    ss.setActiveSheet(sh);
    ss.moveActiveSheet(i + 1);
  }
}


function hasPromoOnDay_(stateEntry, day) {
  const d = String(day || "").trim();
  return (stateEntry?.assignedAll || []).some(a =>
    String(a.day || "").trim() === d && String(a.type || "") === "promo"
  );
}

function deleteDefaultSheetIfEmpty_(ss) {
  try {
    const sh = ss.getSheetByName("Sheet1");
    if (!sh) return;

    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();

    // Wenn wirklich leer (nur leeres Default-Sheet)
    if (lastRow <= 1 && lastCol <= 1 && !sh.getRange(1,1).getValue()) {
      ss.deleteSheet(sh);
    }
  } catch (err) {
    // falls es nicht gelöscht werden darf – einfach ignorieren
  }
}


function writeWarningsSheet_(ss, festivalId, warnings) {
  const name = `WARNINGS_${festivalId}`;
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clear();

  const header = ["Type", "Day", "Time", "Block", "Where", "People", "Message"];
  sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight("bold");

  const rows = (warnings || []).map(w => [
    w.type || "",
    w.day || "",
    w.time || "",
    w.block || "",
    w.where || "",
    w.people || "",
    w.message || "",
  ]);

  if (rows.length) sh.getRange(2, 1, rows.length, header.length).setValues(rows);

// Erstmal alles ab Spalte B (2) bis Spalte O (15) automatisch anpassen
sh.autoResizeColumns(2, 14);

// Jetzt Spalte A (1) gezielt auf eine feste Breite setzen (z.B. 120 oder 150 Pixel)
// Das überschreibt jeden automatischen Versuch von Google, die Spalte breit zu machen.
sh.setColumnWidth(1, 150);
  sh.setFrozenRows(1);

  // Optional: kleine Optik
  sh.getRange(1, 1, 1, header.length).setBackground("#f3f3f3");
}


function isPromoYes_(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return false;
  // du schreibst in parsePromoWant_ "Ja"/"Nein" — aber wir sind robust:
  if (s === "ja") return true;
  if (s.includes("bock")) return true;
  if (s.includes("yes")) return true;
  if (s.includes("klar")) return true;
  if (s.includes("safe")) return true;
  if (s.includes("gerne")) return true;
  return false;
}

function hasSameShift_(assignedList, day, time) {
  const d = String(day || "").trim();
  const t = String(time || "").trim();
  return (assignedList || []).some(a => String(a.day||"").trim() === d && String(a.time||"").trim() === t);
}


function formatDayHeaderRows_(sh, dayHeaderRows, headerLen) {
  (dayHeaderRows || []).forEach(r => {
    // ganze Zeile über Planbreite mergen
    sh.getRange(r, 1, 1, headerLen).mergeAcross();
    sh.getRange(r, 1, 1, headerLen)
      .setFontWeight("bold")
      .setFontSize(12)
      .setBackground("#eeeeee")
      .setHorizontalAlignment("left")
      .setVerticalAlignment("middle");

    // etwas “Luft”
    sh.setRowHeight(r, 28);

    // dickere Linie oben/unten
    sh.getRange(r, 1, 1, headerLen)
      .setBorder(true, null, true, null, null, null, "#999999", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  });
}


function stylePlanHeader_(sh, headerLen) {
  sh.getRange(1, 1, 1, headerLen)
    .setFontWeight("bold")
    .setBackground("#f3f3f3")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  sh.getRange(1, 1, 1, headerLen)
    .setBorder(null, null, true, null, null, null, "#999999", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}


function isTrue_(v) {
  const s = String(v || "").trim().toLowerCase();
  return s === "true" || s === "ja" || s === "yes" || s === "1" || s === "x";
}


// =====================================================
// DayOrderMap: global cache (Compat Layer)
// =====================================================
let __DAY_ORDER_MAP__ = null;

/**
 * Setzt die DayOrderMap einmal pro Build (aus slots gebaut).
 */
function setDayOrderMap_(map) {
  __DAY_ORDER_MAP__ = map || null;
}

/**
 * Backwards-compatible: alte Calls dayOrderMap_("Do") funktionieren wieder.
 * Gibt den Index zurück oder -1.
 */
function dayOrderMap_(day) {
  const d = String(day || "").trim();
  if (!__DAY_ORDER_MAP__) return -1;
  return Object.prototype.hasOwnProperty.call(__DAY_ORDER_MAP__, d) ? __DAY_ORDER_MAP__[d] : -1;
}

/**
 * Optional: falls du irgendwo explizit die Map brauchst
 */
function getDayOrderMap_() {
  return __DAY_ORDER_MAP__;
}


function parseBool_(v) {
  const s = String(v || "").trim().toLowerCase();
  return s === "true" || s === "ja" || s === "yes" || s === "1";
}

/**
 * Ermittelt maxCamps (z.B. 2) und ob Promo irgendwo aktiv ist.
 * Promo gilt als aktiv, wenn in CONFIG_SHIFT_SLOTS in irgendeiner Zeile promo/promo_active/promo_enabled TRUE ist.
 */
function getPlanLayoutFromSlots_(slots) {
  let maxCamps = 1;
  let hasPromo = false;

  (slots || []).forEach((s) => {
    const nc = parseInt(s.num_camps, 10);
    if (!Number.isNaN(nc) && nc > maxCamps) maxCamps = nc;

    // mögliche Spaltennamen in CONFIG_SHIFT_SLOTS
    const promoVal =
      s.promo ??
      s.promo_active ??
      s.promo_enabled ??
      s.promo_shift ??
      s.has_promo;

    if (parseBool_(promoVal)) hasPromo = true;
  });

  maxCamps = Math.max(1, maxCamps);

  return { maxCamps, hasPromo };
}


function buildDayOrderMapFromSlots_(slots) {
  const uniqueDays = [...new Set((slots || []).map(s => String(s.day || "").trim()))].filter(Boolean);
  const map = {};
  uniqueDays.forEach((d, i) => { map[d] = i; });
  return map; // z.B. { "Do":0, "Fr":1, "Sa":2, ... }
}

function getDayIndexFromMap_(dayOrderMap, day) {
  const d = String(day || "").trim();
  const idx = dayOrderMap && dayOrderMap.hasOwnProperty(d) ? dayOrderMap[d] : -1;
  return idx;
}


/**
 * "Adjacent shift" = entweder direkt angrenzend im gleichen Tag (10-13 neben 13-16 etc.)
 * ODER Late->Early über die Tagesgrenze (19-22 -> nächster Tag 7-10).
 *
 * ✅ dayOrderMap muss übergeben werden (kein UI-Prompt, kein Slots-Load hier drin!)
 */
function isAdjacentShift_(dayA, timeA, dayB, timeB, dayOrderMap) {
  const dA = getDayIndexFromMap_(dayOrderMap, dayA);
  const dB = getDayIndexFromMap_(dayOrderMap, dayB);

  const tA = String(timeA || "").trim();
  const tB = String(timeB || "").trim();

  if (dA === -1 || dB === -1) return false;

  // Gleicher Tag: Nutze timeIndex
  if (dA === dB) {
    const iA = timeIndex_(tA);
    const iB = timeIndex_(tB);
    return iA !== -1 && iB !== -1 && Math.abs(iA - iB) === 1;
  }

  // Über die Tagesgrenze hinweg
  const isNextDay = (dB - dA) === 1;
  const isPrevDay = (dA - dB) === 1;

  // MOYN: 04-07 -> 07-10
  if (isNextDay && tA === "04-07" && tB === "07-10") return true;
  if (isPrevDay && tB === "04-07" && tA === "07-10") return true;

  // Hurricane: 19-22 -> 7-10
  if (isNextDay && tA === "19-22" && tB === "7-10") return true;

  return false;
}



function firstNonEmpty_(...vals) {
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s !== "") return v;
  }
  return "";
}


function rotateArray_(arr, offset) {
  const n = arr.length;
  if (!n) return arr;
  const k = ((offset % n) + n) % n;
  return arr.slice(k).concat(arr.slice(0, k));
}

function sendMailBccSafe_({ toReal, subject, htmlBody, isTestRun, vars, includeAttachments = false }) {
  if (!toReal) throw new Error("sendMailBccSafe_: toReal fehlt");

  const attachments = [];
  // Anhänge nur hinzufügen, wenn explizit gewünscht (z.B. bei Zusage)
  if (includeAttachments) {
    const idCodeOfConduct = "1sCgp-PrWioR35ZjnRJ8CdA2vpyaW8OWV"; 
    const idFAQ           = "1Kumxs-jZTQx47GEpa_3fJu2hI3p1m0ht"; 

    try {
      attachments.push(DriveApp.getFileById(idCodeOfConduct).getAs(MimeType.PDF));
      if (idFAQ && idFAQ.length > 10) {
        attachments.push(DriveApp.getFileById(idFAQ).getAs(MimeType.PDF));
      }
    } catch (e) {
      Logger.log("Anhang-Fehler: " + e.message);
    }
  }

  // Betreff-Ersetzung (Platzhalter {{FESTIVAL_NAME}})
  let finalSubject = subject;
  if (vars && vars.FESTIVAL_NAME) {
    finalSubject = finalSubject.replace(/\{\{\s*FESTIVAL_NAME\s*\}\}/g, vars.FESTIVAL_NAME);
  }
  
  if (isTestRun) finalSubject = "[TEST] " + finalSubject;

  const mailOptions = {
    htmlBody: htmlBody,
    name: MAIL_CFG.SENDER_NAME,
    replyTo: MAIL_CFG.REPLY_TO,
    attachments: attachments
  };

  if (isTestRun) {
    GmailApp.sendEmail(MAIL_CFG.TEST_RECIPIENT, finalSubject, "HTML erforderlich", mailOptions);
  } else {
    GmailApp.sendEmail(toReal, finalSubject, "HTML erforderlich", mailOptions);
  }
}

function findHeaderKey_(headers, predicates) {
  for (const h of headers) {
    const hl = String(h || "").trim().toLowerCase();
    if (predicates.every((fn) => fn(hl))) return h;
  }
  return null;
}

function normEmail_(s) {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, "");
}

function normalizePhone_(raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  // Sheets liest Nummern als Zahl → 4913209482304 (+ weg, führende 0 weg)
  var s = String(raw).trim();
  // Leerzeichen, Bindestriche, Klammern entfernen
  s = s.replace(/[\s\-().]/g, '');
  // Kein Inhalt übrig?
  if (!s) return '';
  // Nur Ziffern (Google hat + und ggf. führende 0 gefressen):
  if (/^\d+$/.test(s)) {
    if (s.startsWith('0049')) {
      s = '+49' + s.slice(4);          // 00491234 → +491234
    } else if (s.startsWith('49') && s.length >= 11) {
      s = '+' + s;                     // 491234567890 → +491234567890
    } else if (s.startsWith('0')) {
      s = '+49' + s.slice(1);          // 01234567890 → +491234567890
    } else {
      s = '+49' + s;                   // Fallback: 1234567890 → +491234567890
    }
  } else if (s.startsWith('00')) {
    s = '+' + s.slice(2);             // 00491234 → +491234
  }
  // Sicherstellen dass + am Anfang steht
  if (!s.startsWith('+')) s = '+49' + s;
  return s;
}

function normalizeBlockPref_(raw) {
  const s = String(raw || "").trim().toUpperCase();
  if (!s) return "";
  // akzeptiert: "A", "Block A", "BLOCK B", "b", "Block C"
  const m = s.match(/([ABC])\s*$/);
  return m ? m[1] : "";
}


function normalizeSpreadsheetId_(maybeIdOrUrl) {
  const s = String(maybeIdOrUrl || "").trim();
  if (!s) return "";

  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m && m[1]) return m[1];

  const m2 = s.match(/(?:^|\/)d\/([a-zA-Z0-9-_]+)/);
  if (m2 && m2[1]) return m2[1];

  return s;
}

function updateCell_(sheet, headerMap, rowNumber, columnName, value) {
  const key = String(columnName || "").trim();
  const colIdx =
    headerMap[key] !== undefined ? headerMap[key]
    : headerMap[key.toLowerCase()] !== undefined ? headerMap[key.toLowerCase()]
    : undefined;

  if (colIdx === undefined) {
    log_({ action: "UPDATECELL_COL_NOT_FOUND", meta: { sheet: sheet.getName(), columnName, headers: Object.keys(headerMap) }, count: 0 });
    return;
  }
  setValueSafe_(sheet.getRange(rowNumber, colIdx + 1), value, `updateCell col=${columnName} row=${rowNumber}`);
}

function updateIfCol_(sheet, headerMap, rowNumber, columnName, value) {
  const colIdx = headerMap[columnName];
  if (colIdx === undefined) return;
  setValueSafe_(sheet.getRange(rowNumber, colIdx + 1), value, `updateIfCol col=${columnName} row=${rowNumber}`);
}

function normalizeStatus_(s) {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function coerceStatus_(value) {
  const v = String(value || "").trim().toLowerCase();

  // Default, falls leer/undefined:
  if (!v) return "eingegangen";

  // Exakt erlaubte Werte (so wie in STATUS_LIST):
  const allowed = new Set([
    "eingegangen",
    "in_pruefung",
    "zusagen",
    "zugesagt",
    "friend",
    "akkreditiert",
    "teilgenommen",
    "für warteliste",
    "auf warteliste",
    "final absagen",
    "final abgesagt",
    "zurueckgezogen",
  ]);

  // 1) Wenn schon erlaubt -> ok
  if (allowed.has(v)) return v;

  // 2) Legacy / Synonyme / Tippvarianten -> auf erlaubte mappen
  const map = {
    // Zusage-ähnlich
    "zugesagt": "zusagen",
    "akkreditiert": "zusagen",
    "teilgenommen": "zusagen",
    "zusage": "zusagen",

    // Warteliste
    "warteliste": "für warteliste",
    "auf warteliste": "für warteliste",
    "fuer warteliste": "für warteliste", // falls irgendwo ohne Umlaut

    // Absage
    "absagen": "final absagen",
    "final_absagen": "final absagen",
    "abgesagt": "final absagen",

    // Prüfung
    "in prüfung": "in_pruefung",
    "in pruefung": "in_pruefung",
    "in_prüfung": "in_pruefung",
  };

  const mapped = map[v];
  if (mapped && allowed.has(mapped)) return mapped;

  // 3) Fallback: alles Unbekannte sicher auf eingegangen
  return "eingegangen";
}


/**
 * Findet die Header-Zeile eines Dashboard-Sheets dynamisch (Zeile mit "application_id").
 * Macht den Code robust gegen Layout-Änderungen (z.B. KPI-Zeilen hinzufügen).
 */
function findDashHeaderRow_(sh) {
  if (!sh) return 15;
  const lastCol = sh.getLastColumn();
  const lastRow = sh.getLastRow();
  if (lastCol < 1 || lastRow < 12) return 15;
  const scanStart = 12;
  const scanEnd   = Math.min(lastRow, 20);
  const vals = sh.getRange(scanStart, 1, scanEnd - scanStart + 1, lastCol).getValues();
  for (let i = 0; i < vals.length; i++) {
    if (vals[i].some(v => String(v).trim() === "application_id")) return scanStart + i;
  }
  return 15; // Fallback
}

function statusSortKey_(status) {
  const s = normalizeStatus_(status);
  return STATUS_SORT_ORDER[s] || 99;
}

function coerceFromList_(value, allowed, fallback) {
  const v = String(value === null || value === undefined ? "" : value).trim();
  if (v === "") return fallback;
  return allowed.includes(v) ? v : fallback;
}


function splitMulti_(val) {
  const s = String(val || "").trim();
  if (!s) return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function normalizeYesNo_(val) {
  const v = String(val || "").trim().toLowerCase();
  if (v === "ja" || v === "yes" || v === "true") return "Ja";
  if (v === "nein" || v === "no" || v === "false") return "Nein";
  return v ? val : "";
}

function parseYesNoLoose_(raw) {
  const s = String(raw || "").toLowerCase();
  const hasJa = s.includes("ja") || s.includes("jap") || s.includes("yes") || s.includes("klar") || s.includes("safe") || s.includes("gerne") || s.includes("bock") || s.includes("will") || s.includes("brauche");
  const hasNein = s.includes("nein") || s.includes("no") || s.includes("kein") || s.includes("nicht");
  if (hasJa && !hasNein) return "Ja";
  if (hasNein && !hasJa) return "Nein";
  return "";
}

function hasDuplicates_(arr) {
  const seen = new Set();
  for (const a of arr) {
    if (seen.has(a)) return true;
    seen.add(a);
  }
  return false;
}

function makeCrewId_(email) {
  return String(email || "").trim().toLowerCase();
}

function slugFestivalId_(festivalName) {
  return String(festivalName || "")
    .trim()
    .toUpperCase()
    .replace(/Ä/g, "AE")
    .replace(/Ö/g, "OE")
    .replace(/Ü/g, "UE")
    .replace(/ß/g, "SS")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildFestivalMaps_() {
  // getActive() gibt null zurück wenn die Funktion aus einem externen Trigger läuft
  // (z.B. onFormSubmit auf einem fremden Spreadsheet). Fallback: gespeicherte ID nutzen.
  let ss = SpreadsheetApp.getActive();
  if (!ss || !ss.getSheetByName(SHEETS.FESTIVALS)) {
    const savedId = PropertiesService.getScriptProperties().getProperty("CREW_TOOLS_SS_ID");
    if (savedId) ss = SpreadsheetApp.openById(savedId);
  }
  const sheet = ss ? ss.getSheetByName(SHEETS.FESTIVALS) : null;

  const idByName = new Map();
  const overlapByName = new Map();
  const startDateById = new Map();
  const fullDataById = new Map(); // NEU: Speichert alle Details (Ort, Zeiten etc.)

  if (!sheet) return { idByName, overlapByName, startDateById, fullDataById };

  const data = readSheetAsObjects_(sheet);
  data.rows.forEach((r) => {
    const id = String(r.festival_id || "").trim();
    const name = String(r.festival_name || "").trim();
    
    if (id && name) {
      idByName.set(name, id);
      // Wir nutzen start_official für den Alterscheck
      if (r.start_official) startDateById.set(id, new Date(r.start_official));
      
      const og = String(r.overlap_group || "").trim();
      if (og) overlapByName.set(name, og);
      
      // Speichere das ganze Objekt für spätere E-Mail Variablen
      fullDataById.set(id, r);
    }
  });

  return { idByName, overlapByName, startDateById, fullDataById };
}

function normalizeRole_(raw) {
  if (!raw) return 'OTHER';
  const s = raw.toString().trim().toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/\+/g, '_plus');
  const map = {
    'lead':          'LEAD',
    'operator':      'OPERATOR',
    'supporti':      'SUPPORTI',
    'supporti_plus': 'SUPPORTI_PLUS',
    'catering':      'CATERING',
    'friend':        'FRIEND',
    'friends':       'FRIEND',
  };
  return map[s] || 'OTHER';
}

function roleSortKey_(role) {
  const nr = normalizeRole_(role);
  const order = {
    "LEAD": 1,
    "OPERATOR": 2,
    "SUPPORTI": 3,
    "SUPPORTI_PLUS": 4,
    "CATERING": 5,
    "OTHER": 99
  };
  return order[nr] || 99;
}

// ==========================================
// 2. VARIABLE FÜR DAS E-MAIL-TEMPLATE
// ==========================================
function buildVars_(row) {
  const ss = SpreadsheetApp.getActive();
  const festMaps = buildFestivalMaps_();
  const fid = String(row.festival_id || "").trim();
  const rawDetails = festMaps.fullDataById.get(fid) || {};
  
  const crewSh = ss.getSheetByName(SHEETS.CREW_MASTER);
  const crewData = readSheetAsObjects_(crewSh);
  const crewPerson = crewData.rows.find(c => normEmail_(c.email) === normEmail_(row.email));

  if (!crewPerson) throw new Error(`Email ${row.email} nicht im Crew-Master gefunden!`);

  const festDetails = {};
  Object.keys(rawDetails).forEach(key => {
    festDetails[key.toLowerCase().trim()] = rawDetails[key];
  });
  
  const role = String(row.role || "").trim();
  const normRole = normalizeRole_(role);

  // --- HILFSFUNKTION DATUM & ZEIT (ROBUST) ---
  const fmtDate = (val, includeTime = false) => {
    if (!val || String(val).trim() === "") return "TBA";
    // Echtes Date-Objekt (aus als Datum formatierter Zelle) → formatieren
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return "TBA";
      const pattern = includeTime ? "dd.MM.yyyy HH:mm 'Uhr'" : "dd.MM.yyyy";
      return Utilities.formatDate(val, "GMT+1", pattern);
    }
    // String → unverändert zurückgeben (enthält schon TT.MM.JJJJ + evtl. Freitext)
    return String(val).trim();
  };

  // --- ZEIT-LOGIK FÜR ROLLEN (OHNE FLEX-HINWEIS) ---
  let anreise = "TBA";
  let abreise = "TBA";

  if (normRole === "SUPPORTI_PLUS") {
    anreise = fmtDate(festDetails["start_leadop"]);
    abreise = fmtDate(festDetails["end_takedown"]);
  } else if (normRole === "SUPPORTI") {
    anreise = fmtDate(festDetails["start_supp"]);
    abreise = fmtDate(festDetails["end_supp"]);
  } else if (normRole === "LEAD" || normRole === "OPERATOR") {
    anreise = fmtDate(festDetails["start_leadop"]);
    abreise = fmtDate(festDetails["end_leadop"]);
  } else if (normRole === "CATERING") {
    anreise = fmtDate(festDetails["start_kitchen"]);
    abreise = fmtDate(festDetails["end_kitchen"]);
  }

  // --- VERTRAGS-SEKTION ---
  const UNIVERSAL_CONTRACT_URL = "https://app.dpms-online.de/vertrag-anfordern/695e416c623d5"; 
  let contractSection = "";
  if (crewPerson && String(crewPerson.contract_status).trim().toLowerCase() === "unterschrieben") {
    contractSection = "<p style='color: green; font-weight: bold;'>Dein Ehrenamtsvertrag liegt uns bereits unterschrieben vor. Danke!</p>";
  } else {
    contractSection = `
      <div style="border: 2px solid #000000; padding: 20px; border-radius: 8px; margin: 25px 0; background-color: #fffdec;">
        <h3 style="margin-top: 0; color: #000000;">Ehrenamtsvertrag</h3>
        <p style="font-size: 14px; margin-bottom: 20px;">
          Für den Festivaleinsatz mit Goldeimer schließt du einen Ehrenamtsvertrag mit uns ab. Dieser enthält alle Fakten zur Arbeit auf dem Festival sowie eine Sicherheitseinweisung und endet automatisch nach der Festivalsaison. Du brauchst den Vertrag nur 1x für die ganze Saison zu unterzeichnen (nicht für jedes Festival). Bitte gründlich lesen und direkt unterzeichnen.
        </p>
        <a href="${UNIVERSAL_CONTRACT_URL}" style="background-color: #ffe500; color: #000000; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; border: 1px solid #000000;">
          Vertrag jetzt digital unterzeichnen
        </a>
      </div>`;
  }

  // --- HEPA-HINWEIS ---
  const hasHepa = String(row.hepa_vax_flag || "").trim().toLowerCase();
  const hepaHinweis = (hasHepa === "nein") 
    ? `<div style="margin: 25px 0; padding: 15px; border-left: 5px solid #990000; background-color: #f4cccc; color: #990000;">
        <strong>Wichtiger Hinweis:</strong> Laut deiner Anmeldung fehlt dir noch eine Hepatitis A Impfung. Kümmere dich bitte zeitnah darum!
       </div>` : "";

  // --- CREW EVENT BLOCK (KORRIGIERTE FASSUNG) ---
  const crewEventDeadline = new Date("2026-05-04T00:00:00");
  const now = new Date();
  let crewEventBlock = "";

  if (now < crewEventDeadline) {
    crewEventBlock = `
      <div style="margin: 25px 0; padding: 15px; border-left: 5px solid #ffe500; background-color: #f9f9f9;">
        <strong style="font-size: 16px; display: block; margin-bottom: 5px;">Crew Wochenende vom 08. - 10. Mai in Ollsen</strong>
        <p style="margin: 0;">Jedes Jahr stimmt sich die Goldeimer Crew beim Crew Wochenende gemeinsam auf die Festivalsaison ein. Das heißt: Menschen und Toiletten kennenlernen, mit den Aufgaben vertraut machen, Festivalabläufe üben und eine gute Zeit zusammen haben. Bist du dabei? Infos und Anmeldung <a href="https://docs.google.com/forms/d/e/1FAIpQLSfRU1q3mM7tq9exEXoptGwhawMvZXjR7d1iVxhMgGnjlWxdIA/viewform" style="color: #000000; font-weight: bold;">hier</a>.</p>
      </div>`;
  }

  // Alle CONFIG_FESTIVALS-Felder als Großbuchstaben-Platzhalter (z.B. {{TELEGRAM_LINK}}, {{SHIFT_TABLE_LINK}}, {{CREW_CARE}} ...)
  // Markdown-Syntax (**fett**, *kursiv*) wird in HTML umgewandelt, damit die Formatierung
  // zuverlässig im E-Mail-Template ankommt – auch wenn rohes HTML in Zellen nicht rendern würde.
  const festVars = {};
  Object.keys(festDetails).forEach(key => {
    festVars[key.trim().toUpperCase()] = configMdToHtml_(String(festDetails[key] ?? ""));
  });

  // FINALER VARIABLEN-OUTPUT (spezifische Werte überschreiben ggf. festVars)
  return {
    ...festVars,
    FIRST_NAME: row.first_name || "Du Liebe/r",
    LAST_NAME: row.last_name || "",
    FESTIVAL_NAME: row.festival_name || festDetails["festival_name"] || "unser Festival",
    STADT: festDetails["festival_town"] || "TBA",
    ROLE: role,
    ANREISE_PLAN: anreise,
    ABREISE_PLAN: abreise,
    CONTRACT_SECTION: contractSection,
    HEPA_HINWEIS: hepaHinweis,
    CREW_EVENT_BLOCK: crewEventBlock
  };
}

function render_(tpl, vars) {
  let out = String(tpl || "");
  Object.keys(vars).forEach((k) => {
    const re = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "g");
    out = out.replace(re, String(vars[k] ?? ""));
  });
  return out;
}

/**
 * Konvertiert einfaches Markdown aus CONFIG-Zellen in HTML.
 * Unterstützt:
 *   **fett**    → <strong>fett</strong>
 *   *kursiv*    → <em>kursiv</em>
 *   _kursiv_    → <em>kursiv</em>
 *   \n          → <br> (Zeilenumbrüche erhalten)
 *
 * WARUM: GmailApp / Spreadsheet-Zellen können rohe HTML-Tags in substituierten
 * Variablen-Werten unter Umständen streifen oder entstellen.
 * Markdown-Syntax ist sicherer: wir konvertieren explizit im Code,
 * bevor render_() die Variable in das Template einsetzt.
 *
 * Bestehende HTML-Tags (<b>, <strong>, <a href=...> etc.) werden
 * nicht berührt — rückwärtskompatibel.
 */
function configMdToHtml_(text) {
  if (!text) return text;
  return String(text)
    // **fett** → <strong>fett</strong>  (vor *kursiv* verarbeiten!)
    .replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>')
    // *kursiv* oder _kursiv_ → <em>kursiv</em>
    .replace(/\*(.+?)\*/gs, '<em>$1</em>')
    .replace(/_([^_]+)_/gs, '<em>$1</em>')
    // Zeilenumbrüche → <br>
    .replace(/\n/g, '<br>');
}

function formatCrewShortName_(firstName, lastName, emailFallback) {
  const f = String(firstName || "").trim();
  const l = String(lastName || "").trim();

  if (f && l) return `${f} ${l.charAt(0).toUpperCase()}.`;
  if (f) return f;

  // fallback: aus email "bianka.pagel@..." -> "bianka p."
  const em = String(emailFallback || "").trim();
  if (em && em.includes("@")) {
    const local = em.split("@")[0];
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) return `${cap_(parts[0])} ${parts[1].charAt(0).toUpperCase()}.`;
    return cap_(parts[0] || local);
  }
  return "Unbekannt";
}

function cap_(s) {
  const x = String(s || "").trim();
  if (!x) return "";
  return x.charAt(0).toUpperCase() + x.slice(1).toLowerCase();
}


function escapeHtml_(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildTestHeader_(toReal, festivalId, role) {
  return `<p style="font-size:12px;color:#666;">
    <strong>TESTVERSAND</strong> – wäre eigentlich an: ${escapeHtml_(toReal)}<br>
    festival_id: ${escapeHtml_(String(festivalId))} | role: ${escapeHtml_(String(role))}
  </p><hr style="border:none;border-top:1px solid #ddd;margin:16px 0;">`;
}

function toast_(msg) {
  SpreadsheetApp.getActive().toast(String(msg), "Crew Tools", 8);
}

function log_({ action, meta, count }) {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SHEETS.LOG) || ss.insertSheet(SHEETS.LOG);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["timestamp", "user", "action", "count", "meta_json"]);
  }
  sheet.appendRow([
    new Date(),
    Session.getActiveUser().getEmail() || "",
    action,
    count || 0,
    JSON.stringify(meta || {}),
  ]);
}

function setValueSafe_(range, value, context) {
  try {
    range.setValue(value);
  } catch (err) {
    log_({
      action: "SETVALUE_FAILED_VALIDATION",
      meta: {
        a1: range.getA1Notation(),
        sheet: range.getSheet().getName(),
        value: String(value),
        context: context || "",
        message: String(err && err.message ? err.message : err),
      },
      count: 0,
    });
    throw err;
  }
}

function getSchichtplanPropKey_(festivalId) {
  return `SCHICHTPLAN_SPREADSHEET_ID__${String(festivalId).trim()}`;
}

/**
 * Öffnet vorhandene Schichtplan-Datei (pro festivalId), oder erstellt sie einmalig
 * und speichert die ID in ScriptProperties.
 */
function getOrCreateSchichtplanSpreadsheet_({ festivalId, label }) {
  const props = PropertiesService.getScriptProperties();
  const key = getSchichtplanPropKey_(festivalId);
  const existingId = props.getProperty(key);

  if (existingId) {
    try {
      DriveApp.getFileById(existingId);
      return SpreadsheetApp.openById(existingId);
    } catch (e) {
      props.deleteProperty(key);
    }
  }

  // ✅ neu erstellen mit sauberem Namen
  const ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HHmm");
  const name = `${label}_${festivalId}_${ts}`;
  const ss = SpreadsheetApp.create(name);

  deleteDefaultSheetIfEmpty_(ss);

  // Freigabe: Goldeimer = Bearbeiter, Extern = Betrachter
  try { setGoldeimerrSharing_(ss.getId()); } catch (e) { Logger.log("Sharing: " + e.message); }

  props.setProperty(key, ss.getId());
  return ss;
}

function rebuildShiftStatsFromPlan_({ festivalId, targetSpreadsheetId }) {
  const ss = targetSpreadsheetId ? SpreadsheetApp.openById(targetSpreadsheetId) : SpreadsheetApp.getActive();
  const planName = `SCHICHTPLAN_${festivalId}`;
  const planSh = ss.getSheetByName(planName);
  if (!planSh) throw new Error(`Schichtplan-Sheet nicht gefunden: ${planName}`);

  // Slots/Days vorbereiten
  const slots = getUniversalShiftSlots_(festivalId);
  const uniqueDays = [...new Set(slots.map(s => String(s.day || "").trim()))].filter(Boolean);
  const dayOrderMap = buildDayOrderMapFromSlots_(slots);

  // Lookup-Map: day|time|block → people_per_shift (für dynamische Zeilenzahl im Rücklesen)
  const slotPpsMap = {};
  slots.forEach(s => {
    const key = `${String(s.day||"").trim()}|${String(s.time||"").trim()}|${String(s.block||"").trim()}`;
    slotPpsMap[key] = Math.max(1, Number(s.people_per_shift || 3) || 3);
  });

  const firstTwoDaysSet = {};
  uniqueDays.slice(0, 2).forEach(d => firstTwoDaysSet[d] = true);

  // People meta (experience etc.)
  const peopleAll = getShiftCandidatesForFestival_({ festivalId });
  const peopleByName = {};
  (peopleAll || []).forEach((p) => {
    const name = String(p.displayName || p.name || "").trim();
    if (!name) return;
    peopleByName[name] = {
      email: p.email || "",
      experienceBucket: String(p.experienceBucket || "").trim(),
      isExperienced: p.isExperienced === true,
      pref1: p.pref1 || "",
      pref2: p.pref2 || "",
      promoWant: p.promoWant || "",
      arrival: p.arrival || "",
    };
  });

  // --- Unterfunktionen
  function normBlock_(raw) {
    const s = String(raw || "").trim().toUpperCase();
    const m = s.match(/([A-E])\s*$/);
    return m ? m[1] : "";
  }

  function timeIndex_(timeStr) {
    const order = ["7-10", "10-13", "13-16", "16-19", "19-22", "22-01", "01-04", "04-07"];
    return order.indexOf(String(timeStr || "").trim());
  }

  function collectPlanOccurrences_() {
    const values = planSh.getDataRange().getValues();
    const occByPerson = {};
    let curDay = "", curTime = "", curBlock = "";

    // Header dynamisch
    const header = values[0].map(h => String(h || "").trim());
    const campColsCount = header.filter(h => /^Camp\s+\d+$/i.test(h)).length;
    const promoColIdx = header.indexOf("Promo Schicht"); // -1 wenn nicht vorhanden

    for (let r = 1; r < values.length; r++) {
      const row = values[r];

      if (String(row[0]).trim()) curDay = String(row[0]).trim();
      if (String(row[1]).trim()) curTime = String(row[1]).trim();
      if (String(row[2]).trim()) curBlock = String(row[2]).trim();

      if (!curDay || !curTime || !curBlock) continue;

      // Camps
      for (let c = 0; c < campColsCount; c++) {
        const name = String(row[3 + c] || "").trim();
        if (!name) continue;
        if (!occByPerson[name]) occByPerson[name] = [];
        occByPerson[name].push({ day: curDay, time: curTime, block: curBlock, type: "camp" });
      }

      // Promo
      if (promoColIdx !== -1) {
        const pName = String(row[promoColIdx] || "").trim();
        if (pName) {
          if (!occByPerson[pName]) occByPerson[pName] = [];
          occByPerson[pName].push({ day: curDay, time: curTime, block: curBlock, type: "promo" });
        }
      }
    }
    return { occByPerson, campColsCount, promoColIdx };
  }

  function buildAssignedBlockAndMatch_({ perBlock, pref1, pref2 }) {
    const blocks = ["A", "B", "C", "D", "E"];
    const totalBlocks = blocks.reduce((sum, b) => sum + (perBlock[b] || 0), 0);
    if (totalBlocks === 0) return { assignedLabel: "", match: "—" };

    let mainBlock = "";
    let mainPct = 0;
    blocks.forEach(b => {
      const pct = (perBlock[b] || 0) / totalBlocks;
      if (pct > mainPct) { mainPct = pct; mainBlock = b; }
    });

    const assignedLabel = mainBlock ? `Block ${mainBlock}` : "";
    let match = "🟥 anderer Block";
    if (mainBlock === pref1) match = "🟩 1. Wahl";
    else if (mainBlock === pref2) match = "🟧 2. Wahl";

    return { assignedLabel, match };
  }

  // --- Stats sammeln
  const stats = {};
  function ensure_(name) {
    if (!name || !peopleByName[name]) return null;
    if (!stats[name]) {
      const meta = peopleByName[name];
      stats[name] = {
        name,
        email: meta.email,
        experienceBucket: meta.experienceBucket,
        isExperienced: meta.isExperienced,
        pref1: meta.pref1,
        pref2: meta.pref2,
        promoWant: meta.promoWant,
        arrival: meta.arrival,
        total: 0,
        perDay: {},
        perBlock: { A: 0, B: 0, C: 0, D: 0, E: 0 },
        promo: 0,
      };
    }
    return stats[name];
  }

  const values = planSh.getDataRange().getValues();
  const header = values[0].map(h => String(h || "").trim());
  const campColsCount = header.filter(h => /^Camp\s+\d+$/i.test(h)).length;
  const promoColIdx = header.indexOf("Promo Schicht"); // -1 wenn nicht vorhanden

  let curDay = "", curTime = "", curBlock = "";
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (String(row[0]).trim()) curDay = String(row[0]).trim();
    if (String(row[1]).trim()) curTime = String(row[1]).trim();
    if (String(row[2]).trim()) curBlock = String(row[2]).trim();
    if (!curDay || !curTime || !curBlock) continue;

    // Camps
    for (let c = 0; c < campColsCount; c++) {
      const name = String(row[3 + c] || "").trim();
      const s = ensure_(name);
      if (s) {
        s.total++;
        s.perDay[curDay] = (s.perDay[curDay] || 0) + 1;
        const b = normBlock_(curBlock);
        if (s.perBlock[b] !== undefined) s.perBlock[b]++;
      }
    }

    // Promo
    if (promoColIdx !== -1) {
      const pName = String(row[promoColIdx] || "").trim();
      const ps = ensure_(pName);
      if (ps) { ps.total++; ps.promo++; }
    }
  }

  // --- Shift Stats Sheet schreiben
  const statsName = `${SHEETS.SHIFTSTATS}_${festivalId}`;
  const statSh = getOrCreateSheet_(ss, statsName);
  statSh.clear();

  const headersOut = ["Name", "E-Mail", "Rolle", "Experience", "Erfahren?", "Zugewiesener Block", "1. Wahl", "2. Wahl", "Match", "Klo", "Promo", "Gesamt", "Promo-Wunsch", "Anreise"];
  statSh.getRange(1, 1, 1, headersOut.length).setValues([headersOut]).setFontWeight("bold");

  const rowsOut = Object.values(stats).map(s => {
    const { assignedLabel, match } = buildAssignedBlockAndMatch_({ perBlock: s.perBlock, pref1: s.pref1, pref2: s.pref2 });
    return [s.name, s.email, "Supporti", s.experienceBucket, s.isExperienced ? "Ja" : "Nein", assignedLabel, s.pref1, s.pref2, match, s.total - s.promo, s.promo, s.total, s.promoWant, s.arrival];
  });

  if (rowsOut.length) statSh.getRange(2, 1, rowsOut.length, headersOut.length).setValues(rowsOut);

  // --- Warnings aus dem Plan bauen (statt Notes)
  const warnings = [];

  // 1) Experience-Regel: erste 2 Tage, Camp hat 3 Leute, aber niemand erfahren
  //    Wir iterieren slotweise (3 Zeilen pro Slot), denn dein Plan schreibt Slots in 3er-Blöcken.
  //    Day-Header-Zeilen erkennen wir daran, dass nur Spalte A gefüllt ist und Zeit/Block leer sind.
  let rIdx = 1;
  let currentDay2 = "";
  while (rIdx < values.length) {
    const row = values[rIdx];

    const dayCell = String(row[0] || "").trim();
    const timeCell = String(row[1] || "").trim();
    const blockCell = String(row[2] || "").trim();

    // Day header row?
    if (dayCell && !timeCell && !blockCell) {
      currentDay2 = dayCell;
      rIdx++;
      continue;
    }

    // slot start — Anzahl Zeilen pro Slot aus Config
    if (!currentDay2 || !timeCell || !blockCell) { rIdx++; continue; }

    const slotKey2 = `${currentDay2}|${timeCell}|${blockCell}`;
    const pps2 = slotPpsMap[slotKey2] || 3;

    if (firstTwoDaysSet[currentDay2]) {
      for (let c = 0; c < campColsCount; c++) {
        const colIdx = 3 + c;

        const names = [];
        for (let ni = 0; ni < pps2; ni++) {
          const n = String(values[rIdx + ni]?.[colIdx] || "").trim();
          if (n) names.push(n);
        }

        if (names.length === pps2) {
          const hasExp = names.some(n => (peopleByName[n] && peopleByName[n].isExperienced === true));
          if (!hasExp) {
            warnings.push({
              type: "EXPERIENCE",
              day: currentDay2,
              time: timeCell,
              block: blockCell,
              where: `Camp ${c + 1}`,
              people: names.join(" | "),
              message: "Keine erfahrene Person im Camp (gilt nur in den ersten 2 Festivaltagen)."
            });
          }
        }
      }
    }

    rIdx += pps2; // nächster Slot
  }

  // 2) Back-to-back: aus Occurrences pro Person
  const { occByPerson } = collectPlanOccurrences_();
  Object.keys(occByPerson).forEach((name) => {
    const list = (occByPerson[name] || []).slice().sort((a, b) => {
      const da = getDayIndexFromMap_(dayOrderMap, a.day);
      const db = getDayIndexFromMap_(dayOrderMap, b.day);
      if (da !== db) return da - db;
      return timeIndex_(a.time) - timeIndex_(b.time);
    });

    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const cur = list[i];
      if (isAdjacentShift_(prev.day, prev.time, cur.day, cur.time, dayOrderMap)) {
        warnings.push({
          type: "BACK_TO_BACK",
          day: `${prev.day} → ${cur.day}`,
          time: `${prev.time} → ${cur.time}`,
          block: "",
          where: name,
          people: name,
          message: "Direkt angrenzende Schichten."
        });
      }
    }
  });

  // Warnings Sheet schreiben/refresh
  writeWarningsSheet_(ss, festivalId, warnings);

  return { people: rowsOut.length };
}




/* =========================
 * DASHBOARD UPDATE BY APP ID
 * ========================= */
/**
 * Aktualisiert eine Dashboard-Zeile anhand der application_id.
 * @param {string} festivalId
 * @param {string} applicationId
 * @param {Object} updatesObj  Felder die geschrieben werden sollen
 * @param {Object} [_dashCache]  Optional: { headers: string[], rowByAppId: Map<string,number>, sheet: Sheet }
 *                               Wenn übergeben, werden keine Sheet-Reads für Header/ID-Spalte gemacht.
 */
function updateDashboardRowByApplicationId_(festivalId, applicationId, updatesObj, _dashCache) {
  let sh, headers, rowByAppId;

  if (_dashCache && _dashCache.headers && _dashCache.rowByAppId && _dashCache.sheet) {
    // ⚡ Cache verwenden – kein Sheet-Read nötig
    sh = _dashCache.sheet;
    headers = _dashCache.headers;
    rowByAppId = _dashCache.rowByAppId;
  } else {
    sh = SpreadsheetApp.getActive().getSheetByName(`DASH_${festivalId}`);
    if (!sh) return;

    const lastCol = sh.getLastColumn();
    if (lastCol < 1) return;

    const headerRow = findDashHeaderRow_(sh);

    headers = sh
      .getRange(headerRow, 1, 1, lastCol)
      .getValues()[0]
      .map((h) => String(h).trim());

    const idCol = headers.indexOf("application_id") + 1;
    const lastRow = sh.getLastRow();
    if (lastRow <= headerRow) return;

    const idValues = sh.getRange(headerRow + 1, idCol, lastRow - headerRow, 1).getValues();
    rowByAppId = new Map();
    idValues.forEach(([v], i) => {
      const id = String(v || "").trim();
      if (id) rowByAppId.set(id, headerRow + 1 + i);
    });
  }

  const required = ["application_id", "status", "mail_status", "detail_status"];
  const missing = required.filter((k) => headers.indexOf(k) === -1);
  if (missing.length) {
    log_({ action: "DASH_HEADERS_MISSING", meta: { festivalId, missing }, count: 0 });
    return;
  }

  const targetRow = rowByAppId.get(String(applicationId).trim());
  if (!targetRow) return;

  const allowedDetail = new Set(DETAIL_STATUS_LIST);
  const allowedContract = new Set(CONTRACT_STATUS_LIST);
  const allowedStatus = new Set(STATUS_LIST);
  const allowedMail = new Set(MAIL_STATUS_LIST);

  Object.keys(updatesObj).forEach((key) => {
    const colIdx0 = headers.indexOf(key);
    if (colIdx0 === -1) return;

    const col = colIdx0 + 1;
    const val = updatesObj[key];

    // Header-Prüfung direkt aus gecachtem Array (kein zusätzlicher Sheet-Read)
    if (headers[colIdx0] !== key) {
      log_({ action: "DASH_COL_MISMATCH", meta: { festivalId, applicationId, key, col, headerAtCol: headers[colIdx0], attempted: val }, count: 0 });
      return;
    }

    if (key === "detail_status" && !allowedDetail.has(String(val))) return;
    if (key === "contract_status" && !allowedContract.has(String(val))) return;
    if (key === "status" && !allowedStatus.has(String(val))) return;
    if (key === "mail_status" && !allowedMail.has(String(val))) return;

    setValueSafe_(sh.getRange(targetRow, col), val, `dashUpdate key=${key} appId=${applicationId}`);
  });

  // Zeilenhintergrund bei Statuswechsel aktualisieren
  if ("status" in updatesObj) {
    const newSt = normalizeStatus_(String(updatesObj.status || "").trim());
    const rowLastCol = sh.getLastColumn();
    const rowRange = sh.getRange(targetRow, 1, 1, rowLastCol);
    if (newSt === "zurueckgezogen" || newSt === "final abgesagt") {
      rowRange.setBackground("#f4cccc").setFontColor("#990000");
    } else {
      rowRange.setBackground(null).setFontColor(null);
    }
  }
}

/* =========================
 * AGE CHECK
 * ========================= */
function isUnder18AtFestival_(birthdate, festivalDate) {
  if (!birthdate || !festivalDate) return false;

  const b = new Date(birthdate);
  if (isNaN(b.getTime())) return false;

  const f = new Date(festivalDate);
  let age = f.getFullYear() - b.getFullYear();

  const hadBirthday =
    f.getMonth() > b.getMonth() ||
    (f.getMonth() === b.getMonth() && f.getDate() >= b.getDate());

  if (!hadBirthday) age--;

  return age < 18;
}

/* =========================
 * DETAIL CONFIG
 * ========================= */
function getDetailCfgByFestivalId_(festivalId) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEETS.DETAIL_CFG);
  if (!sh) throw new Error(`Sheet fehlt: ${SHEETS.DETAIL_CFG}`);

  const data = readSheetAsObjects_(sh);

  const row = data.rows.find((r) => String(r.festival_id || "").trim() === String(festivalId).trim());
  if (!row) throw new Error(`CONFIG_DETAILABFRAGE: Kein Eintrag für festival_id=${festivalId}`);

  const detailFormUrl = String(row.detail_form_url || "").trim();
  const responsesSpreadsheetId = normalizeSpreadsheetId_(row.detail_responses_spreadsheet_id);
  const responsesSheetName = String(row.detail_responses_sheet || "").trim();

  if (!detailFormUrl) throw new Error(`detail_form_url fehlt für ${festivalId}`);
  if (!responsesSpreadsheetId) throw new Error(`detail_responses_spreadsheet_id fehlt für ${festivalId}`);
  if (!responsesSheetName) throw new Error(`detail_responses_sheet fehlt für ${festivalId}`);

  return { detailFormUrl, responsesSpreadsheetId, responsesSheetName };
}

/* =========================
 * CONDITIONAL FORMATTING: DETAIL (DEDUPED)
 * ========================= */
function applyPregnancyFlagConditionalFormatting_(sheet, dashCols, headerRow) {
  const colIndex = dashCols.indexOf("detail_pregnant");
  if (colIndex === -1) return;

  const existingRules = sheet.getConditionalFormatRules() || [];
  const lastRow = Math.max(sheet.getLastRow(), headerRow + 1);

  const range = sheet.getRange(headerRow + 1, colIndex + 1, lastRow - headerRow, 1);
  const firstCell = range.getA1Notation().split(":")[0];
  const formula = `=LOWER(TRIM(${firstCell}))="ja"`;

  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(formula)
    .setBackground("#f4cccc")
    .setFontColor("#990000")
    .setRanges([range])
    .build();

  sheet.setConditionalFormatRules(existingRules.concat([rule]));
}

function applyDetailStatusConditionalFormatting_(sheet, dashCols, headerRow) {
  const idx = dashCols.indexOf("detail_status");
  if (idx === -1) return;

  const existingRules = sheet.getConditionalFormatRules() || [];
  const lastRow = Math.max(sheet.getLastRow(), headerRow + 1);
  const range = sheet.getRange(headerRow + 1, idx + 1, lastRow - headerRow, 1);
  const firstCell = range.getA1Notation().split(":")[0];

  const mkRule = (value, bg, font) =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=LOWER(TRIM(${firstCell}))="${value}"`)
      .setBackground(bg)
      .setFontColor(font)
      .setRanges([range])
      .build();

  const newRules = [
    mkRule("detailabfrage_gesendet", "#fff2cc", "#000000"),
    mkRule("reminder_geschickt", "#fce5cd", "#000000"),
    mkRule("formular_ausgefuellt", "#274e13", "#ffffff"),
  ];

  sheet.setConditionalFormatRules(existingRules.concat(newRules));
}

function isEarlySlot_(timeStr) { return String(timeStr) === "7-10"; }
function isLateSlot_(timeStr) { return String(timeStr) === "19-22"; }

function isAdjacentTime_(timeA, timeB) {
  // adjacency only within same day
  const order = ["7-10", "10-13", "13-16", "16-19", "19-22"];
  const ia = order.indexOf(String(timeA));
  const ib = order.indexOf(String(timeB));
  return ia !== -1 && ib !== -1 && Math.abs(ia - ib) === 1;
}

function getShiftCandidatesForFestival_({ festivalId }) {
  const ss = SpreadsheetApp.getActive();
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  
  if (!appSheet) throw new Error(`Sheet fehlt: ${SHEETS.APPLICATIONS}`);

  // 1. NUR die Applications laden
  const appData = readSheetAsObjects_(appSheet);

  // 2. Filter: NUR dieses Festival + NUR Supportis + NUR zugesagte Stati
  const validApps = appData.rows.filter((r) => {
    const fidMatch = String(r.festival_id || "").trim() === String(festivalId).trim();
    const roleMatch = ["SUPPORTI", "SUPPORTI_PLUS"].includes(normalizeRole_(r.role));
    const st = normalizeStatus_(r.status);
    const statusMatch = (
      st === normalizeStatus_(STATUS.ZUGESAGT) ||
      st === normalizeStatus_(STATUS.AKKREDITIERT) ||
      st === normalizeStatus_(STATUS.TEILGENOMMEN)
    );
    return fidMatch && roleMatch && statusMatch;
  });

  Logger.log(`Gefundene valide Applications für ${festivalId}: ${validApps.length}`);

  // 3. Erst alle Vornamen sammeln um Duplikate zu erkennen
  const firstNameCounts = {};
  validApps.forEach(r => {
    const fn = String(r.detail_first_name || r.first_name || "").trim().toLowerCase();
    if (fn) firstNameCounts[fn] = (firstNameCounts[fn] || 0) + 1;
  });

  // 4. Mapping: Kandidaten aufbauen, DisplayName nur mit Nachnamenskürzel wenn Vorname doppelt
  return validApps.map((r) => {
    const bucket = parseExperienceBucket_(r.experience_count) || "0";

    const firstName = String(r.detail_first_name || r.first_name || "").trim();
    const lastName = String(r.detail_last_name || r.last_name || "").trim();

    let displayName;
    if (!firstName) {
      // Kein Vorname → Fallback auf E-Mail
      displayName = r.email || "?";
    } else if ((firstNameCounts[firstName.toLowerCase()] || 0) > 1 && lastName) {
      // Vorname kommt mehrfach vor → "Vorname N."
      displayName = `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
    } else {
      // Vorname eindeutig → nur Vorname
      displayName = firstName;
    }

    return {
      application_id: String(r.application_id || "").trim(),
      email: String(r.email || "").trim(),
      displayName: displayName,
      name: displayName,
      pref1: normalizeBlockPref_(r.detail_shift_pref_1),
      pref2: normalizeBlockPref_(r.detail_shift_pref_2),
      promoWant: String(r.detail_promo_want || "").trim(),
      experienceBucket: bucket,
      isExperienced: isVeryExperienced_(bucket),
      arrival: String(r.detail_arrival || "").trim(),
    };
  });
}

function buildUniversalSchichtplan_({ festivalId, targetSpreadsheetId }) {
  const ss = SpreadsheetApp.openById(targetSpreadsheetId);

  const planName = `SCHICHTPLAN_${festivalId}`;
  const statsName = `${SHEETS.SHIFTSTATS}_${festivalId}`;
  const warningsName = `WARNINGS_${festivalId}`;

  // ✅ Default-Sheet recyceln statt leeres Sheet übrig zu lassen
  const sh = reuseFirstEmptySheetOrCreate_(ss, planName);
  sh.clear();

  const slots = getUniversalShiftSlots_(festivalId);
  const peopleAll = getShiftCandidatesForFestival_({ festivalId });

  // Layout fürs Festival bestimmen
  const layout = getPlanLayoutFromSlots_(slots);
  const maxCamps = layout.maxCamps;
  const hasPromo = layout.hasPromo;

  // Header
  const headers = ["Tag", "Zeit", "Block"];
  for (let c = 1; c <= maxCamps; c++) headers.push(`Camp ${c}`);
  if (hasPromo) headers.push("Promo Schicht");

  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  stylePlanHeader_(sh, headers.length);
  sh.setFrozenRows(1);

  // Day-Mapping
  const uniqueDays = [...new Set((slots || []).map((s) => String(s.day || "").trim()))].filter(Boolean);
  const firstTwoDaysSet = {};
  uniqueDays.slice(0, 2).forEach((d) => (firstTwoDaysSet[d] = true));

  const dayOrderMap = buildDayOrderMapFromSlots_(slots);
  setDayOrderMap_(dayOrderMap); // optionaler Compat-Layer

  // Zielwert: wie viele Schichten soll jeder bekommen?
  const totalSlotPositions = (slots || []).reduce((sum, slot) => {
    const numCamps = Math.max(1, Number(slot.num_camps || 0) || 1);
    const pps = Math.max(1, Number(slot.people_per_shift || 3) || 3);
    const slotHasPromo = hasPromo && (
      isTrue_(slot.promo) || isTrue_(slot.promo_needed) ||
      isTrue_(slot.has_promo) || isTrue_(slot.promo_active) || isTrue_(slot.promo_enabled)
    );
    return sum + numCamps * pps + (slotHasPromo ? pps : 0);
  }, 0);
  const shiftTarget = Math.max(1, Math.floor(totalSlotPositions / Math.max(1, peopleAll.length)));
  Logger.log(`Schicht-Zielwert: ${shiftTarget} (${totalSlotPositions} Positionen / ${peopleAll.length} Personen)`);

  // Block-Zuordnung
  const { blockPeople, blockChosenById } = assignPeopleToBlocks_({ people: peopleAll, slots });

  // ✅ State sauber initialisieren
  const state = {};
  (peopleAll || []).forEach((p) => {
    const id = String(p.application_id || "").trim();
    if (!id) return;
    state[id] = {
      totalAll: 0, // Camp + Promo
      totalCamp: 0, // nur Camp
      perDayAll: {}, // Camp + Promo pro Tag
      perDayCamp: {}, // nur Camp pro Tag
      assignedAll: [], // {day,time,type}
      assigned: [], // legacy camp-only
      block: blockChosenById[id] || "",
      promo: 0,
    };
  });

  const globalPairCounts = {};
  const globalTrioCounts = {};

  // ── Pass 1: ALLE Camps zuweisen ──────────────────────────────────────────
  // Promo ERST danach (Pass 2), damit Adjacency-Check die echten Camp-Schichten sieht.
  // Beispiel: Promo Do 16-19 würde sonst Block-B-Leute aus Do 19-22 (Camp) sperren.
  const allCampRosters = {};
  const allCampGroups  = {};

  (slots || []).forEach((slot, slotIdx) => {
    const numCamps = Math.max(1, Number(slot.num_camps || 0) || 1);
    const pps = Math.max(1, Number(slot.people_per_shift || 3) || 3);
    const roster = pickRosterUniversal_({
      blockLetter: String(slot.block || "").toUpperCase(),
      blockPeople,
      state,
      slot,
      needed: numCamps * pps,
      dayOrderMap,
      shiftTarget,
      peopleAll,
    });
    allCampRosters[slotIdx] = roster;
    allCampGroups[slotIdx]  = buildBestCampGroupsForSlot_({
      roster,
      state,
      globalPairCounts,
      globalTrioCounts,
      firstTwoDaysSet,
      slot,
    });
  });

  // ── Pass 2: ALLE Promos zuweisen (Camps sind jetzt im State) ─────────────
  const allPromoRosters = {};
  (slots || []).forEach((slot, slotIdx) => {
    const slotWantsPromo =
      hasPromo &&
      (isTrue_(slot.promo) || isTrue_(slot.promo_needed) ||
       isTrue_(slot.has_promo) || isTrue_(slot.promo_active) || isTrue_(slot.promo_enabled));

    if (!slotWantsPromo) { allPromoRosters[slotIdx] = []; return; }

    const usedIds = (allCampRosters[slotIdx] || []).map(p => String(p.application_id));
    allPromoRosters[slotIdx] = pickPromoRosterForSlot_({
      peopleAll,
      state,
      slot,
      dayOrderMap,
      excludeIds: usedIds,
      shiftTarget,
    });
  });

  // ── Pass 3: Output zusammenbauen ─────────────────────────────────────────
  const out = [];
  const slotStartRows = [];
  const dayHeaderRows = [];
  let currentDay = null;

  (slots || []).forEach((slot, slotIdx) => {
    const day   = String(slot.day   || "").trim();
    const time  = String(slot.time  || "").trim();
    const block = String(slot.block || "").trim();
    const numCamps = Math.max(1, Number(slot.num_camps || 0) || 1);
    const pps = Math.max(1, Number(slot.people_per_shift || 3) || 3);

    // Day header row einfügen
    if (day && day !== currentDay) {
      currentDay = day;
      const dayRow = new Array(headers.length).fill("");
      dayRow[0] = day;
      out.push(dayRow);
      dayHeaderRows.push(1 + out.length);
    }

    // Slot Start Row merken
    slotStartRows[slotIdx] = 1 + out.length + 1;

    const groups     = allCampGroups[slotIdx]  || {};
    const promoRoster = allPromoRosters[slotIdx] || [];

    // pps Reihen pro Slot schreiben
    for (let i = 0; i < pps; i++) {
      const row = [i === 0 ? day : "", i === 0 ? time : "", i === 0 ? block : ""];
      for (let c = 1; c <= maxCamps; c++) {
        if (c <= numCamps) {
          row.push(groups[`camp${c}`]?.[i]?.displayName || "");
        } else {
          row.push("");
        }
      }
      if (hasPromo) row.push(promoRoster[i]?.displayName || "");
      out.push(row);
    }
  });

  // Output schreiben
  if (out.length) {
    sh.getRange(2, 1, out.length, headers.length).setValues(out);
  }

  // Day Header formatieren
  formatDayHeaderRows_(sh, dayHeaderRows, headers.length);

  // Slot Formatting
  applyUniversalFormatting_(sh, slots, {
    maxCamps,
    hasPromo,
    headerLen: headers.length,
    slotStartRows,
  });

  // Stats aus Plan neu berechnen (schreibt auch Warnings)
  rebuildShiftStatsFromPlan_({ festivalId, targetSpreadsheetId: ss.getId() });

  // ✅ Reihenfolge + Cleanup (kein leeres Sheet mehr)
  enforceSheetOrder_(ss, [planName, statsName, warningsName]);
  deleteEmptySheetsExcept_(ss, [planName, statsName, warningsName]);

  return { slots: (slots || []).length, filledPositions: out.length };
}






/**
 * Verteilt People auf Blocks A/B/C:
 * - chosen = pref1, sonst pref2, sonst "kleinster Block"
 * - pro Block werden activePerBlock als "active roster" gesetzt,
 *   Rest wird "reserve" (nicht eingeplant)
 */
/**
 * Stabilere Block-Zuordnung A/B/C:
 * - Ziel: Leute möglichst "fest" in einem Block halten
 * - Wenn ein Block (z.B. C) zu wenig Leute hat, werden bewusst ein paar Personen "umgezogen"
 *   (lieber Präferenz opfern, dafür Stabilität & weniger Gemischt).
 *
 * Targets werden proportional zur Anzahl Slots pro Block berechnet (falls slots übergeben werden),
 * sonst ungefähr gleich verteilt.
 */
function assignPeopleToBlocks_({ people, slots }) {
  // Ermittle dynamisch alle Blöcke, die in der Config vorkommen (z.B. A, B, C, D, E)
  const BLOCKS = [...new Set(slots.map(s => String(s.block).toUpperCase()))].sort();

  function normBlock_(x) {
    const s = String(x || "").trim().toUpperCase();
    const m = s.match(/([A-Z])\s*$/); // Erkennt jetzt jeden Buchstaben
    return m ? m[1] : "";
  }

  // Gewichtung nach Camp-Positionen (numCamps × 3), nicht nur Slot-Anzahl
  // → Block B mit mehr Camps pro Slot bekommt proportional mehr Leute zugewiesen
  const slotCounts = {};
  BLOCKS.forEach(b => slotCounts[b] = 0);
  (slots || []).forEach((s) => {
    const b = String(s.block).toUpperCase();
    if (slotCounts[b] !== undefined) {
      slotCounts[b] += Math.max(1, Number(s.num_camps || 1));
    }
  });

  const totalPeople = (people || []).length;
  const weights = {};
  BLOCKS.forEach(b => weights[b] = slotCounts[b] || 1);
  
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const targets = {};
  BLOCKS.forEach(b => targets[b] = Math.round(totalPeople * (weights[b] / totalWeight)));

  const sorted = (people || []).slice().sort((a, b) =>
    String(a.application_id).localeCompare(String(b.application_id))
  );

  const blockPeople = {};
  BLOCKS.forEach(b => blockPeople[b] = []);
  const blockChosenById = {};

  const neediest_ = () => BLOCKS.slice().sort((x, y) =>
    (targets[y] - blockPeople[y].length) - (targets[x] - blockPeople[x].length)
  )[0];

  sorted.forEach((p) => {
    const b1 = normBlock_(p.pref1);
    const b2 = normBlock_(p.pref2);
    let target = "";

    const b1Need = BLOCKS.includes(b1) ? targets[b1] - blockPeople[b1].length : -Infinity;
    const b2Need = BLOCKS.includes(b2) ? targets[b2] - blockPeople[b2].length : -Infinity;

    if (BLOCKS.includes(b1) && b1Need > 0) {
      // pref1 hat noch Bedarf → 1. Wahl
      target = b1;
    } else if (BLOCKS.includes(b2) && b2Need > 0) {
      // pref1 voll, aber pref2 hat noch Bedarf → 2. Wahl
      target = b2;
    } else {
      // beide Präferenzen voll (oder keine angegeben) → Block mit dem größten Bedarf
      target = neediest_();
    }

    blockPeople[target].push(p);
    blockChosenById[p.application_id] = target;
  });

  return { blockPeople, blockChosenById };
}




function parsePromoWant_(raw) {
  const s = String(raw || "").trim().toLowerCase();

  // exakt eure Optionen + robuste Varianten
  if (s.includes("bock")) return "Ja";                 // "Bock drauf!"
  if (s.includes("da bin ich raus")) return "Nein";    // exakt
  if (s.includes("raus")) return "Nein";               // fallback

  // fallback: nutze generischen yes/no parser
  const yn = parseYesNoLoose_(raw);
  if (yn) return yn;

  return "";
}

function writeSchichtplanLinkToDashboard_({ festivalId, url }) {
  const sh = SpreadsheetApp.getActive().getSheetByName(`DASH_${festivalId}`);
  if (!sh) return;
  if (url) {
    sh.getRange("F1").setRichTextValue(
      SpreadsheetApp.newRichTextValue().setText("📅 Schichtplan").setLinkUrl(url).build()
    ).setFontWeight("bold");
    sh.getRange("F2").setValue(`Erstellt: ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm")}`)
      .setFontColor("#999999").setFontSize(9);
  } else {
    // Reset: Link und Datum leeren
    sh.getRange("F1").clearContent().setFontWeight("normal");
    sh.getRange("F2").clearContent();
  }
}

function writeCrewListLinkToDashboard_({ festivalId, url }) {
  const sh = SpreadsheetApp.getActive().getSheetByName(`DASH_${festivalId}`);
  if (!sh) return;
  sh.getRange("E1").setRichTextValue(
    SpreadsheetApp.newRichTextValue().setText("👥 Crew-Liste").setLinkUrl(url).build()
  ).setFontWeight("bold");
  sh.getRange("E2").setValue(`Erstellt: ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm")}`)
    .setFontColor("#999999").setFontSize(9);
}

function writeLeadRiderLinkToDashboard_({ festivalId, url }) {
  const sh = SpreadsheetApp.getActive().getSheetByName(`DASH_${festivalId}`);
  if (!sh) return;
  sh.getRange("G1").setRichTextValue(
    SpreadsheetApp.newRichTextValue().setText("📄 Lead Rider").setLinkUrl(url).build()
  ).setFontWeight("bold");
  sh.getRange("G2").setValue(`Erstellt: ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm")}`)
    .setFontColor("#999999").setFontSize(9);
}

function writeKitchenCrewListLinkToDashboard_({ festivalId, url }) {
  const sh = SpreadsheetApp.getActive().getSheetByName(`DASH_${festivalId}`);
  if (!sh) return;
  sh.getRange("H1").setRichTextValue(
    SpreadsheetApp.newRichTextValue().setText("🍳 Küchen-Liste").setLinkUrl(url).build()
  ).setFontWeight("bold");
  sh.getRange("H2").setValue(`Erstellt: ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm")}`)
    .setFontColor("#999999").setFontSize(9);
}

function buildBestCampGroupsForSlot_({ roster, state, globalPairCounts, globalTrioCounts, firstTwoDaysSet, slot }) {
  const people = (roster || []).filter(Boolean).slice(); // clone
  const day = String(slot?.day || "").trim();
  const isFirstTwoDaysSlot = firstTwoDaysSet && firstTwoDaysSet[day] === true;

  // Helpers
  function id_(p) {
    return String(p?.application_id || p?.id || p?.email || p?.displayName || "").trim();
  }
  function stableKey_(p) {
    // deterministic tie-breaker
    return id_(p) || String(p?.displayName || "");
  }
  function isExp_(p) {
    return p && p.isExperienced === true;
  }
  function trioKey_(a, b, c) {
    const ids = [id_(a), id_(b), id_(c)].map(String).sort();
    return ids.join("|");
  }
  function pairKey_(a, b) {
    const ids = [id_(a), id_(b)].map(String).sort();
    return ids.join("|");
  }
  function getPairPenalty_(a, b) {
    const k = pairKey_(a, b);
    return Number(globalPairCounts?.[k] || 0);
  }
  function getTrioPenalty_(a, b, c) {
    const k = trioKey_(a, b, c);
    return Number(globalTrioCounts?.[k] || 0);
  }
  function hasExperienced_(trio) {
    return (trio || []).some(isExp_);
  }
  function trioPenaltyTotal_(trio) {
    if (trio.length < 3) return 999999;
    const [a, b, c] = trio;
    return (
      getTrioPenalty_(a, b, c) * 5 +
      getPairPenalty_(a, b) +
      getPairPenalty_(a, c) +
      getPairPenalty_(b, c)
    );
  }
  function markCounts_(trio) {
    if (trio.length < 3) return;
    const [a, b, c] = trio;
    const pk1 = pairKey_(a, b), pk2 = pairKey_(a, c), pk3 = pairKey_(b, c);
    globalPairCounts[pk1] = (globalPairCounts[pk1] || 0) + 1;
    globalPairCounts[pk2] = (globalPairCounts[pk2] || 0) + 1;
    globalPairCounts[pk3] = (globalPairCounts[pk3] || 0) + 1;

    const tk = trioKey_(a, b, c);
    globalTrioCounts[tk] = (globalTrioCounts[tk] || 0) + 1;
  }

  // Camps dynamisch aus slot.num_camps (nicht immer 4)
  const numCamps = Math.max(1, Number(slot?.num_camps || 1) || 1);
  const pps = Math.max(1, Number(slot?.people_per_shift || 3) || 3);
  const campKeys = [];
  for (let c = 1; c <= numCamps; c++) campKeys.push(`camp${c}`);

  const out = {};
  campKeys.forEach(k => out[k] = []);

  // Wenn weniger als pps*numCamps verfügbar: stumpf auffüllen, aber stabil
  if (people.length < numCamps * pps) {
    people.sort((a, b) => stableKey_(a).localeCompare(stableKey_(b)));
    let idx = 0;
    for (let c = 0; c < campKeys.length; c++) {
      for (let k = 0; k < pps; k++) {
        if (idx < people.length) out[campKeys[c]].push(people[idx++]);
      }
    }
    return out;
  }

  // --- Phase 1: (nur wenn firstTwoDays) "mind. 1 erfahrene Person pro Trio", soweit möglich
  // Strategie: pro Camp zuerst 1 erfahrene Person setzen, wenn genug erfahrene existieren
  // Danach Rest mit Penalty-Minimierung füllen.
  let remaining = people.slice().sort((a, b) => stableKey_(a).localeCompare(stableKey_(b)));

  if (isFirstTwoDaysSlot) {
    const exp = remaining.filter(isExp_);
    const non = remaining.filter(p => !isExp_(p));

    // Wenn wir >= numCamps erfahrene haben, verteilen wir je 1 erfahrene pro Camp
    if (exp.length >= numCamps) {
      // leichte Penalty-Sortierung: nimm zuerst erfahrene, die wenig "historische Wiederholungen" verursachen
      exp.sort((a, b) => stableKey_(a).localeCompare(stableKey_(b)));
      for (let c = 0; c < numCamps; c++) {
        out[campKeys[c]].push(exp[c]);
      }
      // remove used exp from remaining
      const used = new Set(exp.slice(0, numCamps).map(id_));
      remaining = remaining.filter(p => !used.has(id_(p)));
    } else {
      // zu wenig erfahrene: nichts hart verteilen, wir versuchen später beim Trio-Build bestmöglich
    }
  }

  // --- Phase 2: Trios bauen Camp für Camp mit minimaler Penalty
  // Greedy: pro Camp die beste Ergänzung für vorhandene (0 oder 1 Person) wählen
  function pickBestForCamp_(campArr, pool) {
    // campArr hat 0..pps-1 Personen, wir müssen bis pps auffüllen
    while (campArr.length < pps) {
      let bestIdx = -1;
      let bestScore = Infinity;

      for (let i = 0; i < pool.length; i++) {
        const cand = pool[i];
        const trial = campArr.concat([cand]);

        // Score: Wiederholungen minimieren
        let score = 0;

        if (trial.length === 2) {
          score = getPairPenalty_(trial[0], trial[1]);
        } else if (trial.length === pps) {
          score = trioPenaltyTotal_(trial);

          // Experience-Priorität in den ersten 2 Tagen: wenn Camp voll und ohne erfahrene, fetter Malus
          if (isFirstTwoDaysSlot && !hasExperienced_(trial)) score += 1000;
        } else {
          // should not happen
          score = 0;
        }

        // leichter Tie-breaker: stabil
        score += (stableKey_(cand).charCodeAt(0) || 0) / 100000;

        if (score < bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      if (bestIdx === -1) break;
      campArr.push(pool[bestIdx]);
      pool.splice(bestIdx, 1);
    }
  }

  // build camps sequentially
  for (let c = 0; c < numCamps; c++) {
    pickBestForCamp_(out[campKeys[c]], remaining);
  }

  // --- Phase 3: counts updaten für die finalen Camps
  campKeys.forEach(k => {
    if (out[k].length === pps) markCounts_(out[k]);
  });

  return out;
}



/**
 * Löscht die Verknüpfung zur aktuellen Schichtplan-Datei und leert den Cache.
 * Beim nächsten Klick auf "Schichtplan erstellen" wird eine komplett neue Datei generiert.
 */
function uiResetUniversalSchichtplanLink() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;

  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    "Schichtplan-Link zurücksetzen",
    `Möchtest du die Verknüpfung für ${festivalId} wirklich löschen? \n\nDie bisherige Datei bleibt im Drive erhalten, aber Crew Tools wird beim nächsten Mal eine komplett NEUE Datei erstellen.`,
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  const props = PropertiesService.getScriptProperties();
  const key   = getSchichtplanPropKey_(festivalId);
  props.deleteProperty(key);

  writeSchichtplanLinkToFestConfig_(festivalId, "");
  writeSchichtplanLinkToDashboard_({ festivalId, url: "" });

  CacheService.getScriptCache().removeAll(["candidates_" + festivalId]);
  SpreadsheetApp.flush();

  toast_(`Link und Cache für ${festivalId} gelöscht. Bereit für einen frischen Build!`);
}

/**
 * Setzt Freigabe: Goldeimer-Domain = Bearbeiter, alle anderen = Betrachter
 */
function setGoldeimerrSharing_(fileId) {
  // Bestehende Permissions laden, um update vs. create zu entscheiden
  let existingPerms = [];
  try {
    const list = Drive.Permissions.list(fileId, {
      fields: "permissions(id,type,domain,role)",
      supportsAllDrives: true
    });
    existingPerms = list.permissions || [];
  } catch (e) { Logger.log("Permissions-Liste fehlgeschlagen: " + e.message); }

  const findPerm = (type, domain) =>
    existingPerms.find(p => p.type === type && (!domain || p.domain === domain));

  // 1. Extern (alle mit Link) → Betrachter
  try {
    const anyonePerm = findPerm("anyone");
    if (anyonePerm) {
      Drive.Permissions.update({ role: "reader" }, fileId, anyonePerm.id, { supportsAllDrives: true });
      Logger.log("ANYONE VIEW aktualisiert");
    } else {
      Drive.Permissions.create({ role: "reader", type: "anyone" }, fileId, { supportsAllDrives: true });
      Logger.log("ANYONE VIEW erstellt");
    }
  } catch (e) { Logger.log("ANYONE VIEW: " + e.message); }

  // 2. Goldeimer-Domain → Bearbeiter
  try {
    const domainPerm = findPerm("domain", "goldeimer.de");
    if (domainPerm) {
      Drive.Permissions.update({ role: "writer" }, fileId, domainPerm.id, { supportsAllDrives: true });
      Logger.log("Domain EDIT aktualisiert");
    } else {
      Drive.Permissions.create(
        { role: "writer", type: "domain", domain: "goldeimer.de", allowFileDiscovery: false },
        fileId,
        { supportsAllDrives: true }
      );
      Logger.log("Domain EDIT erstellt");
    }
  } catch (e) { Logger.log("Domain EDIT: " + e.message); }
}

function writeSchichtplanLinkToFestConfig_(festivalId, url) {
  const ss        = SpreadsheetApp.getActive();
  const festSheet = ss.getSheetByName(SHEETS.FESTIVALS);
  const festData  = readSheetAsObjects_(festSheet);
  const festRow   = festData.rows.find(r =>
    String(r.festival_id || "").trim() === String(festivalId).trim()
  );
  if (!festRow) return;
  updateCell_(festSheet, festData.headerMap, festRow.__rowNumber, "shift_table_link", url);
}

// =====================================================
// EXPERIENCE: Parser + Lookup
// =====================================================

function parseExperienceBucket_(value) {
  if (value === null || value === undefined) return "0";

  let s = String(value).trim();

  // normalisiere alle möglichen "Bindestrich"-Zeichen zu "-"
  s = s.replace(/[–—−-]/g, "-");       // en dash, em dash, minus, non-breaking hyphen
  s = s.replace(/\s+/g, "");           // alle Spaces raus (z.B. "1 - 2")

  if (s === "" || s === "-" ) return "0";

  // akzeptiere mehrere Schreibweisen
  if (s === "0" || /^keine$/i.test(s)) return "0";
  if (s === "1-2" || s === "1–2") return "1-2";
  if (s === "3-5" || s === "3–5") return "3-5";

  // >5 Varianten
  if (s === ">5" || s === "5+" || /^> ?5$/.test(s) || /^mehrals5$/i.test(s)) return ">5";

  // Notfalls: wenn jemand "1" oder "2" eingibt → 1-2; 3/4/5 → 3-5; >=6 → >5
  const n = Number(s);
  if (!Number.isNaN(n)) {
    if (n <= 0) return "0";
    if (n <= 2) return "1-2";
    if (n <= 5) return "3-5";
    return ">5";
  }

  // Wenn irgendwas Unerwartetes kommt: lieber sichtbar machen statt still zu 0
  // -> ich gebe hier bewusst "0" zurück, aber du kannst auch "UNBEKANNT" nehmen.
  return "0";
}



function isVeryExperienced_(bucket) {
  return bucket === "3-5" || bucket === ">5";
}


function getApplicationsExperienceMap_(ss) {
  const sh = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!sh) throw new Error(`Sheet nicht gefunden: ${SHEETS.APPLICATIONS}`);

  const values = sh.getDataRange().getValues();
  if (values.length < 2) return new Map();

  const headers = values[0].map(h => String(h || "").trim());
  const idxId = headers.indexOf("application_id");
  const idxExp = headers.indexOf("experience_count"); // <- muss so heißen wie bei dir
  // Alternativ, falls es in deinen Daten anders heißt:
  // const idxExp = headers.indexOf("detail_experience_count");

  if (idxId === -1) throw new Error("APPLICATIONS: Spalte 'application_id' fehlt.");
  if (idxExp === -1) throw new Error("APPLICATIONS: Spalte 'experience_count' fehlt.");

  const map = new Map();
  for (let r = 1; r < values.length; r++) {
    const id = String(values[r][idxId] || "").trim();
    if (!id) continue;
    const bucket = parseExperienceBucket_(values[r][idxExp]);
    if (bucket) map.set(id, bucket);
  }
  return map;
}

// ============================
// DPMS CONFIG (ScriptProperties!)
// ============================
const props = PropertiesService.getScriptProperties();

const DPMS = {
  BASE: "https://app.dpms-online.de/api/v1",
  TOKEN: props.getProperty("DPMS_TOKEN"),
  COMPANY_ID: props.getProperty("DPMS_COMPANY_ID") || "7147", 
  TEMPLATE_ID: props.getProperty("DPMS_TEMPLATE_ID") || "12175",
};

// ---- helper: DPMS request ----
function dpmsRequest_(method, path, { query, payload } = {}) {
  const token = PropertiesService.getScriptProperties().getProperty("DPMS_TOKEN");
  if (!token) throw new Error("DPMS_TOKEN fehlt in ScriptProperties.");

  let url = DPMS.BASE + path;
  if (query) {
    const qs = Object.keys(query)
      .filter(k => query[k] !== undefined && query[k] !== null && String(query[k]) !== "")
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(String(query[k]))}`)
      .join("&");
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  const params = {
    method,
    muteHttpExceptions: true,
    contentType: "application/json",
    headers: { Authorization: "Bearer " + token },
  };
  if (payload) params.payload = JSON.stringify(payload);

  const resp = UrlFetchApp.fetch(url, params);
  const code = resp.getResponseCode();
  const text = resp.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error(`DPMS ${method} ${path} failed (${code}): ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

// ============================
// DPMS: find or create "client" per person
// ============================
function dpmsFindClientByEmail_(email) {
  // DPMS: get list of clients for the company: GET /client?companyId=...
  const list = dpmsRequest_("get", "/client", { query: { companyId: DPMS.COMPANY_ID } });
  const norm = String(email || "").trim().toLowerCase();
  const hit = (list || []).find(c => String(c.email || "").trim().toLowerCase() === norm);
  return hit || null;
}

function dpmsCreateClient_(person) {
  // DPMS: POST /client?companyId=...  (body has name, email, etc.)
  const payload = {
    name: `${person.first_name || ""} ${person.last_name || ""}`.trim() || person.email,
    email: person.email,
    country: "DE",
  };
  return dpmsRequest_("post", "/client", { query: { companyId: DPMS.COMPANY_ID }, payload });
}

function dpmsFindOrCreateClient_(person) {
  const existing = dpmsFindClientByEmail_(person.email);
  if (existing && existing.clientId) return existing;
  const created = dpmsCreateClient_(person);
  return created;
}

// ============================
// DPMS: create contract for client
// ============================
function dpmsCreateContractForClient_(clientId, title) {
  const validUntilDate = "2026-12-31T23:59:59Z"; 

  const payload = {
    templateId: Number(DPMS.TEMPLATE_ID),
    title: title || "Ehrenamtsvertrag Goldeimer 2026",
    validUntil: validUntilDate,
    isOrderProcessingContract: false,
  };

  const response = dpmsRequest_("post", `/client/${clientId}/contract`, {
    query: { companyId: DPMS.COMPANY_ID },
    payload,
  });

  // LOGIK-FIX: DPMS gibt das Client-Objekt zurück, der neue Vertrag ist der LETZTE im Array 'contracts'
  if (response && response.contracts && response.contracts.length > 0) {
    // Wir nehmen den letzten Eintrag aus dem Array (der gerade neu erstellte)
    const newContract = response.contracts[response.contracts.length - 1];
    const finalId = newContract.contractId;

    Logger.log("Neuer Vertrag gefunden! ID: " + finalId);

    return {
      contractId: finalId,
      shareLink: `https://app.dpms-online.de/contract/${finalId}/sign`
    };
  } else {
    throw new Error("DPMS hat den Vertrag anscheinend nicht angelegt. Response: " + JSON.stringify(response));
  }
}

function dpmsGetContract_(contractId) {
  // DPMS: GET /contract/{contractId}?companyId=...
  return dpmsRequest_("get", `/contract/${contractId}`, { query: { companyId: DPMS.COMPANY_ID } });
}

// ============================
// CREW_MASTER integration
// ============================
function ensureCrewMasterCols_(sh, cols) {
  const data = readSheetAsObjects_(sh);
  const headers = data.headers;
  let changed = false;

  cols.forEach((c) => {
    if (!headers.includes(c)) {
      sh.getRange(1, headers.length + 1).setValue(c);
      headers.push(c);
      changed = true;
    }
  });

  if (changed) return readSheetAsObjects_(sh);
  return data;
}


function zzz_clearAllCachesAndCandidateProps() {
  CacheService.getScriptCache().removeAll([]);
  CacheService.getUserCache().removeAll([]);
  CacheService.getDocumentCache().removeAll([]);

  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  let removed = 0;

  Object.keys(all).forEach(k => {
    if (k.toLowerCase().includes("candidate") || k.toLowerCase().includes("candidates")) {
      props.deleteProperty(k);
      removed++;
    }
  });

  Logger.log("Removed candidate-related props: " + removed);
  Logger.log("Done.");
}


function getUniversalShiftSlots_(festivalId) {
  const sh = SpreadsheetApp.getActive().getSheetByName("CONFIG_SHIFT_SLOTS");
  if (!sh) throw new Error("Sheet 'CONFIG_SHIFT_SLOTS' fehlt!");
  const data = readSheetAsObjects_(sh);
  const slots = data.rows.filter(r => String(r.festival_id).trim().toUpperCase() === String(festivalId).trim().toUpperCase());
  if (slots.length === 0) throw new Error(`Keine Slots für ${festivalId} in CONFIG_SHIFT_SLOTS gefunden!`);
  return slots;
}

function pickRosterUniversal_({ blockLetter, blockPeople, state, slot, needed, dayOrderMap, shiftTarget, peopleAll }) {
  const pool = (blockPeople[blockLetter] || []).slice();
  if (!pool.length) return [];

  const day = String(slot.day || "").trim();
  const time = String(slot.time || "").trim();

  function globalMinTotal_(stateObj) {
    let min = Infinity;
    Object.keys(stateObj).forEach(id => {
      const t = Number(stateObj[id]?.totalAll || 0);
      if (t < min) min = t;
    });
    return min === Infinity ? 0 : min;
  }

  function hasAdjacent_(personState) {
    const list = personState?.assignedAll || [];
    return list.some(a => isAdjacentShift_(a.day, a.time, day, time, dayOrderMap));
  }

  function canTakeCamp_(p) {
    const st = state[p.application_id];
    if (!st) return false;

    // Max 2 Schichten pro Tag insgesamt (Camp+Promo)
    if ((st.perDayAll[day] || 0) >= 2) return false;

    // Wenn HEUTE schon Promo: max 1 Camp heute (nicht die Gesamtzahl prüfen)
    const promoToday = (st.perDayAll[day] || 0) - (st.perDayCamp[day] || 0);
    if (promoToday >= 1 && (st.perDayCamp[day] || 0) >= 1) return false;

    // Max 2 Camp/Tag (optional zusätzlich – wenn du Camp strikt auch begrenzen willst)
    if ((st.perDayCamp[day] || 0) >= 2) return false;

    // keine angrenzenden Schichten (gegen alles)
    if (hasAdjacent_(st)) return false;

    return true;
  }

  // Kandidaten, die grundsätzlich dürfen
  const available = pool.filter(canTakeCamp_);
  if (!available.length) return [];

  // Zielwert-basierte Fairness: vorab berechnetes Schicht-Ziel verwenden
  const target = shiftTarget || 5;
  const picked = [];
  const remaining = available.slice();

  function sortKey(a, b) {
    const sa = state[a.application_id] || {};
    const sb = state[b.application_id] || {};

    const ta = Number(sa.totalAll || 0);
    const tb = Number(sb.totalAll || 0);
    if (ta !== tb) return ta - tb;

    // zweitens: heute weniger belegt (gesamt)
    const da = Number(sa.perDayAll?.[day] || 0);
    const db = Number(sb.perDayAll?.[day] || 0);
    if (da !== db) return da - db;

    // stabil
    return String(a.application_id).localeCompare(String(b.application_id));
  }

  // Pass 1: Leute, die noch unter dem Ziel sind → bekommen als erste eine Schicht
  remaining.sort(sortKey);
  for (let i = 0; i < remaining.length && picked.length < needed; i++) {
    const p = remaining[i];
    const st = state[p.application_id];
    if ((st.totalAll || 0) < target) picked.push(p);
  }
  picked.forEach(p => {
    const idx = remaining.findIndex(x => x.application_id === p.application_id);
    if (idx !== -1) remaining.splice(idx, 1);
  });

  // Pass 2: Leute genau am Ziel (Fallback) – strenge Obergrenze = target
  // OPTION A: Kein cap++ → niemand geht über target hinaus.
  // Folge: Block B (~7 Leute) kann strukturell ~1-2 Slots nicht voll besetzen (2 statt 3 Personen).
  // Rückgängig machen: cap++ und "if (cap > target + 1) break;" wieder einfügen (siehe git/history).
  while (picked.length < needed && remaining.length) {
    remaining.sort(sortKey);
    let addedAny = false;
    for (let i = 0; i < remaining.length && picked.length < needed; i++) {
      const p = remaining[i];
      const st = state[p.application_id];
      if ((st.totalAll || 0) <= target) {
        picked.push(p);
        remaining.splice(i, 1);
        i--;
        addedAny = true;
      }
    }
    if (!addedAny) break; // niemand mehr unter/gleich target → Slot bleibt ggf. halb leer
  }

  // State updaten (Camp ist vollwertige Schicht)
  picked.forEach(p => {
    const st = state[p.application_id];
    st.totalAll = (st.totalAll || 0) + 1;
    st.totalCamp = (st.totalCamp || 0) + 1;

    st.perDayAll[day] = (st.perDayAll[day] || 0) + 1;
    st.perDayCamp[day] = (st.perDayCamp[day] || 0) + 1;

    st.assignedAll.push({ day, time, type: "camp" });
    st.assigned.push({ day, time }); // legacy
  });

  return picked;
}

function pickPromoRosterForSlot_({ peopleAll, state, slot, dayOrderMap, excludeIds, shiftTarget }) {
  const day = String(slot.day || "").trim();
  const time = String(slot.time || "").trim();

  const wantsPromo =
    isTrue_(slot.promo) || isTrue_(slot.promo_needed) || isTrue_(slot.has_promo) ||
    isTrue_(slot.promo_active) || isTrue_(slot.promo_enabled);

  if (!wantsPromo) return [];

  const exclude = new Set((excludeIds || []).map(String));

  function globalMinTotal_(stateObj) {
    let min = Infinity;
    Object.keys(stateObj).forEach(id => {
      const t = Number(stateObj[id]?.totalAll || 0);
      if (t < min) min = t;
    });
    return min === Infinity ? 0 : min;
  }

  function hasAdjacent_(personState) {
    const list = personState?.assignedAll || [];
    return list.some(a => isAdjacentShift_(a.day, a.time, day, time, dayOrderMap));
  }

  function isPromoYes_(p) {
    return String(p.promoWant || "").trim().toLowerCase() === "ja";
  }

  function canTakePromo_(p) {
    if (!p || !p.application_id) return false;
    if (exclude.has(String(p.application_id))) return false;

    const st = state[p.application_id];
    if (!st) return false;

    // Promo zählt als vollwertige Schicht → Max 2 pro Tag total
    if ((st.perDayAll[day] || 0) >= 2) return false;

    // Wenn die Person heute schon 2 Camp hat → kein Promo
    if ((st.perDayCamp[day] || 0) >= 2) return false;

    // Tageslimit reicht als Schutz – keine pauschale Sperre wegen früherer Promo-Schichten
    // (Verteilung regelt die Sortierung nach promo-Count, nicht diese Bedingung)

    if (hasAdjacent_(st)) return false;

    return true;
  }

  // Pool = alle promo-yes Supportis (peopleAll ist eh Supporti-only bei dir)
  const pool = (peopleAll || []).filter(p => isPromoYes_(p)).filter(canTakePromo_);
  if (!pool.length) return [];

  const target = shiftTarget || 5;

  function sortKey(a, b) {
    const sa = state[a.application_id] || {};
    const sb = state[b.application_id] || {};
    // 1. Promo-Count: wer noch keine Promo hatte, zuerst → breite Verteilung
    const pa = Number(sa.promo || 0);
    const pb = Number(sb.promo || 0);
    if (pa !== pb) return pa - pb;
    // 2. Gesamtschichten (Klo + Promo)
    const ta = Number(sa.totalAll || 0);
    const tb = Number(sb.totalAll || 0);
    if (ta !== tb) return ta - tb;
    // 3. Heute möglichst wenig (gesamt)
    const da = Number(sa.perDayAll?.[day] || 0);
    const db = Number(sb.perDayAll?.[day] || 0);
    if (da !== db) return da - db;

    return String(a.application_id).localeCompare(String(b.application_id));
  }

  const picked = [];
  const remaining = pool.slice().sort(sortKey);
  const pps = Math.max(1, Number(slot?.people_per_shift || 3) || 3);

  // Pass 1: Leute unter dem Ziel
  for (let i = 0; i < remaining.length && picked.length < pps; i++) {
    const p = remaining[i];
    const st = state[p.application_id];
    if ((st.totalAll || 0) < target) picked.push(p);
  }

  // Pass 2: Option A – strikt gleiche Obergrenze wie Camp-Picker
  // Nur Leute UNTER target (nicht AM Ziel) → niemand wird durch Promo über target gedrückt
  // Konsequenz: Promo-Slot bleibt ggf. mit weniger als pps Leuten besetzt
  for (let i = 0; i < remaining.length && picked.length < pps; i++) {
    const p = remaining[i];
    if (picked.some(x => x.application_id === p.application_id)) continue;
    const st = state[p.application_id];
    if ((st.totalAll || 0) < target) picked.push(p);
  }

  // State updaten
  picked.forEach(p => {
    const st = state[p.application_id];
    st.totalAll = (st.totalAll || 0) + 1;
    st.promo = (st.promo || 0) + 1;

    st.perDayAll[day] = (st.perDayAll[day] || 0) + 1;

    st.assignedAll.push({ day, time, type: "promo" });
  });

  return picked;
}

function applyUniversalFormatting_(sh, slots, layout) {
  const maxCamps = layout?.maxCamps || 4;
  const hasPromo = layout?.hasPromo === true;
  const headerLen = layout?.headerLen || sh.getLastColumn();
  const slotStartRows = layout?.slotStartRows || [];

  const campStartCol = 4; // D
  const promoCol = hasPromo ? (campStartCol + maxCamps) : -1;

  for (let sIdx = 0; sIdx < (slots || []).length; sIdx++) {
    const slot = slots[sIdx];
    const startRow = slotStartRows[sIdx];   // ✅ kommt jetzt aus buildUniversalSchichtplan_
    if (!startRow) continue;

    const blockLetter = String(slot.block || "").toUpperCase();
    const numCamps = Math.max(1, Number(slot.num_camps || 0) || 1);
    const pps = Math.max(1, Number(slot.people_per_shift || 3) || 3);

    const bgLight = getBlockColorUniversal_(blockLetter, "light");
    const bgDark  = getBlockColorUniversal_(blockLetter, "dark");

    // Merges für Tag/Zeit/Block (pps Zeilen pro Slot)
    sh.getRange(startRow, 1, pps, 1).mergeVertically();
    sh.getRange(startRow, 2, pps, 1).mergeVertically();
    sh.getRange(startRow, 3, pps, 1).mergeVertically();


    sh.getRange(startRow, 1, pps, 3)
      .setVerticalAlignment("middle")
      .setHorizontalAlignment("center");

    sh.getRange(startRow, 3, pps, 1)
      .setBackground(bgDark)
      .setFontWeight("bold");

    // Camps: erst alles weiß
    if (maxCamps > 0) {
      sh.getRange(startRow, campStartCol, pps, maxCamps).setBackground("#ffffff");
    }

    // dann nur existierende Camps einfärben
    const paintCamps = Math.min(numCamps, maxCamps);
    if (paintCamps > 0) {
      sh.getRange(startRow, campStartCol, pps, paintCamps).setBackground(bgLight);
    }

    // Promo: nur wenn Festival Promo-Spalte hat UND Slot Promo will, sonst weiß
    if (hasPromo && promoCol !== -1) {
      const slotWantsPromo = isTrue_(slot.promo) || isTrue_(slot.promo_needed) || isTrue_(slot.has_promo);
      sh.getRange(startRow, promoCol, pps, 1).setBackground(slotWantsPromo ? bgLight : "#ffffff");
    }

    // Rahmen über Planbreite
    sh.getRange(startRow, 1, pps, headerLen)
      .setBorder(true, null, true, null, null, null, "#cccccc", SpreadsheetApp.BorderStyle.SOLID);
  }
}



function getBlockColorUniversal_(blockLetter, variant) {
  const colors = {
    "A": { light: "#fce5cd", dark: "#f6b26b" }, // Orange
    "B": { light: "#d9ead3", dark: "#93c47d" }, // Grün
    "C": { light: "#cfe2f3", dark: "#6fa8dc" }, // Blau
    "D": { light: "#ead1dc", dark: "#c27ba0" }, // Pink/Lila
    "E": { light: "#fff2cc", dark: "#ffd966" }  // Gelb
  };
  
  const set = colors[blockLetter] || { light: "#ffffff", dark: "#eeeeee" };
  return variant === "light" ? set.light : set.dark;
}


function timeIndex_(timeStr) {
  // Erweitert für Nachtschichten (MOYN)
  const order = ["7-10", "10-13", "13-16", "16-19", "19-22", "22-01", "01-04", "04-07"];
  return order.indexOf(String(timeStr || "").trim());
}

/**
 * GOLDEIMER: Update des internen Export-Blatts für die Website
 * Spalten: Festival | Beginn | Ende | Ort | Status | Letztes Update
 */
function updateInternalWebsiteData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const targetSheetName = "WEBSITE_DATA";
  const festivalConfigSheet = ss.getSheetByName(SHEETS.FESTIVALS);
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  
  let targetSheet = ss.getSheetByName(targetSheetName);
  if (!targetSheet) {
    targetSheet = ss.insertSheet(targetSheetName);
  }

  if (!festivalConfigSheet || !appSheet) {
    toast_("Fehler: Config oder Applications Sheet nicht gefunden.");
    return;
  }

  const festData = readSheetAsObjects_(festivalConfigSheet);
  const appRows = readSheetAsObjects_(appSheet).rows;

  const exportRows = [];
  const today = new Date();
  today.setHours(0,0,0,0);

  function parseGermanDate(val) {
    if (!val || String(val).trim() === "" || String(val).toLowerCase() === "tba") return null;
    // Falls es ein echtes Datum-Objekt ist
    if (val instanceof Date) return val;
    // Falls es ein String im Format DD.MM.YYYY ist
    let dParts = String(val).split(".");
    if (dParts.length === 3) {
      return new Date(dParts[2], dParts[1] - 1, dParts[0]);
    }
    let d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  festData.rows.forEach(fest => {
    const fid = String(fest.festival_id || "").trim();
    if (!fid) return;

    const maxCap = Number(fest.need_total || 0); 
    const town = String(fest.festival_town || "").trim() || "TBA";
    
    // --- DATUM-LOGIK FIX ---
    // Wir greifen auf die Eigenschaften des "fest" Objekts zu.
    // fest.start_supp entspricht Spalte F (oder G)
    // fest.end_takedown entspricht Spalte H
    let startSuppDate = parseGermanDate(fest.start_supp);
    let endSuppDate = parseGermanDate(fest.end_takedown); // ✅ Greift jetzt korrekt auf die Eigenschaft zu

    const displayStart = startSuppDate ? Utilities.formatDate(startSuppDate, "GMT+1", "dd.MM.yyyy") : "TBA";
    const displayEnd = endSuppDate ? Utilities.formatDate(endSuppDate, "GMT+1", "dd.MM.yyyy") : "TBA";

    // --- STATUS ZÄHLUNG ---
    const countZusagen = appRows.filter(r =>
      String(r.festival_id).trim() === fid &&
      ["zusagen", "zugesagt", "akkreditiert", "teilgenommen", "friend"].includes(normalizeStatus_(r.status))
    ).length;
    
    const countBewerbungenGesamt = appRows.filter(r => 
      String(r.festival_id).trim() === fid && 
      !["final absagen", "final abgesagt", "zurueckgezogen"].includes(normalizeStatus_(r.status))
    ).length;

    // --- LOGIK-BERECHNUNG ---
    let status = "freespots";

    Logger.log(`[${fid}] maxCap=${maxCap} | countZusagen=${countZusagen} | countBewerbungenGesamt=${countBewerbungenGesamt} | startSuppDate=${startSuppDate} | today=${today}`);
    Logger.log(`[${fid}] Bedingung waitinglist: maxCap>0=${maxCap>0} | zusagen>=${maxCap*0.85}? ${countZusagen>=(maxCap*0.85)} | bewerber>=${maxCap*1.15}? ${countBewerbungenGesamt>=(maxCap*1.15)}`);

    if (startSuppDate && today >= startSuppDate) {
      status = "festivalover";
    }
    else if (maxCap > 0 && countZusagen >= maxCap) {
      // 100% der Plätze besetzt → immer waitinglist
      status = "waitinglist";
    }
    else if (maxCap > 0 && countZusagen >= (maxCap * 0.85) && countBewerbungenGesamt >= (maxCap * 1.10)) {
      // 85% besetzt + mind. 10% Bewerber-Puffer
      status = "waitinglist";
    }

    Logger.log(`[${fid}] → status: ${status}`);

    exportRows.push([
      fest.festival_name, 
      displayStart, 
      displayEnd, 
      town, 
      status, 
      Utilities.formatDate(new Date(), "GMT+1", "dd.MM.yyyy HH:mm")
    ]);
  });

  targetSheet.clearContents();
  
  targetSheet.getRange(1, 1, 1, 6)
    .setValues([["Festival", "Beginn", "Ende", "Ort", "Status", "Letztes Update"]])
    .setFontWeight("bold")
    .setBackground("#f3f3f3");
  
  if (exportRows.length > 0) {
    targetSheet.getRange(2, 1, exportRows.length, 6).setValues(exportRows);
    targetSheet.autoResizeColumns(1, 6);
    targetSheet.getRange(2, 2, exportRows.length, 2).setHorizontalAlignment("center");
    targetSheet.getRange(2, 5, exportRows.length, 1).setHorizontalAlignment("center");
    targetSheet.getRange(2, 6, exportRows.length, 1).setFontColor("#999999").setFontSize(8);
  }
  
  toast_("WEBSITE_DATA wurde mit Daten aus Spalte H (end_takedown) aktualisiert.");
}


function testDpmsConnection() {
  try {
    // Wir versuchen einfach nur, die Liste der Kunden zu laden (kleinster Request)
    const response = dpmsRequest_("get", "/client", { query: { companyId: DPMS.COMPANY_ID } });
    
    Logger.log("✅ Verbindung erfolgreich!");
    Logger.log("Anzahl gefundener Clients: " + (response ? response.length : 0));
    
    if (response && response.length > 0) {
      Logger.log("Beispiel-Client: " + response[0].name);
    }
    
    SpreadsheetApp.getUi().alert("DPMS Verbindung steht! ✅");
    
  } catch (e) {
    Logger.log("❌ Fehler bei der Verbindung: " + e.message);
    SpreadsheetApp.getUi().alert("Fehler: " + e.message);
  }
}

// ==========================================
// 3. AUTOMATISCHER STATUS-SYNC (POLLING) - MIT JAHRES-CHECK
// ==========================================
function syncDpmsSignedContracts() {
  const ss = SpreadsheetApp.getActive();
  const crewSh = ss.getSheetByName(SHEETS.CREW_MASTER);
  const appSh = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!crewSh || !appSh) return;

  const crewData = readSheetAsObjects_(crewSh);
  const appData = readSheetAsObjects_(appSh);

  // Wir ermitteln das aktuelle Jahr (z.B. 2026)
  const currentYear = new Date().getFullYear();

  Logger.log(`Präzisions-Sync startet für das Jahr ${currentYear}...`);

  let contracts = [];
  try {
    contracts = dpmsRequest_("get", "/contract", { 
      query: { companyId: DPMS.COMPANY_ID } 
    });
  } catch (e) {
    Logger.log("❌ API-Fehler: " + e.message);
    return;
  }

  if (!contracts || !Array.isArray(contracts)) return;

  let updatedTotal = 0;

  contracts.forEach(c => {
    // 1. Check: Ist der Vertrag unterzeichnet?
    const sigTime = c.signatureTime ? new Date(c.signatureTime) : null;
    const isSigned = sigTime && sigTime.getFullYear() > 1970;
    
    if (isSigned) {
      // ✅ NEU: Check, ob das Jahr der Unterschrift dem aktuellen Jahr entspricht
      const signatureYear = sigTime.getFullYear();
      if (signatureYear !== currentYear) {
        // Optional: Logger.log(`Überspringe veraltete Unterschrift (${signatureYear}) von ${c.emailReceiver}`);
        return; 
      }

      const rawEmail = c.emailReceiver || c.email;
      if (!rawEmail) return;

      const signedEmail = normEmail_(rawEmail);
      
      // 3. Match im Crew-Master suchen
      const crewMatch = crewData.rows.find(r => normEmail_(r.email) === signedEmail);
      
      if (crewMatch && String(crewMatch.contract_status).trim() !== "unterschrieben") {
        Logger.log(`✅ GÜLTIGER VERTRAG FÜR ${currentYear} GEFUNDEN: ${signedEmail}`);

        const formattedDate = Utilities.formatDate(new Date(c.signatureTime), Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm");

        // Update Crew Master
        updateCell_(crewSh, crewData.headerMap, crewMatch.__rowNumber, "contract_status", "unterschrieben");
        updateCell_(crewSh, crewData.headerMap, crewMatch.__rowNumber, "contract_signed_at", c.signatureTime);
        updateCell_(crewSh, crewData.headerMap, crewMatch.__rowNumber, "dpms_contract_id", c.contractId);

        // Update Applications & Dashboards
        appData.rows.forEach(appRow => {
          if (normEmail_(appRow.email) === signedEmail) {
            updateCell_(appSh, appData.headerMap, appRow.__rowNumber, "contract_status", "unterschrieben");
            updateDashboardRowByApplicationId_(appRow.festival_id, appRow.application_id, {
              contract_status: "unterschrieben"
            });
          }
        });
        updatedTotal++;
      }
    }
  });

  if (updatedTotal > 0) {
    toast_(`${updatedTotal} Crew-Mitglieder für ${currentYear} als 'unterschrieben' markiert! 🚀`);
  } else {
    Logger.log("Keine neuen/gültigen Unterschriften für das aktuelle Jahr gefunden.");
  }
}

function triggerDashboardRecalcAfterMail_(festivalId, forceTest, sentOk) {
  if (!forceTest && sentOk > 0) {
    try {
      const sh = SpreadsheetApp.getActive().getSheetByName(`DASH_${festivalId}`);
      if (sh) {
        const headerRow = findDashHeaderRow_(sh);
        const lastCol = sh.getLastColumn();
        const headers = sh.getRange(headerRow, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
        recalcDashboardKpis_(sh, headers, headerRow);
        Logger.log(`Live-Update KPIs für ${festivalId} durchgeführt.`);
      }
    } catch (e) {
      Logger.log("Dashboard-Update übersprungen: " + e.message);
    }
  }
}

/**
 * Sendet Daten an Supabase. 
 * Nutzt den 'service_role' Key für Schreibrechte.
 */
function sendToSupabase_(table, payload, conflictColumn = null) {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty("SUPABASE_URL");
  const key = props.getProperty("SUPABASE_SERVICE_KEY");

  if (!url || !key) {
    Logger.log("Supabase Config fehlt!");
    return;
  }

  const endpoint = conflictColumn
    ? `${url}/rest/v1/${table}?on_conflict=${conflictColumn}`
    : `${url}/rest/v1/${table}`;

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      Prefer: "resolution=merge-duplicates"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true  // ← damit HTTP-Fehler nicht als Exception geworfen werden
  };

  try {
    const response = UrlFetchApp.fetch(endpoint, options);
    const code = response.getResponseCode();
    if (code < 200 || code >= 300) {
      Logger.log(`Supabase Error (${table}): HTTP ${code} – ${response.getContentText()}`);
    }
  } catch (e) {
    Logger.log(`Supabase Error (${table}): ` + e.message);
  }
}

/**
 * Synchronisiert JEDE Spalte aus der Festival-Config als JSON zu Supabase.
 */
function syncAllFestivalsToSupabase() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SHEETS.FESTIVALS);

  if (!sheet) {
    toast_("Fehler: Tabelle " + SHEETS.FESTIVALS + " nicht gefunden!");
    return;
  }

  const data = readSheetAsObjects_(sheet);
  let count = 0;

  data.rows.forEach((row) => {
    const googleId = row.festival_id || row.google_festival_id || row.ID || "";
    const festName = row.festival_name || row.Name || googleId;

    if (!googleId || String(googleId).trim() === "") {
      Logger.log("Überspringe Zeile ohne ID: " + JSON.stringify(row));
      return;
    }

    const cleanDetails = {};
    Object.keys(row).forEach(key => {
      if (key !== "__rowNumber") cleanDetails[key] = row[key];
    });

    sendToSupabase_("festivals", {
      google_festival_id: String(googleId).trim(),
      name: String(festName).trim(),
      details: cleanDetails
    }, "google_festival_id");
    count++;
  });

  const phoneCount = syncPhoneNumbersToSupabase_();
  toast_(`${count} Festivals und ${phoneCount} Telefonnummern synchronisiert! 🚀`);
  syncAllAssignmentsToSupabase_();
}

function syncPhoneNumbersToSupabase_() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SHEETS.CREW_MASTER);
  if (!sheet) {
    Logger.log('Sheet "' + SHEETS.CREW_MASTER + '" nicht gefunden');
    return 0;
  }

  const props = PropertiesService.getScriptProperties();
  const sbUrl = props.getProperty("SUPABASE_URL");
  const sbKey = props.getProperty("SUPABASE_SERVICE_KEY");
  if (!sbUrl || !sbKey) {
    Logger.log("Supabase Config fehlt!");
    return 0;
  }

  const data = readSheetAsObjects_(sheet);
  const emailKey = data.headers.find(h => String(h).trim().toLowerCase() === 'email');
  const phoneKey = data.headers.find(h => String(h).trim().toLowerCase() === 'phone');

  if (!emailKey || !phoneKey) {
    Logger.log('Spalte "email" oder "phone" nicht gefunden. Spalten: ' + data.headers.join(', '));
    return 0;
  }

  let updated = 0;
  data.rows.forEach(function(row) {
    const email = normEmail_(row[emailKey]);
    const phone = normalizePhone_(row[phoneKey]);
    if (!email || !phone) return;

    try {
      const res = UrlFetchApp.fetch(
        sbUrl + '/rest/v1/profiles?email=eq.' + encodeURIComponent(email),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': sbKey,
            'Authorization': 'Bearer ' + sbKey,
            'Prefer': 'return=minimal',
          },
          payload: JSON.stringify({ phone: phone }),
          muteHttpExceptions: true,
        }
      );
      if (res.getResponseCode() === 204) updated++;
      else Logger.log('Phone-Sync Fehler ' + email + ': ' + res.getContentText());
    } catch(e) {
      Logger.log('Phone-Sync Exception ' + email + ': ' + e.message);
    }
  });

  Logger.log('✓ ' + updated + ' Telefonnummern synchronisiert');
  return updated;
}

function normalizeFestName_(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u0060\u00B4']/g, "") // alle Apostroph-Varianten komplett entfernen
    .replace(/[^a-z0-9äöüß]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function syncAllExistingAssignments() {
  const ss = SpreadsheetApp.getActive();
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  const data = readSheetAsObjects_(appSheet);
  
  const validStatuses = ['zugesagt', 'akkreditiert', 'teilgenommen'];
  
  const candidates = data.rows.filter(r => 
    validStatuses.includes(normalizeStatus_(r.status))
  );
  
  Logger.log(`Gefunden: ${candidates.length} Assignments zum Sync`);
  
  let ok = 0, failed = 0;
  
  candidates.forEach(r => {
    try {
      // Erst Profil anlegen
      sendToSupabase_("profiles", {
        email:     normEmail_(r.email),
        full_name: ((r.first_name || '') + ' ' + (r.last_name || '')).trim() || null,
        role:      normalizeRole_(r.role).toLowerCase(),
      }, "email");
      
      // Dann Assignment
      const props = PropertiesService.getScriptProperties();
      const sbUrl = props.getProperty("SUPABASE_URL");
      const sbKey = props.getProperty("SUPABASE_SERVICE_KEY");
      
      const rpcOptions = {
        method: "post",
        contentType: "application/json",
        headers: { apikey: sbKey, Authorization: "Bearer " + sbKey },
        payload: JSON.stringify({
          p_email: r.email,
          p_google_fest_id: r.festival_id,
          p_status: normalizeStatus_(r.status)
        })
      };
      UrlFetchApp.fetch(sbUrl + "/rest/v1/rpc/sync_assignment", rpcOptions);
      ok++;
    } catch(e) {
      Logger.log("Fehler: " + r.email + " - " + e.message);
      failed++;
    }
  });
  
  toast_(`Sync fertig: ${ok} OK, ${failed} Fehler`);
}

function backfillAuthUsers() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet()
                .getSheetByName("APPLICATIONS");
  var data  = sheet.getDataRange().getValues();
  var header = data[0];

  // Spaltenname-Suche case-insensitiv
  var emailIdx = -1;
  for (var h = 0; h < header.length; h++) {
    if (String(header[h]).trim().toLowerCase() === "email") {
      emailIdx = h;
      break;
    }
  }

  if (emailIdx === -1) {
    Logger.log("FEHLER: Keine E-Mail-Spalte gefunden! Vorhandene Spalten: " + header.join(", "));
    return;
  }
  Logger.log("E-Mail-Spalte gefunden: '" + header[emailIdx] + "' (Index " + emailIdx + ")");

  var props = PropertiesService.getScriptProperties();
  var sbUrl = props.getProperty("SUPABASE_URL");
  var sbKey = props.getProperty("SUPABASE_SERVICE_KEY");
  var adminUrl = sbUrl + "/auth/v1/admin/users";

  var created = 0, skipped = 0, errors = 0;

  for (var i = 1; i < data.length; i++) {
    var email = String(data[i][emailIdx] || "").trim().toLowerCase();
    if (!email) continue;

    try {
      var res = UrlFetchApp.fetch(adminUrl, {
        method: "post",
        contentType: "application/json",
        headers: { apikey: sbKey, Authorization: "Bearer " + sbKey },
        muteHttpExceptions: true,
        payload: JSON.stringify({ email: email, email_confirm: true })
      });
      var code = res.getResponseCode();
      if (code === 200 || code === 201)  { created++; Logger.log("Erstellt: " + email); }
      else if (code === 422)             { skipped++; }
      else { errors++; Logger.log("Fehler " + email + ": " + code + " " + res.getContentText()); }
    } catch(e) {
      errors++;
      Logger.log("Exception " + email + ": " + e.message);
    }
    Utilities.sleep(150);
  }

  Logger.log("Backfill fertig: " + created + " erstellt, " + skipped + " schon vorhanden, " + errors + " Fehler");
}

/* =========================
 * EINMALIGER BACKFILL: detail_pronouns/carpass/arrival aus APPLICATIONS -> Supabase
 * (für Zeilen, die schon vor der Supabase-Anbindung importiert wurden und daher
 *  beim normalen Sync als "bereits aktuell" überspringen würden)
 * ========================= */
function backfillAssignmentDetailsToSupabase_(festivalId) {
  const ss = SpreadsheetApp.getActive();
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!appSheet) throw new Error(`Sheet fehlt: ${SHEETS.APPLICATIONS}`);

  const appData = readSheetAsObjects_(appSheet);
  let pushed = 0, skipped = 0;

  appData.rows.forEach((r) => {
    if (String(r.festival_id || "").trim() !== String(festivalId).trim()) return;

    const hasAny = String(r.detail_pronouns || "").trim()
      || String(r.detail_carpass || "").trim()
      || String(r.detail_arrival || "").trim();
    if (!hasAny) { skipped++; return; }

    try {
      callRpc_("sync_assignment_details", {
        p_email:       normEmail_(r.email),
        p_festival_id: String(festivalId || "").trim(),
        p_pronouns:    String(r.detail_pronouns || ""),
        p_carpass:     String(r.detail_carpass  || ""),
        p_arrival:     String(r.detail_arrival  || ""),
      });
      pushed++;
    } catch (e) {
      Logger.log("Backfill Error bei " + r.email + ": " + e.message);
    }
  });

  Logger.log(`Backfill fertig: ${pushed} an Supabase gesendet, ${skipped} ohne Detaildaten übersprungen`);
  return { pushed, skipped };
}

function uiBackfillAssignmentDetails() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  const res = backfillAssignmentDetailsToSupabase_(festivalId);
  toast_(`Backfill: ${res.pushed} an Supabase gesendet, ${res.skipped} übersprungen (keine Detaildaten)`);
}

function callRpc_(funcName, params) {
  const props  = PropertiesService.getScriptProperties();
  const sbUrl  = props.getProperty("SUPABASE_URL");
  const sbKey  = props.getProperty("SUPABASE_SERVICE_KEY");
  const url    = sbUrl + "/rest/v1/rpc/" + funcName;
  const options = {
    method:      "post",
    contentType: "application/json",
    headers: {
      "apikey":        sbKey,
      "Authorization": "Bearer " + sbKey,
    },
    payload:          JSON.stringify(params),
    muteHttpExceptions: true,
  };
  const response = UrlFetchApp.fetch(url, options);
  try {
    return JSON.parse(response.getContentText());
  } catch (e) {
    Logger.log("callRpc_ parse error: " + response.getContentText());
    return null;
  }
}

function syncAllAssignmentsToSupabase_() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!sheet) {
    Logger.log("syncAllAssignments: Kein APPLICATIONS-Sheet gefunden");
    return;
  }

  const data = readSheetAsObjects_(sheet);

  // Nur Zeilen wo eine Entscheidung gefallen ist (keine offenen Bewerbungen ins Hub schreiben)
  const syncableStatuses = new Set([
    'zugesagt', 'akkreditiert', 'teilgenommen',
    'auf warteliste', 'final abgesagt', 'zurueckgezogen'
  ]);

  const rows = data.rows.filter(r => syncableStatuses.has(normalizeStatus_(r.status)));
  Logger.log(`syncAllAssignments: ${rows.length} Zeilen zu synchen`);

  let synced = 0, errors = 0;

  rows.forEach((r) => {
    const email  = normEmail_(r.email);
    const festId = String(r.festival_id || '').trim();   // ← festival_id, nicht google_festival_id
    const status = normalizeStatus_(r.status) || 'zugesagt';
    const role   = r.role ? normalizeRole_(r.role).toLowerCase() : null;

    if (!email || !festId) return;

    // Erst Profil sicherstellen, damit die RPC nicht "Profile not found" wirft
    sendToSupabase_("profiles", {
      email:     email,
      full_name: ((r.first_name || '') + ' ' + (r.last_name || '')).trim() || null,
      role:      role && role !== 'other' ? role : 'operator',
    }, "email");

    // Dann Assignment synchen
    const payload = { p_email: email, p_google_fest_id: festId, p_status: status };
    if (role && role !== 'other') payload.p_role = role;

    const result = callRpc_("sync_assignment", payload);

    if (result && result.success) {
      synced++;
    } else {
      errors++;
      Logger.log(`syncAllAssignments Fehler: email=${email} fest=${festId} → ${JSON.stringify(result)}`);
    }
  });

  Logger.log(`syncAllAssignments: ${synced} OK, ${errors} Fehler`);
}

/**
 * Manueller Rück-Sync: liest das "Anwesenheit"-Sheet (vom Anwesenheits-Check in
 * der App befüllt) und überträgt den Stand ins Crew-Management:
 *  - "Ja"   → Status wird auf 'teilgenommen' gesetzt
 *  - "Nein" → Status wird auf den gespeicherten "Vorheriger Status" zurückgesetzt
 *             (damit eine Korrektur in der App nicht für immer auf 'teilgenommen' hängen bleibt)
 * Aktualisiert APPLICATIONS (Quelle der Wahrheit), das DASH_<festivalId>-Sheet
 * und per RPC auch den Supabase-Assignment-Status. Bewusst manuell ausgelöst,
 * nicht automatisch per Trigger.
 */
function uiSyncAttendanceToStatus() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  const res = syncAttendanceToStatus_(festivalId);
  toast_(`Anwesenheit-Sync: ${res.markedPresent} auf 'teilgenommen' gesetzt, ${res.reverted} zurückgesetzt, ${res.skipped} übersprungen, ${res.errors} Fehler.`);
}

function syncAttendanceToStatus_(festivalId) {
  const ss = SpreadsheetApp.getActive();

  const festSheet = ss.getSheetByName(SHEETS.FESTIVALS);
  const festData  = readSheetAsObjects_(festSheet);
  const festCfg   = festData.rows.find(r => String(r.festival_id || "").trim() === festivalId) || {};
  const festivalName = String(festCfg.festival_name || festivalId).trim();

  const reportSheetId = PropertiesService.getScriptProperties().getProperty('REPORTS_SS_ID')
    || '19RLr7RQ0yZQ84NGd6ShgJp_tKWwVLfH6-ibsRXhaq_E';
  const reportSs = SpreadsheetApp.openById(reportSheetId);
  const attSheet = reportSs.getSheetByName('Anwesenheit');
  if (!attSheet) {
    Logger.log("syncAttendanceToStatus_: Kein 'Anwesenheit'-Sheet gefunden");
    return { markedPresent: 0, reverted: 0, skipped: 0, errors: 0 };
  }

  const attData = readSheetAsObjects_(attSheet);
  const rows = attData.rows.filter(r => String(r['Festival'] || '').trim() === festivalName);

  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!appSheet) throw new Error(`Sheet fehlt: ${SHEETS.APPLICATIONS}`);
  const appData = readSheetAsObjects_(appSheet);
  const statusColIdx = appData.headerMap['status'];
  if (statusColIdx === undefined) throw new Error("APPLICATIONS: Spalte 'status' fehlt.");

  // email + festival_id -> Zeile (für direkten Schreibzugriff in APPLICATIONS)
  const appRowByEmail = new Map();
  appData.rows.forEach(r => {
    if (String(r.festival_id || '').trim() !== festivalId) return;
    const em = normEmail_(r.email);
    if (em) appRowByEmail.set(em, r);
  });

  let markedPresent = 0, reverted = 0, skipped = 0, errors = 0;

  rows.forEach(r => {
    const email   = normEmail_(r['Email']);
    const present = String(r['Anwesend'] || '').trim().toLowerCase();
    if (!email || (present !== 'ja' && present !== 'nein')) { skipped++; return; }

    const appRow = appRowByEmail.get(email);
    if (!appRow) { skipped++; return; }

    const newStatus = present === 'ja'
      ? 'teilgenommen'
      : normalizeStatus_(r['Vorheriger Status']) || null;

    if (!newStatus) { skipped++; return; } // kein bekannter vorheriger Status → nichts kaputt machen

    // Bereits im Zielzustand? Dann nichts zu tun (idempotent).
    if (normalizeStatus_(appRow.status) === newStatus) { skipped++; return; }

    try {
      appSheet.getRange(appRow.__rowNumber, statusColIdx + 1).setValue(newStatus);

      if (appRow.application_id) {
        updateDashboardRowByApplicationId_(festivalId, appRow.application_id, { status: newStatus });
      }

      callRpc_("sync_assignment", { p_email: email, p_google_fest_id: festivalId, p_status: newStatus });

      if (present === 'ja') markedPresent++; else reverted++;
    } catch (e) {
      errors++;
      Logger.log(`syncAttendanceToStatus_ Fehler bei ${email}: ${e.message}`);
    }
  });

  return { markedPresent, reverted, skipped, errors };
}

// Headless-Version für den Zeit-Trigger: iteriert selbst über alle Festivals
// im Anwesenheits-Sheet und syncht jeden einzeln. Läuft ohne aktiven Sheet-Tab.
function autoSyncAllAttendanceToStatus_() {
  const reportSheetId = PropertiesService.getScriptProperties().getProperty('REPORTS_SS_ID')
    || '19RLr7RQ0yZQ84NGd6ShgJp_tKWwVLfH6-ibsRXhaq_E'
  const reportSs = SpreadsheetApp.openById(reportSheetId)
  const attSheet  = reportSs.getSheetByName('Anwesenheit')
  if (!attSheet) return // noch kein Anwesenheits-Sheet → nichts zu tun

  const attData = readSheetAsObjects_(attSheet)

  // Alle einzigartigen Festival-Namen aus dem Sheet holen
  const festivalNames = [...new Set(
    attData.rows.map(r => String(r['Festival'] || '').trim()).filter(Boolean)
  )]
  if (!festivalNames.length) return

  // Festival-Name → festival_id via CONFIG_FESTIVALS
  const ss = SpreadsheetApp.getActive()
  const festSheet = ss.getSheetByName(SHEETS.FESTIVALS)
  const festData  = readSheetAsObjects_(festSheet)

  let totalPresent = 0, totalReverted = 0, totalErrors = 0
  festivalNames.forEach(name => {
    const festRow = festData.rows.find(r => String(r.festival_name || '').trim() === name)
    if (!festRow) return
    const festivalId = String(festRow.festival_id || '').trim()
    if (!festivalId) return
    try {
      const res = syncAttendanceToStatus_(festivalId)
      totalPresent  += res.markedPresent
      totalReverted += res.reverted
      totalErrors   += res.errors
    } catch (e) {
      Logger.log(`autoSync Fehler für ${name}: ${e.message}`)
      totalErrors++
    }
  })
  Logger.log(`autoSyncAllAttendance: ${totalPresent} teilgenommen, ${totalReverted} zurückgesetzt, ${totalErrors} Fehler`)
}

function uiEnableAttendanceAutoSync() {
  // Doppelte Trigger vermeiden
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'autoSyncAllAttendanceToStatus_')
    .forEach(t => ScriptApp.deleteTrigger(t))

  ScriptApp.newTrigger('autoSyncAllAttendanceToStatus_')
    .timeBased()
    .everyMinutes(10)
    .create()
  toast_('✅ Auto-Sync aktiviert: Anwesenheit wird alle 10 Minuten automatisch übernommen.')
}

function uiDisableAttendanceAutoSync() {
  const triggers = ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'autoSyncAllAttendanceToStatus_')
  triggers.forEach(t => ScriptApp.deleteTrigger(t))
  toast_(triggers.length
    ? '⏹ Auto-Sync deaktiviert.'
    : 'Kein aktiver Auto-Sync-Trigger gefunden.')
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)
    if (data.action === 'aufbau') writeAufbauReport_(data)
    if (data.action === 'anwesenheit') writeAnwesenheitReport_(data)
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

// Schreibt/aktualisiert die Anwesenheits-Daten pro Person (Upsert über Assignment-ID),
// NICHT append-only — sonst würde jedes erneute Abschicken (Korrektur) Karteileichen
// erzeugen statt den Stand pro Person zu aktualisieren.
function writeAnwesenheitReport_(data) {
  const sheetId = PropertiesService.getScriptProperties().getProperty('REPORTS_SS_ID')
    || '19RLr7RQ0yZQ84NGd6ShgJp_tKWwVLfH6-ibsRXhaq_E'
  const ss = SpreadsheetApp.openById(sheetId)

  const HEADER = ['Festival', 'Name', 'Email', 'Rolle', 'Anwesend', 'Vorheriger Status', 'Eingabe durch', 'Eingabe am', 'AssignmentID']
  let sheet = ss.getSheetByName('Anwesenheit')
  if (!sheet) {
    sheet = ss.insertSheet('Anwesenheit')
    sheet.appendRow(HEADER)
    sheet.getRange(1, 1, 1, HEADER.length).setFontWeight('bold')
  }

  const ts = new Date(data.submitted_at).toLocaleString('de-DE')
  const lastRow = sheet.getLastRow()
  const idColIdx = HEADER.indexOf('AssignmentID') // 0-basiert

  // AssignmentID -> Zeilennummer (1-basiert), für Upsert statt Append
  const rowByAssignmentId = new Map()
  if (lastRow > 1) {
    const ids = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues()
    ids.forEach((r, i) => {
      const id = String(r[0] || '').trim()
      if (id) rowByAssignmentId.set(id, i + 2) // +2: 1-basiert + Header-Zeile
    })
  }

  ;(data.entries || []).forEach(e => {
    if (!e.assignment_id) return // ohne Assignment-ID kein verlässlicher Abgleich möglich
    const present = e.present === true ? 'Ja' : e.present === false ? 'Nein' : ''
    const rowValues = [
      data.festival_name, e.full_name || '', e.email || '', e.role || '',
      present, e.prior_status || '', data.submitted_by_name, ts, e.assignment_id,
    ]
    const existingRow = rowByAssignmentId.get(String(e.assignment_id))
    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, rowValues.length).setValues([rowValues])
    } else {
      sheet.appendRow(rowValues)
      rowByAssignmentId.set(String(e.assignment_id), sheet.getLastRow())
    }
  })
}

function writeAufbauReport_(data) {
  const sheetId = PropertiesService.getScriptProperties().getProperty('REPORTS_SS_ID')
    || '19RLr7RQ0yZQ84NGd6ShgJp_tKWwVLfH6-ibsRXhaq_E'
  const ss = SpreadsheetApp.openById(sheetId)

  let sheet = ss.getSheetByName('Aufbau')
  if (!sheet) {
    sheet = ss.insertSheet('Aufbau')
    sheet.appendRow(['Festival', 'Name', 'Rolle', 'Packen', 'Fahren', 'Ausladen', 'Aufbau', 'Eingabe durch', 'Eingabe am'])
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold')
  }

  const ts = new Date(data.submitted_at).toLocaleString('de-DE')
  ;(data.crew_entries || []).forEach(e => {
    const t = e.tasks || []
    sheet.appendRow([data.festival_name, e.name, e.role_label,
      t.includes('packen') ? '✓' : '', t.includes('fahren') ? '✓' : '',
      t.includes('ausladen') ? '✓' : '', t.includes('aufbau') ? '✓' : '',
      data.submitted_by_name, ts])
  })
  ;(data.extra_entries || []).forEach(e => {
    if (!e.name) return
    const t = e.tasks || []
    sheet.appendRow([data.festival_name, e.name, 'Weitere',
      t.includes('packen') ? '✓' : '', t.includes('fahren') ? '✓' : '',
      t.includes('ausladen') ? '✓' : '', t.includes('aufbau') ? '✓' : '',
      data.submitted_by_name, ts])
  })
}

function loadSperrlisteMap_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.SPERRLISTE);
  if (!sh) return new Map();

  const map = new Map();
  readSheetAsObjects_(sh).rows.forEach(r => {
    const em = normEmail_(r.email);
    if (em) map.set(em, {
      name:   `${r.first_name || ""} ${r.last_name || ""}`.trim(),
      reason: String(r.reason || "").trim(),
    });
  });
  return map;
}

function applySperrlisteHighlighting_(sh, sorted, dashCols, headerRow, sperrMap) {
  const firstIdx = dashCols.indexOf("first_name");
  const lastIdx  = dashCols.indexOf("last_name");
  const emailIdx = dashCols.indexOf("email");
  if (emailIdx === -1) return;

  // Immer erst alte Sperrliste-Notizen löschen (bleiben sonst nach Rebuild erhalten)
  if (sorted.length > 0 && firstIdx !== -1) {
    sh.getRange(headerRow + 1, firstIdx + 1, sorted.length, 1).clearNote();
  }

  if (!sperrMap || sperrMap.size === 0) return;

  sorted.forEach((row, i) => {
    const em = normEmail_(String(row[emailIdx] || ""));
    if (!sperrMap.has(em)) return;

    const entry   = sperrMap.get(em);
    const dataRow = headerRow + 1 + i;

    [firstIdx, lastIdx].forEach(colIdx => {
      if (colIdx === -1) return;
      sh.getRange(dataRow, colIdx + 1)
        .setBackground("#cc0000")
        .setFontColor("#ffffff");
    });

    if (firstIdx !== -1) {
      sh.getRange(dataRow, firstIdx + 1)
        .setNote(`🚫 Gesperrt${entry.reason ? ": " + entry.reason : ""}`);
    }
  });
}

function uiSendLastInfoTest() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  const res = sendLastInfoForFestival_({ festivalId, forceTest: true });
  toast_(`TEST Letzte Info: ${res.sentOk} OK, ${res.sentFailed} Fehler (${res.candidates} Kandidaten)`);
}

/**
 * DEBUG: Rendert die Mail für die erste akkreditierte Person,
 * loggt den relevanten Abschnitt des htmlBody und öffnet ihn als Google Doc.
 * Damit kann man exakt sehen, was vor GmailApp.sendEmail ankommt.
 */
function uiDebugLastInfoHtml() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;

  const ss = SpreadsheetApp.getActive();
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!appSheet) { toast_("APPLICATIONS Sheet fehlt"); return; }

  const appData = readSheetAsObjects_(appSheet);
  const sample = appData.rows.find(r =>
    String(r.festival_id || "").trim() === String(festivalId).trim() &&
    normalizeStatus_(r.status) === "akkreditiert"
  );

  if (!sample) { toast_("Keine akkreditierte Person für dieses Festival gefunden."); return; }

  Logger.log(`Debug-Person: ${sample.email} | Festival: ${festivalId}`);

  const vars = buildVars_(sample);
  Logger.log("=== CONFIG-VARIABLEN (vor render) ===");
  ["INFOMAIL_WOHIN", "INFOMAIL_TICKET", "INFOMAIL_VERPFLEGUNG", "INFOMAIL_SONSTIGES"].forEach(k => {
    Logger.log(`  ${k} = ${String(vars[k] || "(leer)").substring(0, 300)}`);
  });

  const template = getTemplate_("LAST_INFO", { allowInactive: true });
  const htmlBody = render_(template.body_html, vars);

  Logger.log("=== HTMLBODY SNIPPET (erste 3000 Zeichen) ===");
  Logger.log(htmlBody.substring(0, 3000));

  // Prüfe ob HTML-Tags aus CONFIG-Variablen im Ergebnis vorhanden sind
  const hasBold = /<b>|<strong>|font-weight/.test(htmlBody);
  const hasColor = /color\s*:/.test(htmlBody);
  Logger.log(`=== DIAGNOSE: <b>/<strong> im htmlBody vorhanden? ${hasBold} | color-Style? ${hasColor} ===`);

  // htmlBody in Google Doc speichern für einfache Ansicht
  try {
    const doc = DocumentApp.create(`[DEBUG] Last-Info HTML – ${festivalId} – ${new Date().toISOString().slice(0,10)}`);
    doc.getBody().setText(htmlBody);
    doc.saveAndClose();
    Logger.log(`Debug-Doc: ${doc.getUrl()}`);
    toast_(`Debug-Log erstellt! Doc: ${doc.getUrl()} – bitte Logger prüfen.`);
  } catch (e) {
    toast_(`htmlBody im Logger! ${hasBold ? "✅ Bold-Tags vorhanden" : "❌ Keine Bold-Tags"}`);
  }
}

function uiSendLastInfoReal() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  const res = sendLastInfoForFestival_({ festivalId, forceTest: false });
  toast_(`ECHT Letzte Info: ${res.sentOk} OK, ${res.sentFailed} Fehler`);
}

function sendLastInfoForFestival_({ festivalId, forceTest }) {
  Logger.log(`▶ LAST_INFO START | festival=${festivalId} | forceTest=${forceTest}`);

  const ss = SpreadsheetApp.getActive();
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!appSheet) throw new Error(`Sheet fehlt: ${SHEETS.APPLICATIONS}`);

  const isTestRun = !!forceTest;
  const template = getTemplate_("LAST_INFO", { allowInactive: true });
  Logger.log(`template gefunden: ${!!template} | active=${template && template.active}`);

  if (!isTestRun && !template.active) {
    Logger.log("⚠ Abbruch: Template LAST_INFO inaktiv");
    return { candidates: 0, sentOk: 0, sentFailed: 0 };
  }

  // Detailabfrage-Antworten frisch aus dem Formular importieren
  try {
    const importRes = syncDetailResponsesFromForm_({ festivalId });
    Logger.log(`Detail-Sync: ${JSON.stringify(importRes)}`);
  } catch (se) {
    Logger.log(`Detail-Sync Fehler (nicht kritisch): ${se.message}`);
  }

  const appData = readSheetAsObjects_(appSheet);

  // Nur akkreditierte Personen (= Detailabfrage bereits ausgefüllt), an die noch nicht geschickt wurde
  const candidates = appData.rows.filter(r => {
    const fidMatch = String(r.festival_id || "").trim() === String(festivalId).trim();
    const st = normalizeStatus_(r.status);
    const notSentYet = !String(r.last_info_sent || "").trim();
    return fidMatch && (st === "akkreditiert" || st === STATUS.FRIEND) && notSentYet;
  });

  Logger.log(`Kandidaten (akkreditiert, noch keine letzte Info): ${candidates.length}`);
  if (candidates.length === 0) {
    Logger.log("⚠ Keine Kandidaten – alle bereits versorgt oder niemand zugesagt.");
    return { candidates: 0, sentOk: 0, sentFailed: 0 };
  }

  let sentOk = 0, sentFailed = 0;

  candidates.forEach(r => {
    try {
      const vars = buildVars_(r);
let htmlBody = render_(template.body_html, vars);
const subject  = render_(template.subject || "Letzte Infos fürs {{FESTIVAL_NAME}}", vars);
const recipient = isTestRun ? Session.getActiveUser().getEmail() : (r.email || "");

if (isTestRun) {
  htmlBody = buildTestHeader_(r.email, festivalId, r.role) + htmlBody;
}

      Logger.log(`   Sende an: ${recipient} | Betreff: ${subject}`);
      if (!recipient) throw new Error("Keine E-Mail-Adresse");

      GmailApp.sendEmail(recipient, subject, "", {
        htmlBody,
        name: "Goldeimer Crew",
      });

      Logger.log(`   ✓ Mail gesendet`);

      if (!isTestRun) {
        const now = new Date();
        const nowFormatted = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm");

        const rowIdx = appData.rows.indexOf(r);
        const colIdx = appData.headerMap["last_info_sent"];
        if (rowIdx >= 0 && colIdx !== undefined) {
          appSheet.getRange(rowIdx + 2, colIdx + 1).setValue(nowFormatted);
        }

        updateDashboardRowByApplicationId_(festivalId, r.application_id, {
          last_info_sent: nowFormatted,
        });
      }

      sentOk++;
    } catch (e) {
      sentFailed++;
      Logger.log(`   ✗ FEHLER bei ${r.email || "?"}: ${e.message}`);
    }
  });

  log_({
    action: "MAIL_LAST_INFO",
    meta: { festivalId, candidates: candidates.length, sentOk, sentFailed, mode: isTestRun ? "TEST" : "ECHT" },
    count: sentOk,
  });

  Logger.log(`▶ FERTIG | ok=${sentOk} | fehler=${sentFailed}`);
  return { candidates: candidates.length, sentOk, sentFailed };
}

// Template Doc ID einmalig in ScriptProperties speichern:
// Schlüssel: LEAD_RIDER_TEMPLATE_ID, Wert: 1_HyCWEzr9Exr6N9FJNG_BDb8JaTMhMxo
// (oder was auch immer die korrekte vollständige ID ist)

function uiGenerateLeadRider() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  try {
    const file = saveLeadRiderToDrive_(festivalId);
    
    // Link in CONFIG_FESTIVALS speichern
    const ss        = SpreadsheetApp.getActive();
    const festSheet = ss.getSheetByName(SHEETS.FESTIVALS);
    const festData  = readSheetAsObjects_(festSheet);
    const festRow   = festData.rows.find(r =>
      String(r.festival_id || "").trim() === String(festivalId).trim()
    );
    if (festRow) {
      updateCell_(festSheet, festData.headerMap, festRow.__rowNumber, "lead_rider_link", file.getUrl());
    }
    writeLeadRiderLinkToDashboard_({ festivalId, url: file.getUrl() });

    toast_(`✅ Lead Rider gespeichert & Link eingetragen!`);
    Logger.log(`Lead Rider URL: ${file.getUrl()}`);
  } catch (e) {
    toast_("Fehler: " + e.message);
    Logger.log("❌ " + e.message);
  }
}

function saveLeadRiderToDrive_(festivalId) {
  const folderId = PropertiesService.getScriptProperties().getProperty("LEAD_RIDER_FOLDER_ID")
    || "18j7io9O7Y8iiOTUryUxdf2k1DUj5iMli";

  const pdfBlob = generateLeadRiderPdf_(festivalId);
  const folder  = DriveApp.getFolderById(folderId);
  const file    = folder.createFile(pdfBlob);
  return file;
}

function generateLeadRiderPdf_(festivalId) {
  const templateDocId = PropertiesService.getScriptProperties().getProperty("LEAD_RIDER_TEMPLATE_ID");
  if (!templateDocId) throw new Error("LEAD_RIDER_TEMPLATE_ID fehlt in ScriptProperties.");

  // ── 1. Config-Daten laden ─────────────────────────────────────────────────
  const ss        = SpreadsheetApp.getActive();
  const festSheet = ss.getSheetByName(SHEETS.FESTIVALS);
  const festData  = readSheetAsObjects_(festSheet);
  const festCfg   = festData.rows.find(r =>
    String(r.festival_id || "").trim() === String(festivalId).trim()
  );
  if (!festCfg) throw new Error(`Kein Config-Eintrag für festival_id=${festivalId}`);

  // ── 2. Crew aus APPLICATIONS laden ───────────────────────────────────────
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  const appData  = readSheetAsObjects_(appSheet);
  const festApps = appData.rows.filter(r =>
    String(r.festival_id || "").trim() === festivalId
  );
  const validStatuses = ["zugesagt", "akkreditiert", "teilgenommen"];

  const zugesagte = festApps.filter(r =>
    validStatuses.includes(normalizeStatus_(r.status))
  );

  // Hilfsfunktion: Namen einer Rolle kommagetrennt
  function getNames_(role) {
    return zugesagte
      .filter(r => normalizeRole_(r.role) === role)
      .map(r => String(r.detail_first_name || r.first_name || "").trim())
      .filter(Boolean)
      .join(", ") || "–";
  }

  // Crew-Zahlen pro Rolle
  const byRole = zugesagte.reduce((acc, r) => {
    const role = normalizeRole_(r.role);
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  // ── 3. Vars-Objekt bauen ──────────────────────────────────────────────────
  const vars = {};
  Object.keys(festCfg).forEach(key => {
    if (key === "__rowNumber") return;
    vars[key.trim().toUpperCase()] = String(festCfg[key] || "").trim();
  });

  // Namen
  vars["LEAD_NAMEN"]     = getNames_("LEAD");
  vars["OPERATOR_NAMEN"] = getNames_("OPERATOR");
  vars["SUPP_PLUS_NAMEN"]= getNames_("SUPPORTI_PLUS");

  // Zahlen
  vars["ANZAHL_SUPPORTIS"]      = String((byRole["SUPPORTI"] || 0) + (byRole["SUPPORTI_PLUS"] || 0));
  vars["ANZAHL_CREW_AKTUELL"]   = String(zugesagte.length);
  vars["ANZAHL_CREW_LEADS"]     = String(byRole["LEAD"]          || 0);
  vars["ANZAHL_CREW_OPS"]       = String(byRole["OPERATOR"]      || 0);
  vars["ANZAHL_CREW_SUPP"]      = String(byRole["SUPPORTI"]      || 0);
  vars["ANZAHL_CREW_SUPP_PLUS"] = String(byRole["SUPPORTI_PLUS"] || 0);
  vars["ANZAHL_CREW_KITCHEN"]   = String(byRole["CATERING"]      || 0);

  // ── 4. Doc kopieren & Platzhalter ersetzen ────────────────────────────────
  const templateFile = DriveApp.getFileById(templateDocId);
  const copyFile     = templateFile.makeCopy(`Lead Rider – ${festivalId}`);
  const copyDoc      = DocumentApp.openById(copyFile.getId());
  const body         = copyDoc.getBody();

  // Link-Platzhalter zuerst als echte Hyperlinks einsetzen (vor dem normalen replaceText)
  const linkPlaceholders = {
    "CREW_LIST_LINK":   "→ Crew-Liste öffnen",
    "SHIFT_TABLE_LINK": "→ Schichtplan öffnen",
  };
  Object.entries(linkPlaceholders).forEach(([key, displayText]) => {
    const url = vars[key];
    if (!url) return;
    try {
      let found = body.findText(`\\{\\{${key}\\}\\}`);
      while (found) {
        const el    = found.getElement().asText();
        const start = found.getStartOffset();
        const end   = found.getEndOffsetInclusive();
        el.deleteText(start, end);
        el.insertText(start, displayText);
        el.setLinkUrl(start, start + displayText.length - 1, url);
        found = body.findText(`\\{\\{${key}\\}\\}`);
      }
      delete vars[key]; // nicht nochmal per replaceText ersetzen
    } catch (e) {
      Logger.log(`Link-Platzhalter {{${key}}} fehlgeschlagen: ${e.message}`);
    }
  });

  // Alle übrigen Platzhalter als Text ersetzen
  Object.keys(vars).forEach(key => {
    try {
      body.replaceText(`\\{\\{${key}\\}\\}`, vars[key]);
    } catch (e) {
      Logger.log(`Platzhalter {{${key}}} konnte nicht ersetzt werden: ${e.message}`);
    }
  });

  copyDoc.saveAndClose();

  // ── 5. Als PDF exportieren & Kopie löschen ───────────────────────────────
  const pdfBlob = DriveApp.getFileById(copyFile.getId())
    .getAs(MimeType.PDF)
    .setName(`Lead Rider – ${festivalId}.pdf`);

  copyFile.setTrashed(true);

  return pdfBlob;
}

function DEBUG_leadRiderTest() {
  const festivalId = "HURR_2026"; // ← deine Festival-ID eintragen
  try {
    const pdfBlob = generateLeadRiderPdf_(festivalId);
    const email = Session.getActiveUser().getEmail();
    GmailApp.sendEmail(email, `[TEST] Lead Rider – ${festivalId}`, "Lead Rider im Anhang.", {
      attachments: [pdfBlob],
      name: "Goldeimer Crew Tools"
    });
    Logger.log("✅ PDF verschickt an " + email);
  } catch (e) {
    Logger.log("❌ Fehler: " + e.message);
  }
}

function DEBUG_checkProps() {
  const props = PropertiesService.getScriptProperties().getProperties();
  Logger.log(JSON.stringify(props, null, 2));
}

function uiBuildCrewList() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  try {
    const url = buildCrewList_(festivalId);
    writeCrewListLinkToDashboard_({ festivalId, url });
    toast_(`✅ Crew-Liste erstellt & Link gespeichert!`);
    Logger.log("Crew-Liste URL: " + url);
  } catch (e) {
    toast_("Fehler: " + e.message);
    Logger.log("❌ " + e.message);
  }
}

function buildCrewList_(festivalId) {
  const FOLDER_ID = "1XXMmJgI8B-Hywc_lWNH8jltEK31azPNE";

  const ss = SpreadsheetApp.getActive();

  // ── 1. Festival-Config laden ──────────────────────────────────────────────
  const festSheet = ss.getSheetByName(SHEETS.FESTIVALS);
  const festData  = readSheetAsObjects_(festSheet);
  const festCfg   = festData.rows.find(r =>
    String(r.festival_id || "").trim() === festivalId
  );
  if (!festCfg) throw new Error(`Kein Config-Eintrag für ${festivalId}`);

  const festivalName = String(festCfg.festival_name || festivalId).trim();
  const year         = new Date().getFullYear();
  const fileName     = `${festivalName.toUpperCase().replace(/\s+/g, "-")}-Crew-Liste-${year}`;

  // ── 2. Crew laden & sortieren ─────────────────────────────────────────────
  const appSheet     = ss.getSheetByName(SHEETS.APPLICATIONS);
  const appData      = readSheetAsObjects_(appSheet);
  const validStatuses = ["zugesagt", "akkreditiert", "teilgenommen", "friend"];

  const crew = appData.rows
    .filter(r =>
      String(r.festival_id || "").trim() === festivalId &&
      validStatuses.includes(normalizeStatus_(r.status))
    )
    .sort((a, b) => {
      const rA = ROLE_SORT_ORDER[normalizeRole_(a.role)] || 99;
      const rB = ROLE_SORT_ORDER[normalizeRole_(b.role)] || 99;
      if (rA !== rB) return rA - rB;
      return String(a.last_name || "").localeCompare(String(b.last_name || ""), "de");
    });

  // ── 3. Bestehendes Sheet wiederverwenden oder neu erstellen ───────────────
  const currentSsId = ss.getId();
  let newSS = null;
  const existingUrl = String(festCfg.crew_list_link || "").trim();

  if (existingUrl) {
    try {
      const existingId = existingUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      // Nicht das Hauptspreadsheet wiederverwenden
      if (existingId && existingId !== currentSsId) {
        newSS = SpreadsheetApp.openById(existingId);
        const existing = newSS.getSheetByName("Crew");
        if (existing) {
          existing.clear();
          existing.clearConditionalFormatRules();
        }
        Logger.log("Bestehende Crew-Liste wird aktualisiert.");
      } else {
        Logger.log("Bestehender Link ungültig – neue Datei wird erstellt.");
      }
    } catch (e) {
      Logger.log("Bestehende Datei nicht zugänglich – neue wird erstellt: " + e.message);
      newSS = null;
    }
  }

  if (!newSS) {
    newSS = SpreadsheetApp.create(fileName);
    const newFileId = newSS.getId();
    Logger.log("Neue Crew-Liste erstellt: " + newFileId);
    // In Zielordner verschieben (Drive API v3, Shared-Drive-kompatibel, kein DriveApp)
    try {
      const meta = Drive.Files.get(newFileId, { fields: "parents", supportsAllDrives: true });
      const currentParents = (meta.parents || []).join(",");
      Drive.Files.update(
        {},
        newFileId,
        null,
        { addParents: FOLDER_ID, removeParents: currentParents, supportsAllDrives: true }
      );
      Logger.log("Datei verschoben nach Ordner: " + FOLDER_ID);
    } catch (e) {
      Logger.log("Ordner-Verschiebung fehlgeschlagen: " + e.message);
    }
    // Freigabe: Goldeimer = Bearbeiter, Extern = Betrachter
    try { setGoldeimerrSharing_(newFileId); } catch (se) { Logger.log("Sharing: " + se.message); }
  }

  const sh = newSS.getSheetByName("Crew") || newSS.getActiveSheet();
sh.setName("Crew");

  // ── 4. Header ────────────────────────────────────────────────────────────
  const headers = ["Name", "Pronomen", "Rolle", "Telefonnummer", "Carpass", "Anreiseinfo", "Notizen"];
  sh.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight("bold")
    .setBackground("#444444")
    .setFontColor("#ffffff");
  sh.setFrozenRows(1);

  // ── 5. Daten einfügen ────────────────────────────────────────────────────
  if (crew.length > 0) {
    const rows = crew.map(r => {
      const firstName = String(r.detail_first_name || r.first_name || "").trim();
      const lastName  = String(r.detail_last_name  || r.last_name  || "").trim();
      const isFriend  = normalizeStatus_(r.status) === "friend";
      return [
        [firstName, lastName].filter(Boolean).join(" "),
        String(r.detail_pronouns || "").trim(),
        isFriend ? "Friend" : String(r.role || "").trim(),
        String(r.detail_phone    || "").trim(),
        String(r.detail_carpass  || "").trim(),
        String(r.detail_arrival  || "").trim(),
        "",  // Notizen – leer lassen
      ];
    });

    sh.getRange(2, 1, rows.length, headers.length).setValues(rows);

    // Farbige Markierung nach Rolle
    const roleColors = {
      "LEAD":         "#f4cccc",
      "OPERATOR":     "#fce5cd",
      "SUPPORTI_PLUS":"#d9ead3",
      "SUPPORTI":     "#d9ead3",
      "CATERING":     "#cfe2f3",
      "FRIEND":       "#c9daf8",
    };

    rows.forEach((_, i) => {
      const r          = crew[i];
      const isFriend   = normalizeStatus_(r.status) === "friend";
      const bg         = isFriend ? "#c9daf8" : (roleColors[normalizeRole_(r.role)] || "#ffffff");
      sh.getRange(i + 2, 1, 1, headers.length).setBackground(bg);
    });

    // Notizen-Spalte gelb hinterlegen
    sh.getRange(2, headers.length, rows.length, 1).setBackground("#fff9c4");
  }

  // ── 6. Spaltenbreiten ────────────────────────────────────────────────────
  sh.autoResizeColumns(1, headers.length - 1);
  sh.setColumnWidth(headers.length, 250); // Notizen breiter

  // ── 9. Link in CONFIG_FESTIVALS speichern ────────────────────────────────
  const fileUrl = newSS.getUrl();
  updateCell_(festSheet, festData.headerMap, festCfg.__rowNumber, "crew_list_link", fileUrl);

  return fileUrl;
}

// ═══════════════════════════════════════════════════════════════════════════
// KÜCHEN-CREW-LISTE
// ═══════════════════════════════════════════════════════════════════════════

function uiBuildKitchenCrewList() {
  const festivalId = getActiveFestivalIdOrPrompt_();
  if (!festivalId) return;
  try {
    const url = buildKitchenCrewList_(festivalId);
    writeKitchenCrewListLinkToDashboard_({ festivalId, url });
    toast_(`✅ Küchen-Liste erstellt & Link gespeichert!`);
    Logger.log("Küchen-Liste URL: " + url);
  } catch (e) {
    toast_("Fehler: " + e.message);
    Logger.log("❌ " + e.message);
  }
}

function buildKitchenCrewList_(festivalId) {
  const FOLDER_ID = "1Uba1MP67exqo9sKGdtu9QPUuks1Mc89M"; // Küche-Ordner

  const ss = SpreadsheetApp.getActive();

  // ── 1. Festival-Config laden ──────────────────────────────────────────────
  const festSheet = ss.getSheetByName(SHEETS.FESTIVALS);
  const festData  = readSheetAsObjects_(festSheet);
  const festCfg   = festData.rows.find(r =>
    String(r.festival_id || "").trim() === festivalId
  );
  if (!festCfg) throw new Error(`Kein Config-Eintrag für ${festivalId}`);

  const festivalName = String(festCfg.festival_name || festivalId).trim();
  const year         = new Date().getFullYear();
  const fileName     = `${festivalName.toUpperCase().replace(/\s+/g, "-")}-Küchen-Crew-Liste-${year}`;

  // ── 2. Crew laden & sortieren ─────────────────────────────────────────────
  const appSheet      = ss.getSheetByName(SHEETS.APPLICATIONS);
  const appData       = readSheetAsObjects_(appSheet);
  const validStatuses = ["zugesagt", "akkreditiert", "teilgenommen"];

  const crew = appData.rows
    .filter(r =>
      String(r.festival_id || "").trim() === festivalId &&
      validStatuses.includes(normalizeStatus_(r.status))
    )
    .sort((a, b) => {
      // "nein" bei detail_food → ans Ende
      const foodA = String(a.detail_food || "").trim().toLowerCase();
      const foodB = String(b.detail_food || "").trim().toLowerCase();
      const aIsNo = foodA === "nein";
      const bIsNo = foodB === "nein";
      if (aIsNo !== bIsNo) return aIsNo ? 1 : -1;
      // sonst alphabetisch nach Nachname
      return String(a.last_name || "").localeCompare(String(b.last_name || ""), "de");
    });

  // ── 3. Bestehendes Sheet wiederverwenden oder neu erstellen ───────────────
  const currentSsId = ss.getId();
  let newSS = null;
  const existingUrl = String(festCfg.kitchen_crew_list || "").trim();

  if (existingUrl) {
    try {
      const existingId = existingUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (existingId && existingId !== currentSsId) {
        newSS = SpreadsheetApp.openById(existingId);
        const existing = newSS.getSheetByName("Küche");
        if (existing) {
          existing.clear();
          existing.clearConditionalFormatRules();
          existing.clearDataValidations();
        }
        Logger.log("Bestehende Küchen-Liste wird aktualisiert.");
      } else {
        Logger.log("Bestehender Link ungültig – neue Datei wird erstellt.");
      }
    } catch (e) {
      Logger.log("Bestehende Datei nicht zugänglich – neue wird erstellt: " + e.message);
      newSS = null;
    }
  }

  if (!newSS) {
    newSS = SpreadsheetApp.create(fileName);
    const newFileId = newSS.getId();
    Logger.log("Neue Küchen-Liste erstellt: " + newFileId);
    // In Zielordner verschieben (Drive API v3, Shared-Drive-kompatibel)
    try {
      const meta = Drive.Files.get(newFileId, { fields: "parents", supportsAllDrives: true });
      const currentParents = (meta.parents || []).join(",");
      Drive.Files.update(
        {},
        newFileId,
        null,
        { addParents: FOLDER_ID, removeParents: currentParents, supportsAllDrives: true }
      );
      Logger.log("Datei verschoben nach Ordner: " + FOLDER_ID);
    } catch (e) {
      Logger.log("Ordner-Verschiebung fehlgeschlagen: " + e.message);
    }
    // Freigabe: Goldeimer = Bearbeiter, Extern = Betrachter
    try { setGoldeimerrSharing_(newFileId); } catch (se) { Logger.log("Sharing: " + se.message); }
  }

  const sh = newSS.getSheetByName("Küche") || newSS.getActiveSheet();
  sh.setName("Küche");

  // ── 4. Header ────────────────────────────────────────────────────────────
  const headers = ["Vorname", "Nachname", "Verpflegung", "Allergien", "Anreise", "bezahlt?"];
  sh.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight("bold")
    .setBackground("#444444")
    .setFontColor("#ffffff");
  sh.setFrozenRows(1);

  // ── 5. Daten einfügen ────────────────────────────────────────────────────
  if (crew.length > 0) {
    const rows = crew.map(r => {
      const firstName  = String(r.detail_first_name || r.first_name || "").trim();
      const lastName   = String(r.detail_last_name  || r.last_name  || "").trim();
      const food       = String(r.detail_food       || "").trim();
      const allergies  = String(r.detail_allergies  || "").trim();
      const arrival    = String(r.detail_arrival    || "").trim();
      return [firstName, lastName, food, allergies, arrival, false];
    });

    sh.getRange(2, 1, rows.length, headers.length).setValues(rows);

    // Checkboxen in der "bezahlt?"-Spalte (Spalte 6)
    const checkboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    sh.getRange(2, 6, rows.length, 1).setDataValidation(checkboxRule);

    // Farben: hellblau für alle, hellrot für "nein"-Verpflegung
    rows.forEach((row, i) => {
      const isNo = String(row[2] || "").trim().toLowerCase() === "nein";
      const bg = isNo ? "#f4cccc" : "#cfe2f3";
      sh.getRange(i + 2, 1, 1, headers.length).setBackground(bg);
    });

    // "bezahlt?"-Spalte grün hinterlegen (Abhak-Spalte)
    sh.getRange(2, 6, rows.length, 1).setBackground("#d9ead3");
  }

  // ── 6. Spaltenbreiten ────────────────────────────────────────────────────
  sh.autoResizeColumns(1, 5);
  sh.setColumnWidth(6, 100); // bezahlt? etwas schmaler

  // ── 7. Link in CONFIG_FESTIVALS speichern ────────────────────────────────
  const fileUrl = newSS.getUrl();
  updateCell_(festSheet, festData.headerMap, festCfg.__rowNumber, "kitchen_crew_list", fileUrl);

  return fileUrl;
}


/* =========================
 * NEWBIE-BRIEFING SYSTEM
 * ========================= */

/**
 * Läuft alle 10 Minuten. Findet neue Anmeldungen (Status leer) und schickt
 * die Bestätigungsmail. Markiert anschließend "Link geschickt".
 */
function processNewNewbieRegistrations() {
  Logger.log("▶ processNewNewbieRegistrations");

  const respSS    = SpreadsheetApp.openById(NEWBIE_BRIEFING_RESPONSES_ID);
  const respSheet = respSS.getSheets()[0];
  const data      = readSheetAsObjects_(respSheet);

  const newRows = data.rows.filter(r => !String(r["Status"] || "").trim());
  if (newRows.length === 0) { Logger.log("Keine neuen Anmeldungen."); return; }

  Logger.log(`${newRows.length} neue Anmeldung(en) gefunden`);

  newRows.forEach(respRow => {
    const email        = normEmail_(respRow["E-Mail-Adresse"]);
    const firstName    = String(respRow["Vorname"] || "").trim();
    const festivalName = String(respRow["Bei welchem Festival bist du dabei?"] || "").trim();

    if (!email || !festivalName) {
      _markNewbieRow_(respRow.__rowNumber, "Status", "Fehler: Daten unvollständig");
      return;
    }

    const cfg = _getNewbieBriefingConfig_(festivalName);
    if (!cfg.preBriefing || !cfg.briefingCall) {
      Logger.log(`⚠ Config fehlt für '${festivalName}' – newbie_pre_briefing / newbie_briefing_call prüfen`);
      return;
    }

    // Briefing-Datum prüfen: nur senden wenn Briefing noch nicht vorbei ist
    const briefingDate = _parseBriefingDate_(cfg.preBriefing);
    if (briefingDate) {
      briefingDate.setHours(23, 59, 59, 0);
      if (briefingDate < new Date()) {
        Logger.log(`⏭ Briefing für '${festivalName}' bereits vorbei (${cfg.preBriefing}) – übersprungen`);
        _markNewbieRow_(respRow.__rowNumber, "Status", "Briefing vorbei");
        return;
      }
    }

    try {
      // Zuerst Status setzen (verhindert Doppelversand falls Trigger erneut läuft)
      _markNewbieRow_(respRow.__rowNumber, "Status", "Link geschickt");

      GmailApp.sendEmail(email, `Einladung: Dein Goldeimer Newbie-Briefing @ ${festivalName}`, "", {
        htmlBody: _buildNewbieConfirmationHtml_(firstName, cfg.preBriefing, cfg.briefingCall),
        name: MAIL_CFG.SENDER_NAME,
      });
      Logger.log(`✓ Bestätigung → ${email} (${festivalName})`);
    } catch (err) {
      Logger.log(`✗ Bestätigung FEHLER ${email}: ${err.message}`);
      _markNewbieRow_(respRow.__rowNumber, "Status", "Fehler beim Senden");
    }
  });
}

/**
 * Täglicher 8-Uhr-Trigger: Schickt Erinnerungsmail an alle Angemeldeten,
 * deren Newbie-Briefing heute stattfindet.
 */
function sendNewbieBriefingReminder() {
  Logger.log("▶ sendNewbieBriefingReminder");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ss = SpreadsheetApp.getActive();
  const festSheet = ss.getSheetByName(SHEETS.FESTIVALS);
  if (!festSheet) { Logger.log("⚠ CONFIG_FESTIVALS nicht gefunden"); return; }
  const festData = readSheetAsObjects_(festSheet);

  // Festivals mit heutigem Briefing-Datum
  const todayFestivals = festData.rows.filter(r => {
    const d = _parseBriefingDate_(String(r["newbie_pre_briefing"] || "").trim());
    if (!d) return false;
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  if (todayFestivals.length === 0) {
    Logger.log("Kein Newbie-Briefing heute – fertig.");
    return;
  }
  Logger.log(`Briefings heute: ${todayFestivals.map(f => f["festival_name"]).join(", ")}`);

  // Anmeldeliste öffnen
  const respSS    = SpreadsheetApp.openById(NEWBIE_BRIEFING_RESPONSES_ID);
  const respSheet = respSS.getSheets()[0];
  const respData  = readSheetAsObjects_(respSheet);

  let sentOk = 0, sentFailed = 0;

  todayFestivals.forEach(festRow => {
    const festivalName = String(festRow["festival_name"]        || "").trim();
    const preBriefing  = String(festRow["newbie_pre_briefing"]  || "").trim();
    const briefingCall = String(festRow["newbie_briefing_call"] || "").trim();

    if (!briefingCall) {
      Logger.log(`⚠ newbie_briefing_call fehlt für ${festivalName} – übersprungen`);
      return;
    }

    // Uhrzeit aus preBriefing extrahieren, z.B. "18:30 Uhr"
    const timeMatch = preBriefing.match(/(\d{1,2}:\d{2})\s*Uhr/i);
    const timeStr   = timeMatch ? `${timeMatch[1]} Uhr` : "";

    // Alle Angemeldeten für dieses Festival
    const registrations = respData.rows.filter(r =>
      String(r["Bei welchem Festival bist du dabei?"] || "").trim() === festivalName
    );
    Logger.log(`${festivalName}: ${registrations.length} Angemeldete`);

    registrations.forEach(respRow => {
      const email     = normEmail_(respRow["E-Mail-Adresse"]);
      const firstName = String(respRow["Vorname"] || "").trim();
      if (!email) return;
      try {
        GmailApp.sendEmail(email, "Heute: Goldeimer Newbie-Briefing 🔥", "", {
          htmlBody: _buildNewbieReminderHtml_(firstName, timeStr, briefingCall),
          name: MAIL_CFG.SENDER_NAME,
        });
        sentOk++;
        Logger.log(`  ✓ Reminder → ${email}`);
      } catch (err) {
        sentFailed++;
        Logger.log(`  ✗ Reminder FEHLER ${email}: ${err.message}`);
      }
    });
  });

  Logger.log(`▶ Reminder FERTIG | ok=${sentOk} | fehler=${sentFailed}`);
}

/** Test-Funktion: Reminder manuell auslösen (ignoriert heutiges Datum, schickt an alle) */
function uiSendNewbieBriefingReminderTest() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert(
    "Newbie-Briefing Reminder TEST",
    "Schickt die Erinnerungsmail an ALLE Festivals, bei denen newbie_briefing_call gesetzt ist – unabhängig vom Datum. Nur für Tests!",
    ui.ButtonSet.OK_CANCEL
  );
  if (resp !== ui.Button.OK) return;

  const ss = SpreadsheetApp.getActive();
  const festData = readSheetAsObjects_(ss.getSheetByName(SHEETS.FESTIVALS));
  const respSS   = SpreadsheetApp.openById(NEWBIE_BRIEFING_RESPONSES_ID);
  const respData = readSheetAsObjects_(respSS.getSheets()[0]);
  const testEmail = Session.getActiveUser().getEmail();

  let sent = 0;
  festData.rows.forEach(festRow => {
    const festivalName = String(festRow["festival_name"]        || "").trim();
    const preBriefing  = String(festRow["newbie_pre_briefing"]  || "").trim();
    const briefingCall = String(festRow["newbie_briefing_call"] || "").trim();
    if (!briefingCall) return;

    const timeMatch = preBriefing.match(/(\d{1,2}:\d{2})\s*Uhr/i);
    const timeStr   = timeMatch ? `${timeMatch[1]} Uhr` : "";
    const sample    = respData.rows.find(r =>
      String(r["Bei welchem Festival bist du dabei?"] || "").trim() === festivalName
    );
    const firstName = sample ? String(sample["Vorname"] || "").trim() : "Testperson";

    GmailApp.sendEmail(testEmail, `[TEST] Newbie-Reminder @ ${festivalName}`, "", {
      htmlBody: _buildNewbieReminderHtml_(firstName, timeStr, briefingCall),
      name: MAIL_CFG.SENDER_NAME,
    });
    sent++;
  });

  toast_(`Test-Reminder gesendet: ${sent} Festival(e) → ${testEmail}`);
}

/**
 * Einmalig ausführen: Installiert onFormSubmit- und täglichen 8-Uhr-Trigger.
 * Danach läuft alles automatisch.
 */
function uiInstallNewbieTriggers() {
  // Crew-Tools-Spreadsheet-ID speichern (wird von Triggern benötigt die außerhalb laufen)
  const crewToolsId = SpreadsheetApp.getActive().getId();
  PropertiesService.getScriptProperties().setProperty("CREW_TOOLS_SS_ID", crewToolsId);
  Logger.log("Crew Tools SS ID gespeichert: " + crewToolsId);

  // Alle alten Newbie-Trigger löschen (inkl. alter onFormSubmit-Variante)
  ScriptApp.getProjectTriggers().forEach(t => {
    const fn = t.getHandlerFunction();
    if (["onNewbieBriefingFormSubmit", "processNewNewbieRegistrations", "sendNewbieBriefingReminder"].includes(fn)) {
      ScriptApp.deleteTrigger(t);
      Logger.log("Alter Trigger gelöscht: " + fn);
    }
  });

  // 1. Alle 10 Minuten: neue Anmeldungen prüfen + Bestätigungsmail senden
  ScriptApp.newTrigger("processNewNewbieRegistrations")
    .timeBased()
    .everyMinutes(10)
    .create();
  Logger.log("✓ Trigger erstellt: processNewNewbieRegistrations (alle 10 Min)");

  // 2. Täglich 8:00 Uhr: Erinnerungsmail am Briefing-Tag
  ScriptApp.newTrigger("sendNewbieBriefingReminder")
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .create();
  Logger.log("✓ Trigger erstellt: sendNewbieBriefingReminder (täglich 8 Uhr)");

  toast_("✅ Newbie-Trigger aktiv: Bestätigung alle 10 Min + Reminder täglich 8 Uhr");
}

// --- Private Hilfsfunktionen ---

function _getNewbieBriefingConfig_(festivalName) {
  const festMaps = buildFestivalMaps_();

  // Debug: alle bekannten Festivalnamen + Zeichencodes des Suchbegriffs loggen
  const allNames = [...festMaps.idByName.keys()];
  Logger.log(`Bekannte Festivalnamen: ${JSON.stringify(allNames)}`);
  Logger.log(`Suche nach: "${festivalName}" | Zeichencodes: ${[...festivalName].map(c => c.charCodeAt(0)).join(",")}`);

  // Erst exakter Match, dann case-insensitiv + trim als Fallback
  let festivalId = festMaps.idByName.get(festivalName);
  if (!festivalId) {
    const needle = festivalName.toLowerCase().trim();
    for (const [key, val] of festMaps.idByName) {
      if (key.toLowerCase().trim() === needle) { festivalId = val; break; }
    }
  }
  if (!festivalId) {
    Logger.log(`_getNewbieBriefingConfig_: '${festivalName}' nicht in CONFIG_FESTIVALS – festival_name prüfen`);
    return {};
  }
  const raw = festMaps.fullDataById.get(festivalId) || {};
  const d   = {};
  Object.keys(raw).forEach(k => { d[k.toLowerCase().trim()] = raw[k]; });
  return {
    preBriefing:  String(d["newbie_pre_briefing"]  || "").trim(),
    briefingCall: String(d["newbie_briefing_call"] || "").trim(),
  };
}

/**
 * Parst deutsches Datums-Zeitformat "dd.MM.yyyy HH:mm" in ein Date-Objekt.
 * Wird z.B. für detail_last_sent_at verwendet.
 */
function parseDEDatetime_(str) {
  if (!str) return null;
  const m = String(str).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]), parseInt(m[4]), parseInt(m[5]));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Extrahiert Date aus Strings wie "Mittwoch (10.06.) um 18:30 Uhr".
 * Sucht nach DD.MM. Pattern.
 */
function _parseBriefingDate_(text) {
  const m = String(text || "").match(/(\d{1,2})\.(\d{1,2})\./);
  if (!m) return null;
  const d = new Date(new Date().getFullYear(), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Wandelt einen Freitext-Block mit Meeting-Link + Telefondaten in HTML um:
 *   - URLs → klickbare <a>-Links
 *   - Zeilenumbrüche → <br>
 */
function _formatCallBlock_(text) {
  return String(text || "")
    .replace(/(https?:\/\/[^\s<\n]+)/g, '<a href="$1">$1</a>')
    .replace(/\n/g, "<br>");
}

function _buildNewbieConfirmationHtml_(firstName, preBriefing, briefingCall) {
  return `<meta charset="UTF-8">
<p>Moini${firstName ? " " + firstName : ""},</p>

<p>sehr cool, dass du dieses Jahr mit Goldeimer auf's Festival kommst! &#127881;</p>

<p>Wir treffen uns am <strong>${preBriefing}</strong> für ein erstes Briefing. Dort bekommst du nochmal wichtige Infos zu Goldeimer und dem Ablauf auf'm Festival.</p>

<p>Bitte trag dir den Termin im Kalender ein, damit du safe dabei bist.</p>

<p>${_formatCallBlock_(briefingCall)}</p>

<p>Wir freuen uns &#128293;<br>
Tanja und die Goldis</p>`;
}

function _buildNewbieReminderHtml_(firstName, timeStr, briefingCall) {
  return `<meta charset="UTF-8">
<p>Moini${firstName ? " " + firstName : ""},</p>

<p>kleine Erinnerung: Wir treffen uns <strong>heute${timeStr ? " um " + timeStr : ""}</strong> für das Goldeimer Briefing. Es dauert max. 1,5 Stunden – danach bist du bestens vorbereitet für ein fantastisches Festival. Bring gern deine Fragen mit!</p>

<p>${_formatCallBlock_(briefingCall)}</p>

<p>Bis später &#128293;<br>
Tanja und die Goldis</p>`;
}

function _markNewbieRow_(rowNum, colName, value) {
  try {
    const sheet  = SpreadsheetApp.openById(NEWBIE_BRIEFING_RESPONSES_ID).getSheets()[0];
    const data   = readSheetAsObjects_(sheet);
    const colIdx = data.headerMap[colName];
    if (colIdx !== undefined) sheet.getRange(rowNum, colIdx + 1).setValue(value);
  } catch (e) {
    Logger.log("_markNewbieRow_ FEHLER: " + e.message);
  }
}