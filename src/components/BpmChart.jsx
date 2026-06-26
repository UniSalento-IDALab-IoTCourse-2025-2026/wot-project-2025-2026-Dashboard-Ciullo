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
      background: '#16213e', borderRadius: 10,
      padding: '10px 14px', height: '100%',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 8, flexShrink: 0 }}>
        Andamento BPM — ultimi {data.length} valori
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a4a" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#555' }} interval="preserveStartEnd" />
            <YAxis domain={[30, 160]} tick={{ fontSize: 9, fill: '#555' }} />
            <Tooltip contentStyle={{ background: '#16213e', border: 'none', fontSize: 11 }} />
            <ReferenceLine y={100} stroke="#E24B4A" strokeDasharray="4 3" label={{ value: '100', fontSize: 9, fill: '#E24B4A' }} />
            <ReferenceLine y={50}  stroke="#E24B4A" strokeDasharray="4 3" label={{ value: '50',  fontSize: 9, fill: '#E24B4A' }} />
            <Line type="monotone" dataKey="bpm" stroke="#378ADD" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}