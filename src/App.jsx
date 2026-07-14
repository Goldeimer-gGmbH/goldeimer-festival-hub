import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthContext'
import LoginPage    from './pages/LoginPage'
import HomePage     from './pages/HomePage'
import FestivalPage from './pages/FestivalPage'
import InfosPage    from './pages/InfosPage'
import ProfilPage   from './pages/ProfilPage'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 20,
        background: 'var(--gelb)',
      }}>
        <img src="/goldeimer-logo.png" alt="Goldeimer" style={{ height: 48, objectFit: 'contain' }} />
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 13, letterSpacing: '0.15em', color: 'var(--schwarz)', opacity: 0.6,
        }}>
          LÄDT...
        </div>
      </div>
    )
  }

  // Wenn Profil im Cache ist, App zeigen und Session im Hintergrund prüfen.
  // Nur zur LoginPage, wenn weder User noch gecachtes Profil vorhanden sind.
  if (!user && !profile) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/"             element={<HomePage />} />
      <Route path="/festival/:id" element={<FestivalPage />} />
      <Route path="/infos"        element={<InfosPage />} />
      <Route path="/profil"       element={<ProfilPage />} />
      <Route path="*"             element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
