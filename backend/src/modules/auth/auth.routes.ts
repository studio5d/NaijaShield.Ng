import argon2 from 'argon2';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { audit } from '../../middleware/audit.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/tokens.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

function publicUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    teamRole: user.teamRole,
    clientCompanyId: user.clientCompanyId
  };
}

function setRefreshCookie(res: any, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'strict',
    path: '/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

router.post('/login', validate(loginSchema), audit('AUTH_LOGIN', 'USER'), asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email.toLowerCase() } });
  if (!user || !(await argon2.verify(user.passwordHash, req.body.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const payload = { sub: user.id, role: user.role, companyId: user.clientCompanyId };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  setRefreshCookie(res, refreshToken);
  return res.json({ accessToken, user: publicUser(user) });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token required' });
  const payload = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid refresh token' });
  const accessToken = signAccessToken({ sub: user.id, role: user.role, companyId: user.clientCompanyId });
  return res.json({ accessToken, user: publicUser(user) });
}));

router.post('/logout', audit('AUTH_LOGOUT', 'USER'), (_req, res) => {
  res.clearCookie('refreshToken', { path: '/auth/refresh' });
  return res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: publicUser(res.locals.user) });
});

export default router;
