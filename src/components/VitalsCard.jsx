// VitalsCard.jsx
// Componente che mostra i vitali attuali del paziente
//
// Mostra 4 metriche in una griglia 2x2 (o 4x1 su desktop):
//   - Frequenza cardiaca (BPM)
//   - HRV (variabilità R-R in ms)
//   - Temperatura (°C)
//   - Anomaly score (output Isolation Forest)
//
// Il badge severity in alto a destra cambia colore in base allo stato:
//   - Verde  = normale
//   - Arancione = warning
//   - Rosso  = critical
//
// I dati vengono aggiornati ogni 10 secondi con polling REST API.

import { useEffect, useState } from 'react'
import axios from 'axios'

const severityColor = {
  normal:   { bg: '#085041', text: '#9FE1CB', label: 'Normale' },
  warning:  { bg: '#854F0B', text: '#FAC775', label: 'Attenzione' },
  critical: { bg: '#7A1F1F', text: '#F09595', label: 'Critico' },
}

export default function VitalsCard({ patientID }) {
  const [data, setData]         = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

 useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await axios.get(`/api/vitals/${patientID}/latest`)
      setData(res.data)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (e) {
      console.error('Errore fetch vitali:', e)
    }
  }
  fetchData()
  const interval = setInterval(fetchData, 10000)
  return () => clearInterval(interval)
}, [patientID])

  if (!data) return <p style={{ color: '#555', fontSize: 12 }}>Caricamento vitali...</p>

  const severity = data.anomaly?.severity || 'normal'
  const colors   = severityColor[severity] || severityColor.normal

  return (
    <div style={{
      background: '#16213e', borderRadius: 10,
      padding: '10px 14px', height: '100%',
    }}>
      {/* Header con titolo e badge severity */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#888' }}>Vitali attuali</div>
        <span style={{
          background: colors.bg, color: colors.text,
          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
        }}>{colors.label}</span>
      </div>

      {/* Griglia 4 metriche */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
        {[
          { label: 'Freq. cardiaca', val: data.bpm ? Math.round(data.bpm) : '—',                       unit: ' bpm', accent: '#EF9F27' },
          { label: 'HRV',            val: data.hrv_ms ? Math.round(data.hrv_ms) : '—',                 unit: ' ms',  accent: '#1D9E75' },
          { label: 'Temperatura',    val: data.temp_c ? data.temp_c.toFixed(1) : '—',                  unit: '°C',   accent: '#1D9E75' },
          { label: 'Anomaly score',  val: data.ecg_analysis?.anomaly_ratio?.toFixed(2) ?? '—',         unit: '/1',   accent: '#378ADD' },
        ].map(m => (
          <div key={m.label} style={{
            background: '#0f1731', borderRadius: 8,
            padding: '8px 10px', borderLeft: `3px solid ${m.accent}`,
          }}>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#fff' }}>
              {m.val}<span style={{ fontSize: 11, color: '#aaa' }}>{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Timestamp ultimo aggiornamento */}
      <div style={{ fontSize: 10, color: '#555', textAlign: 'right', marginTop: 6 }}>
        Aggiornato: {lastUpdate}
      </div>
    </div>
  )
}