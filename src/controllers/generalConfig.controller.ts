import { Request, Response } from "express";
import GeneralConfigService from "../services/generalConfig.service";

export const getGeneralConfig = async (req: Request, res: Response) => {
  try {
    const config = await GeneralConfigService.getConfig();
    return res.json({ ok: true, data: config });
  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};

export const updateGeneralConfig = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;

    // Validación obligatoria para TypeScript
    if (!adminId) {
      return res.status(401).json({
        ok: false,
        msg: "No autorizado"
      });
    }

    const config = await GeneralConfigService.updateConfig(req.body, adminId);

    return res.json({ ok: true, data: config });

  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};
