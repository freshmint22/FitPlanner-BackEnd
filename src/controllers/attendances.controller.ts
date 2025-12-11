import { Request, Response } from "express";
import Attendance from "../models/attendance.model";
import type { FilterQuery } from "mongoose";

/**
 * GET /api/attendances/list
 * Historial de asistencias del usuario autenticado
 */
export const getAttendanceHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // requireAuth ya puso user en req

    // Parámetros opcionales de filtrado
    const { startDate, endDate } = req.query;

    const filter: FilterQuery<Record<string, unknown>> = { memberId: userId };

    // Filtrar por fecha si vienen los parámetros
    if (startDate || endDate) {
      filter.date = {};

      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    // Consultar historial
    const history = await Attendance.find(filter)
      .populate("classId") // Si existe el modelo Class
      .sort({ date: -1 })   // Más recientes primero
      .lean();

    return res.json({ items: history });
  } catch (err) {
    console.error("Error obteniendo historial:", err);
    return res.status(500).json({
      error: { message: "Error interno del servidor" },
    });
  }
};
