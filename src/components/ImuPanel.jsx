// ImuPanel.jsx
// Pannello IMU — postura e movimento
//
// Dati REALI dal dispositivo IIT (non simulati).
// Stima postura da Az:
//   - |Az| > 500 = possibile caduta
//   - Az > 800   = in piedi
//   - Az > 400   = seduto
//   - altro      = sdraiato / in movimento

import { useEffect, useState } from 'react'
import axios from 'axios'

export default function ImuPanel({ patientID }) {
  const [imu, setImu]         = useState(null)
  const [postura, setPostura] = useState('—')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/vitals/${patientID}/latest`)
        const i   = res.data?.imu
        setImu(i)
        if (!i) return
        if (Math.abs(i.az) > 500) setPostura('Possibile caduta')
        else if (i.az > 800)      setPostura('In piedi')
        else if (i.az > 400)      setPostura('Seduto')
        else                      setPostura('Sdraiato / in movimento')
      } catch (e) {
        console.error('Errore fetch IMU:', e)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [patientID])

  const caduta = postura === 'Possibile caduta'

  return (
    <div style={{
      background: '#16213e',
      border: `0.5px solid ${caduta ? '#E24B4A' : '#1e2a4a'}`,
      borderRadius: 10, padding: '10px 14px', height: '100%',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#888' }}>Postura e movimento</div>
        <span style={{
          background: caduta ? '#7A1F1F' : '#085041',
          color:      caduta ? '#F09595' : '#9FE1CB',
          padding: '2px 10px', borderRadius: 20, fontSize: 11,
        }}>{postura}</span>
      </div>
      {imu ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
          {['ax','ay','az','gx','gy','gz'].map(key => (
            <div key={key} style={{
              background: '#0f1731', borderRadius: 6,
              padding: '6px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase' }}>{key}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>
                {imu[key]?.toFixed(1) ?? '—'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#555', fontSize: 12 }}>Nessun dato IMU disponibile</p>
      )}
    </div>
  )
}