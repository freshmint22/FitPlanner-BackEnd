import { Router } from "express";
import { validarJWT, isAdmin } from "../middleware/auth";

import {
  getPlanes,
  getPlanesActivos,
  createPlan,
  updatePlan,
  deactivatePlan,
  changeUserPlan
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

// Obtener SOLO planes activos (vista de membresías)
router.get("/activos", validarJWT, getPlanesActivos);

// Cambiar plan del usuario
router.put("/usuario/:id", validarJWT, isAdmin, changeUserPlan);

export default router;
