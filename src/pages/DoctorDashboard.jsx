// DoctorDashboard.jsx
// Dashboard principale vista dal medico dopo il login
//
// Layout:
//   Header con contatori warning/critical
//   Tabella pazienti con vitali in tempo reale
//   Lista alert filtrabili per severity
//
// Notifiche Chrome: popup quando arriva un nuovo alert critical

import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const alertStyle = {
  warning:  { bg: '#2a1a00', color: '#FAC775' },
  critical: { bg: '#2a0000', color: '#F09595' },
}

const sevBadge = {
  normal:   { bg: '#085041', color: '#9FE1CB', label: 'Normale' },
  warning:  { bg: '#854F0B', color: '#FAC775', label: 'Attenzione' },
  critical: { bg: '#7A1F1F', color: '#F09595', label: 'Critico' },
}

export default function DoctorDashboard() {
  const { user, logout }          = useAuth()
  const navigate                  = useNavigate()
  const [pazienti, setPazienti]   = useState([])
  const [alerts, setAlerts]       = useState([])
  const [latestMap, setLatestMap] = useState({})
  const [filtro, setFiltro]       = useState('tutti')
  const [lastUpd, setLastUpd]     = useState('—')
  const [showModal, setShowModal] = useState(false)
  const [newPaz, setNewPaz]       = useState({ nome: '', cognome: '', email: '', password: '', telefono: '', codice_fiscale: '', patientID: '' })
  const [erroreModal, setErroreModal] = useState('')

  // Tiene traccia dell'ultimo alert notificato per non ripetere la stessa notifica
  const lastNotifiedRef = useRef(null)

  // Chiede il permesso notifiche Chrome al primo caricamento
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Mostra notifica Chrome quando arriva un NUOVO alert critical
  useEffect(() => {
    if (alerts.length === 0) return
    const ultimo = alerts[0]
    if (
      ultimo?.anomaly?.severity === 'critical' &&
      Notification.permission === 'granted' &&
      ultimo._id !== lastNotifiedRef.current
    ) {
      lastNotifiedRef.current = ultimo._id
      new Notification('SMARTCARE — Alert Critico', {
        body: `Paziente ${ultimo.pazienteNome} — BPM ${Math.round(ultimo.bpm)} | Temp ${ultimo.temp_c?.toFixed(1)}°C`,
        icon: '/vite.svg',
      })
    }
  }, [alerts])

  useEffect(() => {
    const token   = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }

    const fetchAll = async () => {
      try {
        const paz = await axios.get('/api/patients', { headers })
        setPazienti(paz.data)

        // Vitali più recenti per ogni paziente
        const latestData = {}
        await Promise.all(paz.data.map(async p => {
          if (!p.patientID) return
          try {
            const res = await axios.get(`/api/vitals/${p.patientID}/latest`)
            latestData[p.patientID] = res.data
          } catch (err) {
            console.error('Errore fetch vitali paziente:', err.message)
          }
        }))
        setLatestMap(latestData)

        // Alert di tutti i pazienti uniti in una lista ordinata
        const allAlerts = []
        await Promise.all(paz.data.map(async p => {
          if (!p.patientID) return
          try {
            const res = await axios.get(`/api/alerts/${p.patientID}`)
            res.data.forEach(a => allAlerts.push({ ...a, pazienteNome: `${p.nome} ${p.cognome}` }))
          } catch (err) {
            console.error('Errore fetch alert paziente:', err.message)
          }
        }))
        allAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        setAlerts(allAlerts)
        setLastUpd(new Date().toLocaleTimeString())
      } catch (e) {
        console.error('Errore fetch:', e)
      }
    }
    fetchAll()
    const t = setInterval(fetchAll, 10000)
    return () => clearInterval(t)
  }, [])

  const aggiungiPaziente = async () => {
    setErroreModal('')
    const token   = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }
    try {
      await axios.post('/api/patients', newPaz, { headers })
      setShowModal(false)
      setNewPaz({ nome: '', cognome: '', email: '', password: '', telefono: '', codice_fiscale: '', patientID: '' })
    } catch (e) {
      setErroreModal(e.response?.data?.error || 'Errore durante la registrazione')
    }
  }

  const alertsFiltrati = filtro === 'tutti' ? alerts : alerts.filter(a => a.anomaly?.severity === filtro)
  const nWarning       = alerts.filter(a => a.anomaly?.severity === 'warning').length
  const nCritical      = alerts.filter(a => a.anomaly?.severity === 'critical').length
  const ROW_H          = 41
  const EMPTY_ROWS     = 6
  const tableMinHeight = (EMPTY_ROWS + 1) * ROW_H

  return (
    <div style={{
      background: '#1a1a2e', height: '100vh', padding: '16px 20px',
      fontFamily: 'sans-serif', color: '#fff', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: 1 }}>SMARTCARE — Vista medico</div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
            Dr. {user?.nome} {user?.cognome} · aggiornato {lastUpd}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowModal(true)} style={{
            background: '#1D9E75', border: 'none', color: '#fff',
            padding: '5px 14px', borderRadius: 20, fontSize: 11,
            cursor: 'pointer', fontWeight: 500,
          }}>+ Paziente</button>
          <button onClick={() => { logout(); navigate('/login') }} style={{
            background: '#16213e', border: '0.5px solid #555', color: '#888',
            padding: '5px 14px', borderRadius: 20, fontSize: 11, cursor: 'pointer'
          }}>Esci</button>
        </div>
      </div>

      {/* CARD CONTATORI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, flexShrink: 0 }}>
        <div style={{ background: '#16213e', borderRadius: 10, padding: '14px 12px', borderLeft: '3px solid #1D9E75' }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Pazienti monitorati</div>
          <div style={{ fontSize: 28, fontWeight: 500 }}>{pazienti.length}</div>
        </div>
        <div style={{ background: '#16213e', borderRadius: 10, padding: '14px 12px', borderLeft: '3px solid #EF9F27' }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Alert warning</div>
          <div style={{ fontSize: 28, fontWeight: 500, color: '#FAC775' }}>{nWarning}</div>
        </div>
        <div style={{ background: '#16213e', borderRadius: 10, padding: '14px 12px', borderLeft: '3px solid #E24B4A' }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Alert critical</div>
          <div style={{ fontSize: 28, fontWeight: 500, color: '#F09595' }}>{nCritical}</div>
        </div>
      </div>

      {/* TABELLA PAZIENTI */}
      <div style={{ background: '#16213e', borderRadius: 10, padding: 14, flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>Pazienti attivi</div>
        <div style={{ minHeight: tableMinHeight, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Paziente', 'BPM', 'Temp', 'HRV', 'Severity', 'Ultimo agg.', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', color: '#555', fontWeight: 400, padding: '6px 8px', borderBottom: '1px solid #1e2a4a' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pazienti.length === 0 ? (
                <tr><td colSpan={7} style={{ color: '#555', padding: 12, textAlign: 'center' }}>Nessun paziente registrato</td></tr>
              ) : pazienti.map(p => {
                const v   = latestMap[p.patientID]
                const sev = v?.anomaly?.severity || 'normal'
                const sb  = sevBadge[sev] || sevBadge.normal
                return (
                  <tr key={p._id}>
                    <td style={{ padding: '8px 8px', borderBottom: '1px solid #1e2a4a', color: '#fff', fontWeight: 500 }}>
                      {p.nome} {p.cognome}
                      <div style={{ fontSize: 10, color: '#555' }}>{p.patientID}</div>
                    </td>
                    <td style={{ padding: '8px 8px', borderBottom: '1px solid #1e2a4a', color: '#ccc' }}>{v?.bpm ? Math.round(v.bpm) : '—'}</td>
                    <td style={{ padding: '8px 8px', borderBottom: '1px solid #1e2a4a', color: '#ccc' }}>{v?.temp_c ? `${v.temp_c.toFixed(1)}°C` : '—'}</td>
                    <td style={{ padding: '8px 8px', borderBottom: '1px solid #1e2a4a', color: '#ccc' }}>{v?.hrv_ms ? `${Math.round(v.hrv_ms)} ms` : '—'}</td>
                    <td style={{ padding: '8px 8px', borderBottom: '1px solid #1e2a4a' }}>
                      <span style={{ background: sb.bg, color: sb.color, padding: '2px 8px', borderRadius: 12, fontSize: 10 }}>{sb.label}</span>
                    </td>
                    <td style={{ padding: '8px 8px', borderBottom: '1px solid #1e2a4a', color: '#555', fontSize: 11 }}>
                      {v ? new Date(v.timestamp).toLocaleTimeString() : '—'}
                    </td>
                    <td style={{ padding: '8px 8px', borderBottom: '1px solid #1e2a4a' }}>
                      <button onClick={() => navigate(`/medico/paziente/${p._id.toString()}`)} style={{
                        background: '#16213e', border: '0.5px solid #378ADD', color: '#378ADD',
                        padding: '3px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer'
                      }}>Dettaglio →</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* LISTA ALERT */}
      <div style={{ background: '#16213e', borderRadius: 10, padding: 14, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8, flexShrink: 0 }}>Alert recenti — tutti i pazienti</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexShrink: 0 }}>
          {['tutti', 'warning', 'critical'].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: '3px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
              background: filtro === f ? '#378ADD' : 'transparent',
              color:      filtro === f ? '#fff' : '#888',
              border:     `0.5px solid ${filtro === f ? '#378ADD' : '#333'}`,
            }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {alertsFiltrati.length === 0 ? (
            <p style={{ color: '#555', fontSize: 12 }}>Nessun alert</p>
          ) : alertsFiltrati.map(a => {
            const as    = alertStyle[a.anomaly?.severity] || alertStyle.warning
            const flags = [...(a.anomaly?.flags||[]), ...(a.anomaly?.critical||[])].join(' · ')
            return (
              <div key={a._id} style={{
                background: as.bg, borderRadius: 6, padding: '6px 10px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 11, color: as.color }}>
                  {a.pazienteNome} — {a.anomaly?.severity?.toUpperCase()} · BPM {Math.round(a.bpm)} | Temp {a.temp_c?.toFixed(1)}°C
                  {flags ? ` · ${flags}` : ''}
                </span>
                <span style={{ fontSize: 10, color: '#555', whiteSpace: 'nowrap', marginLeft: 8 }}>
                  {new Date(a.timestamp).toLocaleTimeString()}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL AGGIUNGI PAZIENTE */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{ background: '#16213e', borderRadius: 12, padding: '1.5rem', width: 400, border: '0.5px solid #1e2a4a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Nuovo paziente</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            {erroreModal && (
              <div style={{ background: '#2a0000', color: '#F09595', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                {erroreModal}
              </div>
            )}

            {[
              { key: 'nome',           label: 'Nome',           type: 'text' },
              { key: 'cognome',        label: 'Cognome',        type: 'text' },
              { key: 'email',          label: 'Email',          type: 'email' },
              { key: 'password',       label: 'Password',       type: 'password' },
              { key: 'telefono',       label: 'Telefono',       type: 'text' },
              { key: 'codice_fiscale', label: 'Codice fiscale', type: 'text' },
              { key: 'patientID',      label: 'Patient ID',     type: 'text' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={newPaz[f.key]}
                  onChange={e => setNewPaz({ ...newPaz, [f.key]: e.target.value })}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    background: '#0f1731', border: '0.5px solid #1e2a4a',
                    color: '#fff', fontSize: 13, outline: 'none',
                  }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={aggiungiPaziente} style={{
                flex: 1, padding: '10px', borderRadius: 8,
                background: '#1D9E75', border: 'none',
                color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>Aggiungi paziente</button>
              <button onClick={() => setShowModal(false)} style={{
                padding: '10px 16px', borderRadius: 8,
                background: 'transparent', border: '0.5px solid #555',
                color: '#888', fontSize: 13, cursor: 'pointer',
              }}>Annulla</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}