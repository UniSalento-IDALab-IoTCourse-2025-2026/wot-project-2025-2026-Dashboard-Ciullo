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
  normal:   { bg: '#F0FBF8', text: '#0D7A5F', border: '#6EE7C7', label: 'Normale' },
  warning:  { bg: '#FFF8ED', text: '#B45309', border: '#FCD34D', label: 'Attenzione' },
  critical: { bg: '#FFF1F1', text: '#C53030', border: '#FEB2B2', label: 'Critico' },
}

function stimaPostura(imu) {
  if (!imu) return '—'
  if (Math.abs(imu.ax) > 60 || Math.abs(imu.ay) > 60) return 'Possibile caduta'
  if (Math.abs(imu.az) > 80) return 'In piedi'
  if (Math.abs(imu.az) > 30) return 'Seduto'
  return 'Fermo'
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
      background: '#F0F4F8', height: '100vh', padding: '14px 20px',
      fontFamily: 'sans-serif', color: '#2D3748', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden',
    }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#1A202C', letterSpacing: 0.5 }}>SMARTCARE</div>
          <div style={{ fontSize: 11, color: '#8FA3BF', marginTop: 2 }}>
            Monitoraggio paziente — {PATIENT_ID} · aggiornato {lastUpd}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            background: sc.bg, color: sc.text,
            border: `1px solid ${sc.border}`,
            padding: '5px 16px', borderRadius: 20, fontSize: 12, fontWeight: 500,
          }}>
            {sc.label}
          </span>
          <button onClick={() => { logout(); navigate('/login') }} style={{
            background: '#FFFFFF', border: '1px solid #E2EBF6', color: '#8FA3BF',
            padding: '5px 14px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
          }}>Esci</button>
        </div>
      </div>

      {/* RIGA 1: vitali | attività giornaliera */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flexShrink: 0 }}>

        <VitalsCard patientID={PATIENT_ID} />

        {/* Attività giornaliera */}
        <div style={{
          background: '#FFFFFF', borderRadius: 10, padding: '10px 14px',
          border: '1px solid #E2EBF6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ fontSize: 11, color: '#8FA3BF', marginBottom: 8, fontWeight: 500 }}>Attività giornaliera</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 8 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#1A202C', marginBottom: 3 }}>
                {passi.toLocaleString()} <span style={{ fontSize: 13, color: '#8FA3BF', fontWeight: 400 }}>passi</span>
              </div>
              <div style={{ fontSize: 10, color: '#B0C4D8', marginBottom: 4 }}>
                Obiettivo: {obiettivo.toLocaleString()} passi
              </div>
              <div style={{ background: '#E2EBF6', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 3 }}>
                <div style={{ background: '#60A5FA', height: 6, borderRadius: 4, width: `${perc}%` }} />
              </div>
              <div style={{ fontSize: 10, color: '#8FA3BF', textAlign: 'right' }}>{perc}%</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ background: '#F0F6FF', borderRadius: 8, padding: '6px 12px', textAlign: 'center', border: '1px solid #E2EBF6' }}>
                <div style={{ fontSize: 10, color: '#8FA3BF' }}>Distanza</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#2D3748' }}>
                  {distanza}<span style={{ fontSize: 11, color: '#8FA3BF' }}> km</span>
                </div>
              </div>
              <div style={{ background: '#F0F6FF', borderRadius: 8, padding: '6px 12px', textAlign: 'center', border: '1px solid #E2EBF6' }}>
                <div style={{ fontSize: 10, color: '#8FA3BF' }}>Calorie</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#2D3748' }}>
                  {calorie}<span style={{ fontSize: 11, color: '#8FA3BF' }}> kcal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGA 2: grafico BPM | mappa + postura */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1, minHeight: 0 }}>

        <BpmChart patientID={PATIENT_ID} />

        {/* Mappa GPS con badge postura */}
        <div style={{
          background: '#FFFFFF', borderRadius: 10, padding: '10px 14px',
          display: 'flex', flexDirection: 'column',
          border: '1px solid #E2EBF6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: '#8FA3BF', fontWeight: 500 }}>Posizione GPS</div>
            <span style={{
              background: caduta ? '#FFF1F1' : '#F0FBF8',
              color:      caduta ? '#C53030' : '#0D7A5F',
              border:     `1px solid ${caduta ? '#FEB2B2' : '#6EE7C7'}`,
              padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
            }}>{post}</span>
          </div>
          {gps?.lat && (
            <div style={{ fontSize: 10, color: '#B0C4D8', marginBottom: 6, flexShrink: 0 }}>
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