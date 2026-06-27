// Login.jsx
// Pagina di login — primo schermo che vede l'utente
//
// Dopo il login il backend restituisce un token JWT e il ruolo dell'utente.
// In base al ruolo l'utente viene reindirizzato:
//   - paziente -> /paziente (dashboard vitali)
//   - medico   -> /medico  (dashboard overview pazienti)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore]     = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }               = useAuth()
  const navigate                = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrore('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.ruolo === 'medico') navigate('/medico')
      else navigate('/paziente')
    } catch (err) {
      setErrore(err.response?.data?.error || 'Errore di accesso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#F0F4F8', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: '#FFFFFF', borderRadius: 12, padding: '2rem',
        width: 360, border: '1px solid #E2EBF6',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1A202C', margin: 0 }}>SMARTCARE</h1>
          <p style={{ fontSize: 13, color: '#8FA3BF', marginTop: 4 }}>Accedi al tuo account</p>
        </div>

        {errore && (
          <div style={{ background: '#FFF1F1', color: '#C53030', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #FEB2B2' }}>
            {errore}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: '#8FA3BF', display: 'block', marginBottom: 6, fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                background: '#F0F6FF', border: '1px solid #E2EBF6',
                color: '#2D3748', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: '#8FA3BF', display: 'block', marginBottom: 6, fontWeight: 500 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                background: '#F0F6FF', border: '1px solid #E2EBF6',
                color: '#2D3748', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '10px', borderRadius: 8,
              background: '#60A5FA', border: 'none',
              color: '#fff', fontSize: 14, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 1px 4px rgba(96,165,250,0.3)',
            }}
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  )
}