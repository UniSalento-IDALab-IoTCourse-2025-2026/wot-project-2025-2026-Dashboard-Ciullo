# SMARTCARE — Dashboard Web React

> Sistema IoT per il Monitoraggio Remoto di Pazienti con Scompenso Cardiaco

[![University](https://img.shields.io/badge/Università-del%20Salento-gold)](https://www.unisalento.it)
[![Course](https://img.shields.io/badge/Corso-Internet%20of%20Things-blue)](https://www.unisalento.it)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-purple)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Descrizione

Questo repository contiene la **dashboard web** del sistema SMARTCARE, una Single Page Application sviluppata con **React e Vite**. Offre viste differenziate per ruolo — paziente e medico — con aggiornamento dei parametri vitali in tempo reale tramite polling REST ogni 10 secondi.

---

## Viste disponibili

### Vista Paziente
- Parametri vitali in tempo reale: BPM, HRV, temperatura, anomaly score
- Stima attività giornaliera: passi, distanza, calorie
- Grafico andamento BPM (ultimi 50 valori) con soglie cliniche a 50 e 100 BPM
- Mappa GPS interattiva con posizione aggiornata ogni 10 secondi
- Storico alert recenti con livello di severità

### Vista Medico
- Tabella di tutti i pazienti monitorati con stato in tempo reale
- Contatori: pazienti totali, alert warning attivi, alert critical attivi
- Lista alert filtrabili per severità: Tutti · Warning · Critical
- Accesso al dettaglio anagrafico e clinico di ogni paziente
- Registrazione nuovi pazienti tramite modal dedicato
- Web Notifications API per popup di emergenza su Chrome

---

## Tecnologie

| Libreria | Utilizzo |
|----------|----------|
| `React 18` | Framework UI con componenti riutilizzabili |
| `Vite 5` | Bundler con hot module replacement |
| `React Router` | Routing protetto per ruolo con JWT |
| `Recharts` | Grafico BPM con soglie cliniche |
| `React Leaflet` | Mappa GPS interattiva su OpenStreetMap |
| `Axios` | Chiamate REST API al backend |

---

## Installazione e avvio

```bash
# 1. Clona il repository
git clone https://github.com/UniSalento-IDALab-IoTCourse-2025-2026/wot-project-2025-2026-Dashboard-Ciullo.git
cd wot-project-2025-2026-Dashboard-Ciullo

# 2. Installa le dipendenze
npm install

# 3. Configura il backend URL
# Modifica BACKEND_URL in src/App.jsx con l'IP del PC che esegue il backend
# es. const BACKEND_URL = 'http://192.168.0.105:3000'

# 4. Avvia il server di sviluppo
npm run dev

# 5. Apri nel browser
# http://localhost:5173
```

---

## Credenziali di test

| Ruolo | Email | Password |
|-------|-------|----------|
| Medico | albertociullo18@gmail.com | medico123 |
| Paziente | luigidevitis52@gmail.com | paziente123 |

---

## Nota IP

Se l'IP del PC cambia, aggiorna `BACKEND_URL` in `src/App.jsx`:
```javascript
const BACKEND_URL = 'http://TUO_IP:3000'
```

---

## Repository correlati

| Repository | Descrizione |
|------------|-------------|
| [Edge Node Raspberry Pi](https://github.com/UniSalento-IDALab-IoTCourse-2025-2026/wot-project-2025-2026-RaspberryPi-Ciullo) | Acquisizione BLE, Isolation Forest, pubblicazione MQTT |
| [Backend Node.js](https://github.com/UniSalento-IDALab-IoTCourse-2025-2026/wot-project-2025-2026-Backend-Ciullo) | Server Express, MQTT subscriber, MongoDB, Nodemailer |
| [App Android](https://github.com/UniSalento-IDALab-IoTCourse-2025-2026/wot-project-2025-2026-MobileApp-Ciullo) | Applicazione mobile Expo SDK 54 con tracking GPS |
| [Presentazione](https://github.com/UniSalento-IDALab-IoTCourse-2025-2026/wot-project-2025-2026-Presentation-Ciullo) | Slide e documentazione del progetto |

---

## Autore

**Alberto Ciullo**
Università del Salento — Magistrale Informatica
Corso di Internet of Things — A.A. 2025/2026
Docente: Prof. Luigi Patrono · Tutor: Ing. Teodoro Montanaro

Sviluppato in collaborazione con l'**Istituto Italiano di Tecnologia (IIT)**
