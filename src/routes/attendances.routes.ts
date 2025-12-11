import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getAttendanceHistory } from "../controllers/attendances.controller";

const router = Router();

router.get("/list", requireAuth, getAttendanceHistory);

export default router;

