import { Request, Response, NextFunction } from "express";

export const validateGeneralConfig = (req: Request, res: Response, next: NextFunction) => {
  const { nombreSistema, colorPrimario, colorSecundario, limiteUsuarios } = req.body;

  // Validación HEX
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;

  if (!hexRegex.test(colorPrimario) || !hexRegex.test(colorSecundario)) {
    return res.status(400).json({
      ok: false,
      msg: "Los colores deben ser códigos HEX válidos."
    });
  }

  if (!nombreSistema || !limiteUsuarios) {
    return res.status(400).json({
      ok: false,
      msg: "Todos los campos obligatorios deben estar completos"
    });
  }

  next();
};
