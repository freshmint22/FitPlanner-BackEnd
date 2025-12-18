import { Router } from "express";
import { validarJWT, isAdmin } from "../middleware/auth";

import {
  getPlanes,
  getPlanesActivos,
  createPlan,
  updatePlan,
  deactivatePlan,
   changeUserPlan,
   purchasePlan,
   cancelPurchase
} from "../controllers/plan.controller";

const router = Router();

/* ===================================================
      RUTAS ADMIN (requieren admin y JWT)
   =================================================== */

// Listar todos los planes (activos o inactivos)
router.get("/", validarJWT, isAdmin, getPlanes);

// Crear un nuevo plan
router.post("/", validarJWT, isAdmin, createPlan);

// Editar un plan existente
router.put("/:id", validarJWT, isAdmin, updatePlan);

// Deshabilitar un plan (no borrar)
router.delete("/:id", validarJWT, isAdmin, deactivatePlan);

/* ===================================================
      RUTAS PARA USUARIOS
   =================================================== */

// Obtener SOLO planes activos (vista de membresías) — público
router.get("/activos", getPlanesActivos);

// Cambiar plan del usuario
router.put("/usuario/:id", validarJWT, isAdmin, changeUserPlan);

// Compra / suscripción de plan (usuario autenticado)
router.post('/purchase', validarJWT, purchasePlan);
// Cancel current user's subscription
router.post('/cancel', validarJWT, cancelPurchase);

export default router;
