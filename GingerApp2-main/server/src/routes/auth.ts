import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required'); })();

// Login route
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    next(err);
  }
});

// Middleware to protect routes
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to check for admin role
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && (req.user as any).role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ error: 'Admin access required' });
  }
};

// Change own password
router.post('/change-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Username, current password, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordValid = await bcrypt.compare(currentPassword, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { username },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

// Admin reset password for another user (only Burim can do this)
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { adminUsername, targetUsername, newPassword } = req.body;
    
    console.log(`Password reset attempt: admin=${adminUsername}, target=${targetUsername}`);
    
    if (!adminUsername || !targetUsername || !newPassword) {
      return res.status(400).json({ error: 'Admin username, target username, and new password are required' });
    }

    // Only Burim can reset other users' passwords
    if (adminUsername !== 'Burim') {
      return res.status(403).json({ error: 'Only Burim can reset other users passwords' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const targetUser = await prisma.user.findUnique({ where: { username: targetUsername } });
    if (!targetUser) {
      console.log(`Target user not found: ${targetUsername}`);
      return res.status(404).json({ error: 'Target user not found' });
    }

    console.log(`Found target user: id=${targetUser.id}, username=${targetUser.username}`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id }, // Use ID instead of username for more reliable update
      data: { password: hashedPassword },
    });

    console.log(`Password updated for user: id=${updatedUser.id}, username=${updatedUser.username}`);

    res.json({ success: true, message: `Password reset successfully for ${targetUsername}` });
  } catch (err) {
    console.error('Password reset error:', err);
    next(err);
  }
});

// Get all users (for admin to see who they can reset)
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: { username: true, fullName: true, role: true },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

export default router;
