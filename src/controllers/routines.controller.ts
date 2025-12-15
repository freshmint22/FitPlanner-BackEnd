import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import RoutineModel from '../models/routine.model';
import RoutineAssignmentModel from '../models/routineAssignment.model';
import mongoose from 'mongoose';
import { generarRutinaIA } from '../services/routineAI.service';

export async function listRoutines(req: Request, res: Response) {
  try {
    const connected = mongoose.connection.readyState === 1;
    if (!connected) return res.json({ items: [], total: 0 });

    const items = await RoutineModel.find().lean();
    const mapped = (items as any[]).map((r: any) => ({ id: r._id?.toString?.() || String(r._id), name: r.name, exercises: r.exercises }));
    
    // If the request provides an Authorization header, attempt to decode it (optional auth)
    const authHeader = req.headers.authorization;
    let memberId = (req as any).user?.id;
    if (!memberId && authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload: any = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        memberId = payload?.id;
      } catch {
        memberId = undefined;
      }
    }
    if (memberId) {
      const data = await RoutineModel.find({ usuario: memberId }).lean();
      return res.json({ ok: true, data });
    }

    return res.json({ items: mapped, total: mapped.length });
  } catch (err) {
    console.error('listRoutines error', err);
    return res.status(500).json({ error: { code: 'server_error' } });
  }
}

export async function createRoutine(req: Request, res: Response) {
  try {
    const memberId = (req as any).user?.id;
    if (!memberId) return res.status(401).json({ error: { code: 'unauthorized' } });

    const { nombre, diasPorSemana, objetivo, enfoque, nivel } = req.body;
    // Use AI service when requested via body fields
    const aiResult = await generarRutinaIA({ diasPorSemana: diasPorSemana || 3, objetivo: objetivo || '', enfoque: enfoque || [], nivel: nivel || 'basico' });

    const created = await RoutineModel.create({
      usuario: memberId,
      nombre,
      diasPorSemana,
      objetivo,
      enfoque,
      nivel,
      dias: aiResult.dias,
      estado: 'activa'
    });

    return res.json({ ok: true, data: created });
  } catch (err) {
    console.error('createRoutine error', err);
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
    const r: any = routine as any;
    return res.json({ id: r._id?.toString?.() || String(r._id), name: r.name, exercises: r.exercises });
  } catch (err) {
    console.error('getRoutine error', err);
    return res.status(500).json({ error: { code: 'server_error' } });
  }
}

// Assign a routine to a member (admin/trainer)
export async function assignRoutine(req: Request, res: Response) {
  try {
    const { id: routineId } = req.params;
    const { memberId, days } = req.body;
    const connected = mongoose.connection.readyState === 1;
    if (!connected) return res.status(201).json({ id: 'temp', routineId, memberId, days: days || [], exercisesStatus: [] });

    // ensure routine exists
    const routine = await RoutineModel.findById(routineId).lean();
    if (!routine) return res.status(404).json({ error: { code: 'routine_not_found' } });

    // initialize exercises status from routine exercises
    const exercises = (routine as any).exercises || [];
    const exercisesStatus = exercises.map((e: any) => ({ name: e.name, completed: false, completedAt: null }));

    const created = await RoutineAssignmentModel.create({ routineId, memberId, days: days || [], exercisesStatus });
    return res.status(201).json({ id: created._id.toString(), routineId, memberId, days: created.days, exercisesStatus: created.exercisesStatus });
  } catch (err) {
    console.error('assignRoutine error', err);
    return res.status(500).json({ error: { code: 'server_error' } });
  }
}

// List routines assigned to the authenticated user
export async function listAssignedRoutines(req: Request, res: Response) {
  try {
    const memberId = (req as any).user?.id;
    if (!memberId) return res.status(401).json({ error: { code: 'unauthorized' } });
    const connected = mongoose.connection.readyState === 1;
    if (!connected) return res.json({ items: [], total: 0 });

    const assignments = await RoutineAssignmentModel.find({ memberId }).lean();
    const mapped = await Promise.all((assignments as any[]).map(async (a: any) => {
      const routine: any = await RoutineModel.findById(a.routineId).lean() as any;
      return { id: a._id?.toString?.() || String(a._id), routineId: a.routineId, routineName: routine?.name || null, days: a.days || [], exercisesStatus: a.exercisesStatus || [] };
    }));
    return res.json({ items: mapped, total: mapped.length });
  } catch (err) {
    console.error('listAssignedRoutines error', err);
    return res.status(500).json({ error: { code: 'server_error' } });
  }
}

// Get exercises for a routine including completion state for the authenticated user
export async function getRoutineExercisesForUser(req: Request, res: Response) {
  try {
    const { id: routineId } = req.params;
    const memberId = (req as any).user?.id;
    if (!memberId) return res.status(401).json({ error: { code: 'unauthorized' } });
    const connected = mongoose.connection.readyState === 1;
    if (!connected) return res.json({ id: routineId, exercises: [] });

    const routine = await RoutineModel.findById(routineId).lean();
    if (!routine) return res.status(404).json({ error: { code: 'routine_not_found' } });

    const assignment = await RoutineAssignmentModel.findOne({ routineId, memberId }).lean();
    const exercises = (routine as any).exercises || [];
    // merge completion state if assignment exists
    const exercisesWithStatus = exercises.map((e: any) => {
      const status = (assignment as any)?.exercisesStatus?.find((s: any) => s.name === e.name);
      return { name: e.name, sets: e.sets, reps: e.reps, completed: status?.completed || false, completedAt: status?.completedAt || null };
    });
    return res.json({ id: (routine as any)._id?.toString?.() || String((routine as any)._id), name: (routine as any).name, exercises: exercisesWithStatus });
  } catch (err) {
    console.error('getRoutineExercisesForUser error', err);
    return res.status(500).json({ error: { code: 'server_error' } });
  }
}

// Mark an exercise as completed for the authenticated user
export async function markExerciseCompleted(req: Request, res: Response) {
  try {
    const { id: routineId, idx } = req.params; // idx is exercise index or name
    const memberId = (req as any).user?.id;
    if (!memberId) return res.status(401).json({ error: { code: 'unauthorized' } });
    const connected = mongoose.connection.readyState === 1;
    if (!connected) return res.status(200).json({ message: 'ok' });

    const assignment = await RoutineAssignmentModel.findOne({ routineId, memberId });
    if (!assignment) return res.status(404).json({ error: { code: 'assignment_not_found' } });

    const index = Number(idx);
    if (Number.isNaN(index) || index < 0 || index >= assignment.exercisesStatus.length) {
      return res.status(400).json({ error: { code: 'invalid_exercise_index' } });
    }

    assignment.exercisesStatus[index].completed = true;
    assignment.exercisesStatus[index].completedAt = new Date();
    await assignment.save();
    return res.json({ id: assignment._id?.toString?.() || String(assignment._id), exercisesStatus: assignment.exercisesStatus });
  } catch (err) {
    console.error('markExerciseCompleted error', err);
    return res.status(500).json({ error: { code: 'server_error' } });
  }
}
