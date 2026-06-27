// PatientDetail.jsx
// Pagina dettaglio paziente — vista dal medico
//
// Layout:
//   Riga 1: Anagrafica + foto | Vitali grandi 2x2 + postura
//   Riga 2: Grafico BPM | Mappa GPS + Alert 2 righe scorribili

import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts'
import MappaGPS from '../components/MappaGPS'

const sevBadge = {
  normal:   { bg: '#F0FBF8', color: '#0D7A5F', border: '#6EE7C7', label: 'Normale' },
  warning:  { bg: '#FFF8ED', color: '#B45309', border: '#FCD34D', label: 'Attenzione' },
  critical: { bg: '#FFF1F1', color: '#C53030', border: '#FEB2B2', label: 'Critico' },
}

const alertColor = {
  warning:  { bg: '#FFF8ED', color: '#B45309', border: '#FCD34D' },
  critical: { bg: '#FFF1F1', color: '#C53030', border: '#FEB2B2' },
}

function stimaPostura(imu) {
  if (!imu) return '—'
  if (Math.abs(imu.ax) > 60 || Math.abs(imu.ay) > 60) return 'Possibile caduta'
  if (Math.abs(imu.az) > 80) return 'In piedi'
  if (Math.abs(imu.az) > 30) return 'Seduto'
  return 'Fermo'
}

