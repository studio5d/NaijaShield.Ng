import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export function audit(action: string, entityType = 'SYSTEM') {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      const user = res.locals.user;
      prisma.auditLog.create({
        data: {
          userId: user?.id,
          clientCompanyId: user?.clientCompanyId,
          action,
          entityType,
          entityId: req.params.id,
          metadata: { method: req.method, path: req.originalUrl, bodyKeys: Object.keys(req.body || {}) },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || ''
        }
      }).catch(() => undefined);
    });
    next();
  };
}
