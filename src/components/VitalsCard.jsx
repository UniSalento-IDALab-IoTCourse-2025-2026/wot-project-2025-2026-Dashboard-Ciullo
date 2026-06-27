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
  normal:   { bg: '#F0FBF8', text: '#0D7A5F', border: '#6EE7C7', label: 'Normale' },
  warning:  { bg: '#FFF8ED', text: '#B45309', border: '#FCD34D', label: 'Attenzione' },
  critical: { bg: '#FFF1F1', text: '#C53030', border: '#FEB2B2', label: 'Critico' },
}

export default function VitalsCard({ patientID }) {
  const [data, setData]             = useState(null)
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

  if (!data) return <p style={{ color: '#8FA3BF', fontSize: 12 }}>Caricamento vitali...</p>

  const severity = data.anomaly?.severity || 'normal'
  const colors   = severityColor[severity] || severityColor.normal

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 10,
      padding: '10px 14px', height: '100%',
      border: '1px solid #E2EBF6',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {/* Header con titolo e badge severity */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#8FA3BF', fontWeight: 500 }}>Vitali attuali</div>
        <span style={{
          background: colors.bg, color: colors.text,
          border: `1px solid ${colors.border}`,
          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
        }}>{colors.label}</span>
      </div>

      {/* Griglia 4 metriche */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
        {[
          { label: 'Freq. cardiaca', val: data.bpm    ? Math.round(data.bpm)    : '—', unit: ' bpm', accent: '#F59E0B' },
          { label: 'HRV',            val: data.hrv_ms ? Math.round(data.hrv_ms) : '—', unit: ' ms',  accent: '#10B981' },
          { label: 'Temperatura',    val: data.temp_c ? data.temp_c.toFixed(1)  : '—', unit: '°C',   accent: '#10B981' },
          { label: 'Anomaly score',  val: data.ecg_analysis?.anomaly_ratio?.toFixed(2) ?? '—', unit: '/1', accent: '#60A5FA' },
        ].map(m => (
          <div key={m.label} style={{
            background: '#F0F6FF', borderRadius: 8,
            padding: '8px 10px', borderLeft: `3px solid ${m.accent}`,
            border: '1px solid #E2EBF6', borderLeftWidth: 3,
          }}>
            <div style={{ fontSize: 10, color: '#8FA3BF', marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#2D3748' }}>
              {m.val}<span style={{ fontSize: 11, color: '#8FA3BF' }}>{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Timestamp ultimo aggiornamento */}
      <div style={{ fontSize: 10, color: '#B0C4D8', textAlign: 'right', marginTop: 6 }}>
        Aggiornato: {lastUpdate}
      </div>
    </div>
  )
}