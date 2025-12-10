import { Router } from "express";
import { simulatePayment } from "../controllers/payments.controller";

const router = Router();

router.post("/simulado", simulatePayment);

export default router;
