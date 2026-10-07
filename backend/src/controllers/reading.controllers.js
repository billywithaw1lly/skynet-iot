import Reading from "../models/reading.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const getHistoricalReadings = asyncHandler(async (req, res) => {
  const { stationId } = req.query;
  const limit = parseInt(req.query.limit) || 100;

  if (!stationId) {
    return res
      .status(400)
      .json({ success: false, message: "stationId query param is required" });
  }

  const history = await Reading.find({ stationId })
    .sort({ timestamp: 1 }) // ascending = chronological
    .limit(limit)
    .lean();

  const formatted = history.map((doc) => ({
    stationId: doc.stationId,
    timestamp: new Date(doc.timestamp).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    temp: doc.payload.temp,
    humidity: doc.payload.humidity,
    pressure: doc.payload.pressure,
    altitude: doc.payload.altitude,
    airQuality: doc.payload.airQuality,
    rain: doc.payload.rain,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formatted,
        `Fetched ${formatted.length} readings for ${stationId}`,
      ),
    );
});
