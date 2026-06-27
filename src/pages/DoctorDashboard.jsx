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
  warning:  { bg: '#FFF8ED', color: '#B45309', border: '#FCD34D' },
  critical: { bg: '#FFF1F1', color: '#C53030', border: '#FEB2B2' },
}

const sevBadge = {
  normal:   { bg: '#F0FBF8', color: '#0D7A5F', border: '#6EE7C7', label: 'Normale' },
  warning:  { bg: '#FFF8ED', color: '#B45309', border: '#FCD34D', label: 'Attenzione' },
  critical: { bg: '#FFF1F1', color: '#C53030', border: '#FEB2B2', label: 'Critico' },
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

  const lastNotifiedRef = useRef(null)

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

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
      background: '#F0F4F8', height: '100vh', padding: '16px 20px',
      fontFamily: 'sans-serif', color: '#2D3748', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#1A202C', letterSpacing: 0.5 }}>SMARTCARE — Vista medico</div>
          <div style={{ fontSize: 11, color: '#8FA3BF', marginTop: 2 }}>
            Dr. {user?.nome} {user?.cognome} · aggiornato {lastUpd}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowModal(true)} style={{
            background: '#60A5FA', border: 'none', color: '#fff',
            padding: '5px 14px', borderRadius: 20, fontSize: 11,
            cursor: 'pointer', fontWeight: 500,
            boxShadow: '0 1px 4px rgba(96,165,250,0.3)',
          }}>+ Paziente</button>
          <button onClick={() => { logout(); navigate('/login') }} style={{
            background: '#FFFFFF', border: '1px solid #E2EBF6', color: '#8FA3BF',
            padding: '5px 14px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
          }}>Esci</button>
        </div>
      </div>

      {/* CARD CONTATORI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, flexShrink: 0 }}>
        <div style={{ background: '#FFFFFF', borderRadius: 10, padding: '14px 12px', borderLeft: '3px solid #60A5FA', border: '1px solid #E2EBF6', borderLeftWidth: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 11, color: '#8FA3BF', marginBottom: 4 }}>Pazienti monitorati</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#1A202C' }}>{pazienti.length}</div>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: 10, padding: '14px 12px', borderLeft: '3px solid #F59E0B', border: '1px solid #E2EBF6', borderLeftWidth: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 11, color: '#8FA3BF', marginBottom: 4 }}>Alert warning</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#B45309' }}>{nWarning}</div>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: 10, padding: '14px 12px', borderLeft: '3px solid #F87171', border: '1px solid #E2EBF6', borderLeftWidth: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 11, color: '#8FA3BF', marginBottom: 4 }}>Alert critical</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#C53030' }}>{nCritical}</div>
        </div>
      </div>

      {/* TABELLA PAZIENTI */}
      <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 14, flexShrink: 0, border: '1px solid #E2EBF6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 10, fontWeight: 500 }}>Pazienti attivi</div>
        <div style={{ minHeight: tableMinHeight, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Paziente', 'BPM', 'Temp', 'HRV', 'Severity', 'Ultimo agg.', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', color: '#B0C4D8', fontWeight: 500, padding: '6px 8px', borderBottom: '1px solid #E2EBF6' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pazienti.length === 0 ? (
                <tr><td colSpan={7} style={{ color: '#B0C4D8', padding: 12, textAlign: 'center' }}>Nessun paziente registrato</td></tr>
              ) : pazienti.map(p => {
                const v   = latestMap[p.patientID]
                const sev = v?.anomaly?.severity || 'normal'
                const sb  = sevBadge[sev] || sevBadge.normal
                return (
                  <tr key={p._id}>
                    <td style={{ padding: '8px 8px', borderBottom: '1px solid #F0F4F8', color: '#1A202C', fontWeight: 500 }}>
                      {p.nome} {p.cognome}
                      <div style={{ fontSize: 10, color: '#B0C4D8' }}>{p.patientID}</div>
                    </td>
                    <td style={{ padding: '8px 8px', borderBottom: '1px solid #F0F4F8', color: '#4A5568' }}>{v?.bpm ? Math.round(v.bpm) : '—'}</td>
                    <td style={{ padding: '8px 8px', borderBottom: '1px solid #F0F4F8', color: '#4A5568' }}>{v?.temp_c ? `${v.temp_c.toFixed(1)}°C` : '—'}</td>
                    <td style={{ padding: '8px 8px', borderBottom: '1px solid #F0F4F8', color: '#4A5568' }}>{v?.hrv_ms ? `${Math.round(v.hrv_ms)} ms` : '—'}</td>
                    <td style={{ padding: '8px 8px', borderBottom: '1px solid #F0F4F8' }}>
                      <span style={{ background: sb.bg, color: sb.color, border: `1px solid ${sb.border}`, padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 500 }}>{sb.label}</span>
                    </td>
                    <td style={{ padding: '8px 8px', borderBottom: '1px solid #F0F4F8', color: '#B0C4D8', fontSize: 11 }}>
                      {v ? new Date(v.timestamp).toLocaleTimeString() : '—'}
                    </td>
                    <td style={{ padding: '8px 8px', borderBottom: '1px solid #F0F4F8' }}>
                      <button onClick={() => navigate(`/medico/paziente/${p._id.toString()}`)} style={{
                        background: '#FFFFFF', border: '1px solid #60A5FA', color: '#60A5FA',
                        padding: '3px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontWeight: 500,
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
      <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 14, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', border: '1px solid #E2EBF6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 8, flexShrink: 0, fontWeight: 500 }}>Alert recenti — tutti i pazienti</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexShrink: 0 }}>
          {['tutti', 'warning', 'critical'].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: '3px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
              background: filtro === f ? '#60A5FA' : '#FFFFFF',
              color:      filtro === f ? '#fff' : '#8FA3BF',
              border:     `1px solid ${filtro === f ? '#60A5FA' : '#E2EBF6'}`,
              fontWeight: filtro === f ? 500 : 400,
            }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {alertsFiltrati.length === 0 ? (
            <p style={{ color: '#B0C4D8', fontSize: 12 }}>Nessun alert</p>
          ) : alertsFiltrati.map(a => {
            const as    = alertStyle[a.anomaly?.severity] || alertStyle.warning
            const flags = [...(a.anomaly?.flags||[]), ...(a.anomaly?.critical||[])].join(' · ')
            return (
              <div key={a._id} style={{
                background: as.bg, borderRadius: 6, padding: '6px 10px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
                border: `1px solid ${as.border}`,
              }}>
                <span style={{ fontSize: 11, color: as.color, fontWeight: 500 }}>
                  {a.pazienteNome} — {a.anomaly?.severity?.toUpperCase()} · BPM {Math.round(a.bpm)} | Temp {a.temp_c?.toFixed(1)}°C
                  {flags ? ` · ${flags}` : ''}
                </span>
                <span style={{ fontSize: 10, color: '#B0C4D8', whiteSpace: 'nowrap', marginLeft: 8 }}>
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
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', width: 400, border: '1px solid #E2EBF6', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#1A202C' }}>Nuovo paziente</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#B0C4D8', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            {erroreModal && (
              <div style={{ background: '#FFF1F1', color: '#C53030', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12, border: '1px solid #FEB2B2' }}>
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
                <label style={{ fontSize: 11, color: '#8FA3BF', display: 'block', marginBottom: 4, fontWeight: 500 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={newPaz[f.key]}
                  onChange={e => setNewPaz({ ...newPaz, [f.key]: e.target.value })}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    background: '#F0F6FF', border: '1px solid #E2EBF6',
                    color: '#2D3748', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={aggiungiPaziente} style={{
                flex: 1, padding: '10px', borderRadius: 8,
                background: '#60A5FA', border: 'none',
                color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>Aggiungi paziente</button>
              <button onClick={() => setShowModal(false)} style={{
                padding: '10px 16px', borderRadius: 8,
                background: '#FFFFFF', border: '1px solid #E2EBF6',
                color: '#8FA3BF', fontSize: 13, cursor: 'pointer',
              }}>Annulla</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}