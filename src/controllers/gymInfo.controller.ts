import { Request, Response } from "express";
import GymInfoService from "../services/gymInfo.service";

export const getGymInfo = async (req: Request, res: Response) => {
  try {
    const info = await GymInfoService.getInfo();

    return res.json({
      ok: true,
      data: info
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};
export const saveGymInfo = async (req: Request, res: Response) => {
  try {
    const { nombre, direccion, telefono, horarios } = req.body;

    // Validaciones
    if (!nombre || !direccion || !telefono || !horarios) {
      return res.status(400).json({
        ok: false,
        msg: "Todos los campos son obligatorios"
      });
    }

    const data = {
      nombre,
      direccion,
      telefono,
      horarios,
      updatedBy: req.user?.id
    };

    const info = await GymInfoService.saveInfo(data);

    return res.json({
      ok: true,
      data: info
    });

  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};
