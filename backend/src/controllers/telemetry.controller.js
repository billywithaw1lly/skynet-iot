import  Reading  from "../models/reading.models.js";

const postTelemetry = async (req, res) => {
  try {
    const { stationId, payload } = req.body;
    
    if (!stationId || !payload) {
      return res.status(400).json({ error: "Invalid payload format" });
    }

    // Save reading to MongoDB
    const newReading = await Reading.create({
      stationId,
      temp: payload.temp,
      humidity: payload.humidity,
      pressure: payload.pressure,
      altitude: payload.altitude,
      airQuality: payload.airQuality,
      rain: payload.rain,
    });

    return res.status(201).json({ success: true, data: newReading });
  } catch (error) {
    console.error("Error saving telemetry:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export { postTelemetry };
