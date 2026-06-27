// BpmChart.jsx
// Grafico andamento BPM nel tempo
//
// Mostra gli ultimi 50 valori con due soglie cliniche:
//   - 100 BPM = soglia tachicardia
//   - 50 BPM  = soglia bradicardia
import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts'

export default function BpmChart({ patientID }) {
  const [data, setData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/vitals/${patientID}`)
        const formatted = res.data
          .reverse()
          .map(d => ({
            time: new Date(d.timestamp).toLocaleTimeString(),
            bpm:  Math.round(d.bpm),
          }))
        setData(formatted)
      } catch (e) {
        console.error('Errore fetch storico BPM:', e)
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
        Andamento BPM — ultimi {data.length} valori
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
  )
}