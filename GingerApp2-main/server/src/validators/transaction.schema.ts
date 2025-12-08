import { z } from 'zod';

export const transactionSchema = z.object({
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  projectName: z.string().min(1).optional(),
  userId: z.string().uuid().optional(),
  name: z.string().min(1),
  account: z.string().min(1),
  category: z.string().min(1),
  subCategory: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(500).optional(),
  amount: z.number().refine((value: number) => value !== 0, {
    message: 'Amount cannot be zero',
  }),
  description: z.string().max(500).optional(),
});
