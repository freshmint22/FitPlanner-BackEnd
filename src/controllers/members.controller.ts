import { Request, Response, NextFunction } from 'express';
import * as service from '../services/members.service';

export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const q = (req.query.q as string) || undefined;
    const result = await service.listMembers(page, limit, q);
    res.json({ data: result.data, total: result.total });
  } catch (err) {
    next(err);
  }
};

export const createMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await service.createMember(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

export const updateMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await service.updateMember(id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await service.deleteMember(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
