import { Router } from "express";
import { getHistoricalReadings } from "../controllers/reading.controllers.js";

const router = Router();

router.route("/history").get(getHistoricalReadings);

export default router;
