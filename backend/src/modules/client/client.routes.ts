import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { audit } from '../../middleware/audit.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();
router.use(requireAuth, requireRole('CLIENT', 'ADMIN'));

function companyId(res: any) {
  return res.locals.user.clientCompanyId;
}

router.get('/dashboard', asyncHandler(async (_req, res) => {
  const id = companyId(res);
  const [company, reports, tickets, requests, subscription, scoreHistory, notifications] = await Promise.all([
    prisma.clientCompany.findUnique({ where: { id }, include: { users: true } }),
    prisma.report.findMany({ where: { clientCompanyId: id }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.ticket.findMany({ where: { clientCompanyId: id }, orderBy: { updatedAt: 'desc' }, take: 6 }),
    prisma.serviceRequest.findMany({ where: { clientCompanyId: id }, orderBy: { updatedAt: 'desc' }, take: 6 }),
    prisma.subscription.findFirst({ where: { clientCompanyId: id }, orderBy: { startDate: 'desc' } }),
    prisma.securityScoreHistory.findMany({ where: { clientCompanyId: id }, orderBy: { calculatedAt: 'asc' } }),
    prisma.notification.findMany({ where: { clientCompanyId: id }, orderBy: { createdAt: 'desc' }, take: 6 })
  ]);
  const latestScore = scoreHistory.at(-1)?.score ?? 0;
  return res.json({
    company,
    reports,
    tickets,
    requests,
    subscription,
    scoreHistory,
    notifications,
    summary: {
      securityScore: latestScore,
      openTickets: tickets.filter(ticket => !['RESOLVED', 'CLOSED'].includes(ticket.status)).length,
      activeRequests: requests.filter(request => !['COMPLETED', 'CANCELLED'].includes(request.status)).length,
      latestReports: reports.length,
      alerts: notifications.slice(0, 3)
    }
  });
}));

router.get('/reports', asyncHandler(async (req, res) => {
  const where: any = { clientCompanyId: companyId(res) };
  if (req.query.type) where.type = String(req.query.type);
  if (req.query.severity) where.severity = String(req.query.severity);
  return res.json(await prisma.report.findMany({ where, orderBy: { createdAt: 'desc' } }));
}));

router.get('/reports/:id', audit('REPORT_VIEW', 'REPORT'), asyncHandler(async (req, res) => {
  const report = await prisma.report.findFirst({ where: { id: req.params.id, clientCompanyId: companyId(res) } });
  if (!report) return res.status(404).json({ error: 'Report not found' });
  return res.json(report);
}));

router.get('/tickets', asyncHandler(async (_req, res) => {
  return res.json(await prisma.ticket.findMany({ where: { clientCompanyId: companyId(res) }, include: { comments: { include: { user: true } } }, orderBy: { updatedAt: 'desc' } }));
}));

router.post('/tickets', audit('TICKET_CREATE', 'TICKET'), validate(z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM')
})), asyncHandler(async (req, res) => {
  const ticket = await prisma.ticket.create({
    data: { ...req.body, clientCompanyId: companyId(res), createdByUserId: res.locals.user.id }
  });
  return res.status(201).json(ticket);
}));

router.get('/tickets/:id', asyncHandler(async (req, res) => {
  const ticket = await prisma.ticket.findFirst({ where: { id: req.params.id, clientCompanyId: companyId(res) }, include: { comments: { include: { user: true } } } });
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  return res.json(ticket);
}));

router.post('/tickets/:id/comment', audit('TICKET_COMMENT', 'TICKET'), validate(z.object({ body: z.string().min(2) })), asyncHandler(async (req, res) => {
  const ticket = await prisma.ticket.findFirst({ where: { id: req.params.id, clientCompanyId: companyId(res) } });
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  const comment = await prisma.ticketComment.create({ data: { ticketId: ticket.id, userId: res.locals.user.id, body: req.body.body } });
  return res.status(201).json(comment);
}));

router.get('/requests', asyncHandler(async (_req, res) => {
  return res.json(await prisma.serviceRequest.findMany({ where: { clientCompanyId: companyId(res) }, orderBy: { updatedAt: 'desc' } }));
}));

router.post('/requests', audit('SERVICE_REQUEST_CREATE', 'SERVICE_REQUEST'), validate(z.object({
  type: z.enum(['PENETRATION_TESTING', 'INCIDENT_RESPONSE', 'SECURITY_ASSESSMENT', 'FORENSICS', 'COMPLIANCE_AUDIT']),
  description: z.string().min(10),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM')
})), asyncHandler(async (req, res) => {
  const request = await prisma.serviceRequest.create({ data: { ...req.body, clientCompanyId: companyId(res) } });
  return res.status(201).json(request);
}));

router.get('/security-score/history', asyncHandler(async (_req, res) => {
  return res.json(await prisma.securityScoreHistory.findMany({ where: { clientCompanyId: companyId(res) }, orderBy: { calculatedAt: 'asc' } }));
}));

router.get('/subscription', asyncHandler(async (_req, res) => {
  return res.json(await prisma.subscription.findFirst({ where: { clientCompanyId: companyId(res) }, orderBy: { startDate: 'desc' } }));
}));

router.get('/notifications', asyncHandler(async (_req, res) => {
  return res.json(await prisma.notification.findMany({ where: { clientCompanyId: companyId(res) }, orderBy: { createdAt: 'desc' } }));
}));

router.get('/audit-logs', asyncHandler(async (_req, res) => {
  return res.json(await prisma.auditLog.findMany({ where: { clientCompanyId: companyId(res) }, orderBy: { createdAt: 'desc' }, take: 100 }));
}));

router.get('/knowledge-base', asyncHandler(async (_req, res) => {
  return res.json(await prisma.knowledgeBaseArticle.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' } }));
}));

router.get('/company', asyncHandler(async (_req, res) => {
  return res.json(await prisma.clientCompany.findUnique({ where: { id: companyId(res) }, include: { users: true } }));
}));

export default router;
