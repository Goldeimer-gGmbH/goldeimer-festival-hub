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
        height: '100vh', flexDirection: 'column', gap: 16
      }}>
        <div style={{
          width: 60, height: 60, background: '#ffe500',
          borderRadius: 14, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 32
        }}>
          🚽
        </div>
        <p style={{ color: '#888', fontSize: 14 }}>Lädt...</p>
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
