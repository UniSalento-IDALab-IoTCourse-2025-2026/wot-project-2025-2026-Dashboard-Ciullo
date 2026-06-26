# SMARTCARE — Dashboard Web

Interfaccia web React.js per il monitoraggio dei pazienti cardiaci.
Accessibile da browser su rete locale.

## Stack tecnologico

- **React** + **Vite** — framework e build tool
- **React Router** — navigazione tra pagine
- **Axios** — chiamate REST API al backend
- **Recharts** — grafico andamento BPM
- **Leaflet** + **React Leaflet** — mappa GPS interattiva
- **JWT** — autenticazione stateless

## Viste disponibili

### Vista Paziente (/paziente)
- Vitali in tempo reale (BPM, HRV, Temperatura, Anomaly score)
- Attività giornaliera (passi, distanza, calorie)
- Grafico BPM storico con soglie cliniche
- Mappa GPS live con postura
- Lista alert recenti scorrevole

### Vista Medico (/medico)
- Tabella tutti i pazienti con vitali in tempo reale
- Contatori warning e critical attivi
- Lista alert filtrabili per severity
- Bottone + per aggiungere nuovi pazienti

### Dettaglio Paziente (/medico/paziente/:id)
- Dati anagrafici completi
- Vitali attuali + postura
- Attività giornaliera
- Grafico BPM storico
- Mappa GPS
- Alert recenti

## Struttura file
src/
├── context/
│   └── AuthContext.jsx      — gestione autenticazione JWT
├── pages/
│   ├── Login.jsx            — pagina login
│   ├── PatientDashboard.jsx — dashboard paziente
│   ├── DoctorDashboard.jsx  — dashboard medico
│   └── PatientDetail.jsx    — dettaglio paziente
└── components/
├── VitalsCard.jsx       — card vitali (BPM, HRV, Temp, Anomaly)
├── BpmChart.jsx         — grafico BPM con Recharts
├── ImuPanel.jsx         — pannello IMU e postura
├── AlertList.jsx        — lista alert scorrevole
└── MappaGPS.jsx         — mappa OpenStreetMap con Leaflet

## Setup

```bash
# Installa dipendenze
npm install

# Avvia in sviluppo
npm run dev

# Build produzione
npm run build
```

## Configurazione proxy (vite.config.js)

Il proxy Vite gira le richieste API al backend Node.js:
```javascript
server: {
  proxy: {
    '/api':  'http://localhost:3000',
    '/auth': 'http://localhost:3000',
  }
}
```

## Credenziali di test
| Ruolo | Email | Password |
|-------|-------|----------|
| Medico | medico@smartcare.it | medico123 |
| Paziente | paziente@smartcare.it | paziente123 |

## Note
- La dashboard si aggiorna ogni 10 secondi tramite polling REST API
- La mappa GPS usa OpenStreetMap — gratuito, no API key necessaria
- I dati GPS vengono aggiornati dall'app Android ogni 10 secondi
- Il token JWT viene salvato nel localStorage del browser