<<<<<<< HEAD
# 🌦️ Weather Station IoT

A real-time IoT weather station dashboard built with React and Node.js. Sensor data (temperature, humidity, etc.) is streamed live from an IoT device to a web dashboard using **WebSockets**, stored in **MongoDB**, and visualised with animated **Recharts** graphs.

---

## 🖥️ How It Works

```
IoT Device (ESP32 / Arduino)
        │
        │  HTTP POST / Serial
        ▼
  Express Backend  ──── MongoDB (stores readings)
        │
        │  Socket.io (real-time broadcast)
        ▼
  React Dashboard  ──── Live charts + animated UI
```

1. The IoT device sends sensor readings to the Express backend
2. The backend saves each reading to MongoDB and broadcasts it via Socket.io
3. The React frontend receives the live data and updates charts in real time

---

## ✨ Features

- 📡 Real-time sensor data via WebSockets (Socket.io)
- 📊 Live charts for temperature, humidity, and other metrics (Recharts)
- 💾 Persistent data storage in MongoDB
- 🎨 Smooth animations with Framer Motion
- 💅 Clean, responsive UI with Tailwind CSS
- 🔒 Environment-based configuration with dotenv

---

## 📁 Project Structure

```
weather-station-iot/
├── backend/
│   ├── index.js / server.js   # Express server + Socket.io + MongoDB
│   ├── package.json
│   └── .env                   # Never commit this
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/        # Dashboard, charts, sensor cards
│   ├── package.json
│   └── index.html
│
└── .gitignore
=======
# 🛰️ SkyNet IoT — Weather Station Dashboard

A full-stack IoT weather monitoring system built with an Arduino UNO R4 WiFi, Node.js backend, and React frontend. Collects real-time environmental data from physical sensors and visualizes it on a live dashboard with historical trend charts.

---

## 📸 Features

- **Live telemetry** — sensor data streams to the dashboard in real time via Socket.io
- **Historical trends** — scrollable 24h charts for all metrics
- **Component analytics** — dedicated pages for Thermal Comfort, Atmospheric Dynamics, and Environmental Quality
- **Weather sticker** — dynamic card showing condition, temperature, and rain status
- **Dark/Light mode** — full theme toggle
- **SD card logging** — every reading is written to `log.csv` on the Arduino's SD card
- **mDNS support** — Arduino connects to the backend by hostname, not IP

---

## 🧰 Hardware

| Component | Purpose |
|---|---|
| Arduino UNO R4 WiFi | Main microcontroller + WiFi |
| DHT22 | Temperature & Humidity |
| BMP180 | Barometric Pressure & Altitude |
| MQ-135 | Air Quality (PPM) |
| Rain Sensor (DO pin) | Digital rain detection |
| DS3231 RTC | Real-time clock for timestamps |
| SD Card Module | Local CSV data logging |

### Wiring

| Sensor | Pin |
|---|---|
| DHT11 DATA | D3 |
| Rain Sensor DO | D2 |
| MQ-135 AO | A3 |
| SD Card CS | D4 |
| BMP180 + DS3231 | SDA→D18, SCL→D19 |

---

## 🏗️ Project Structure

```
skynet-iot/
├── arduino/
│   └── src/
│       └── main.cpp          # Arduino firmware
├── backend/
│   └── src/
│       ├── index.js           # Server entry point, routes, Socket.io
│       ├── app.js             # Express app setup
│       ├── db/
│       │   └── index.js       # MongoDB connection
│       ├── models/
│       │   └── reading.models.js
│       ├── controllers/
│       │   ├── healthcheck.controllers.js
│       │   └── reading.controllers.js
│       ├── routes/
│       │   ├── healthcheck.routes.js
│       │   └── reading.routes.js
│       ├── sockets/
│       │   └── socket.js
│       └── utils/
│           ├── api-response.js
│           ├── api-error.js
│           ├── async-handler.js
│           └── constants.js
└── frontend/
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── Topbar.jsx
        │   ├── LiveSummary.jsx
        │   ├── History24h.jsx
        │   ├── AtmosphericDynamics.jsx
        │   ├── ThermalComfort.jsx
        │   ├── EnvironmentalQuality.jsx
        │   ├── WeatherSticker.jsx
        │   └── SkyNetLogo.jsx
        └── index.css
