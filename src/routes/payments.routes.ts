import { Router } from "express";
import { simulatePayment, getUserPayments } from "../controllers/payments.controller";
import { validarJWT } from '../middleware/auth';

const router = Router();

router.post('/simulado', simulatePayment);
router.get('/', validarJWT, getUserPayments);

export default router;
