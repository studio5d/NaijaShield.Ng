import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { verifyAccessToken } from '../utils/tokens.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid session' });
    res.locals.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

export function requireRole(...roles: string[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(res.locals.user?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}
