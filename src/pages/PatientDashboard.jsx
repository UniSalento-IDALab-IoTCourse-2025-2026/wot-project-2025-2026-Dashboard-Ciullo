// PatientDashboard.jsx
// Dashboard principale vista dal paziente dopo il login
//
// Layout a 3 righe:
//   Riga 1: VitalsCard (vitali) | Attività giornaliera (passi)
//   Riga 2: BpmChart (grafico) | MappaGPS + postura
//   Riga 3: AlertList (alert scorrevoli)

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import VitalsCard from '../components/VitalsCard'
import BpmChart   from '../components/BpmChart'
import AlertList  from '../components/AlertList'
import MappaGPS   from '../components/MappaGPS'

const PATIENT_ID = 'PAZ-001'

const sevColors = {
  normal:   { bg: '#085041', text: '#9FE1CB', label: 'Normale' },
  warning:  { bg: '#854F0B', text: '#FAC775', label: 'Attenzione' },
  critical: { bg: '#7A1F1F', text: '#F09595', label: 'Critico' },
}

function stimaPostura(imu) {
  if (!imu) return '—'
  if (Math.abs(imu.az) > 500) return 'Possibile caduta'
  if (imu.az > 800)  return 'In piedi'
  if (imu.az > 400)  return 'Seduto'
  return 'Sdraiato / in movimento'
}

export default function PatientDashboard() {
  const { logout }            = useAuth()
  const navigate              = useNavigate()
  const [gps, setGps]         = useState(null)
  const [latest, setLatest]   = useState(null)
  const [lastUpd, setLastUpd] = useState('—')

  useEffect(() => {
    const token   = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }

    const fetchAll = async () => {
      try {
        const l = await axios.get(`/api/vitals/${PATIENT_ID}/latest`)
        setLatest(l.data)

        const me = await axios.get('/auth/me', { headers })
        if (me.data.gps?.lat) setGps(me.data.gps)

        setLastUpd(new Date().toLocaleTimeString())
      } catch (e) {
        console.error('Errore fetch:', e)
      }
    }
    fetchAll()
    const t = setInterval(fetchAll, 10000)
    return () => clearInterval(t)
  }, [])

  const passi     = latest?.passi_oggi ?? 0
  const obiettivo = 5000
  const perc      = Math.min(Math.round((passi / obiettivo) * 100), 100)
  const distanza  = (passi * 0.00075).toFixed(1)
  const calorie   = Math.round(passi * 0.055)
  const sev       = latest?.anomaly?.severity || 'normal'
  const sc        = sevColors[sev] || sevColors.normal
  const post      = stimaPostura(latest?.imu)
  const caduta    = post === 'Possibile caduta'

  return (
    <div style={{
      background: '#1a1a2e', height: '100vh', padding: '14px 20px',
      fontFamily: 'sans-serif', color: '#fff', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden',
    }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: 1 }}>SMARTCARE</div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
            Monitoraggio paziente — {PATIENT_ID} · aggiornato {lastUpd}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ background: sc.bg, color: sc.text, padding: '5px 16px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
            {sc.label}
          </span>
          <button onClick={() => { logout(); navigate('/login') }} style={{
            background: '#16213e', border: '0.5px solid #555', color: '#888',
            padding: '5px 14px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
          }}>Esci</button>
        </div>
      </div>

      {/* RIGA 1: vitali | attività giornaliera */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flexShrink: 0 }}>

        {/* Componente vitali separato */}
        <VitalsCard patientID={PATIENT_ID} />

        {/* Attività giornaliera */}
        <div style={{ background: '#16213e', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Attività giornaliera</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 8 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 3 }}>
                {passi.toLocaleString()} <span style={{ fontSize: 13, color: '#aaa', fontWeight: 400 }}>passi</span>
              </div>
              <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>
                Obiettivo: {obiettivo.toLocaleString()} passi
              </div>
              <div style={{ background: '#0f1731', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 3 }}>
                <div style={{ background: '#378ADD', height: 6, borderRadius: 4, width: `${perc}%` }} />
              </div>
              <div style={{ fontSize: 10, color: '#555', textAlign: 'right' }}>{perc}%</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ background: '#0f1731', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#888' }}>Distanza</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>
                  {distanza}<span style={{ fontSize: 11, color: '#aaa' }}> km</span>
                </div>
              </div>
              <div style={{ background: '#0f1731', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#888' }}>Calorie</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>
                  {calorie}<span style={{ fontSize: 11, color: '#aaa' }}> kcal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGA 2: grafico BPM | mappa + postura */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1, minHeight: 0 }}>

        {/* Componente grafico BPM separato */}
        <BpmChart patientID={PATIENT_ID} />

        {/* Mappa GPS con badge postura */}
        <div style={{ background: '#16213e', borderRadius: 10, padding: '10px 14px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: '#888' }}>Posizione GPS</div>
            <span style={{
              background: caduta ? '#7A1F1F' : '#085041',
              color:      caduta ? '#F09595' : '#9FE1CB',
              padding: '2px 10px', borderRadius: 20, fontSize: 11,
            }}>{post}</span>
          </div>
          {gps?.lat && (
            <div style={{ fontSize: 10, color: '#555', marginBottom: 6, flexShrink: 0 }}>
              {gps.lat.toFixed(4)}° N, {gps.lng.toFixed(4)}° E · {new Date(gps.timestamp).toLocaleTimeString()}
            </div>
          )}
          <div style={{ flex: 1, minHeight: 0, borderRadius: 8, overflow: 'hidden' }}>
            <MappaGPS
              lat={gps?.lat}
              lng={gps?.lng}
              nome="Paziente"
              timestamp={gps?.timestamp}
            />
          </div>
        </div>
      </div>

      {/* RIGA 3: alert scorrevoli */}
      <div style={{ flexShrink: 0, height: 100 }}>
        <AlertList patientID={PATIENT_ID} />
      </div>

    </div>
  )
}