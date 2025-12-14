import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  crearRutina,
  listarRutinas
} from "../controllers/routines.controller";

const router = Router();

router.post("/", requireAuth, crearRutina);
router.get("/", requireAuth, listarRutinas);

export default router;
