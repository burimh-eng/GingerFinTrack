import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const router = Router();

const taskSchema = z.object({
  projectId: z.string().uuid(),
  assignedTo: z.string().uuid().optional(),
  title: z.string().min(2),
  notes: z.string().max(500).optional(),
  dueDate: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'done']).default('pending'),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.query;
    const tasks = await prisma.task.findMany({
      where: projectId ? { projectId: String(projectId) } : undefined,
      include: { project: true, assignee: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = taskSchema.parse(req.body);
    const created = await prisma.task.create({
      data: {
        ...payload,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
      },
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = taskSchema.partial().parse(req.body);
    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...payload,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
