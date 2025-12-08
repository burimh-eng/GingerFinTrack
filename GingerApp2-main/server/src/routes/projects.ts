import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const projectSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().max(500).optional(),
  status: z.enum(['active', 'archived']).default('active'),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;
    const projects = await prisma.project.findMany({
      where: userId ? { userId: String(userId) } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = projectSchema.parse(req.body);
    const created = await prisma.project.create({ data: payload });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = projectSchema.partial().parse(req.body);
    const updated = await prisma.project.update({ where: { id: req.params.id }, data: payload });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
