import { Request, Response } from "express";
import Routine from "../models/routine.model";
import { generarRutinaIA } from "../services/routineAI.service";

export const crearRutina = async (req: Request, res: Response) => {
  try {
    // 🔐 Seguridad: aseguramos que el usuario existe
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        msg: "No autorizado"
      });
    }

    // 🤖 Generar rutina con IA (o mock)
    const rutinaIA = await generarRutinaIA(req.body);

    // 💾 Guardar rutina en base de datos
    const rutina = await Routine.create({
      usuario: req.user.id,
      nombre: req.body.nombre,
      diasPorSemana: req.body.diasPorSemana,
      objetivo: req.body.objetivo,
      enfoque: req.body.enfoque,
      nivel: req.body.nivel,
      dias: rutinaIA.dias,
      estado: "activa"
    });

    // ✅ Respuesta al frontend
    return res.status(200).json({
      ok: true,
      data: rutina
    });

  } catch (error) {
    console.error("Error creando rutina:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al crear la rutina"
    });
  }
};

export const listarRutinas = async (req: Request, res: Response) => {
  try {
    // 🔐 Seguridad
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        msg: "No autorizado"
      });
    }

    // 📋 Obtener rutinas del usuario
    const rutinas = await Routine.find({
      usuario: req.user.id
    });

    return res.status(200).json({
      ok: true,
      data: rutinas
    });

  } catch (error) {
    console.error("Error listando rutinas:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener rutinas"
    });
  }
};
