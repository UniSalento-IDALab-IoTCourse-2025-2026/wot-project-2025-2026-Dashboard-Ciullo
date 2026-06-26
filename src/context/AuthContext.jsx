// AuthContext.jsx
// Contesto React per la gestione dell'autenticazione
//
// Fornisce a tutta l'app le informazioni sull'utente loggato
// e le funzioni di login/logout.
//
// Funzionamento:
// - Al caricamento dell'app controlla se esiste un token nel localStorage
// - Se esiste, chiama /auth/me per recuperare i dati dell'utente
// - Se il token non è valido lo rimuove e mostra il login
//
// Il token JWT viene salvato nel localStorage del browser
// e inviato in ogni richiesta nell'header Authorization: Bearer <token>

import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Controlla se esiste un token salvato dal login precedente
    const token = localStorage.getItem('token')
    if (token) {
      axios.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setUser(res.data)
      }).catch(() => {
        // Token scaduto o non valido — rimuovi e mostra login
        localStorage.removeItem('token')
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    // Chiama /auth/login, salva il token e aggiorna lo stato utente
    const res = await axios.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    // Rimuove il token e reimposta lo stato utente a null
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}