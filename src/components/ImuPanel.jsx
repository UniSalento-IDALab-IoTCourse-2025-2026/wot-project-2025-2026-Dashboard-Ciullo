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
      background: '#FFFFFF',
      border: `1px solid ${caduta ? '#FEB2B2' : '#E2EBF6'}`,
      borderRadius: 10, padding: '10px 14px', height: '100%',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#8FA3BF', fontWeight: 500 }}>Postura e movimento</div>
        <span style={{
          background: caduta ? '#FFF1F1' : '#F0FBF8',
          color:      caduta ? '#C53030' : '#0D7A5F',
          border:     `1px solid ${caduta ? '#FEB2B2' : '#6EE7C7'}`,
          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
        }}>{postura}</span>
      </div>

      {imu ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
          {['ax','ay','az','gx','gy','gz'].map(key => (
            <div key={key} style={{
              background: '#F0F6FF', borderRadius: 6,
              padding: '6px 8px', textAlign: 'center',
              border: '1px solid #E2EBF6',
            }}>
              <div style={{ fontSize: 10, color: '#8FA3BF', textTransform: 'uppercase', fontWeight: 500 }}>{key}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#2D3748' }}>
                {imu[key]?.toFixed(1) ?? '—'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#B0C4D8', fontSize: 12 }}>Nessun dato IMU disponibile</p>
      )}
    </div>
  )
}