export default function PatientDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [paziente, setPaziente] = useState(null)
  const [latest, setLatest]     = useState(null)
  const [history, setHistory]   = useState([])
  const [alerts, setAlerts]     = useState([])
  const [foto, setFoto]         = useState(null)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [lastUpd, setLastUpd]   = useState('—')

  const fileInputRef = useRef(null)

  useEffect(() => {
    const token   = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }

    const fetchAll = async () => {
      try {
        const paz = await axios.get(`/api/patients/${id}`, { headers })
        setPaziente(paz.data)
        if (paz.data.foto) setFoto(paz.data.foto)

        if (paz.data.patientID) {
          const [l, h, a] = await Promise.all([
            axios.get(`/api/vitals/${paz.data.patientID}/latest`),
            axios.get(`/api/vitals/${paz.data.patientID}`),
            axios.get(`/api/alerts/${paz.data.patientID}`),
          ])
          setLatest(l.data)
          setHistory(h.data.reverse().map(d => ({
            time: new Date(d.timestamp).toLocaleTimeString(),
            bpm:  Math.round(d.bpm),
          })))
          setAlerts(a.data)
        }
        setLastUpd(new Date().toLocaleTimeString())
      } catch (e) {
        console.error('Errore fetch:', e)
      }
    }
    fetchAll()
    const t = setInterval(fetchAll, 10000)
    return () => clearInterval(t)
  }, [id])

  const caricaFoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingFoto(true)
    try {
      const token    = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('foto', file)
      const res = await axios.post(
        `/api/upload/foto/${id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      )
      setFoto(res.data.url)
    } catch (e) {
      console.error('Errore upload foto:', e)
    } finally {
      setUploadingFoto(false)
    }
  }

  if (!paziente) return (
    <div style={{ background: '#F0F4F8', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8FA3BF', fontFamily: 'sans-serif' }}>
      Caricamento...
    </div>
  )

  const sev    = latest?.anomaly?.severity || 'normal'
  const sb     = sevBadge[sev] || sevBadge.normal
  const post   = stimaPostura(latest?.imu)
  const caduta = post === 'Possibile caduta'

  return (
    <div style={{
      background: '#F0F4F8', height: '100vh', padding: '14px 20px',
      fontFamily: 'sans-serif', color: '#2D3748', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden',
    }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            background: sb.bg, color: sb.color,
            border: `1px solid ${sb.border}`,
            padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
          }}>
            {sb.label}
          </span>
          <button onClick={() => navigate('/medico')} style={{
            background: '#FFFFFF', border: '1px solid #60A5FA', color: '#60A5FA',
            padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontWeight: 500,
          }}>← Lista</button>
        </div>
      </div>

      {/* RIGA 1: anagrafica + foto | vitali grandi */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flexShrink: 0 }}>

        {/* Anagrafica con foto */}
        <div style={{
          background: '#FFFFFF', borderRadius: 10, padding: '10px 14px',
          border: '1px solid #E2EBF6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ fontSize: 11, color: '#8FA3BF', marginBottom: 8, fontWeight: 500 }}>Dati anagrafici</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div
              onClick={() => fileInputRef.current.click()}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#F0F6FF', border: '2px dashed #E2EBF6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
              }}
            >
              {foto
                ? <img src={foto} alt="Foto paziente" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 24 }}>👤</span>
              }
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>{paziente.nome} {paziente.cognome}</div>
              <div style={{ fontSize: 11, color: '#8FA3BF', marginTop: 2 }}>{paziente.patientID}</div>
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={uploadingFoto}
                style={{ marginTop: 6, fontSize: 10, color: '#60A5FA', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}
              >
                {uploadingFoto ? 'Caricamento...' : '+ Cambia foto'}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={caricaFoto} />
          </div>

          {[
            { label: 'Email',         val: paziente.email },
            { label: 'Telefono',      val: paziente.telefono || '—' },
            { label: 'Cod. fiscale',  val: paziente.codice_fiscale || '—' },
            { label: 'Patient ID',    val: paziente.patientID || '—' },
            { label: 'Registrato il', val: new Date(paziente.createdAt).toLocaleDateString('it-IT') },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F0F4F8' }}>
              <span style={{ fontSize: 11, color: '#B0C4D8' }}>{r.label}</span>
              <span style={{ fontSize: 11, color: '#4A5568', fontWeight: 500 }}>{r.val}</span>
            </div>
          ))}
        </div>

        {/* Vitali grandi 2x2 + postura */}
        <div style={{
          background: '#FFFFFF', borderRadius: 10, padding: '10px 14px',
          border: '1px solid #E2EBF6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: '#8FA3BF', fontWeight: 500 }}>Vitali attuali</div>
            <div style={{ fontSize: 10, color: '#B0C4D8' }}>aggiornato {lastUpd}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 8 }}>
            {[
              { label: 'Freq. cardiaca', val: latest?.bpm    ? Math.round(latest.bpm)    : '—', unit: ' bpm', accent: '#F59E0B' },
              { label: 'HRV',            val: latest?.hrv_ms ? Math.round(latest.hrv_ms) : '—', unit: ' ms',  accent: '#10B981' },
              { label: 'Temperatura',    val: latest?.temp_c ? latest.temp_c.toFixed(1)  : '—', unit: '°C',   accent: '#10B981' },
              { label: 'Anomaly score',  val: latest?.ecg_analysis?.anomaly_ratio?.toFixed(2) ?? '—', unit: '/1', accent: '#60A5FA' },
            ].map(m => (
              <div key={m.label} style={{
                background: '#F0F6FF', borderRadius: 8, padding: '10px 12px',
                borderLeft: `3px solid ${m.accent}`,
                border: '1px solid #E2EBF6', borderLeftWidth: 3,
              }}>
                <div style={{ fontSize: 10, color: '#8FA3BF', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 26, fontWeight: 600, color: '#1A202C' }}>
                  {m.val}<span style={{ fontSize: 12, color: '#8FA3BF' }}>{m.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#8FA3BF' }}>Postura:</span>
            <span style={{
              background: caduta ? '#FFF1F1' : '#F0FBF8',
              color:      caduta ? '#C53030' : '#0D7A5F',
              border:     `1px solid ${caduta ? '#FEB2B2' : '#6EE7C7'}`,
              padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
            }}>{post}</span>
          </div>
        </div>
      </div>

      {/* RIGA 2: grafico BPM | mappa GPS + alert */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1, minHeight: 0 }}>

        {/* Grafico BPM */}
        <div style={{
          background: '#FFFFFF', borderRadius: 10, padding: '10px 14px',
          display: 'flex', flexDirection: 'column', minHeight: 0,
          border: '1px solid #E2EBF6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ fontSize: 11, color: '#8FA3BF', marginBottom: 8, flexShrink: 0, fontWeight: 500 }}>
            Andamento BPM — ultimi {history.length} valori
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBF2FA" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#B0C4D8' }} interval="preserveStartEnd" />
                <YAxis domain={[30, 160]} tick={{ fontSize: 9, fill: '#B0C4D8' }} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2EBF6', fontSize: 11, color: '#2D3748', borderRadius: 8 }} />
                <ReferenceLine y={100} stroke="#F87171" strokeDasharray="4 3" label={{ value: '100', fontSize: 9, fill: '#F87171' }} />
                <ReferenceLine y={50}  stroke="#F87171" strokeDasharray="4 3" label={{ value: '50',  fontSize: 9, fill: '#F87171' }} />
                <Line type="monotone" dataKey="bpm" stroke="#60A5FA" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mappa GPS + alert */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>

          {/* Mappa GPS */}
          <div style={{
            background: '#FFFFFF', borderRadius: 10, padding: '10px 14px',
            flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
            border: '1px solid #E2EBF6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: 11, color: '#8FA3BF', marginBottom: 4, flexShrink: 0, fontWeight: 500 }}>Posizione GPS</div>
            {paziente.gps?.lat && (
              <div style={{ fontSize: 10, color: '#B0C4D8', marginBottom: 4, flexShrink: 0 }}>
                {paziente.gps.lat.toFixed(4)}° N, {paziente.gps.lng.toFixed(4)}° E · {new Date(paziente.gps.timestamp).toLocaleTimeString()}
              </div>
            )}
            <div style={{ flex: 1, minHeight: 0, borderRadius: 8, overflow: 'hidden' }}>
              <MappaGPS
                lat={paziente.gps?.lat}
                lng={paziente.gps?.lng}
                nome={`${paziente.nome} ${paziente.cognome}`}
                timestamp={paziente.gps?.timestamp}
              />
            </div>
          </div>

          {/* Alert */}
          <div style={{
            background: '#FFFFFF', borderRadius: 10, padding: '8px 14px', flexShrink: 0,
            border: '1px solid #E2EBF6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: 11, color: '#8FA3BF', marginBottom: 6, fontWeight: 500 }}>
              Alert recenti — {alerts.length} eventi
            </div>
            <div style={{ maxHeight: 64, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {alerts.length === 0 ? (
                <p style={{ color: '#B0C4D8', fontSize: 12 }}>Nessun alert</p>
              ) : alerts.map(a => {
                const ac    = alertColor[a.anomaly?.severity] || alertColor.warning
                const flags = [...(a.anomaly?.flags||[]), ...(a.anomaly?.critical||[])].join(' · ')
                return (
                  <div key={a._id} style={{
                    background: ac.bg, borderRadius: 6, padding: '5px 10px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
                    border: `1px solid ${ac.border}`,
                  }}>
                    <span style={{ fontSize: 11, color: ac.color, fontWeight: 500 }}>
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
        </div>
      </div>

    </div>
  )
}