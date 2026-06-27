// AlertList.jsx
// Lista alert recenti del paziente
//
// Mostra gli ultimi 20 eventi warning/critical.
// Arancione = warning, Rosso = critical.
// Scorrevole — alert più recenti in cima.

import { useEffect, useState } from 'react'
import axios from 'axios'

const severityStyle = {
  warning:  { bg: '#FFF8ED', text: '#B45309', border: '#FCD34D' },
  critical: { bg: '#FFF1F1', text: '#C53030', border: '#FEB2B2' },
}

export default function AlertList({ patientID }) {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/alerts/${patientID}`)
        setAlerts(res.data)
      } catch (e) {
        console.error('Errore fetch alert:', e)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [patientID])

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 10,
      padding: '10px 14px', height: '100%',
      display: 'flex', flexDirection: 'column',
      border: '1px solid #E2EBF6',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{ fontSize: 11, color: '#8FA3BF', marginBottom: 8, flexShrink: 0, fontWeight: 500 }}>
        Alert recenti — {alerts.length} eventi · scorri per vedere tutti
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {alerts.length === 0 ? (
          <p style={{ color: '#B0C4D8', fontSize: 12 }}>Nessun alert registrato</p>
        ) : alerts.map(a => {
          const s     = severityStyle[a.anomaly?.severity] || severityStyle.warning
          const flags = [...(a.anomaly?.flags||[]), ...(a.anomaly?.critical||[])].join(' · ')
          return (
            <div key={a._id} style={{
              background: s.bg, borderRadius: 6, padding: '5px 10px',
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexShrink: 0,
              border: `1px solid ${s.border}`,
            }}>
              <span style={{ fontSize: 11, color: s.text, fontWeight: 500 }}>
                {a.anomaly?.severity?.toUpperCase()} — BPM {Math.round(a.bpm)} | Temp {a.temp_c?.toFixed(1)}°C
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
  )
}