import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthContext'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import FestivalPage from './pages/FestivalPage'
import InfosPage from './pages/InfosPage'
import ProfilPage from './pages/ProfilPage'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 20,
        background: 'var(--gelb)',
      }}>
        <div style={{
          width: 72, height: 72, background: 'var(--schwarz)',
          borderRadius: 12, border: '3px solid var(--schwarz)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36
        }}>
          🚽
        </div>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
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
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/festival/:id" element={<FestivalPage />} />
      <Route path="/infos" element={<InfosPage />} />
      <Route path="/profil" element={<ProfilPage />} />
      <Route path="*" element={<Navigate to="/" />} />
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
