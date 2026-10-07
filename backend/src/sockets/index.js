import { Server } from "socket.io";
import Reading from "../models/reading.models.js";

export const initializeSockets = (server) => {
  const frontendUrl =
    process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173";

  const io = new Server(server, {
    cors: {
      origin: frontendUrl,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    socket.on("sensorData", async (data) => {
      const { stationId, payload } = data;

      if (!stationId || !payload) {
        console.warn(
          "⚠️  Received malformed sensorData — missing stationId or payload",
        );
        return;
      }

      console.log(`📥 sensorData received from ${stationId}`);

      io.emit("updateDashboard", { stationId, payload });

      try {
        await Reading.create({ stationId, payload });
        console.log(`💾 Saved reading from ${stationId} to MongoDB`);
      } catch (error) {
        console.error("❌ Failed to save reading to DB:", error.message);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};
