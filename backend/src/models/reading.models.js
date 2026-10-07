import mongoose from "mongoose";

const readingSchema = new mongoose.Schema(
  {
    stationId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    payload: {
      temp: { type: Number, required: true },
      humidity: { type: Number, required: true },
      pressure: { type: Number, required: true },
      altitude: { type: Number, required: true },
      airQuality: { type: Number, required: true },
      rain: { type: Number, required: true },
    },
  },
  {
    timestamps: false,
  },
);

export default mongoose.model("Reading", readingSchema);
