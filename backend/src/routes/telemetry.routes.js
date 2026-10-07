import { Router } from "express";
import { postTelemetry } from "../controllers/telemetry.controller.js";

const router = Router();

router.route("/").post(postTelemetry);

export default router;
