import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  if (err.name === 'ZodError') {
    return res.status(400).json({ message: 'Validation failed', issues: err.errors });
  }

  return res.status(500).json({ message: 'Internal server error' });
};
