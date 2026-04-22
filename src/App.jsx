import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthContext'

// Seiten erst laden wenn sie gebraucht werden → kleineres initiales Bundle
const LoginPage    = lazy(() => import('./pages/LoginPage'))
const HomePage     = lazy(() => import('./pages/HomePage'))
const FestivalPage = lazy(() => import('./pages/FestivalPage'))
const InfosPage    = lazy(() => import('./pages/InfosPage'))
const ProfilPage   = lazy(() => import('./pages/ProfilPage'))

// Minimaler Splash für Lazy-Loads (erscheint nur bei sehr langsamen Verbindungen)
function PageFallback() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--papier)',
    }}>
      <img src="/goldeimer-logo.png" alt="Goldeimer" style={{ height: 40, opacity: 0.5 }} />
    </div>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

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
          fontSize: 13, letterSpacing: '0.15em', color: 'var(--schwarz)',
          opacity: 0.6,
        }}>
          LÄDT...
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/"              element={<HomePage />} />
        <Route path="/festival/:id"  element={<FestivalPage />} />
        <Route path="/infos"         element={<InfosPage />} />
        <Route path="/profil"        element={<ProfilPage />} />
        <Route path="*"              element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
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
