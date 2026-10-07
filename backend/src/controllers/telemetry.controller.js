import Reading from "../models/reading.models.js";

export const postTelemetry = async (req, res) => {
  try {
    const { stationId, payload } = req.body;

    if (!stationId || !payload) {
      return res.status(400).json({ success: false, message: "stationId and payload are required" });
    }

    const newReading = await Reading.create({
      stationId,
      payload: {
        temp: payload.temp,
        humidity: payload.humidity,
        pressure: payload.pressure,
        altitude: payload.altitude,
        airQuality: payload.airQuality,
        rain: payload.rain,
      },
    });

    return res.status(201).json({ success: true, data: newReading });
  } catch (error) {
    console.error("Error saving telemetry:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
