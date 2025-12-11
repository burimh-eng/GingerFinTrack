import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const accounts = await prisma.account.findMany({ orderBy: { name: 'asc' } });
    res.json(accounts);
  } catch (err) {
    next(err);
  }
});

export default router;
