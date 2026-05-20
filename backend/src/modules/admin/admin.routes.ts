import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { audit } from '../../middleware/audit.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();
const upload = multer({
  dest: env.UPLOAD_DIR,
  fileFilter: (_req, file, cb) => cb(null, file.mimetype === 'application/pdf')
});

router.use(requireAuth, requireRole('ADMIN'));

router.get('/clients', asyncHandler(async (_req, res) => {
  return res.json(await prisma.clientCompany.findMany({ include: { users: true, subscriptions: true }, orderBy: { createdAt: 'desc' } }));
}));

router.post('/clients/:id/reports', upload.single('file'), audit('REPORT_UPLOAD', 'REPORT'), validate(z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  type: z.string().default('Security Report'),
  severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('INFO')
})), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'PDF report file required' });
  const report = await prisma.report.create({
    data: {
      clientCompanyId: req.params.id,
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      severity: req.body.severity,
      filePath: `/${req.file.path.replace(/\\/g, '/')}`,
      uploadedBy: res.locals.user.name
    }
  });
  return res.status(201).json(report);
}));

export default router;
