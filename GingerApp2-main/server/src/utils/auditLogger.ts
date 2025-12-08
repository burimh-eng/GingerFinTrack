import { prisma } from '../lib/prisma';
import { Request } from 'express';

export type AuditAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'VIEW';
export type EntityType = 'TRANSACTION' | 'USER' | 'PROJECT' | 'TASK';

interface AuditLogData {
  username: string;
  action: AuditAction;
  entityType?: EntityType;
  entityId?: string;
  details?: any;
  req?: Request;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    const { username, action, entityType, entityId, details, req } = data;

    const auditEntry = await prisma.auditLog.create({
      data: {
        username,
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        details: details ? JSON.stringify(details) : null,
        ipAddress: req ? getClientIp(req) : null,
        userAgent: req?.headers['user-agent'] || null,
      },
    });

    console.log(`[AUDIT] ${action} by ${username}${entityType ? ` on ${entityType}` : ''}${entityId ? ` (${entityId})` : ''}`);
    console.log(`[AUDIT] Created log ID: ${auditEntry.id}, Timestamp: ${auditEntry.timestamp}`);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

export async function getAuditLogs(filters?: {
  username?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const where: any = {};

  if (filters?.username) {
    where.username = filters.username;
  }

  if (filters?.action) {
    where.action = filters.action;
  }

  if (filters?.startDate || filters?.endDate) {
    where.timestamp = {};
    if (filters.startDate) {
      where.timestamp.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.timestamp.lte = filters.endDate;
    }
  }

  return await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: filters?.limit || 100,
  });
}

export async function getUserActivity(username: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Case-insensitive username search
  const logs = await prisma.auditLog.findMany({
    where: {
      username: {
        equals: username,
        mode: 'insensitive',
      },
      timestamp: { gte: startDate },
    },
    orderBy: { timestamp: 'desc' },
  });

  console.log(`[getUserActivity] Username: ${username}, Days: ${days}, Logs found: ${logs.length}`);
  console.log(`[getUserActivity] Date range: ${startDate.toISOString()} to now`);
  
  // Calculate statistics
  const loginCount = logs.filter(l => l.action === 'LOGIN').length;
  const logoutCount = logs.filter(l => l.action === 'LOGOUT').length;
  const createCount = logs.filter(l => l.action === 'CREATE').length;
  const updateCount = logs.filter(l => l.action === 'UPDATE').length;
  const deleteCount = logs.filter(l => l.action === 'DELETE').length;
  const importCount = logs.filter(l => l.action === 'IMPORT').length;

  console.log(`[getUserActivity] Stats - Logins: ${loginCount}, Creates: ${createCount}, Deletes: ${deleteCount}`);

  // Get last login/logout
  const lastLogin = logs.find(l => l.action === 'LOGIN');
  const lastLogout = logs.find(l => l.action === 'LOGOUT');

  return {
    username,
    period: `Last ${days} days`,
    statistics: {
      totalActions: logs.length,
      logins: loginCount,
      logouts: logoutCount,
      creates: createCount,
      updates: updateCount,
      deletes: deleteCount,
      imports: importCount,
    },
    lastLogin: lastLogin?.timestamp || null,
    lastLogout: lastLogout?.timestamp || null,
    recentActivity: logs.slice(0, 20),
  };
}
