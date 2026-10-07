import express from "express";
import cors from "cors";
import healthcheckRouter from "./routes/healthcheck.routes.js";

const app = express();
const frontendUrl =
  process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  }),
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use("/api/v1/healthcheck", healthcheckRouter);

export { app };
