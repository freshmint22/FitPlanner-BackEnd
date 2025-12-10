import { Router } from "express";
import { validarJWT, isAdmin } from "../middleware/auth";
import { getGymInfo, saveGymInfo } from "../controllers/gymInfo.controller";

const router = Router();

router.get("/configuracion/gimnasio", validarJWT, isAdmin, getGymInfo);
router.post("/configuracion/gimnasio", validarJWT, isAdmin, saveGymInfo);

export default router;
