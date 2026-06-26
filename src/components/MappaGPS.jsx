import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function RecenterMap({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng, map])
  return null
}

export default function MappaGPS({ lat, lng, nome, timestamp }) {
  if (!lat || !lng) return (
    <div style={{
      background: '#0f1731', borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', color: '#555', fontSize: 12,
    }}>
      In attesa del segnale GPS...
    </div>
  )

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      style={{ height: '100%', width: '100%', borderRadius: 8 }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap lat={lat} lng={lng} />
      <Marker position={[lat, lng]}>
        <Popup>
          <div style={{ fontSize: 12 }}>
            <strong>{nome}</strong><br />
            {lat.toFixed(4)}° N, {lng.toFixed(4)}° E<br />
            {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}