import { Request, Response } from 'express';
import RoutineModel from '../models/routine.model';
import mongoose from 'mongoose';

export async function listRoutines(req: Request, res: Response) {
  try {
    const connected = mongoose.connection.readyState === 1;
    if (!connected) return res.json({ items: [], total: 0 });

    const items = await RoutineModel.find().lean();
    const mapped = items.map((r) => ({ id: r._id.toString(), name: r.name, exercises: r.exercises }));
    return res.json({ items: mapped, total: mapped.length });
  } catch (err) {
    console.error('listRoutines error', err);
    return res.status(500).json({ error: { code: 'server_error' } });
  }
}

export async function getRoutine(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const connected = mongoose.connection.readyState === 1;
    if (!connected) return res.status(200).json({ id, exercises: [] });

    const routine = await RoutineModel.findById(id).lean();
    if (!routine) return res.status(404).json({ error: { code: 'not_found' } });
    return res.json({ id: routine._id.toString(), name: routine.name, exercises: routine.exercises });
  } catch (err) {
    console.error('getRoutine error', err);
    return res.status(500).json({ error: { code: 'server_error' } });
  }
}
