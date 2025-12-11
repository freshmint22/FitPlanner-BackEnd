import { Request, Response } from "express";
import NotificationService from "../services/notifications.service";

export const getNotificationConfig = async (req: Request, res: Response) => {
  try {
    const config = await NotificationService.getConfig();
    return res.json({
      ok: true,
      data: config || null,
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};

export const saveNotificationConfig = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id; // ya tienes auth implementado

    const data = {
      ...req.body,
      adminId,
    };

    const config = await NotificationService.saveConfig(data);

    return res.json({
      ok: true,
      data: config,
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};

export const testNotification = async (req: Request, res: Response) => {
  try {
    const respuesta = await NotificationService.sendTest();

    return res.json({
      ok: true,
      data: respuesta,
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};
