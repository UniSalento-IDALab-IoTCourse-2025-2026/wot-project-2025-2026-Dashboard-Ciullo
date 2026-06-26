import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientDetail from './pages/PatientDetail'

function ProtectedRoute({ children, ruolo }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ background: '#1a1a2e', minHeight: '100vh' }} />
  if (!user) return <Navigate to="/login" />
  if (ruolo && user.ruolo !== ruolo) return <Navigate to="/login" />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ background: '#1a1a2e', minHeight: '100vh' }} />

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.ruolo === 'medico' ? '/medico' : '/paziente'} /> : <Login />} />
      <Route path="/paziente" element={
        <ProtectedRoute ruolo="paziente">
          <PatientDashboard />
        </ProtectedRoute>
      } />
      <Route path="/medico" element={
        <ProtectedRoute ruolo="medico">
          <DoctorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/medico/paziente/:id" element={
        <ProtectedRoute ruolo="medico">
          <PatientDetail />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}