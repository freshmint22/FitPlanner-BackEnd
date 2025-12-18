import { Router } from "express";
import { simulatePayment, getUserPayments, getAllPayments } from "../controllers/payments.controller";
import { validarJWT, isAdmin } from '../middleware/auth';

const router = Router();

router.post('/simulado', simulatePayment);
router.get('/', validarJWT, getUserPayments);
router.get('/admin', validarJWT, isAdmin, getAllPayments);

export default router;
