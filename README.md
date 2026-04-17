# Goldeimer Festival Hub

PWA für die Goldeimer Crew – gebaut mit React + Vite + Supabase.

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Die App läuft dann auf http://localhost:5173

## Deployment auf Netlify (empfohlen)

1. Repository mit Netlify verbinden
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Deploy!

## Technologie

- **React** – UI
- **Vite** – Build Tool + PWA Plugin
- **Supabase** – Datenbank + Auth (Magic Link)
- **React Router** – Navigation

## Struktur

```
src/
  components/
    AuthContext.jsx    – Login-Status verwalten
  pages/
    LoginPage.jsx      – Magic Link Login
    HomePage.jsx       – Festival-Übersicht
    FestivalPage.jsx   – Festival-Details, Checklisten, Feedback
    InfosPage.jsx      – Globale Anleitungen
    ProfilPage.jsx     – Mein Profil
  lib/
    supabase.js        – Supabase Client
```
