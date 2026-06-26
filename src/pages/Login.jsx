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
      // Redirect in base al ruolo
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
      background: '#1a1a2e', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: '#16213e', borderRadius: 12, padding: '2rem',
        width: 360, border: '0.5px solid #1e2a4a',
      }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: '#fff', margin: 0 }}>SMARTCARE</h1>
          <p style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Accedi al tuo account</p>
        </div>

        {errore && (
          <div style={{ background: '#2a0000', color: '#F09595', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {errore}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                background: '#0f1731', border: '0.5px solid #1e2a4a',
                color: '#fff', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                background: '#0f1731', border: '0.5px solid #1e2a4a',
                color: '#fff', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '10px', borderRadius: 8,
              background: '#378ADD', border: 'none',
              color: '#fff', fontSize: 14, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  )
}