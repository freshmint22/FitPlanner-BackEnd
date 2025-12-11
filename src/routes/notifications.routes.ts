import { Router } from "express";
import {
  getNotificationConfig,
  saveNotificationConfig,
  testNotification,
} from "../controllers/notifications.controller";
import { validarJWT, isAdmin } from "../middleware/auth";

const router = Router();

router.get("/configuracion/notificaciones", validarJWT, isAdmin, getNotificationConfig);

router.post("/configuracion/notificaciones", validarJWT, isAdmin, saveNotificationConfig);

router.post("/configuracion/notificaciones/prueba", validarJWT, isAdmin, testNotification);

export default router;