>>>>>>> d2920d7 (not gonna lie the code is pretty bad)
```

---

<<<<<<< HEAD
## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm
- MongoDB Atlas account (or local MongoDB)
- An IoT device sending weather data (ESP32, ESP8266, Arduino, or a simulator)

---

### 1. Clone the repo

```bash
git clone https://github.com/billywithaw1lly/weather-station-iot.git
cd weather-station-iot
```

### 2. Set up the backend

=======
## ⚙️ Backend Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### 1. Install dependencies
>>>>>>> d2920d7 (not gonna lie the code is pretty bad)
```bash
cd backend
npm install
```

<<<<<<< HEAD
Create a `.env` file in the `backend/` folder:

```env
MONGODB_URL=your_mongodb_connection_string
PORT=3000
```

Start the backend:

```bash
node index.js
```

### 3. Set up the frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Tech Stack

### Backend
| Package | Purpose |
|---|---|
| Express | HTTP server & REST API |
| Mongoose | MongoDB ODM |
| Socket.io | Real-time WebSocket communication |
| cors | Cross-origin request handling |
| dotenv | Environment variable management |

### Frontend
| Package | Purpose |
|---|---|
| React + Vite | UI framework & build tool |
| Tailwind CSS | Utility-first styling |
| Recharts | Live data charts & graphs |
| Socket.io-client | Connects to backend WebSocket |
| Framer Motion (`motion`) | UI animations |
| Lucide React | Icons |

---

## 🔌 IoT Device Setup

The backend expects sensor data as a JSON payload via HTTP POST or a WebSocket event. Example payload:

```json
{
  "temperature": 28.4,
  "humidity": 65.2,
  "pressure": 1012.3,
  "timestamp": "2026-04-12T10:30:00Z"
}
```

Compatible with **ESP32**, **ESP8266**, **Arduino + WiFi shield**, or any device that can make HTTP requests.

---

## 🗺️ Planned / TODO

- [ ] Support for multiple sensor nodes
- [ ] Historical data view with date filtering
- [ ] Alerts / threshold notifications
- [ ] Mobile-responsive improvements
- [ ] Deployment (frontend on Vercel, backend on Render)

---

## 👨‍💻 Author

**Priyanshu Pratik** — [billywithaw1lly](https://github.com/billywithaw1lly)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
=======
### 2. Create `.env` file
```env
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.e5hyeng.mongodb.net/skynet_iot?retryWrites=true&w=majority
CORS_ORIGIN=*
```

> ⚠️ Make sure your MongoDB Atlas cluster is **not paused** and your IP is whitelisted (or set to `0.0.0.0/0` for development).

### 3. Run the backend
```bash
npm run dev
```

You should see:
```
MongoDB connected !! DB HOST: ac-...mongodb.net
⚙️  Server running on port 8000
📡 Hardware endpoint: POST http://0.0.0.0:8000/api/telemetry
📊 History endpoint:  GET  http://0.0.0.0:8000/api/history?stationId=STN-INDORE-04
```

---

## 🖥️ Frontend Setup

### Prerequisites
- Node.js v18+

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Run the frontend
```bash
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

---

## 🔌 Arduino Setup

### Prerequisites
- [PlatformIO](https://platformio.org/) (VS Code extension recommended)

### 1. Install libraries
All dependencies are defined in `platformio.ini` and installed automatically:
```
bblanchon/ArduinoJson
cotestatnt/HTTPWebServer
Adafruit BMP085
Adafruit DHT sensor library
RTClib
SD (arduino-libraries)
```

### 2. Configure the cloud endpoint
Set the deployed backend hostname at the top of `SkyNet-Hardware-Node/src/main.cpp`:
```cpp
const char *serverAddress = "your-backend.example.com";
const int serverPort = 443;
```

Wi-Fi credentials are no longer stored in the source code. On first boot, or after
15 seconds without a connection, join the `SkyNet_Setup` access point and open the
IP address printed in the serial monitor. Submit the form to save credentials in
EEPROM; the board will reboot and connect automatically.

### 3. Flash to board
```bash
pio run --target upload
```

### 4. Monitor serial output
```bash
pio device monitor --baud 115200
```

You should see sensor readings printed every second and `[OK] Transmitted.` after each successful POST to the backend.

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/healthcheck` | Server health check |
| `POST` | `/api/telemetry` | Receive data from Arduino |
| `GET` | `/api/history?stationId=STN-INDORE-04` | Fetch historical readings |

### Telemetry payload (Arduino → Backend)
```json
{
  "stationId": "STN-INDORE-04",
  "payload": {
    "temp": 27.4,
    "humidity": 65,
    "pressure": 1008.3,
    "altitude": 553.0,
    "airQuality": 112,
    "rain": 0
  }
}
```

### Socket.io events

| Event | Direction | Description |
|---|---|---|
| `updateDashboard` | Server → Client | Broadcasts new reading to all connected dashboards |

---

## 📊 Dashboard Pages

| Route | Page | Metrics |
|---|---|---|
| `/` | Live Summary | All sensors, circular gauges |
| `/history` | 24h History | Scrollable line charts for all metrics |
| `/analytics/thermal` | Thermal Comfort | Temp, Humidity, Heat Index |
| `/analytics/atmospheric` | Atmospheric Dynamics | Pressure, Altitude |
| `/analytics/environmental` | Environmental Quality | Air Quality (AQI), Rain |

---

## 🗄️ Database

- **MongoDB Atlas** (cloud) — all readings stored in the `skynet_iot` database, `readings` collection
- **SD Card** (local) — every reading also written to `log.csv` on the Arduino's SD card as a backup

### Reading schema
```js
{
  stationId: String,   // e.g. "STN-INDORE-04"
  timestamp: Date,
  payload: {
    temp:       Number,  // °C
    humidity:   Number,  // %
    pressure:   Number,  // hPa
    altitude:   Number,  // metres
    airQuality: Number,  // PPM
    rain:       Number,  // 0 = dry, 1 = raining
  }
}
```

---

## 🐛 Known Issues & Fixes Applied

| Bug | Fix |
|---|---|
| Backend crashed before opening port 8000 | Fixed MongoDB URI — added `/skynet_iot?retryWrites=true&w=majority` |
| `/api/history` route not registered | Added route in `index.js` alongside Socket.io instance |
| Arduino altitude hardcoded to 553.0m | Now reads live from BMP180 via `bmp.readAltitude()` |
| `bmp.begin()` called every loop iteration | Moved to `setup()`, stored in `bmpAvailable` flag |
| Mac IP changing broke Arduino connection | Switched to mDNS hostname (`MacBook-Air-2.local`) |

---

## 👤 Author

**billywithaw1lly** — SkyNet IoT Weather Station, Indore 🇮🇳
=======

---

## ☁️ Cloud Deployment Environment Variables

### Vercel frontend

```env
VITE_BACKEND_URL=https://your-backend.onrender.com
```

### Render backend

```env
FRONTEND_URL=https://your-frontend.vercel.app
```

Replace the example hostnames with your deployed Vercel and Render URLs.

