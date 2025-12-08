import { Router, Request, Response } from 'express';
import { getAuditLogs, getUserActivity, createAuditLog } from '../utils/auditLogger';

const router = Router();

// Log login action
router.post('/log-login', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    await createAuditLog({
      username,
      action: 'LOGIN',
      req,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging login:', error);
    res.status(500).json({ error: 'Failed to log login' });
  }
});

// Log logout action
router.post('/log-logout', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    await createAuditLog({
      username,
      action: 'LOGOUT',
      req,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging logout:', error);
    res.status(500).json({ error: 'Failed to log logout' });
  }
});

// Get audit logs with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { username, action, startDate, endDate, limit } = req.query;

    const filters: any = {};
    if (username) filters.username = username as string;
    if (action) filters.action = action as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string);

    const logs = await getAuditLogs(filters);

    res.json({
      success: true,
      count: logs.length,
      logs: logs.map((log: any) => ({
        id: log.id,
        username: log.username,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details ? JSON.parse(log.details) : null,
        ipAddress: log.ipAddress,
        timestamp: log.timestamp,
      })),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get all unique usernames in audit log (for debugging)
router.get('/usernames', async (req: Request, res: Response) => {
  try {
    const { prisma } = await import('../lib/prisma');
    const logs = await prisma.auditLog.findMany({
      select: { username: true },
      distinct: ['username'],
    });
    
    const usernames = logs.map(log => log.username);
    console.log('[DEBUG] Unique usernames in AuditLog:', usernames);
    
    res.json({
      success: true,
      usernames,
    });
  } catch (error) {
    console.error('Error fetching usernames:', error);
    res.status(500).json({ error: 'Failed to fetch usernames' });
  }
});

// Get user activity summary
router.get('/user/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    const activity = await getUserActivity(username, days);

    res.json({
      success: true,
      activity,
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

// Get login/logout history
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const { username } = req.query;

    const filters: any = {
      action: undefined,
      limit: 50,
    };

    if (username) filters.username = username as string;

    // Get both LOGIN and LOGOUT events
    const loginLogs = await getAuditLogs({ ...filters, action: 'LOGIN' });
    const logoutLogs = await getAuditLogs({ ...filters, action: 'LOGOUT' });

    // Combine and sort by timestamp
    const sessions = [...loginLogs, ...logoutLogs]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .map(log => ({
        username: log.username,
        action: log.action,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      }));

    res.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

export default router;
