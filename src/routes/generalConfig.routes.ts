import { Router } from "express";
import { validarJWT, isAdmin } from "../middleware/auth";
import { getGeneralConfig, updateGeneralConfig } from "../controllers/generalConfig.controller";

const router = Router();

// GET — obtiene la config, crea si no existe
router.get("/", validarJWT, isAdmin, getGeneralConfig);

// POST — actualiza config
router.post("/", validarJWT, isAdmin, updateGeneralConfig);

export default router;
