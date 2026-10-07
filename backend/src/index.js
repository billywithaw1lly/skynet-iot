import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import http from "http";
import { initializeSockets } from "./sockets/index.js";
import Reading from "./models/reading.models.js";
import express from "express";

dotenv.config({ path: "./.env" });

const server = http.createServer(app);

app.use(express.json());

app.get("/api/stations", async (req, res) => {
  try {
    const stations = await Reading.distinct("stationId");
    res.json(stations);
  } catch (error) {
    console.error("Stations API Error:", error);
    res.status(500).json([]);
  }
});

app.get("/api/history", async (req, res) => {
  const { stationId } = req.query;

  if (!stationId) {
    return res.status(400).json({ error: "stationId query param is required" });
  }

  try {
    const requestedHours = Number(req.query.hours ?? 24);
    const hours = Number.isFinite(requestedHours) && requestedHours >= 0
      ? requestedHours
      : 24;
    const query = { stationId };
    if (hours > 0) {
      query.timestamp = { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) };
    }

    const history = await Reading.find(query)
      .sort({ timestamp: -1 })
      .limit(10000)
      .lean();

    history.reverse();

    let sampled;
    if (history.length > 200) {
      const step = 15;
      sampled = history.filter((_, i) => i % step === 0);
    } else {
      sampled = history;
    }

    const formatted = sampled.map((doc) => ({
      stationId: doc.stationId,
      temp: doc.payload.temp,
      humidity: doc.payload.humidity,
      pressure: doc.payload.pressure,
      altitude: doc.payload.altitude,
      airQuality: doc.payload.airQuality,
      rain: doc.payload.rain,
      timestamp: new Date(doc.timestamp).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    }));

    res.json(formatted);
  } catch (error) {
    console.error("History API Error:", error);
    res.status(500).json([]);
  }
});

app.post("/api/telemetry", async (req, res) => {
  try {
    const { stationId, payload } = req.body;

    if (!stationId || !payload) {
      return res
        .status(400)
        .json({ error: "Missing stationId or payload in request body" });
    }

    const required = ["temp", "humidity", "pressure", "altitude", "airQuality", "rain"];
    const sanitizedPayload = {};

    // Safely cast all incoming values (even strings) to numbers
    for (const field of required) {
      const val = Number(payload[field]);
      if (isNaN(val)) {
        return res.status(400).json({ error: `Missing or invalid payload field: ${field}` });
      }
      sanitizedPayload[field] = val;
    }

    // Save using the converted numerical values
    await Reading.create({ stationId, payload: sanitizedPayload });
    console.log(`💾 Saved telemetry from ${stationId}`);

    // Emit the sanitized numerical data to the React frontend
    req.app.get("io").emit("updateDashboard", { stationId, payload: sanitizedPayload });
    console.log(`📡 Broadcast updateDashboard for ${stationId}`);

    res.status(201).json({ success: true, message: "Telemetry received and saved" });
  } catch (error) {
    console.error("Telemetry API Error:", error);
    res.status(500).json({ error: "Failed to process telemetry data" });
  }
});


connectDB()
  .then(() => {
    const PORT = process.env.PORT || 8000;

    const io = initializeSockets(server);
    app.set("io", io);

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`⚙️  Server running on port ${PORT}`);
      console.log(`📡 Hardware endpoint: POST http://0.0.0.0:${PORT}/api/telemetry`);
      console.log(`📊 History endpoint:  GET  http://0.0.0.0:${PORT}/api/history?stationId=STN-INDORE-04`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });